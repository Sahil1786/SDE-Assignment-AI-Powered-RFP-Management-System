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
    const { rfpData, proposals } = await req.json();

    if (!proposals || proposals.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Proposals are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an AI procurement advisor helping compare vendor proposals for an RFP.

Given the original RFP requirements and multiple vendor proposals, analyze and compare them to help the procurement manager make a decision.

Provide:
1. comparison_summary: Overall comparison of all proposals (2-3 paragraphs)
2. vendor_rankings: Array of { vendor_name, rank, score (1-100), strengths: [], weaknesses: [], key_differentiators: string }
3. recommended_vendor: The vendor you recommend
4. recommendation_reason: Detailed explanation of why (consider price, delivery, terms, compliance)
5. risk_factors: Any risks to be aware of with each vendor
6. negotiation_tips: Suggestions for negotiating with the top vendors

Be objective, thorough, and focus on value for money, not just lowest price.

Return as valid JSON.`;

    const userContent = `
RFP Requirements:
${JSON.stringify(rfpData, null, 2)}

Vendor Proposals:
${proposals.map((p: any, i: number) => `
--- Vendor ${i + 1}: ${p.vendor_name} ---
${JSON.stringify(p.proposal_data, null, 2)}
`).join('\n')}
`;

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
          { role: 'user', content: userContent }
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
    
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = { 
        comparison_summary: 'Unable to generate comparison',
        vendor_rankings: [],
        recommended_vendor: null,
        recommendation_reason: null,
        risk_factors: [],
        negotiation_tips: []
      };
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error comparing proposals:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
