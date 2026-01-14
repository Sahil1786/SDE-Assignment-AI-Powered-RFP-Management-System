import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RFP } from '@/lib/supabase-types';
import { BarChart3, FileText, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Comparisons() {
  const { user } = useAuth();
  const [rfpsWithProposals, setRfpsWithProposals] = useState<(RFP & { proposalCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get RFPs with proposal counts
      const { data: rfps } = await supabase
        .from('rfps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rfps) {
        const rfpsWithCounts = await Promise.all(
          rfps.map(async (rfp) => {
            const { data: rfpVendors } = await supabase
              .from('rfp_vendors')
              .select('id')
              .eq('rfp_id', rfp.id);

            const rfpVendorIds = rfpVendors?.map(rv => rv.id) || [];
            
            let proposalCount = 0;
            if (rfpVendorIds.length > 0) {
              const { count } = await supabase
                .from('proposals')
                .select('*', { count: 'exact', head: true })
                .in('rfp_vendor_id', rfpVendorIds);
              proposalCount = count || 0;
            }

            return { ...rfp, proposalCount };
          })
        );

        // Only show RFPs with 2+ proposals
        setRfpsWithProposals(rfpsWithCounts.filter(r => r.proposalCount >= 2) as any);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Proposal Comparisons</h1>
          <p className="text-muted-foreground mt-1">
            Compare vendor proposals with AI-powered analysis
          </p>
        </div>

        {/* RFPs with enough proposals */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : rfpsWithProposals.length > 0 ? (
          <div className="space-y-4">
            {rfpsWithProposals.map((rfp) => (
              <Link key={rfp.id} to={`/comparisons/${rfp.id}`}>
                <div className="card-elevated p-5 hover:shadow-lg transition-shadow duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{rfp.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {rfp.proposalCount} proposals • Created {format(new Date(rfp.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 card-elevated">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No comparisons available</h3>
            <p className="text-muted-foreground mb-4">
              RFPs need at least 2 vendor proposals before you can compare them
            </p>
            <Link to="/rfps">
              <span className="text-primary hover:underline">View your RFPs →</span>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
