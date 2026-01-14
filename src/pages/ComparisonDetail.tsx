import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { RFP, Proposal, ComparisonAnalysis } from '@/lib/supabase-types';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Sparkles, 
  Trophy, 
  DollarSign, 
  Clock, 
  Star,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function ComparisonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [proposals, setProposals] = useState<(Proposal & { vendor_name: string })[]>([]);
  const [analysis, setAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch RFP
      const { data: rfpData } = await supabase
        .from('rfps')
        .select('*')
        .eq('id', id)
        .single();

      if (rfpData) setRfp(rfpData as RFP);

      // Fetch RFP vendors
      const { data: rfpVendors } = await supabase
        .from('rfp_vendors')
        .select('*, vendor:vendors(*)')
        .eq('rfp_id', id);

      // Fetch proposals
      const rfpVendorIds = rfpVendors?.map(rv => rv.id) || [];
      if (rfpVendorIds.length > 0) {
        const { data: proposalData } = await supabase
          .from('proposals')
          .select('*')
          .in('rfp_vendor_id', rfpVendorIds);

        if (proposalData) {
          const proposalsWithVendor = proposalData.map(p => {
            const rfpVendor = rfpVendors?.find(rv => rv.id === p.rfp_vendor_id);
            return {
              ...p,
              vendor_name: (rfpVendor?.vendor as any)?.name || 'Unknown Vendor'
            };
          });
          setProposals(proposalsWithVendor as any);
        }
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!rfp || proposals.length < 2) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('compare-proposals', {
        body: {
          rfpData: rfp.structured_data,
          proposals: proposals.map(p => ({
            vendor_name: p.vendor_name,
            proposal_data: {
              total_price: p.total_price,
              delivery_days: p.delivery_days,
              payment_terms: p.payment_terms,
              warranty_terms: p.warranty_terms,
              parsed_data: p.parsed_data,
              ai_summary: p.ai_summary
            }
          }))
        }
      });

      if (error) throw error;
      setAnalysis(data.analysis);
      toast.success('Analysis complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze proposals');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!rfp) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p>RFP not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/comparisons')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Compare Proposals: {rfp.title}
              </h1>
              <p className="text-muted-foreground mt-1">
                {proposals.length} proposals to compare
              </p>
            </div>
          </div>
          
          <Button 
            className="btn-gradient-accent gap-2"
            onClick={runAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </Button>
        </div>

        {/* Proposals Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {proposals.map((proposal, index) => {
            const ranking = analysis?.vendor_rankings.find(
              r => r.vendor_name.toLowerCase() === proposal.vendor_name.toLowerCase()
            );
            const isRecommended = analysis?.recommended_vendor?.toLowerCase() === 
              proposal.vendor_name.toLowerCase();

            return (
              <div 
                key={proposal.id} 
                className={`card-elevated p-6 relative ${isRecommended ? 'ring-2 ring-accent' : ''}`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Recommended
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{proposal.vendor_name}</h3>
                  {ranking && (
                    <div className="flex items-center gap-1 text-accent">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-bold">{ranking.score}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total Price
                    </span>
                    <span className="font-semibold">
                      ${proposal.total_price?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Delivery
                    </span>
                    <span className="font-medium">
                      {proposal.delivery_days ? `${proposal.delivery_days} days` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-medium text-sm">
                      {proposal.payment_terms || 'N/A'}
                    </span>
                  </div>
                </div>

                {proposal.ai_summary && (
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {proposal.ai_summary}
                  </p>
                )}

                {ranking && (
                  <div className="mt-4 pt-4 border-t border-border">
                    {ranking.strengths.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-success mb-1">Strengths</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {ranking.strengths.slice(0, 2).map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ranking.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-warning mb-1">Considerations</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {ranking.weaknesses.slice(0, 2).map((w, i) => (
                            <li key={i}>• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Analysis */}
        {analysis && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="card-elevated p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold">AI Analysis Summary</h2>
              </div>
              <p className="text-foreground whitespace-pre-wrap">
                {analysis.comparison_summary}
              </p>
            </div>

            {/* Recommendation */}
            {analysis.recommended_vendor && (
              <div className="card-elevated p-6 bg-accent/5 border-accent/20">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-semibold">Recommendation</h2>
                </div>
                <p className="text-lg font-medium text-accent mb-2">
                  {analysis.recommended_vendor}
                </p>
                <p className="text-foreground">{analysis.recommendation_reason}</p>
              </div>
            )}

            {/* Risk Factors */}
            {analysis.risk_factors.length > 0 && (
              <div className="card-elevated p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h2 className="text-lg font-semibold">Risk Factors</h2>
                </div>
                <ul className="space-y-2">
                  {analysis.risk_factors.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-warning">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Negotiation Tips */}
            {analysis.negotiation_tips.length > 0 && (
              <div className="card-elevated p-6">
                <h2 className="text-lg font-semibold mb-4">💡 Negotiation Tips</h2>
                <ul className="space-y-2">
                  {analysis.negotiation_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
