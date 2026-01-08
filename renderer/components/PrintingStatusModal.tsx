import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Printer, 
  RefreshCw,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface PrintJob {
  id: string;
  type: 'kitchen' | 'customer';
  status: 'pending' | 'printing' | 'completed' | 'failed';
  orderId: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  previewText?: string;
}

interface PrintingStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: PrintJob[];
  onRetryJob?: (jobId: string) => void;
  onViewPreview?: (job: PrintJob) => void;
}

export default function PrintingStatusModal({ 
  open, 
  onOpenChange, 
  jobs, 
  onRetryJob,
  onViewPreview 
}: PrintingStatusModalProps) {
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);

  const getStatusIcon = (status: PrintJob['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'printing': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: PrintJob['status']) => {
    switch (status) {
      case 'completed': return 'border-green-500/50 text-green-300 bg-green-500/10';
      case 'failed': return 'border-red-500/50 text-red-300 bg-red-500/10';
      case 'printing': return 'border-blue-500/50 text-blue-300 bg-blue-500/10';
      case 'pending': return 'border-yellow-500/50 text-yellow-300 bg-yellow-500/10';
      default: return 'border-gray-500/50 text-gray-300 bg-gray-500/10';
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const diff = endTime.getTime() - start.getTime();
    const seconds = Math.floor(diff / 1000);
    return `${seconds}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900/95 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-purple-400" />
            Print Job Status
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Printer className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No print jobs found</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div 
                key={job.id}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {job.type === 'kitchen' ? '🔥 Kitchen Ticket' : '🧾 Customer Receipt'}
                      </p>
                      <p className="text-xs text-gray-400">Order: {job.orderId}</p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(job.status)}`}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Created: {job.createdAt.toLocaleTimeString()}
                  </span>
                  {job.completedAt && (
                    <span>
                      Duration: {formatDuration(job.createdAt, job.completedAt)}
                    </span>
                  )}
                </div>
                
                {job.error && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                    {job.error}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {job.status === 'failed' && onRetryJob && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetryJob(job.id)}
                      className="text-xs h-7 border-orange-500/50 text-orange-300 hover:text-orange-200"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  )}
                  
                  {job.previewText && onViewPreview && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewPreview(job)}
                      className="text-xs h-7 border-gray-500/50 text-gray-300 hover:text-white"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-gray-300 hover:text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
