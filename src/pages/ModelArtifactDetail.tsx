import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  Copy, 
  ExternalLink,
  HardDrive,
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { modelArtifacts, trainingRuns } from '@/lib/mock-data';
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

function getModelTypeColor(type: string) {
  return type === 'trtllm' 
    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
    : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
}

function getFormatColor(format: string) {
  const colors: Record<string, string> = {
    'Triton': 'bg-blue-500/20 text-blue-400',
    'LLM': 'bg-purple-500/20 text-purple-400',
    'RT': 'bg-orange-500/20 text-orange-400',
    'ONNX': 'bg-green-500/20 text-green-400',
  };
  return colors[format] || 'bg-secondary text-muted-foreground';
}

export default function ModelArtifactDetail() {
  const { artifactId } = useParams<{ artifactId: string }>();
  const navigate = useNavigate();
  
  const artifact = modelArtifacts.find(a => a.id === artifactId);
  const trainingRun = artifact ? trainingRuns.find(r => r.id === artifact.trainingRunId) : null;
  
  if (!artifact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Model Artifact Not Found</h2>
        <p className="text-muted-foreground">The model artifact you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/model-artifacts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Model Artifacts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/model-artifacts')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{artifact.artifactType}</h1>
            <Badge className={getModelTypeColor(artifact.modelType)}>
              {artifact.modelType.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{artifact.modelFormat}</Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{artifact.id}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => copyToClipboard(artifact.s3Path)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy S3 Path
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Model Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getFormatColor(artifact.modelFormat)} mb-2`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-bold">{artifact.modelFormat}</p>
                  <p className="text-sm text-muted-foreground">Format</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/20 mb-2">
                    <HardDrive className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg font-bold">{artifact.sizeMb} MB</p>
                  <p className="text-sm text-muted-foreground">Size</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg col-span-2">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-secondary mb-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold">{formatDate(artifact.createdAt)}</p>
                  <p className="text-sm text-muted-foreground">Created</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* S3 Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Storage Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <code className="text-sm font-mono break-all">{artifact.s3Path}</code>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(artifact.s3Path)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Associated Training Run */}
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
                  <div className="flex items-center gap-2">
                    <Badge variant={trainingRun.status === 'success' ? 'success' : 'secondary'}>
                      {trainingRun.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{trainingRun.client}</span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Model Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Model Type</span>
                <Badge className={getModelTypeColor(artifact.modelType)}>
                  {artifact.modelType.toUpperCase()}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Artifact Type</span>
                <span>{artifact.artifactType}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format</span>
                <span>{artifact.modelFormat}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Size</span>
                <span>{artifact.sizeMb} MB</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
