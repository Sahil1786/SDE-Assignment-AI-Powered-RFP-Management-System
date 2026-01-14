-- Create vendors table
CREATE TABLE public.vendors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RFPs table
CREATE TABLE public.rfps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    raw_input TEXT NOT NULL,
    structured_data JSONB NOT NULL DEFAULT '{}',
    budget DECIMAL(12,2),
    delivery_days INTEGER,
    payment_terms TEXT,
    warranty_terms TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rfp_vendors junction table (which vendors an RFP was sent to)
CREATE TABLE public.rfp_vendors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rfp_id UUID NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(rfp_id, vendor_id)
);

-- Create proposals table (vendor responses)
CREATE TABLE public.proposals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rfp_vendor_id UUID NOT NULL REFERENCES public.rfp_vendors(id) ON DELETE CASCADE,
    raw_response TEXT,
    parsed_data JSONB NOT NULL DEFAULT '{}',
    total_price DECIMAL(12,2),
    delivery_days INTEGER,
    payment_terms TEXT,
    warranty_terms TEXT,
    ai_score DECIMAL(3,1),
    ai_summary TEXT,
    ai_recommendation TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfp_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Vendors policies
CREATE POLICY "Users can view their own vendors"
ON public.vendors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vendors"
ON public.vendors FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendors"
ON public.vendors FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendors"
ON public.vendors FOR DELETE
USING (auth.uid() = user_id);

-- RFPs policies
CREATE POLICY "Users can view their own rfps"
ON public.rfps FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rfps"
ON public.rfps FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rfps"
ON public.rfps FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rfps"
ON public.rfps FOR DELETE
USING (auth.uid() = user_id);

-- RFP Vendors policies (access through RFP ownership)
CREATE POLICY "Users can view rfp_vendors for their rfps"
ON public.rfp_vendors FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.rfps WHERE rfps.id = rfp_vendors.rfp_id AND rfps.user_id = auth.uid()
));

CREATE POLICY "Users can create rfp_vendors for their rfps"
ON public.rfp_vendors FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.rfps WHERE rfps.id = rfp_vendors.rfp_id AND rfps.user_id = auth.uid()
));

CREATE POLICY "Users can update rfp_vendors for their rfps"
ON public.rfp_vendors FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.rfps WHERE rfps.id = rfp_vendors.rfp_id AND rfps.user_id = auth.uid()
));

CREATE POLICY "Users can delete rfp_vendors for their rfps"
ON public.rfp_vendors FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.rfps WHERE rfps.id = rfp_vendors.rfp_id AND rfps.user_id = auth.uid()
));

-- Proposals policies (access through RFP ownership)
CREATE POLICY "Users can view proposals for their rfps"
ON public.proposals FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.rfp_vendors rv
    JOIN public.rfps r ON r.id = rv.rfp_id
    WHERE rv.id = proposals.rfp_vendor_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can create proposals for their rfps"
ON public.proposals FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.rfp_vendors rv
    JOIN public.rfps r ON r.id = rv.rfp_id
    WHERE rv.id = proposals.rfp_vendor_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can update proposals for their rfps"
ON public.proposals FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.rfp_vendors rv
    JOIN public.rfps r ON r.id = rv.rfp_id
    WHERE rv.id = proposals.rfp_vendor_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can delete proposals for their rfps"
ON public.proposals FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.rfp_vendors rv
    JOIN public.rfps r ON r.id = rv.rfp_id
    WHERE rv.id = proposals.rfp_vendor_id AND r.user_id = auth.uid()
));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfps_updated_at
BEFORE UPDATE ON public.rfps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();