import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { VendorForm } from '@/components/vendor/VendorForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Vendor } from '@/lib/supabase-types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building2,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function Vendors() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchVendors();
  }, [user]);

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user!.id)
      .order('name');

    if (!error && data) {
      setVendors(data as Vendor[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (data: any) => {
    setSaving(true);
    try {
      if (editingVendor) {
        const { error } = await supabase
          .from('vendors')
          .update(data)
          .eq('id', editingVendor.id);
        if (error) throw error;
        toast.success('Vendor updated');
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert({ ...data, user_id: user!.id });
        if (error) throw error;
        toast.success('Vendor added');
      }
      setShowForm(false);
      setEditingVendor(null);
      fetchVendors();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Vendor deleted');
      fetchVendors();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase()) ||
    v.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
            <p className="text-muted-foreground mt-1">
              Manage your vendor contacts
            </p>
          </div>
          <Button className="btn-gradient gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Vendor Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredVendors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((vendor) => (
              <div key={vendor.id} className="card-elevated p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{vendor.name}</h3>
                      {vendor.company && (
                        <p className="text-sm text-muted-foreground">{vendor.company}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingVendor(vendor);
                        setShowForm(true);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(vendor.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 card-elevated">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search ? 'No vendors found' : 'No vendors yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try a different search term' : 'Add your first vendor to get started'}
            </p>
            {!search && (
              <Button className="btn-gradient gap-2" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Add Vendor
              </Button>
            )}
          </div>
        )}

        {/* Vendor Form Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingVendor(null);
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </DialogTitle>
            </DialogHeader>
            <VendorForm
              vendor={editingVendor || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingVendor(null);
              }}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
