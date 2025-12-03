import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  RefreshCw,
  BarChart3,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trainingRuns, users } from '@/lib/mock-data';
import { CreateTrainingForm } from '@/components/training/CreateTrainingForm';

function getStatusBadge(status: string) {
  const variants: Record<string, 'success' | 'failed' | 'running' | 'queued'> = {
    success: 'success',
    failed: 'failed',
    running: 'running',
    queued: 'queued',
  };
  return variants[status] || 'secondary';
}

function formatDuration(start: string, end: string | null) {
  if (!end) return 'In progress';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TrainingRuns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const activeTab = searchParams.get('tab') || 'active';

  const activeRuns = trainingRuns.filter(r => r.status === 'running' || r.status === 'queued');
  const completedRuns = trainingRuns.filter(r => r.status === 'success' || r.status === 'failed');

  const filteredCompleted = completedRuns.filter(run =>
    run.name.toLowerCase().includes(search.toLowerCase()) ||
    run.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Training Runs</h1>
        <p className="text-muted-foreground mt-1">Manage and monitor your model training</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="active" className="gap-2">
            <Clock className="h-4 w-4" />
            Active ({activeRuns.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedRuns.length})
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2">
            <Play className="h-4 w-4" />
            Create New
          </TabsTrigger>
        </TabsList>

        {/* Active Trainings */}
        <TabsContent value="active" className="mt-6">
          {activeRuns.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No active trainings</h3>
                <p className="text-muted-foreground mb-4">Start a new training run to see it here</p>
                <Button onClick={() => setSearchParams({ tab: 'create' })}>
                  Create Training Run
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRuns.map((run) => {
                const user = users.find(u => u.id === run.userId);
                return (
                  <Card key={run.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            <Link to={`/training-runs/${run.id}`} className="hover:text-primary transition-colors">
                              {run.name}
                            </Link>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {run.id} • {run.client}
                          </p>
                        </div>
                        <Badge variant={getStatusBadge(run.status)} className="uppercase">
                          {run.status === 'running' && (
                            <span className="mr-1.5 h-2 w-2 rounded-full bg-current animate-pulse inline-block" />
                          )}
                          {run.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Started</span>
                          <span>{formatDate(run.startedAt)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Triggered by</span>
                          <span>{user?.username}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Model Format</span>
                          <Badge variant="secondary">{run.parameters.modelFormat}</Badge>
                        </div>
                        
                        {run.status === 'running' && (
                          <div className="pt-2">
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary w-2/3 rounded-full animate-pulse" />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link to={`/training-runs/${run.id}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              View Details
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Completed Trainings */}
        <TabsContent value="completed" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Completed Training Runs</CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search runs..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Training Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Data Gens</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompleted.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Link 
                          to={`/training-runs/${run.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {run.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{run.id}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(run.status)}>
                          {run.status === 'success' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {run.status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{run.client}</TableCell>
                      <TableCell>{formatDate(run.startedAt)}</TableCell>
                      <TableCell>{formatDuration(run.startedAt, run.completedAt)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{run.dataGenerations.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/training-runs/${run.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Re-run
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Evaluate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create New */}
        <TabsContent value="create" className="mt-6">
          <CreateTrainingForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
