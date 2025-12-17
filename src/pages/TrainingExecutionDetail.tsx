import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Cpu, 
  Calendar, 
  Copy, 
  Database,
  Box,
  BarChart3,
  ExternalLink,
  User,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { fetchTrainingExecutionDetails } from '@/lib/api-service';
import type { TrainingExecutionDetailsResponse } from '@/lib/api-types';

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'RUNNING':
    case 'CANCELLING':
      return 'secondary';
    case 'FAILED':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function TrainingExecutionDetail() {
  const { trainingId } = useParams<{ trainingId: string }>();
  const navigate = useNavigate();
  const [training, setTraining] = useState<TrainingExecutionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!trainingId) return;
      
      try {
        setLoading(true);
        const data = await fetchTrainingExecutionDetails(trainingId);
        setTraining(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load training details');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [trainingId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !training) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Cpu className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Training Not Found</h2>
        <p className="text-muted-foreground">{error || "The training execution you're looking for doesn't exist."}</p>
        <Button onClick={() => navigate('/training-runs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Training Runs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/training-runs')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{training.training_execution_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={getStatusBadgeVariant(training.status)}>{training.status}</Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground font-mono">{training.training_execution_id}</span>
          </div>
        </div>
        {training.s3_model_path && (
          <Button variant="outline" onClick={() => copyToClipboard(training.s3_model_path!)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy S3 Path
          </Button>
        )}
      </div>

      {/* Error Message */}
      {training.error_message && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/80">{training.error_message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Training Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Training Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="mt-1">{training.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tenant ID</p>
                  <p className="mt-1 font-mono text-sm">{training.tenant_id || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="mt-1">{training.description || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prefect Run ID</p>
                  {training.prefect_run_id ? (
                    <p className="mt-1 font-mono text-sm text-primary">{training.prefect_run_id}</p>
                  ) : (
                    <p className="mt-1">-</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{training.created_by_user_email || '-'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Updated By</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{training.updated_by_user_email || '-'}</span>
                  </div>
                </div>
                {training.s3_model_path && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">S3 Model Path</p>
                    <button 
                      onClick={() => copyToClipboard(training.s3_model_path!)}
                      className="mt-1 font-mono text-sm text-primary hover:underline break-all text-left"
                    >
                      {training.s3_model_path}
                    </button>
                  </div>
                )}
                {training.wandb_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Wandb URL</p>
                    <button 
                      onClick={() => copyToClipboard(training.wandb_url!)}
                      className="mt-1 font-mono text-sm text-primary hover:underline break-all text-left"
                    >
                      {training.wandb_url}
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datasets Used */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Datasets Used
              </CardTitle>
              <CardDescription>Training data preparations used in this training</CardDescription>
            </CardHeader>
            <CardContent>
              {training.training_data_preparations && training.training_data_preparations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dataset Name</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>S3 Path</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {training.training_data_preparations.map((dataset) => (
                      <TableRow 
                        key={dataset.training_data_preparation_id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/datasets/${dataset.training_data_preparation_id}`)}
                      >
                        <TableCell className="font-medium">{dataset.dataset_name}</TableCell>
                        <TableCell>{dataset.customer_name || '-'}</TableCell>
                        <TableCell>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(dataset.s3_root_path);
                            }}
                            className="font-mono text-xs text-primary hover:underline truncate max-w-[200px] block"
                          >
                            {dataset.s3_root_path}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No datasets associated with this training.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Artifacts */}
          {((training.model_artifacts && training.model_artifacts.length > 0) || training.base_model_artifact) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Model Artifacts
                </CardTitle>
                <CardDescription>Generated model artifacts from this training</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artifact Type</TableHead>
                      <TableHead>Model Name</TableHead>
                      <TableHead>Model Tag</TableHead>
                      <TableHead>S3 Path</TableHead>
                      <TableHead>Size (MB)</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Base Model Artifact */}
                    {training.base_model_artifact && (
                      <TableRow 
                        key={training.base_model_artifact.artifact_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/model-artifacts/${training.base_model_artifact.artifact_id}`)}
                      >
                        <TableCell>
                          <Badge variant="outline">WEIGHT</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {training.base_model_artifact.model_artifact_name}
                        </TableCell>
                        <TableCell>
                          {training.base_model_artifact.model_tag ? (
                            <Badge variant="secondary">{training.base_model_artifact.model_tag}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(training.base_model_artifact!.s3_path);
                            }}
                            className="font-mono text-xs text-primary hover:underline truncate max-w-[200px] block"
                          >
                            {training.base_model_artifact.s3_path}
                          </button>
                        </TableCell>
                        <TableCell>{training.base_model_artifact.model_size_mb?.toLocaleString() || '-'}</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    )}
                    {/* Generated Model Artifacts */}
                    {training.model_artifacts?.map((artifact) => (
                      <TableRow 
                        key={artifact.artifact_id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/model-artifacts/${artifact.artifact_id}`)}
                      >
                        <TableCell>
                          <Badge variant="outline">{artifact.artifact_type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {artifact.model_artifact_name}
                        </TableCell>
                        <TableCell>
                          {artifact.model_tag ? (
                            <Badge variant="secondary">{artifact.model_tag}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(artifact.s3_path);
                            }}
                            className="font-mono text-xs text-primary hover:underline truncate max-w-[200px] block"
                          >
                            {artifact.s3_path}
                          </button>
                        </TableCell>
                        <TableCell>{artifact.model_size_mb?.toLocaleString() || '-'}</TableCell>
                        <TableCell>{formatDate(artifact.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Evaluations */}
          {training.evaluations && training.evaluations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evaluations
                </CardTitle>
                <CardDescription>Evaluation results for this training</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S3 Results Path</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Evaluated At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {training.evaluations.map((evaluation) => (
                      <TableRow 
                        key={evaluation.evaluation_id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/evaluations/${evaluation.evaluation_id}`)}
                      >
                        <TableCell>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(evaluation.s3_results_path);
                            }}
                            className="font-mono text-xs text-primary hover:underline truncate max-w-[200px] block"
                          >
                            {evaluation.s3_results_path}
                          </button>
                        </TableCell>
                        <TableCell>
                          {evaluation.accuracy !== null && evaluation.accuracy !== undefined 
                            ? `${(evaluation.accuracy * 100).toFixed(2)}%` 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {evaluation.error_message ? (
                            <span className="text-destructive text-sm">{evaluation.error_message}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{formatDate(evaluation.evaluated_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-sm mt-1">{formatDate(training.created_at)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Started At</p>
                <p className="text-sm mt-1">{formatDate(training.started_at)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed At</p>
                <p className="text-sm mt-1">{formatDate(training.completed_at)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                <p className="text-sm mt-1">{formatDate(training.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Hyperparameters */}
          {training.hyperparameters && Object.keys(training.hyperparameters).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hyperparameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(training.hyperparameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prefect Parameters */}
          {training.prefect_parameters && Object.keys(training.prefect_parameters).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prefect Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(training.prefect_parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-mono truncate max-w-[120px]" title={String(value)}>
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
