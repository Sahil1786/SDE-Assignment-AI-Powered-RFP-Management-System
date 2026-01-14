import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vendorResponse, rfpContext } = await req.json();

    if (!vendorResponse) {
      return new Response(
        JSON.stringify({ error: 'Vendor response is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an AI assistant that parses vendor proposal responses for RFPs (Requests for Proposal).

Given a vendor's response (which may be messy, unstructured text, email content, or extracted from attachments), extract:

1. total_price: The total quoted price (number only)
2. line_items: Array of { item_name, quantity, unit_price, total_price }
3. delivery_days: Proposed delivery timeline in days
4. payment_terms: Proposed payment terms
5. warranty_terms: Warranty offered
6. additional_notes: Any other relevant information
7. compliance_notes: How well they meet the RFP requirements

Also provide:
8. completeness_score: 1-10 rating of how complete the proposal is
9. summary: A 2-3 sentence summary of the proposal

${rfpContext ? `\nOriginal RFP Context:\n${rfpContext}` : ''}

Return a valid JSON object with these fields. Use null for any fields not found.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: vendorResponse }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { 
        total_price: null,
        line_items: [],
        delivery_days: null,
        payment_terms: null,
        warranty_terms: null,
        additional_notes: vendorResponse,
        compliance_notes: null,
        completeness_score: 0,
        summary: 'Unable to parse vendor response'
      };
    }

    return new Response(
      JSON.stringify({ parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error parsing proposal:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
