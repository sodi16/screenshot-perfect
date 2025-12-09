import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  Calendar, 
  Copy, 
  ExternalLink,
  Database,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { evaluations, trainingRuns, dataGenerations } from '@/lib/mock-data';
import { toast } from 'sonner';

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
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

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function EvaluationDetail() {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  
  const evaluation = evaluations.find(e => e.id === evaluationId);
  const trainingRun = evaluation ? trainingRuns.find(r => r.id === evaluation.trainingRunId) : null;
  const testDataset = evaluation ? dataGenerations.find(d => d.id === evaluation.testDataGenerationId) : null;
  
  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <BarChart3 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Evaluation Not Found</h2>
        <p className="text-muted-foreground">The evaluation you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/evaluations')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Evaluations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/evaluations')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Evaluation Details</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{evaluation.evaluationType}</Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{evaluation.id}</span>
          </div>
        </div>
        <Badge variant={evaluation.status === 'completed' ? 'success' : 'secondary'} className="uppercase">
          {evaluation.status === 'completed' && <CheckCircle2 className="mr-1 h-3 w-3" />}
          {evaluation.status}
        </Badge>
      </div>

      {/* Error Message */}
      {evaluation.errorMessage && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error Message</p>
              <p className="text-sm text-muted-foreground mt-1">{evaluation.errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evaluation Metrics
              </CardTitle>
              <CardDescription>Performance metrics from this evaluation run</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                  <p className="text-2xl font-bold text-success">{formatPercent(evaluation.metrics.accuracy)}</p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{formatPercent(evaluation.metrics.wer)}</p>
                  <p className="text-sm text-muted-foreground">WER</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{formatPercent(evaluation.metrics.precision)}</p>
                  <p className="text-sm text-muted-foreground">Precision</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{formatPercent(evaluation.metrics.recall)}</p>
                  <p className="text-sm text-muted-foreground">Recall</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* S3 Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Results Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <code className="text-sm font-mono break-all">{evaluation.s3ResultsPath}</code>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(evaluation.s3ResultsPath)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Training Run */}
          {trainingRun && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Training Run
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/training-runs?id=${trainingRun.id}`}
                  className="block p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{trainingRun.name}</p>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{trainingRun.id}</p>
                  <Badge variant={trainingRun.status === 'success' ? 'success' : 'secondary'}>
                    {trainingRun.status}
                  </Badge>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Test Dataset */}
          {testDataset && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Test Dataset
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/datasets/${testDataset.id}`}
                  className="block p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{testDataset.name}</p>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {testDataset.dateRangeStart} → {testDataset.dateRangeEnd}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testDataset.testRecords.toLocaleString()} test records
                  </p>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Evaluation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Evaluation Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary">{evaluation.evaluationType}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={evaluation.status === 'completed' ? 'success' : 'secondary'}>
                  {evaluation.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Evaluated At</span>
                <span>{formatDate(evaluation.evaluatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
