import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProposalResponseFormProps {
  rfpVendorId: string;
  vendorName: string;
  rfpContext?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function ProposalResponseForm({ 
  rfpVendorId, 
  vendorName, 
  rfpContext,
  onSubmit, 
  onCancel 
}: ProposalResponseFormProps) {
  const [rawResponse, setRawResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawResponse.trim()) return;

    setLoading(true);
    setParsing(true);

    try {
      // Parse the response with AI
      const { data, error } = await supabase.functions.invoke('parse-proposal', {
        body: { 
          vendorResponse: rawResponse,
          rfpContext 
        }
      });

      if (error) throw error;

      const parsed = data.parsed;

      await onSubmit({
        rfp_vendor_id: rfpVendorId,
        raw_response: rawResponse,
        parsed_data: parsed,
        total_price: parsed.total_price,
        delivery_days: parsed.delivery_days,
        payment_terms: parsed.payment_terms,
        warranty_terms: parsed.warranty_terms,
        ai_score: parsed.completeness_score,
        ai_summary: parsed.summary,
        status: 'received',
        received_at: new Date().toISOString(),
      });

      toast.success('Proposal received and analyzed!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process proposal');
    } finally {
      setLoading(false);
      setParsing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="response">Vendor Response from {vendorName}</Label>
        <p className="text-sm text-muted-foreground">
          Paste the vendor's response here. This can include email content, proposal text, pricing tables, etc.
          Our AI will automatically extract the key details.
        </p>
        <Textarea
          id="response"
          value={rawResponse}
          onChange={(e) => setRawResponse(e.target.value)}
          rows={12}
          placeholder="Paste the vendor's response here..."
          className="font-mono text-sm"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="btn-gradient gap-2" 
          disabled={loading || !rawResponse.trim()}
        >
          {parsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Parse & Save Proposal
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
