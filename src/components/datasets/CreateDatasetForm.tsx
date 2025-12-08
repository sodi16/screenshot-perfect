import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Loader2, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';
import { createDatasetFetch, saveDataset } from '@/lib/api-service';
import type { SnowflakeFilters } from '@/lib/api-types';
import { toast } from 'sonner';

const steps = [
  { id: 1, title: 'Filters' },
  { id: 2, title: 'Preview' },
  { id: 3, title: 'Save' },
];

const availableLanguages = [
  'English', 'Spanish', 'French', 'German', 'Italian', 
  'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic'
];

interface CreateDatasetFormProps {
  onSuccess?: () => void;
}

export function CreateDatasetForm({ onSuccess }: CreateDatasetFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{ total_count: number; fetch_id: string } | null>(null);

  // Form state
  const [filters, setFilters] = useState<SnowflakeFilters>({
    date_range_start: undefined,
    date_range_end: undefined,
    asr_model_version: '',
    languages: [],
    workflow_ids: [],
    is_noisy: null,
    overlapping_speech: null,
    is_not_relevant: null,
    is_voice_recording_na: null,
  });

  const [datasetName, setDatasetName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [newWorkflowId, setNewWorkflowId] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState<Date>();
  const [dateRangeEnd, setDateRangeEnd] = useState<Date>();

  const updateFilter = <K extends keyof SnowflakeFilters>(key: K, value: SnowflakeFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addWorkflowId = () => {
    if (newWorkflowId && !filters.workflow_ids?.includes(newWorkflowId)) {
      updateFilter('workflow_ids', [...(filters.workflow_ids || []), newWorkflowId]);
      setNewWorkflowId('');
    }
  };

  const removeWorkflowId = (id: string) => {
    updateFilter('workflow_ids', filters.workflow_ids?.filter(w => w !== id) || []);
  };

  const toggleLanguage = (lang: string) => {
    const current = filters.languages || [];
    if (current.includes(lang)) {
      updateFilter('languages', current.filter(l => l !== lang));
    } else {
      updateFilter('languages', [...current, lang]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: 
        return dateRangeStart && dateRangeEnd && filters.asr_model_version;
      case 2: 
        return previewData && previewData.total_count > 0;
      case 3:
        return datasetName.trim().length > 0;
      default: 
        return true;
    }
  };

  const handleFetchPreview = async () => {
    setLoading(true);
    try {
      const requestFilters: SnowflakeFilters = {
        ...filters,
        date_range_start: dateRangeStart?.toISOString(),
        date_range_end: dateRangeEnd?.toISOString(),
      };
      
      const response = await createDatasetFetch({ filters: requestFilters });
      setPreviewData({
        total_count: response.preview.total_count,
        fetch_id: response.fetch_id,
      });
      setCurrentStep(2);
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
      await saveDataset({
        fetch_id: previewData.fetch_id,
        generation_name: datasetName,
        customer_name: customerName || undefined,
      });
      toast.success('Dataset created successfully!');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to create dataset');
    } finally {
      setLoading(false);
    }
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
                  "h-0.5 w-24 mx-4",
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
            {currentStep === 1 && 'Configure Snowflake filters to fetch your data'}
            {currentStep === 2 && 'Review the preview of fetched data'}
            {currentStep === 3 && 'Name and save your dataset'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Filters */}
          {currentStep === 1 && (
            <>
              {/* Required Fields */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Required Fields</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date Range Start *</Label>
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
                          {dateRangeStart ? format(dateRangeStart, "PPP") : "Pick a date"}
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date Range End *</Label>
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
                          {dateRangeEnd ? format(dateRangeEnd, "PPP") : "Pick a date"}
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

                <div className="space-y-2">
                  <Label htmlFor="asr_model_version">ASR Model Version *</Label>
                  <Input
                    id="asr_model_version"
                    value={filters.asr_model_version || ''}
                    onChange={(e) => updateFilter('asr_model_version', e.target.value)}
                    placeholder="e.g., v2.1"
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Optional Filters</h4>

                {/* Languages */}
                <div className="space-y-2">
                  <Label>Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableLanguages.map(lang => (
                      <Badge
                        key={lang}
                        variant={filters.languages?.includes(lang) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleLanguage(lang)}
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Workflow IDs */}
                <div className="space-y-2">
                  <Label>Workflow IDs</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newWorkflowId}
                      onChange={(e) => setNewWorkflowId(e.target.value)}
                      placeholder="Enter UUID..."
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={addWorkflowId}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {filters.workflow_ids && filters.workflow_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.workflow_ids.map(id => (
                        <Badge key={id} variant="secondary" className="font-mono text-xs">
                          {id.slice(0, 8)}...
                          <button onClick={() => removeWorkflowId(id)} className="ml-1">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Boolean Filters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Is Noisy</Label>
                      <p className="text-xs text-muted-foreground">Filter noisy audio</p>
                    </div>
                    <Select 
                      value={filters.is_noisy === null ? 'any' : filters.is_noisy ? 'true' : 'false'}
                      onValueChange={(v) => updateFilter('is_noisy', v === 'any' ? null : v === 'true')}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Overlapping Speech</Label>
                      <p className="text-xs text-muted-foreground">Filter overlapping speech</p>
                    </div>
                    <Switch
                      checked={filters.overlapping_speech ?? false}
                      onCheckedChange={(v) => updateFilter('overlapping_speech', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Is Not Relevant</Label>
                      <p className="text-xs text-muted-foreground">Filter non-relevant data</p>
                    </div>
                    <Switch
                      checked={filters.is_not_relevant ?? false}
                      onCheckedChange={(v) => updateFilter('is_not_relevant', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Voice Recording N/A</Label>
                      <p className="text-xs text-muted-foreground">Missing voice recordings</p>
                    </div>
                    <Switch
                      checked={filters.is_voice_recording_na ?? false}
                      onCheckedChange={(v) => updateFilter('is_voice_recording_na', v)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Preview */}
          {currentStep === 2 && previewData && (
            <div className="space-y-6">
              <div className="p-6 bg-primary/10 rounded-lg text-center">
                <p className="text-4xl font-bold text-primary">{previewData.total_count.toLocaleString()}</p>
                <p className="text-muted-foreground mt-1">Records found matching your filters</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Filters Applied</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between p-2 bg-secondary/50 rounded">
                    <span className="text-muted-foreground">Date Range</span>
                    <span>{dateRangeStart && format(dateRangeStart, 'PP')} - {dateRangeEnd && format(dateRangeEnd, 'PP')}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-secondary/50 rounded">
                    <span className="text-muted-foreground">ASR Version</span>
                    <span>{filters.asr_model_version}</span>
                  </div>
                  {filters.languages && filters.languages.length > 0 && (
                    <div className="flex justify-between p-2 bg-secondary/50 rounded col-span-2">
                      <span className="text-muted-foreground">Languages</span>
                      <span>{filters.languages.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Save */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="datasetName">Dataset Name *</Label>
                <Input
                  id="datasetName"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g., Customer A - Q4 2024 Dataset"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., Customer A"
                />
              </div>

              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This will create a new dataset with <span className="font-medium text-foreground">{previewData?.total_count.toLocaleString()}</span> records.
                </p>
              </div>
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
            
            {currentStep === 1 && (
              <Button
                onClick={handleFetchPreview}
                disabled={!canProceed() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    Preview Results
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            
            {currentStep === 2 && (
              <Button onClick={() => setCurrentStep(3)} disabled={!canProceed()}>
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
            
            {currentStep === 3 && (
              <Button variant="glow" onClick={handleSave} disabled={!canProceed() || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Dataset'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
