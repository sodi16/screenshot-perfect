import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { 
  Play, 
  Plus,
  Eye,
  Package,
  AlertCircle,
  Loader2,
  CalendarIcon,
  Search,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Checkbox } from '@/components/ui/checkbox';
import { users, modelArtifacts, TrainingRun } from '@/lib/mock-data';
import { fetchTrainingRuns, fetchAuthUsers, fetchTenantMappings } from '@/lib/api-service';
import { CreateTrainingForm } from '@/components/training/CreateTrainingForm';
import { TrainingDetailsModal } from '@/components/training/TrainingDetailsModal';
import type { StatusEnum, TenantMapping, AuthUser, TrainingRunsFilterParams } from '@/lib/api-types';
import { cn } from '@/lib/utils';

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

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface TrainingFilters {
  status: StatusEnum | '';
  tenant_ids: string[];
  created_by_ids: string[];
  training_execution_name: string;
  prefect_run_id: string;
}

export default function TrainingRuns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRun, setSelectedRun] = useState<TrainingRun | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [trainingRunsData, setTrainingRunsData] = useState<TrainingRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  // Reference data
  const [tenants, setTenants] = useState<TenantMapping[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  
  // Date range - default to last 2 weeks
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const highlightedId = searchParams.get('id');
  
  // Filters state
  const [filters, setFilters] = useState<TrainingFilters>({
    status: '',
    tenant_ids: [],
    created_by_ids: [],
    training_execution_name: '',
    prefect_run_id: '',
  });

  // Multi-select dropdown states
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [createdByDropdownOpen, setCreatedByDropdownOpen] = useState(false);

  // Load reference data and initial training runs on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch reference data in parallel
        const [tenantsData, usersData] = await Promise.all([
          fetchTenantMappings(),
          fetchAuthUsers(),
        ]);
        
        setTenants(tenantsData);
        setAuthUsers(usersData);
        
        // Fetch training runs with default 2-week filter
        const params: TrainingRunsFilterParams = {
          start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
          end_date: format(new Date(), 'yyyy-MM-dd'),
        };
        
        const runs = await fetchTrainingRuns(params);
        setTrainingRunsData(runs);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

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

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const params: TrainingRunsFilterParams = {};
      
      if (dateRange.from) {
        params.start_date = format(dateRange.from, 'yyyy-MM-dd');
      }
      if (dateRange.to) {
        params.end_date = format(dateRange.to, 'yyyy-MM-dd');
      }
      if (filters.created_by_ids.length > 0) {
        params.created_by = filters.created_by_ids;
      }
      if (filters.tenant_ids.length > 0) {
        params.tenant_id = filters.tenant_ids;
      }
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.training_execution_name.trim()) {
        params.training_execution_name = filters.training_execution_name.trim();
      }
      if (filters.prefect_run_id.trim()) {
        params.prefect_run_id = filters.prefect_run_id.trim();
      }
      
      const runs = await fetchTrainingRuns(params);
      setTrainingRunsData(runs);
    } catch (error) {
      console.error('Failed to search training runs:', error);
    } finally {
      setIsSearching(false);
    }
  };

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
      tenant_ids: [],
      created_by_ids: [],
      training_execution_name: '',
      prefect_run_id: '',
    });
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date(),
    });
  };

  const toggleTenantSelection = (tenantId: string) => {
    setFilters(prev => ({
      ...prev,
      tenant_ids: prev.tenant_ids.includes(tenantId)
        ? prev.tenant_ids.filter(id => id !== tenantId)
        : [...prev.tenant_ids, tenantId]
    }));
  };

  const toggleCreatedBySelection = (userId: string) => {
    setFilters(prev => ({
      ...prev,
      created_by_ids: prev.created_by_ids.includes(userId)
        ? prev.created_by_ids.filter(id => id !== userId)
        : [...prev.created_by_ids, userId]
    }));
  };

  const statusOptions: StatusEnum[] = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'CANCELLING'];

  const hasActiveFilters = filters.status || filters.tenant_ids.length > 0 || filters.created_by_ids.length > 0 || filters.training_execution_name || filters.prefect_run_id;

  // Sort by creation date descending
  const sortedRuns = [...trainingRunsData].sort((a, b) => 
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM dd, yyyy")
                      )
                    ) : (
                      <span>Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Created By Multi-Select */}
            <div className="space-y-2">
              <Label>Created By</Label>
              <Popover open={createdByDropdownOpen} onOpenChange={setCreatedByDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    <span className="truncate">
                      {filters.created_by_ids.length > 0
                        ? `${filters.created_by_ids.length} selected`
                        : "All users"}
                    </span>
                    {filters.created_by_ids.length > 0 && (
                      <X
                        className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters(prev => ({ ...prev, created_by_ids: [] }));
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-60 overflow-auto p-2">
                    {authUsers.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => toggleCreatedBySelection(user.user_id)}
                      >
                        <Checkbox
                          checked={filters.created_by_ids.includes(user.user_id)}
                          onCheckedChange={() => toggleCreatedBySelection(user.user_id)}
                        />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    ))}
                    {authUsers.length === 0 && (
                      <p className="text-sm text-muted-foreground p-2">No users available</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Tenant Multi-Select */}
            <div className="space-y-2">
              <Label>Customer</Label>
              <Popover open={tenantDropdownOpen} onOpenChange={setTenantDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    <span className="truncate">
                      {filters.tenant_ids.length > 0
                        ? `${filters.tenant_ids.length} selected`
                        : "All customers"}
                    </span>
                    {filters.tenant_ids.length > 0 && (
                      <X
                        className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters(prev => ({ ...prev, tenant_ids: [] }));
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-60 overflow-auto p-2">
                    {tenants.map((tenant) => (
                      <div
                        key={tenant.tenant_id}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => toggleTenantSelection(tenant.tenant_id)}
                      >
                        <Checkbox
                          checked={filters.tenant_ids.includes(tenant.tenant_id)}
                          onCheckedChange={() => toggleTenantSelection(tenant.tenant_id)}
                        />
                        <span className="text-sm">{tenant.tenant_name}</span>
                      </div>
                    ))}
                    {tenants.length === 0 && (
                      <p className="text-sm text-muted-foreground p-2">No customers available</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(v) => setFilters(prev => ({ ...prev, status: v === 'all' ? '' : v as StatusEnum }))}
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

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} disabled={isSearching} className="gap-2">
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
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
      ) : sortedRuns.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No training runs found</h3>
            <p className="text-muted-foreground mb-4">
              No training runs found for the selected filters
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              Create Training Run
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRuns.map((run) => {
            const user = users.find(u => u.id === run.userId);
            const artifacts = modelArtifacts.filter(a => a.trainingRunId === run.id);
            const tenant = tenants.find(t => t.tenant_id === run.tenantId);
            
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