import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RFP, Vendor, RFPVendor, Proposal } from '@/lib/supabase-types';
import { ProposalResponseForm } from '@/components/proposal/ProposalResponseForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Send, 
  Users, 
  Plus, 
  MessageSquare,
  BarChart3,
  DollarSign,
  Clock,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function RFPDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rfpVendors, setRfpVendors] = useState<(RFPVendor & { vendor: Vendor })[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showVendorSelect, setShowVendorSelect] = useState(false);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [showProposalForm, setShowProposalForm] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    fetchData();
  }, [user, id]);

  const fetchData = async () => {
    try {
      // Fetch RFP
      const { data: rfpData } = await supabase
        .from('rfps')
        .select('*')
        .eq('id', id)
        .single();

      if (rfpData) setRfp(rfpData as RFP);

      // Fetch all vendors
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user!.id);

      if (vendorData) setVendors(vendorData as Vendor[]);

      // Fetch RFP vendors with vendor details
      const { data: rfpVendorData } = await supabase
        .from('rfp_vendors')
        .select('*, vendor:vendors(*)')
        .eq('rfp_id', id);

      if (rfpVendorData) {
        setRfpVendors(rfpVendorData as (RFPVendor & { vendor: Vendor })[]);
      }

      // Fetch proposals
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('*, rfp_vendor:rfp_vendors(*, vendor:vendors(*))')
        .in('rfp_vendor_id', rfpVendorData?.map(rv => rv.id) || []);

      if (proposalData) setProposals(proposalData as any);

    } catch (error) {
      console.error('Error fetching RFP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendors = async () => {
    if (!id || selectedVendorIds.length === 0) return;

    try {
      const newRfpVendors = selectedVendorIds
        .filter(vid => !rfpVendors.some(rv => rv.vendor_id === vid))
        .map(vendor_id => ({
          rfp_id: id,
          vendor_id,
          status: 'pending',
        }));

      if (newRfpVendors.length > 0) {
        const { error } = await supabase
          .from('rfp_vendors')
          .insert(newRfpVendors);

        if (error) throw error;
        toast.success('Vendors added to RFP');
        fetchData();
      }
      
      setShowVendorSelect(false);
      setSelectedVendorIds([]);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSendRFP = async (rfpVendorId: string) => {
    try {
      await supabase
        .from('rfp_vendors')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', rfpVendorId);

      await supabase
        .from('rfps')
        .update({ status: 'sent' })
        .eq('id', id);

      toast.success('RFP marked as sent!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveProposal = async (proposalData: any) => {
    try {
      const { error } = await supabase
        .from('proposals')
        .insert(proposalData);

      if (error) throw error;

      await supabase
        .from('rfp_vendors')
        .update({ status: 'responded' })
        .eq('id', proposalData.rfp_vendor_id);

      setShowProposalForm(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
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

  const statusStyles: Record<string, string> = {
    draft: 'status-draft',
    sent: 'status-sent',
    evaluating: 'status-pending',
    completed: 'status-completed',
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/rfps')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{rfp.title}</h1>
                <span className={`status-badge ${statusStyles[rfp.status]}`}>
                  {rfp.status.charAt(0).toUpperCase() + rfp.status.slice(1)}
                </span>
              </div>
              <p className="text-muted-foreground">
                Created {format(new Date(rfp.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          
          {proposals.length >= 2 && (
            <Button 
              className="btn-gradient-accent gap-2"
              onClick={() => navigate(`/comparisons/${id}`)}
            >
              <BarChart3 className="h-4 w-4" />
              Compare Proposals
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* RFP Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">RFP Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {rfp.budget && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-semibold">${rfp.budget.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {rfp.delivery_days && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery</p>
                      <p className="font-semibold">{rfp.delivery_days} days</p>
                    </div>
                  </div>
                )}
              </div>

              {rfp.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-foreground">{rfp.description}</p>
                </div>
              )}

              {rfp.payment_terms && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Terms</h3>
                  <p className="text-foreground">{rfp.payment_terms}</p>
                </div>
              )}

              {rfp.warranty_terms && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Warranty Terms</h3>
                  <p className="text-foreground">{rfp.warranty_terms}</p>
                </div>
              )}
            </div>

            {/* Vendors & Proposals */}
            <div className="card-elevated">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold">Vendors & Proposals</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setShowVendorSelect(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Vendor
                </Button>
              </div>

              <div className="p-6">
                {rfpVendors.length > 0 ? (
                  <div className="space-y-4">
                    {rfpVendors.map((rv) => {
                      const proposal = proposals.find(p => p.rfp_vendor_id === rv.id);
                      return (
                        <div 
                          key={rv.id} 
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{rv.vendor.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {rv.vendor.company || rv.vendor.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {rv.status === 'pending' && (
                              <Button 
                                size="sm" 
                                className="gap-2"
                                onClick={() => handleSendRFP(rv.id)}
                              >
                                <Send className="h-4 w-4" />
                                Send RFP
                              </Button>
                            )}
                            {rv.status === 'sent' && !proposal && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="gap-2"
                                onClick={() => setShowProposalForm(rv.id)}
                              >
                                <MessageSquare className="h-4 w-4" />
                                Add Response
                              </Button>
                            )}
                            {proposal && (
                              <div className="flex items-center gap-2 text-success">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                  Received • ${proposal.total_price?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p>No vendors assigned to this RFP yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Vendors</span>
                  <span className="font-medium">{rfpVendors.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="font-medium">
                    {rfpVendors.filter(rv => rv.status !== 'pending').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Responses</span>
                  <span className="font-medium">{proposals.length}</span>
                </div>
              </div>
            </div>

            {/* Original Request */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold mb-4">Original Request</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {rfp.raw_input}
              </p>
            </div>
          </div>
        </div>

        {/* Add Vendor Dialog */}
        <Dialog open={showVendorSelect} onOpenChange={setShowVendorSelect}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Vendors</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {vendors.length > 0 ? (
                <>
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center gap-3">
                      <Checkbox
                        id={vendor.id}
                        checked={selectedVendorIds.includes(vendor.id)}
                        onCheckedChange={(checked) => {
                          setSelectedVendorIds(prev =>
                            checked
                              ? [...prev, vendor.id]
                              : prev.filter(id => id !== vendor.id)
                          );
                        }}
                        disabled={rfpVendors.some(rv => rv.vendor_id === vendor.id)}
                      />
                      <label htmlFor={vendor.id} className="flex-1">
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">{vendor.email}</p>
                      </label>
                    </div>
                  ))}
                  <Button 
                    className="w-full btn-gradient"
                    onClick={handleAddVendors}
                    disabled={selectedVendorIds.length === 0}
                  >
                    Add Selected Vendors
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No vendors yet</p>
                  <Button onClick={() => navigate('/vendors')}>
                    Add Vendors First
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Proposal Dialog */}
        <Dialog open={!!showProposalForm} onOpenChange={() => setShowProposalForm(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Vendor Response</DialogTitle>
            </DialogHeader>
            {showProposalForm && (
              <ProposalResponseForm
                rfpVendorId={showProposalForm}
                vendorName={rfpVendors.find(rv => rv.id === showProposalForm)?.vendor.name || ''}
                rfpContext={rfp.raw_input}
                onSubmit={handleSaveProposal}
                onCancel={() => setShowProposalForm(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
