import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Play, 
  Plus,
  Eye,
  Package,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { users, modelArtifacts, TrainingRun, tenantMappings } from '@/lib/mock-data';
import { fetchTrainingRuns } from '@/lib/api-service';
import { CreateTrainingForm } from '@/components/training/CreateTrainingForm';
import { TrainingDetailsModal } from '@/components/training/TrainingDetailsModal';
import type { StatusEnum } from '@/lib/api-types';

function getStatusBadge(status: string) {
  const variants: Record<string, 'success' | 'failed' | 'running' | 'queued'> = {
    success: 'success',
    COMPLETED: 'success',
    failed: 'failed',
    FAILED: 'failed',
    running: 'running',
    RUNNING: 'running',
    queued: 'queued',
    PENDING: 'queued',
    CANCELLED: 'failed',
  };
  return variants[status] || 'secondary';
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TrainingFilters {
  status: StatusEnum | '' | 'all';
  tenant_id: string | 'all';
  training_execution_name: string;
  prefect_run_id: string;
}

type CreatedAtFilter = '30' | '60';

export default function TrainingRuns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRun, setSelectedRun] = useState<TrainingRun | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [trainingRunsData, setTrainingRunsData] = useState<TrainingRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createdAtFilter, setCreatedAtFilter] = useState<CreatedAtFilter>('30');
  
  const highlightedId = searchParams.get('id');
  
  // Filters state
  const [filters, setFilters] = useState<TrainingFilters>({
    status: '',
    tenant_id: '',
    training_execution_name: '',
    prefect_run_id: '',
  });

  // Fetch training runs on mount and when createdAtFilter changes
  useEffect(() => {
    console.log('tododododod');

    const loadTrainingRuns = async () => {
      setIsLoading(true);
      try {
        console.log('createdAtFilter in useEffect', createdAtFilter);
        const data = await fetchTrainingRuns(parseInt(createdAtFilter));
        setTrainingRunsData(data);
      } catch (error) {
        console.error('Failed to fetch training runs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTrainingRuns();
  }, [createdAtFilter]);

  // Extract unique tenants from loaded data for dropdown
  const availableTenants = useMemo(() => {
    const uniqueTenants = new Map<string, string>();
    trainingRunsData.forEach(run => {
      if (run.tenantId) {
        const tenantMapping = tenantMappings.find(t => t.tenant_id === run.tenantId);
        uniqueTenants.set(run.tenantId, tenantMapping?.tenant_name || run.tenantId);
      }
    });
    return Array.from(uniqueTenants.entries()).map(([id, name]) => ({
      tenant_id: id,
      customer_name: name,
    }));
  }, [trainingRunsData]);

  // Filter training runs based on current filters (frontend filtering)
  const filteredRuns = useMemo(() => {
    return trainingRunsData.filter(run => {
      // Map local status to filter status
      const statusMapping: Record<string, StatusEnum> = {
        'running': 'RUNNING',
        'success': 'COMPLETED',
        'failed': 'FAILED',
        'queued': 'PENDING',
      };
      const runStatus = statusMapping[run.status] || run.status;
      
      if (filters.status && filters.status !== 'all' && runStatus !== filters.status) return false;
      if (filters.tenant_id && filters.tenant_id !== 'all' && run.tenantId !== filters.tenant_id) return false;
      if (filters.training_execution_name && 
          !run.name.toLowerCase().includes(filters.training_execution_name.toLowerCase())) return false;
      if (filters.prefect_run_id && run.prefectRunId !== filters.prefect_run_id) return false;
      
      return true;
    }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [trainingRunsData, filters]);

  // Open modal if id is in URL
  useEffect(() => {
    if (highlightedId && trainingRunsData.length > 0) {
      const run = trainingRunsData.find(r => r.id === highlightedId);
      if (run) {
        setSelectedRun(run);
        setModalOpen(true);
      }
    }
  }, [highlightedId, trainingRunsData]);

  const handleOpenDetails = (run: TrainingRun) => {
    setSelectedRun(run);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('id');
      setSearchParams(newParams);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      tenant_id: '',
      training_execution_name: '',
      prefect_run_id: '',
    });
  };

  const statusOptions: StatusEnum[] = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'CANCELLING'];

  const hasActiveFilters = filters.status || filters.tenant_id || filters.training_execution_name || filters.prefect_run_id;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Runs</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your model training</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Created At Filter - Backend filter */}
            <div className="space-y-2">
              <Label>Created At</Label>
              <Select 
                value={createdAtFilter} 
                onValueChange={(v) => setCreatedAtFilter(v as CreatedAtFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(v) => setFilters(prev => ({ ...prev, status: v === 'all' ? '' : v as StatusEnum | '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tenant Filter - populated from API response */}
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select 
                value={filters.tenant_id || 'all'} 
                onValueChange={(v) => setFilters(prev => ({ ...prev, tenant_id: v === 'all' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  {availableTenants.map(tenant => (
                    <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                      {tenant.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Training Name Filter */}
            <div className="space-y-2">
              <Label>Training Name</Label>
              <Input
                placeholder="Search by name..."
                value={filters.training_execution_name}
                onChange={(e) => setFilters(prev => ({ ...prev, training_execution_name: e.target.value }))}
              />
            </div>

            {/* Prefect Run ID Filter */}
            <div className="space-y-2">
              <Label>Prefect Run ID</Label>
              <Input
                placeholder="Prefect run ID..."
                value={filters.prefect_run_id}
                onChange={(e) => setFilters(prev => ({ ...prev, prefect_run_id: e.target.value }))}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Loading training runs...</h3>
          </CardContent>
        </Card>
      ) : filteredRuns.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No training runs found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters 
                ? 'No training runs found matching the selected filters' 
                : 'Start a new training run to see it here'}
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              Create Training Run
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRuns.map((run) => {
            const user = users.find(u => u.id === run.userId);
            const artifacts = modelArtifacts.filter(a => a.trainingRunId === run.id);
            const tenant = tenantMappings.find(t => t.tenant_id === run.tenantId);
            
            return (
              <Card key={run.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{run.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {run.id}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(run.status)} className="uppercase ml-2 shrink-0">
                      {run.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created by</span>
                      <span className="truncate ml-2">{user?.username || run.userId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created at</span>
                      <span>{formatDate(run.startedAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customer</span>
                      <span className="truncate ml-2">{tenant?.tenant_name || run.tenantId}</span>
                    </div>
                    
                    {run.prefectRunId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Prefect ID</span>
                        <span className="font-mono text-xs truncate ml-2">{run.prefectRunId}</span>
                      </div>
                    )}
                    
                    {run.errorMessage && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <p className="text-xs text-destructive line-clamp-2">{run.errorMessage}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleOpenDetails(run)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Details
                      </Button>
                      {run.status === 'success' && artifacts.length > 0 && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/model-artifacts/${artifacts[0].id}`}>
                            <Package className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Training Details Modal */}
      <TrainingDetailsModal 
        open={modalOpen} 
        onOpenChange={handleModalClose} 
        trainingRun={selectedRun} 
      />

      {/* Create Training Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Training Run</DialogTitle>
          </DialogHeader>
          <CreateTrainingForm onSuccess={() => setCreateModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
