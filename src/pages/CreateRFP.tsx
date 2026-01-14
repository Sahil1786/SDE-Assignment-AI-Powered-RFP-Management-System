import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RFPChat } from '@/components/rfp/RFPChat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RFPStructuredData } from '@/lib/supabase-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateRFP() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rfpData, setRfpData] = useState<{ rawInput: string; structured: RFPStructuredData } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState({
    title: '',
    description: '',
    budget: '',
    delivery_days: '',
    payment_terms: '',
    warranty_terms: '',
  });

  const handleRFPCreated = (data: { rawInput: string; structured: RFPStructuredData }) => {
    setRfpData(data);
    setEditedData({
      title: data.structured.title || 'Procurement Request',
      description: data.structured.description || '',
      budget: data.structured.budget?.toString() || '',
      delivery_days: data.structured.delivery_days?.toString() || '',
      payment_terms: data.structured.payment_terms || '',
      warranty_terms: data.structured.warranty_terms || '',
    });
  };

  const handleSave = async () => {
    if (!user || !rfpData) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('rfps')
        .insert([{
          user_id: user.id,
          title: editedData.title,
          description: editedData.description,
          raw_input: rfpData.rawInput,
          structured_data: rfpData.structured as any,
          budget: editedData.budget ? parseFloat(editedData.budget) : null,
          delivery_days: editedData.delivery_days ? parseInt(editedData.delivery_days) : null,
          payment_terms: editedData.payment_terms || null,
          warranty_terms: editedData.warranty_terms || null,
          status: 'draft',
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('RFP created successfully!');
      navigate(`/rfps/${data.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create RFP');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/rfps')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create RFP</h1>
            <p className="text-muted-foreground mt-1">
              Describe your procurement needs in natural language
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Chat Section */}
          <div>
            <RFPChat onRFPCreated={handleRFPCreated} />
          </div>

          {/* Preview/Edit Section */}
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold mb-4">RFP Details</h2>
            
            {rfpData ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editedData.title}
                    onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editedData.description}
                    onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={editedData.budget}
                      onChange={(e) => setEditedData({ ...editedData, budget: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery">Delivery (days)</Label>
                    <Input
                      id="delivery"
                      type="number"
                      value={editedData.delivery_days}
                      onChange={(e) => setEditedData({ ...editedData, delivery_days: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment">Payment Terms</Label>
                  <Input
                    id="payment"
                    value={editedData.payment_terms}
                    onChange={(e) => setEditedData({ ...editedData, payment_terms: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty">Warranty Terms</Label>
                  <Input
                    id="warranty"
                    value={editedData.warranty_terms}
                    onChange={(e) => setEditedData({ ...editedData, warranty_terms: e.target.value })}
                  />
                </div>

                {/* Items Preview */}
                {rfpData.structured.items && rfpData.structured.items.length > 0 && (
                  <div className="space-y-2">
                    <Label>Items</Label>
                    <div className="bg-muted rounded-lg p-3 space-y-2">
                      {rfpData.structured.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          {item.specifications && (
                            <span className="text-muted-foreground">{item.specifications}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSave} 
                  className="w-full btn-gradient gap-2 mt-6"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Create RFP
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Describe your procurement needs in the chat to generate an RFP</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
