import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Database, 
  Calendar, 
  Copy, 
  FileText, 
  Filter,
  ExternalLink
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

  // Files data with individual S3 links
  const files = [
    { name: 'train.csv', type: 'Train', records: dataset.trainRecords, size: '2.4 GB', s3Link: dataset.trainS3Path },
    { name: 'test.csv', type: 'Test', records: dataset.testRecords, size: '680 MB', s3Link: dataset.testS3Path },
    { name: 'val.csv', type: 'Validation', records: dataset.valRecords, size: '340 MB', s3Link: dataset.valS3Path },
  ];

  // Check which filters are actually applied (non-null values)
  const hasLanguages = dataset.filters.languages && dataset.filters.languages.length > 0;
  const hasWorkflowIds = dataset.filters.workflowIds && dataset.filters.workflowIds.length > 0;
  const hasIsNoisy = dataset.filters.isNoisy !== null;
  const hasOverlappingSpeech = dataset.filters.overlappingSpeech !== null;
  const hasIsNotRelevant = dataset.filters.isNotRelevant !== null;
  const hasIsVoiceRecordingNa = dataset.filters.isVoiceRecordingNa !== null;
  const hasAudioFilters = hasIsNoisy || hasOverlappingSpeech || hasIsNotRelevant || hasIsVoiceRecordingNa;

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
        <Button variant="outline" onClick={() => copyToClipboard(dataset.s3Path)}>
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
                    <TableHead>S3 Link</TableHead>
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
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="gap-1 text-primary"
                          onClick={() => copyToClipboard(file.s3Link)}
                        >
                          <Copy className="h-3 w-3" />
                          Copy
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
          {/* Filters Used Card - Only show filters that were applied */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters Applied
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range - Always shown as it's required */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date Range</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dataset.dateRangeStart} → {dataset.dateRangeEnd}</span>
                </div>
              </div>
              
              <Separator />
              
              {/* ASR Model Version - Always shown as it's required */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">ASR Model Version</p>
                <p className="text-sm mt-1">{dataset.filters.asrModelVersion}</p>
              </div>
              
              {/* Languages - Only show if applied */}
              {hasLanguages && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Languages</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dataset.filters.languages!.map(lang => (
                        <Badge key={lang} variant="secondary" className="text-xs">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Audio Filters - Only show if any are applied */}
              {hasAudioFilters && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Audio Filters</p>
                    <div className="space-y-1 mt-1 text-sm">
                      {hasIsNoisy && (
                        <div className="flex justify-between">
                          <span>Is Noisy</span>
                          <span>{dataset.filters.isNoisy ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                      {hasOverlappingSpeech && (
                        <div className="flex justify-between">
                          <span>Overlapping Speech</span>
                          <span>{dataset.filters.overlappingSpeech ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                      {hasIsNotRelevant && (
                        <div className="flex justify-between">
                          <span>Is Not Relevant</span>
                          <span>{dataset.filters.isNotRelevant ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                      {hasIsVoiceRecordingNa && (
                        <div className="flex justify-between">
                          <span>Voice Recording N/A</span>
                          <span>{dataset.filters.isVoiceRecordingNa ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {/* Workflow IDs - Only show if applied */}
              {hasWorkflowIds && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Workflow IDs</p>
                    <div className="space-y-1 mt-1">
                      {dataset.filters.workflowIds!.map(id => (
                        <p key={id} className="text-sm font-mono break-all">{id}</p>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
        </div>
      </div>
    </div>
  );
}
