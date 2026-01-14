// Extended types for better TypeScript support

export interface Vendor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RFP {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  raw_input: string;
  structured_data: RFPStructuredData;
  budget: number | null;
  delivery_days: number | null;
  payment_terms: string | null;
  warranty_terms: string | null;
  status: 'draft' | 'sent' | 'evaluating' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface RFPStructuredData {
  title?: string;
  description?: string;
  items?: Array<{
    name: string;
    quantity: number;
    specifications?: string;
  }>;
  budget?: number;
  delivery_days?: number;
  payment_terms?: string;
  warranty_terms?: string;
  additional_requirements?: string;
}

export interface RFPVendor {
  id: string;
  rfp_id: string;
  vendor_id: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'responded';
  created_at: string;
  vendor?: Vendor;
}

export interface Proposal {
  id: string;
  rfp_vendor_id: string;
  raw_response: string | null;
  parsed_data: ProposalParsedData;
  total_price: number | null;
  delivery_days: number | null;
  payment_terms: string | null;
  warranty_terms: string | null;
  ai_score: number | null;
  ai_summary: string | null;
  ai_recommendation: string | null;
  status: 'pending' | 'received' | 'analyzed';
  received_at: string | null;
  created_at: string;
  updated_at: string;
  rfp_vendor?: RFPVendor & { vendor?: Vendor };
}

export interface ProposalParsedData {
  total_price?: number;
  line_items?: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  delivery_days?: number;
  payment_terms?: string;
  warranty_terms?: string;
  additional_notes?: string;
  compliance_notes?: string;
  completeness_score?: number;
  summary?: string;
}

export interface ComparisonAnalysis {
  comparison_summary: string;
  vendor_rankings: Array<{
    vendor_name: string;
    rank: number;
    score: number;
    strengths: string[];
    weaknesses: string[];
    key_differentiators: string;
  }>;
  recommended_vendor: string | null;
  recommendation_reason: string | null;
  risk_factors: string[];
  negotiation_tips: string[];
}
