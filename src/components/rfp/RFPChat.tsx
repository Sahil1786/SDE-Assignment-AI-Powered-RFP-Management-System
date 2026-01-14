import { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RFPStructuredData } from '@/lib/supabase-types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RFPChatProps {
  onRFPCreated: (data: { rawInput: string; structured: RFPStructuredData }) => void;
}

export function RFPChat({ onRFPCreated }: RFPChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'll help you create an RFP. Just describe what you need to procure in natural language. For example:\n\n\"I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty.\""
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('parse-rfp', {
        body: { rawInput: userMessage }
      });

      if (error) throw error;

      const structured = data.structured as RFPStructuredData;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Great! I've structured your RFP. Here's what I understood:\n\n**Title:** ${structured.title || 'Procurement Request'}\n\n**Items:**\n${structured.items?.map(item => `• ${item.quantity}x ${item.name}${item.specifications ? ` (${item.specifications})` : ''}`).join('\n') || 'Not specified'}\n\n**Budget:** ${structured.budget ? `$${structured.budget.toLocaleString()}` : 'Not specified'}\n**Delivery:** ${structured.delivery_days ? `${structured.delivery_days} days` : 'Not specified'}\n**Payment Terms:** ${structured.payment_terms || 'Not specified'}\n**Warranty:** ${structured.warranty_terms || 'Not specified'}\n\nLooks good? Click "Create RFP" below to proceed, or tell me what you'd like to change.`
      }]);

      onRFPCreated({ rawInput: userMessage, structured });

    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error processing your request: ${error.message}. Please try again.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] card-elevated">
      {/* Chat Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <Sparkles className="h-5 w-5 text-accent" />
        <h3 className="font-semibold">AI RFP Assistant</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you need to procure..."
            className="input-chat flex-1"
            disabled={loading}
          />
          <Button type="submit" className="btn-gradient px-4" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
