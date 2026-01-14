import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RFP, Vendor, Proposal } from '@/lib/supabase-types';
import { RFPCard } from '@/components/rfp/RFPCard';
import { 
  FileText, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stats {
  totalRfps: number;
  activeRfps: number;
  totalVendors: number;
  pendingProposals: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalRfps: 0,
    activeRfps: 0,
    totalVendors: 0,
    pendingProposals: 0,
  });
  const [recentRfps, setRecentRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch RFPs
        const { data: rfps } = await supabase
          .from('rfps')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch vendors count
        const { count: vendorCount } = await supabase
          .from('vendors')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch RFP count
        const { count: rfpCount } = await supabase
          .from('rfps')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch active RFPs count
        const { count: activeCount } = await supabase
          .from('rfps')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['sent', 'evaluating']);

        setStats({
          totalRfps: rfpCount || 0,
          activeRfps: activeCount || 0,
          totalVendors: vendorCount || 0,
          pendingProposals: 0, // Will calculate from proposals
        });

        setRecentRfps((rfps || []) as RFP[]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    { 
      label: 'Total RFPs', 
      value: stats.totalRfps, 
      icon: FileText,
      color: 'text-primary bg-primary/10'
    },
    { 
      label: 'Active RFPs', 
      value: stats.activeRfps, 
      icon: TrendingUp,
      color: 'text-accent bg-accent/10'
    },
    { 
      label: 'Vendors', 
      value: stats.totalVendors, 
      icon: Users,
      color: 'text-success bg-success/10'
    },
    { 
      label: 'Pending Proposals', 
      value: stats.pendingProposals, 
      icon: MessageSquare,
      color: 'text-warning bg-warning/10'
    },
  ];

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your procurement activities
            </p>
          </div>
          <Link to="/rfps/new">
            <Button className="btn-gradient gap-2">
              <Plus className="h-4 w-4" />
              New RFP
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent RFPs */}
        <div className="card-elevated">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Recent RFPs</h2>
            <Link to="/rfps" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentRfps.length > 0 ? (
              <div className="space-y-4">
                {recentRfps.map((rfp) => (
                  <RFPCard key={rfp.id} rfp={rfp} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No RFPs yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first RFP to get started
                </p>
                <Link to="/rfps/new">
                  <Button className="btn-gradient gap-2">
                    <Plus className="h-4 w-4" />
                    Create RFP
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
