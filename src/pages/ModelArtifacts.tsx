import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Download, 
  Copy, 
  Grid, 
  List,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { modelArtifacts, trainingRuns } from '@/lib/mock-data';
import { toast } from 'sonner';

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

function getFormatIcon(format: string) {
  const colors: Record<string, string> = {
    'Triton': 'bg-blue-500/20 text-blue-400',
    'LLM': 'bg-purple-500/20 text-purple-400',
    'RT': 'bg-orange-500/20 text-orange-400',
    'ONNX': 'bg-green-500/20 text-green-400',
  };
  return colors[format] || 'bg-secondary text-muted-foreground';
}

function getModelTypeColor(type: string) {
  return type === 'trtllm' 
    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
    : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
}

export default function ModelArtifacts() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = modelArtifacts.filter(artifact => {
    const run = trainingRuns.find(r => r.id === artifact.trainingRunId);
    return (
      run?.name.toLowerCase().includes(search.toLowerCase()) ||
      artifact.modelFormat.toLowerCase().includes(search.toLowerCase()) ||
      artifact.modelType.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCardClick = (artifactId: string) => {
    navigate(`/model-artifacts/${artifactId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Model Artifacts</h1>
          <p className="text-muted-foreground mt-1">Browse and download trained models</p>
        </div>
        <div className="flex gap-2">
          <Toggle
            pressed={viewMode === 'grid'}
            onPressedChange={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={viewMode === 'list'}
            onPressedChange={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search artifacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((artifact) => {
            const run = trainingRuns.find(r => r.id === artifact.trainingRunId);
            return (
              <Card 
                key={artifact.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleCardClick(artifact.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getFormatIcon(artifact.modelFormat)}`}>
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getModelTypeColor(artifact.modelType)}>
                        {artifact.modelType.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">{artifact.modelFormat}</Badge>
                    </div>
                  </div>
                  <h3 className="font-medium mb-1">{run?.name || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{artifact.artifactType}</p>
                  
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium">{artifact.sizeMb} MB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatDate(artifact.createdAt)}</span>
                  </div>

                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="mr-1 h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(artifact.s3Path)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artifact</TableHead>
                  <TableHead>Training Run</TableHead>
                  <TableHead>Model Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((artifact) => {
                  const run = trainingRuns.find(r => r.id === artifact.trainingRunId);
                  return (
                    <TableRow 
                      key={artifact.id}
                      className="cursor-pointer"
                      onClick={() => handleCardClick(artifact.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded flex items-center justify-center ${getFormatIcon(artifact.modelFormat)}`}>
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{artifact.artifactType}</p>
                            <p className="text-xs text-muted-foreground">{artifact.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{run?.name}</TableCell>
                      <TableCell>
                        <Badge className={getModelTypeColor(artifact.modelType)}>
                          {artifact.modelType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{artifact.modelFormat}</Badge>
                      </TableCell>
                      <TableCell>{artifact.sizeMb} MB</TableCell>
                      <TableCell>{formatDate(artifact.createdAt)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(artifact.s3Path)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
