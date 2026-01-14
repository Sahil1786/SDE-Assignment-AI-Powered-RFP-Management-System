import { Link } from 'react-router-dom';
import { FileText, Calendar, DollarSign, Clock, ChevronRight } from 'lucide-react';
import { RFP } from '@/lib/supabase-types';
import { format } from 'date-fns';

interface RFPCardProps {
  rfp: RFP;
}

const statusStyles: Record<string, string> = {
  draft: 'status-draft',
  sent: 'status-sent',
  evaluating: 'status-pending',
  completed: 'status-completed',
};

export function RFPCard({ rfp }: RFPCardProps) {
  return (
    <Link to={`/rfps/${rfp.id}`}>
      <div className="card-elevated p-5 hover:shadow-lg transition-shadow duration-200 group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{rfp.title}</h3>
                <span className={`status-badge ${statusStyles[rfp.status]}`}>
                  {rfp.status.charAt(0).toUpperCase() + rfp.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {rfp.description || rfp.raw_input}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(rfp.created_at), 'MMM d, yyyy')}
                </div>
                {rfp.budget && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {rfp.budget.toLocaleString()}
                  </div>
                )}
                {rfp.delivery_days && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {rfp.delivery_days} days
                  </div>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
      </div>
    </Link>
  );
}
