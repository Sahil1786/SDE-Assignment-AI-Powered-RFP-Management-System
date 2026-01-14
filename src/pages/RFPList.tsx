import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RFP } from '@/lib/supabase-types';
import { RFPCard } from '@/components/rfp/RFPCard';
import { FileText, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RFPList() {
  const { user } = useAuth();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchRfps = async () => {
      const { data, error } = await supabase
        .from('rfps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRfps(data as RFP[]);
      }
      setLoading(false);
    };

    fetchRfps();
  }, [user]);

  const filteredRfps = rfps.filter(rfp =>
    rfp.title.toLowerCase().includes(search.toLowerCase()) ||
    rfp.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">RFPs</h1>
            <p className="text-muted-foreground mt-1">
              Manage your Requests for Proposal
            </p>
          </div>
          <Link to="/rfps/new">
            <Button className="btn-gradient gap-2">
              <Plus className="h-4 w-4" />
              New RFP
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search RFPs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* RFP List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredRfps.length > 0 ? (
          <div className="space-y-4">
            {filteredRfps.map((rfp) => (
              <RFPCard key={rfp.id} rfp={rfp} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 card-elevated">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search ? 'No RFPs found' : 'No RFPs yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try a different search term' : 'Create your first RFP to get started'}
            </p>
            {!search && (
              <Link to="/rfps/new">
                <Button className="btn-gradient gap-2">
                  <Plus className="h-4 w-4" />
                  Create RFP
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
