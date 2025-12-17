import { useState, useEffect } from 'react';
import { Check, ChevronRight, ChevronLeft, Loader2, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  fetchTenantMappings, 
  fetchWorkflowsByTenant, 
  fetchTenantTrtllmModels,
  filterSnowflakeTrainingData, 
  saveDataset 
} from '@/lib/api-service';
import type { SnowflakeFilters, TenantMapping, WorkflowInfo, TRTLLMModel } from '@/lib/api-types';
import { toast } from 'sonner';

const steps = [
  { id: 1, title: 'Customer' },
  { id: 2, title: 'Filters' },
  { id: 3, title: 'Preview' },
  { id: 4, title: 'Save' },
];

interface CreateDatasetFormProps {
  onSuccess?: () => void;
}

export function CreateDatasetForm({ onSuccess }: CreateDatasetFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{ 
    record_count: number; 
    fetch_id: string;
    preview: Record<string, unknown>[];
  } | null>(null);

  // Step 1: Customer selection
  const [tenants, setTenants] = useState<TenantMapping[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  // Step 2: Filters data
  const [workflows, setWorkflows] = useState<WorkflowInfo[]>([]);
  const [asrModels, setAsrModels] = useState<TRTLLMModel[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [asrModelsLoading, setAsrModelsLoading] = useState(true);

  // Available languages for the dropdown
  const availableLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'he', 'ru'];

  // Form state
  const [filters, setFilters] = useState<SnowflakeFilters>({
    tenant_id: null,
    date_range_start: undefined,
    date_range_end: undefined,
    languages: [],
    asr_model_versions: [],
    workflow_ids: [],
    is_noisy: null,
    overlapping_speech: null,
    is_not_relevant: null,
    is_voice_recording_na: null,
    is_partial_audio: null,
    is_unclear_audio: null,
  });

  const [dateRangeStart, setDateRangeStart] = useState<Date>();
  const [dateRangeEnd, setDateRangeEnd] = useState<Date>();

  // Auto-generated dataset name
  const [generatedDatasetName, setGeneratedDatasetName] = useState('');

  // Load tenants on mount
  useEffect(() => {
    console.log('selectedTenantId in Load tenants on mount', selectedTenantId);

    const loadTenants = async () => {
      try {
        const data = await fetchTenantMappings();
        setTenants(data);
      } catch (error) {
        toast.error('Failed to load customers');
      } finally {
        setTenantsLoading(false);
      }
    };
    loadTenants();
  }, []);

  // Load ASR models when tenant is selected
  useEffect(() => {
    console.log('selectedTenantId in Load ASR', selectedTenantId);

    if (selectedTenantId) {
      const loadAsrModels = async () => {
        setAsrModelsLoading(true);
        try {
          const data = await fetchTenantTrtllmModels(selectedTenantId);
          setAsrModels(data);
        } catch (error) {
          toast.error('Failed to load ASR models');
        } finally {
          setAsrModelsLoading(false);
        }
      };
      loadAsrModels();
    }
  }, [selectedTenantId]);

  // Load workflows when tenant is selected
  useEffect(() => {
    console.log('selectedTenantId in Load workflows', selectedTenantId);
    if (selectedTenantId) {
      const loadWorkflows = async () => {
        setWorkflowsLoading(true);
        try {
          const data = await fetchWorkflowsByTenant(selectedTenantId);
          setWorkflows(data);
        } catch (error) {
          toast.error('Failed to load workflows');
        } finally {
          setWorkflowsLoading(false);
        }
      };
      loadWorkflows();
    }
  }, [selectedTenantId]);

  const handleTenantSelect = (tenantId: string) => {
    console.log('selectedTenantId in handleTenantSelect', tenantId);
    setSelectedTenantId(tenantId);
    setFilters(prev => ({ ...prev, tenant_id: tenantId, workflow_ids: [] }));
    setWorkflows([]); // Clear workflows when changing tenant
  };

  const toggleWorkflowId = (workflowId: string) => {
    const current = filters.workflow_ids || [];
    if (current.includes(workflowId)) {
      setFilters(prev => ({ ...prev, workflow_ids: current.filter(w => w !== workflowId) }));
    } else {
      setFilters(prev => ({ ...prev, workflow_ids: [...current, workflowId] }));
    }
  };

  const toggleAsrModel = (artifactId: string) => {
    const current = filters.asr_model_versions || [];
    if (current.includes(artifactId)) {
      setFilters(prev => ({ ...prev, asr_model_versions: current.filter(a => a !== artifactId) }));
    } else {
      setFilters(prev => ({ ...prev, asr_model_versions: [...current, artifactId] }));
    }
  };

  const toggleLanguage = (lang: string) => {
    const current = filters.languages || [];
    if (current.includes(lang)) {
      setFilters(prev => ({ ...prev, languages: current.filter(l => l !== lang) }));
    } else {
      setFilters(prev => ({ ...prev, languages: [...current, lang] }));
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: 
        return selectedTenantId !== null && selectedTenantId !== '';
      case 2: 
        return true; // All filters are optional
      case 3: 
        return previewData && previewData.record_count > 0;
      case 4:
        return generatedDatasetName.trim().length > 0;
      default: 
        return true;
    }
  };

  const generateDatasetName = () => {
    const tenant = tenants.find(t => t.tenant_id === selectedTenantId);
    const date = format(new Date(), 'yyyy-MM-dd_HHmm');
    return `${tenant?.tenant_name || 'Dataset'}_${date}`;
  };

  const handleFetchPreview = async () => {
    setLoading(true);
    try {
      const requestFilters: SnowflakeFilters = {
        ...filters,
        date_range_start: dateRangeStart?.toISOString() || null,
        date_range_end: dateRangeEnd?.toISOString() || null,
      };
      
      const response = await filterSnowflakeTrainingData({ filters: requestFilters });
      setPreviewData({
        record_count: response.record_count,
        fetch_id: response.fetch_id,
        preview: response.preview,
      });
      setGeneratedDatasetName(generateDatasetName());
      setCurrentStep(3);
    } catch (error) {
      toast.error('Failed to fetch data preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!previewData) return;
    
    setLoading(true);
    try {
      const requestFilters: SnowflakeFilters = {
        ...filters,
        date_range_start: dateRangeStart?.toISOString() || null,
        date_range_end: dateRangeEnd?.toISOString() || null,
      };

      await saveDataset({
        fetch_id: previewData.fetch_id,
        dataset_name: generatedDatasetName,
        filters: requestFilters,
      });
      toast.success('Dataset created successfully!');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to create dataset');
    } finally {
      setLoading(false);
    }
  };

  const selectedTenant = tenants.find(t => t.tenant_id === selectedTenantId);

  const getAppliedFiltersCount = () => {
    let count = 0;
    if (dateRangeStart && dateRangeEnd) count++;
    if (filters.languages && filters.languages.length > 0) count++;
    if (filters.workflow_ids && filters.workflow_ids.length > 0) count++;
    if (filters.asr_model_versions && filters.asr_model_versions.length > 0) count++;
    if (filters.is_noisy !== null) count++;
    if (filters.overlapping_speech !== null) count++;
    if (filters.is_not_relevant !== null) count++;
    if (filters.is_voice_recording_na !== null) count++;
    if (filters.is_partial_audio !== null) count++;
    if (filters.is_unclear_audio !== null) count++;
    return count;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center font-medium transition-all",
                  currentStep > step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : currentStep === step.id 
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
                      : 'bg-secondary text-muted-foreground'
                )}>
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span className={cn(
                  "text-xs mt-2",
                  currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 w-16 mx-4",
                  currentStep > step.id ? 'bg-primary' : 'bg-border'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Select the customer to fetch data from'}
            {currentStep === 2 && 'Configure filters to narrow down your data'}
            {currentStep === 3 && 'Review the preview of fetched data'}
            {currentStep === 4 && 'Confirm and save your dataset'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Customer Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {tenantsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Customer *</Label>
                  <Select 
                    value={selectedTenantId || undefined} 
                    onValueChange={handleTenantSelect}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a customer...">
                        {selectedTenantId && (
                          <>
                            {tenants.find(t => t.tenant_id === selectedTenantId)?.tenant_name}
                            {tenants.find(t => t.tenant_id === selectedTenantId)?.region && 
                              ` (${tenants.find(t => t.tenant_id === selectedTenantId)?.region})`
                            }
                          </>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                          {tenant.tenant_name} {tenant.region && `(${tenant.region})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Filters */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range (Optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRangeStart && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRangeStart ? format(dateRangeStart, "PPP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRangeStart}
                        onSelect={setDateRangeStart}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRangeEnd && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRangeEnd ? format(dateRangeEnd, "PPP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRangeEnd}
                        onSelect={setDateRangeEnd}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <Label>Languages (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((lang) => (
                    <Badge
                      key={lang}
                      variant={filters.languages?.includes(lang) ? 'default' : 'outline'}
                      className="cursor-pointer uppercase"
                      onClick={() => toggleLanguage(lang)}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Workflow IDs */}
              <div className="space-y-2">
                <Label>Workflow IDs (Optional)</Label>
                {workflowsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading workflows...</span>
                  </div>
                ) : workflows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No workflows available for this customer</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {workflows.map((wf) => (
                      <div
                        key={wf.workflow_id}
                        className={cn(
                          "flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors",
                          filters.workflow_ids?.includes(wf.workflow_id) 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-primary/50"
                        )}
                        onClick={() => toggleWorkflowId(wf.workflow_id)}
                      >
                        <Checkbox 
                          checked={filters.workflow_ids?.includes(wf.workflow_id) || false}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{wf.workflow_name}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{wf.workflow_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ASR Models */}
              <div className="space-y-2">
                <Label>ASR Model Versions (Optional)</Label>
                {asrModelsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading ASR models...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {asrModels.map((model) => (
                      <Badge
                        key={model.artifact_id}
                        variant={filters.asr_model_versions?.includes(model.artifact_id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleAsrModel(model.artifact_id)}
                        title={model.s3_path} // Show S3 path on hover
                      >
                        {model.description || model.s3_path.split('/').pop() || model.artifact_id}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Boolean Filters */}
              <div className="space-y-2">
                <Label>Audio Quality Filters (Optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Is Noisy */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Noisy Audio</p>
                      <p className="text-xs text-muted-foreground">Filter noisy recordings</p>
                    </div>
                    <Select 
                      value={filters.is_noisy === null ? 'any' : filters.is_noisy ? 'true' : 'false'}
                      onValueChange={(v) => setFilters(prev => ({ 
                        ...prev, 
                        is_noisy: v === 'any' ? null : v === 'true' 
                      }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Overlapping Speech */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Overlapping Speech</p>
                      <p className="text-xs text-muted-foreground">Filter overlapping audio</p>
                    </div>
                    <Select 
                      value={filters.overlapping_speech === null ? 'any' : filters.overlapping_speech ? 'true' : 'false'}
                      onValueChange={(v) => setFilters(prev => ({ 
                        ...prev, 
                        overlapping_speech: v === 'any' ? null : v === 'true' 
                      }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Is Not Relevant */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Not Relevant</p>
                      <p className="text-xs text-muted-foreground">Filter non-relevant data</p>
                    </div>
                    <Select 
                      value={filters.is_not_relevant === null ? 'any' : filters.is_not_relevant ? 'true' : 'false'}
                      onValueChange={(v) => setFilters(prev => ({ 
                        ...prev, 
                        is_not_relevant: v === 'any' ? null : v === 'true' 
                      }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Is Voice Recording NA */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Missing Recording</p>
                      <p className="text-xs text-muted-foreground">Voice recording N/A</p>
                    </div>
                    <Select 
                      value={filters.is_voice_recording_na === null ? 'any' : filters.is_voice_recording_na ? 'true' : 'false'}
                      onValueChange={(v) => setFilters(prev => ({ 
                        ...prev, 
                        is_voice_recording_na: v === 'any' ? null : v === 'true' 
                      }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Is Partial Audio */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Partial Audio</p>
                      <p className="text-xs text-muted-foreground">Filter partial recordings</p>
                    </div>
                    <Select 
                      value={filters.is_partial_audio === null ? 'any' : filters.is_partial_audio ? 'true' : 'false'}
                      onValueChange={(v) => setFilters(prev => ({ 
                        ...prev, 
                        is_partial_audio: v === 'any' ? null : v === 'true' 
                      }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Is Unclear Audio */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Unclear Audio</p>
                      <p className="text-xs text-muted-foreground">Filter unclear recordings</p>
                    </div>
                    <Select 
                      value={filters.is_unclear_audio === null ? 'any' : filters.is_unclear_audio ? 'true' : 'false'}
                      onValueChange={(v) => setFilters(prev => ({ 
                        ...prev, 
                        is_unclear_audio: v === 'any' ? null : v === 'true' 
                      }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 3 && previewData && (
            <div className="space-y-6">
              <div className="p-6 bg-primary/10 rounded-lg text-center">
                <p className="text-4xl font-bold text-primary">{previewData.record_count.toLocaleString()}</p>
                <p className="text-muted-foreground mt-1">Records found matching your filters</p>
              </div>

              {/* Applied Filters Summary */}
              <div className="space-y-4">
                <h4 className="font-medium">Applied Filters ({getAppliedFiltersCount()})</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between p-2 bg-secondary/50 rounded">
                    <span className="text-muted-foreground">Customer</span>
                    <span>{selectedTenant?.tenant_name}</span>
                  </div>
                  
                  {dateRangeStart && dateRangeEnd && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-muted-foreground">Date Range</span>
                      <span>{format(dateRangeStart, 'PP')} - {format(dateRangeEnd, 'PP')}</span>
                    </div>
                  )}
                  
                  {filters.languages && filters.languages.length > 0 && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-muted-foreground">Languages</span>
                      <span className="uppercase">{filters.languages.join(', ')}</span>
                    </div>
                  )}
                  
                  {filters.workflow_ids && filters.workflow_ids.length > 0 && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded col-span-2">
                      <span className="text-muted-foreground">Workflows</span>
                      <span>{filters.workflow_ids.length} selected</span>
                    </div>
                  )}
                  
                  {filters.asr_model_versions && filters.asr_model_versions.length > 0 && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded col-span-2">
                      <span className="text-muted-foreground">ASR Models</span>
                      <span>{filters.asr_model_versions.length} selected</span>
                    </div>
                  )}
                  
                  {filters.is_noisy !== null && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-muted-foreground">Noisy Audio</span>
                      <span>{filters.is_noisy ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  
                  {filters.overlapping_speech !== null && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-muted-foreground">Overlapping Speech</span>
                      <span>{filters.overlapping_speech ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  
                  {filters.is_not_relevant !== null && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-muted-foreground">Not Relevant</span>
                      <span>{filters.is_not_relevant ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  
                  {filters.is_voice_recording_na !== null && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-muted-foreground">Missing Recording</span>
                      <span>{filters.is_voice_recording_na ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  
                  {filters.is_partial_audio !== null && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-muted-foreground">Partial Audio</span>
                      <span>{filters.is_partial_audio ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  
                  {filters.is_unclear_audio !== null && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-muted-foreground">Unclear Audio</span>
                      <span>{filters.is_unclear_audio ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              {previewData.preview.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Sample Records</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary">
                          <tr>
                            {Object.keys(previewData.preview[0]).slice(0, 4).map((key) => (
                              <th key={key} className="px-3 py-2 text-left font-medium">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.preview.slice(0, 5).map((record, idx) => (
                            <tr key={idx} className="border-t">
                              {Object.values(record).slice(0, 4).map((val, i) => (
                                <td key={i} className="px-3 py-2 truncate max-w-32">
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Save */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dataset Name</span>
                  <span className="font-medium">{generatedDatasetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Records</span>
                  <span className="font-medium">{previewData?.record_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selectedTenant?.tenant_name}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Click "Save Dataset" to create this dataset. The data will be processed and stored for training.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(s => s - 1)}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep === 2 && (
              <Button
                onClick={handleFetchPreview}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    Preview Data
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}

            {currentStep === 1 && (
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={!canProceed()}
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}

            {currentStep === 4 && (
              <Button
                onClick={handleSave}
                disabled={loading || !canProceed()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Dataset'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
