import { Link } from 'react-router-dom';
import { 
  ExternalLink, 
  AlertCircle, 
  Calendar, 
  Settings2, 
  Database,
  Package,
  Copy 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TrainingRun, dataGenerations, modelArtifacts } from '@/lib/mock-data';
import { toast } from 'sonner';

interface TrainingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingRun: TrainingRun | null;
}

function getStatusBadge(status: string) {
  const variants: Record<string, 'success' | 'failed' | 'running' | 'queued'> = {
    success: 'success',
    failed: 'failed',
    running: 'running',
    queued: 'queued',
  };
  return variants[status] || 'secondary';
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
}

export function TrainingDetailsModal({ open, onOpenChange, trainingRun }: TrainingDetailsModalProps) {
  if (!trainingRun) return null;

  const datasets = dataGenerations.filter(d => trainingRun.dataGenerations.includes(d.id));
  const artifacts = modelArtifacts.filter(a => a.trainingRunId === trainingRun.id);
  const prefectUrl = trainingRun.prefectRunId 
    ? `https://cloud.prefect.io/runs/${trainingRun.prefectRunId}` 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">{trainingRun.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{trainingRun.id}</p>
            </div>
            <Badge variant={getStatusBadge(trainingRun.status)} className="uppercase">
              {trainingRun.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Error Message */}
          {trainingRun.errorMessage && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Error Message</p>
                  <p className="text-sm text-muted-foreground mt-1">{trainingRun.errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Datasets Used */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Database className="h-4 w-4" />
              Datasets Used
            </h4>
            <div className="space-y-2">
              {datasets.map(dataset => (
                <Link
                  key={dataset.id}
                  to={`/datasets/${dataset.id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{dataset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dataset.dateRangeStart} → {dataset.dateRangeEnd}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          {/* Prefect Job Link */}
          {prefectUrl && (
            <>
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <ExternalLink className="h-4 w-4" />
                  Prefect Job
                </h4>
                <a
                  href={prefectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  {prefectUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Separator />
            </>
          )}

          {/* Training Parameters */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Settings2 className="h-4 w-4" />
              Training Parameters
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Client</span>
                <span>{trainingRun.client}</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Model Format</span>
                <Badge variant="secondary">{trainingRun.parameters.modelFormat}</Badge>
              </div>
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Batch Size</span>
                <span>{trainingRun.parameters.hyperparameters.batchSize}</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Learning Rate</span>
                <span>{trainingRun.parameters.hyperparameters.learningRate}</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Epochs</span>
                <span>{trainingRun.parameters.hyperparameters.epochs}</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Optimizer</span>
                <span>{trainingRun.parameters.hyperparameters.optimizer}</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">GPU Type</span>
                <span>{trainingRun.parameters.prefectParams.gpuType}</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Instance Type</span>
                <span>{trainingRun.parameters.prefectParams.instanceType}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" />
              Timeline
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Started</span>
                <span>{formatDate(trainingRun.startedAt)}</span>
              </div>
              {trainingRun.completedAt && (
                <div className="flex justify-between p-2 bg-secondary/30 rounded">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{formatDate(trainingRun.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* View Model Button for completed */}
          {trainingRun.status === 'success' && artifacts.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4" />
                  Model Artifacts
                </h4>
                <div className="flex gap-2">
                  {artifacts.map(artifact => (
                    <Button 
                      key={artifact.id}
                      variant="outline" 
                      asChild
                      onClick={() => onOpenChange(false)}
                    >
                      <Link to={`/model-artifacts/${artifact.id}`}>
                        <Package className="mr-2 h-4 w-4" />
                        View {artifact.modelType.toUpperCase()}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* S3 Path */}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">S3 Path</p>
              <p className="text-xs text-muted-foreground font-mono">{trainingRun.s3Path}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(trainingRun.s3Path)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
