import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  clients, 
  modelFormats, 
  gpuTypes, 
  instanceTypes, 
  dataGenerations 
} from '@/lib/mock-data';
import { 
  visibleHyperparameters, 
  hiddenHyperparameters, 
  getDefaultHyperparameters,
  type HyperparameterConfig 
} from '@/lib/hyperparameters';
import { createTrainingRun } from '@/lib/api-service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const steps = [
  { id: 1, title: 'Basic Information' },
  { id: 2, title: 'Select Data' },
  { id: 3, title: 'Hyperparameters' },
  { id: 4, title: 'Prefect Parameters' },
  { id: 5, title: 'Review & Submit' },
];

interface CreateTrainingFormProps {
  onSuccess?: () => void;
}

export function CreateTrainingForm({ onSuccess }: CreateTrainingFormProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    modelFormat: '',
    selectedDataGens: [] as string[],
    // Prefect params
    gpuType: 'V100',
    instanceType: 'p3.2xlarge',
    memory: 16,
    timeout: 3600,
    retryAttempts: 3,
  });

  // Hyperparameters state from CSV
  const [hyperparams, setHyperparams] = useState<Record<string, string | number | boolean>>(
    getDefaultHyperparameters()
  );

  const updateForm = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateHyperparam = (key: string, value: string | number | boolean) => {
    setHyperparams(prev => ({ ...prev, [key]: value }));
  };

  const toggleDataGen = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDataGens: prev.selectedDataGens.includes(id)
        ? prev.selectedDataGens.filter(d => d !== id)
        : [...prev.selectedDataGens, id]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.name && formData.client && formData.modelFormat;
      case 2: return formData.selectedDataGens.length > 0;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Include hidden hyperparameters in the API call
      const allHyperparams = { ...hyperparams };
      hiddenHyperparameters.forEach(h => {
        const key = h.argument;
        if (h.type === 'custom_bool') {
          allHyperparams[key] = h.defaultValue.toLowerCase() === 'true';
        } else {
          allHyperparams[key] = h.defaultValue;
        }
      });

      await createTrainingRun({
        training_execution_name: formData.name,
        customer_name: formData.client,
        description: formData.description,
        hyperparameters: allHyperparams,
        prefect_parameters: {
          gpuType: formData.gpuType,
          instanceType: formData.instanceType,
          memory: formData.memory,
          timeout: formData.timeout,
          retryAttempts: formData.retryAttempts,
        },
        training_data_preparation_ids: formData.selectedDataGens,
      });
      
      toast.success('Training run created successfully!');
      onSuccess?.();
      navigate('/training-runs');
    } catch (error) {
      toast.error('Failed to create training run');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHyperparameterInput = (config: HyperparameterConfig) => {
    const key = config.argument;
    const value = hyperparams[key];

    switch (config.type) {
      case 'int':
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => updateHyperparam(key, parseInt(e.target.value) || 0)}
          />
        );
      case 'float':
        return (
          <Input
            type="number"
            step="0.0001"
            value={value as number}
            onChange={(e) => updateHyperparam(key, parseFloat(e.target.value) || 0)}
          />
        );
      case 'custom_bool':
        return (
          <Switch
            checked={value as boolean}
            onCheckedChange={(checked) => updateHyperparam(key, checked)}
          />
        );
      case 'str':
      case 'str_or_list':
      default:
        return (
          <Input
            type="text"
            value={value as string}
            onChange={(e) => updateHyperparam(key, e.target.value)}
            placeholder={config.defaultValue || ''}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  h-10 w-10 rounded-full flex items-center justify-center font-medium transition-all
                  ${currentStep > step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : currentStep === step.id 
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
                      : 'bg-secondary text-muted-foreground'}
                `}>
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span className={`text-xs mt-2 ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 w-16 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Enter the basic details for your training run'}
            {currentStep === 2 && 'Select the datasets to use for training'}
            {currentStep === 3 && 'Configure the model hyperparameters'}
            {currentStep === 4 && 'Set up the Prefect execution parameters'}
            {currentStep === 5 && 'Review your configuration and submit'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Training Run Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="e.g., Customer A ASR Model v2.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Describe the purpose of this training run..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select value={formData.client} onValueChange={(v) => updateForm('client', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model Format *</Label>
                  <Select value={formData.modelFormat} onValueChange={(v) => updateForm('modelFormat', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelFormats.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Select Data */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {dataGenerations.map((gen) => (
                <div
                  key={gen.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.selectedDataGens.includes(gen.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleDataGen(gen.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={formData.selectedDataGens.includes(gen.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{gen.name}</h4>
                        <span className="text-sm text-muted-foreground">{gen.client}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {gen.dateRangeStart} - {gen.dateRangeEnd}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span>Train: {gen.trainRecords.toLocaleString()}</span>
                        <span>Test: {gen.testRecords.toLocaleString()}</span>
                        <span>Val: {gen.valRecords.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Hyperparameters */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleHyperparameters.map((config) => (
                  <div key={config.argument} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">{config.argument}</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>{config.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Default: {config.defaultValue || 'None'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {renderHyperparameterInput(config)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Prefect Parameters */}
          {currentStep === 4 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GPU Type</Label>
                  <Select value={formData.gpuType} onValueChange={(v) => updateForm('gpuType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gpuTypes.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Instance Type</Label>
                  <Select value={formData.instanceType} onValueChange={(v) => updateForm('instanceType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {instanceTypes.map(i => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Memory Allocation: {formData.memory}GB</Label>
                <Slider
                  value={[formData.memory]}
                  onValueChange={([v]) => updateForm('memory', v)}
                  min={8}
                  max={64}
                  step={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={formData.timeout}
                    onChange={(e) => updateForm('timeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Retry Attempts</Label>
                  <Input
                    type="number"
                    value={formData.retryAttempts}
                    onChange={(e) => updateForm('retryAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-muted-foreground">Basic Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client</span>
                      <span>{formData.client}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model Format</span>
                      <span>{formData.modelFormat}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-muted-foreground">Key Hyperparameters</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batch Size</span>
                      <span>{hyperparams['batch-size']}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Learning Rate</span>
                      <span>{hyperparams['lr']}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Steps</span>
                      <span>{hyperparams['max-steps']}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Optimizer</span>
                      <span>{hyperparams['optim']}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-muted-foreground">Datasets ({formData.selectedDataGens.length})</h4>
                <div className="space-y-2">
                  {formData.selectedDataGens.map(id => {
                    const gen = dataGenerations.find(g => g.id === id);
                    return gen ? (
                      <div key={id} className="text-sm p-2 bg-secondary rounded">
                        {gen.name} - {gen.totalRecords.toLocaleString()} records
                      </div>
                    ) : null;
                  })}
                </div>
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
            {currentStep < 5 ? (
              <Button
                onClick={() => setCurrentStep(s => s + 1)}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button variant="glow" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Training Run'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
