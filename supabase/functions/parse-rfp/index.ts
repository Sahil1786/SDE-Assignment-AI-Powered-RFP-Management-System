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
    const { rawInput } = await req.json();

    if (!rawInput) {
      return new Response(
        JSON.stringify({ error: 'Raw input is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an AI assistant that helps parse natural language procurement requests into structured RFP (Request for Proposal) data.

Given a user's natural language description of what they want to procure, extract and structure the following information:

1. title: A concise title for the RFP (max 100 chars)
2. description: A clear description of what is being procured
3. items: Array of items with { name, quantity, specifications }
4. budget: Total budget amount (number only, no currency symbols)
5. delivery_days: Number of days for delivery
6. payment_terms: Payment terms (e.g., "Net 30", "50% upfront, 50% on delivery")
7. warranty_terms: Warranty requirements
8. additional_requirements: Any other requirements mentioned

Return a valid JSON object with these fields. Use null for any fields not mentioned in the input.`;

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
          { role: 'user', content: rawInput }
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
    
    let structured;
    try {
      structured = JSON.parse(content);
    } catch {
      structured = { 
        title: 'Procurement Request',
        description: rawInput,
        items: [],
        budget: null,
        delivery_days: null,
        payment_terms: null,
        warranty_terms: null,
        additional_requirements: null
      };
    }

    return new Response(
      JSON.stringify({ structured }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error parsing RFP:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
