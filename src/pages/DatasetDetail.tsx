import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Database, 
  Calendar, 
  Copy, 
  FileText, 
  Filter,
  Play,
  Trash2,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { dataGenerations, trainingRuns } from '@/lib/mock-data';
import { toast } from 'sonner';

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
}

export default function DatasetDetail() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  
  const dataset = dataGenerations.find(d => d.id === datasetId);
  
  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Database className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Dataset Not Found</h2>
        <p className="text-muted-foreground">The dataset you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/datasets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Datasets
        </Button>
      </div>
    );
  }

  // Find training runs that use this dataset
  const usedInTrainings = trainingRuns.filter(run => 
    run.dataGenerations.includes(dataset.id)
  );

  // Mock files data
  const files = [
    { name: 'train.jsonl', type: 'Train', records: dataset.trainRecords, size: '2.4 GB' },
    { name: 'test.jsonl', type: 'Test', records: dataset.testRecords, size: '680 MB' },
    { name: 'validation.jsonl', type: 'Validation', records: dataset.valRecords, size: '340 MB' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/datasets')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{dataset.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{dataset.client}</Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{dataset.id}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => copyToClipboard(dataset.s3Path)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy S3 Path
          </Button>
          <Button variant="glow">
            <Play className="mr-2 h-4 w-4" />
            Use in Training
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{dataset.totalRecords.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{dataset.trainRecords.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Train</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{dataset.testRecords.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Test</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{dataset.valRecords.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Validation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Files
              </CardTitle>
              <CardDescription>Dataset files stored in S3</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.name}>
                      <TableCell className="font-mono text-sm">{file.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{file.type}</Badge>
                      </TableCell>
                      <TableCell>{file.records.toLocaleString()}</TableCell>
                      <TableCell>{file.size}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Usage History */}
          <Card>
            <CardHeader>
              <CardTitle>Usage History</CardTitle>
              <CardDescription>Training runs using this dataset</CardDescription>
            </CardHeader>
            <CardContent>
              {usedInTrainings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Training Run</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usedInTrainings.map((run) => (
                      <TableRow 
                        key={run.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/training-runs?id=${run.id}`)}
                      >
                        <TableCell className="font-medium">{run.name}</TableCell>
                        <TableCell>
                          <Badge variant={run.status as 'running' | 'success' | 'failed' | 'queued'}>
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(run.startedAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  This dataset hasn't been used in any training runs yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Filters Used Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters Applied
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date Range</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dataset.dateRangeStart} - {dataset.dateRangeEnd}</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">ASR Model Version</p>
                <p className="text-sm mt-1">{dataset.filters.asrModelVersion}</p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Languages</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dataset.filters.languages.map(lang => (
                    <Badge key={lang} variant="secondary" className="text-xs">{lang}</Badge>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Audio Filters</p>
                <div className="space-y-1 mt-1 text-sm">
                  <div className="flex justify-between">
                    <span>Is Noisy</span>
                    <span>{dataset.filters.isNoisy === null ? 'Any' : dataset.filters.isNoisy ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overlapping Speech</span>
                    <span>{dataset.filters.overlappingSpeech ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Is Not Relevant</span>
                    <span>{dataset.filters.isNotRelevant ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Voice Recording N/A</span>
                    <span>{dataset.filters.isVoiceRecordingNa ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workflow ID</p>
                <p className="text-sm font-mono mt-1 break-all">{dataset.filters.workflowId || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Storage Info */}
          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">S3 Path</p>
                <button 
                  onClick={() => copyToClipboard(dataset.s3Path)}
                  className="text-sm font-mono mt-1 text-primary hover:underline break-all text-left"
                >
                  {dataset.s3Path}
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-sm mt-1">{new Date(dataset.createdAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Dataset
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
