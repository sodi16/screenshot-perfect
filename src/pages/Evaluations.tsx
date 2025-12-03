import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Plus, 
  Eye,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { evaluations, trainingRuns, dataGenerations } from '@/lib/mock-data';

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

export default function Evaluations() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Evaluations</h1>
          <p className="text-muted-foreground mt-1">Model performance metrics and results</p>
        </div>
        <Button variant="glow">
          <Plus className="mr-2 h-4 w-4" />
          New Evaluation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Accuracy</p>
                <p className="text-3xl font-bold text-success">95.0%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average WER</p>
                <p className="text-3xl font-bold">11.0%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Evaluations</p>
                <p className="text-3xl font-bold">{evaluations.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-info/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evaluation ID</TableHead>
                <TableHead>Training Run</TableHead>
                <TableHead>Test Dataset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>WER</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.map((evalItem) => {
                const run = trainingRuns.find(r => r.id === evalItem.trainingRunId);
                const dataGen = dataGenerations.find(d => d.id === evalItem.testDataGenerationId);
                return (
                  <TableRow key={evalItem.id}>
                    <TableCell className="font-medium">{evalItem.id}</TableCell>
                    <TableCell>
                      <Link 
                        to={`/training-runs/${evalItem.trainingRunId}`}
                        className="hover:text-primary transition-colors"
                      >
                        {run?.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/data-generations/${evalItem.testDataGenerationId}`}
                        className="hover:text-primary transition-colors"
                      >
                        {dataGen?.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{evalItem.evaluationType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{formatPercent(evalItem.metrics.accuracy)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{formatPercent(evalItem.metrics.wer)}</span>
                    </TableCell>
                    <TableCell>{formatDate(evalItem.evaluatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
