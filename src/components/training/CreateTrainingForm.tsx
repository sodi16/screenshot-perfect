import { useState, useEffect } from 'react';
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
  gpuTypes, 
  instanceTypes 
} from '@/lib/mock-data';
import { 
  visibleHyperparameters, 
  hiddenHyperparameters, 
  getDefaultHyperparameters,
  type HyperparameterConfig 
} from '@/lib/hyperparameters';
import { createTrainingRun, fetchTenantMappings, fetchWeightModels, fetchTrainingDataPreparationsByTenant } from '@/lib/api-service';
import type { TenantMapping, ModelArtifactResponse, TrainingDataPreparationResponse } from '@/lib/api-types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const steps = [
  { id: 1, title: 'Basic Information' },
  { id: 2, title: 'Select Data' },
  { id: 3, title: 'Select Base Model' },
  { id: 4, title: 'Hyperparameters' },
  { id: 5, title: 'Prefect Parameters' },
  { id: 6, title: 'Review & Submit' },
];

interface CreateTrainingFormProps {
  onSuccess?: () => void;
}

export function CreateTrainingForm({ onSuccess }: CreateTrainingFormProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [tenants, setTenants] = useState<TenantMapping[]>([]);
  const [weightModels, setWeightModels] = useState<ModelArtifactResponse[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [trainingDataPreparations, setTrainingDataPreparations] = useState<TrainingDataPreparationResponse[]>([]);
  const [loadingDataPreparations, setLoadingDataPreparations] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    tenantId: '',
    customerName: '',
    selectedDataGens: [] as string[],
    baseModelArtifactId: '',
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

  // Load tenants on mount
  useEffect(() => {
    fetchTenantMappings().then(setTenants).catch(console.error);
  }, []);

  // Load weight models and training data preparations when tenant changes
  useEffect(() => {
    if (formData.tenantId) {
      // Load weight models
      setLoadingModels(true);
      fetchWeightModels(formData.tenantId)
        .then(setWeightModels)
        .catch(console.error)
        .finally(() => setLoadingModels(false));

      // Load training data preparations
      setLoadingDataPreparations(true);
      fetchTrainingDataPreparationsByTenant(formData.tenantId)
        .then(setTrainingDataPreparations)
        .catch(console.error)
        .finally(() => setLoadingDataPreparations(false));
    }
  }, [formData.tenantId]);

  const updateForm = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateHyperparam = (key: string, value: string | number | boolean) => {
    setHyperparams(prev => {
      const updated = { ...prev, [key]: value };
      // Link use-lora and lora-merge-and-unload
      if (key === 'use-lora') {
        updated['lora-merge-and-unload'] = value;
      }
      return updated;
    });
  };

  const toggleDataGen = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDataGens: prev.selectedDataGens.includes(id)
        ? prev.selectedDataGens.filter(d => d !== id)
        : [...prev.selectedDataGens, id]
    }));
  };

  // Auto-generate training execution name
  const generateTrainingName = () => {
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    return `${formData.customerName || 'training'}_${timestamp}`;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.tenantId;
      case 2: return formData.selectedDataGens.length > 0;
      case 3: return formData.baseModelArtifactId;
      case 4: return true;
      case 5: return true;
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

      // Auto-generate data paths from selected training data preparations
      const selectedPreparations = trainingDataPreparations.filter(prep => 
        formData.selectedDataGens.includes(prep.training_data_preparation_id)
      );
      
      // Extract file paths by type
      const trainPaths: string[] = [];
      const testPaths: string[] = [];
      const valPaths: string[] = [];
      
      selectedPreparations.forEach(prep => {
        if (prep.files) {
          const trainFile = prep.files.find(f => f.file_type === 'train');
          const testFile = prep.files.find(f => f.file_type === 'test');
          const valFile = prep.files.find(f => f.file_type === 'val');
          
          if (trainFile) trainPaths.push(trainFile.s3_path);
          if (testFile) testPaths.push(testFile.s3_path);
          if (valFile) valPaths.push(valFile.s3_path);
        }
      });

      // Add data paths to hyperparameters as arrays
      const finalHyperparams: Record<string, unknown> = {
        ...allHyperparams,
        'train-data-path': trainPaths,
        'test-data-path': testPaths,
        'validation-data-path': valPaths,
      };

      await createTrainingRun({
        training_execution_name: generateTrainingName(),
        customer_name: formData.customerName,
        description: formData.description,
        hyperparameters: finalHyperparams,
        prefect_parameters: {
          gpuType: formData.gpuType,
          instanceType: formData.instanceType,
          memory: formData.memory,
          timeout: formData.timeout,
          retryAttempts: formData.retryAttempts,
        },
        training_data_preparation_ids: formData.selectedDataGens,
        base_model_artifact_id: formData.baseModelArtifactId,
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
    
    // Disable lora-merge-and-unload as it's linked to use-lora
    const isDisabled = key === 'lora-merge-and-unload';

    switch (config.type) {
      case 'int':
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => updateHyperparam(key, parseInt(e.target.value) || 0)}
            disabled={isDisabled}
          />
        );
      case 'float':
        return (
          <Input
            type="number"
            step="0.0001"
            value={value as number}
            onChange={(e) => updateHyperparam(key, parseFloat(e.target.value) || 0)}
            disabled={isDisabled}
          />
        );
      case 'custom_bool':
        return (
          <Switch
            checked={value as boolean}
            onCheckedChange={(checked) => updateHyperparam(key, checked)}
            disabled={isDisabled}
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
            disabled={isDisabled}
          />
        );
    }
  };

  const selectedBaseModel = weightModels.find(m => m.artifact_id === formData.baseModelArtifactId);

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
                <div className={`h-0.5 w-12 mx-1 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
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
            {currentStep === 1 && 'Select the customer and enter basic details'}
            {currentStep === 2 && 'Select the datasets to use for training'}
            {currentStep === 3 && 'Select the base model to fine-tune'}
            {currentStep === 4 && 'Configure the model hyperparameters'}
            {currentStep === 5 && 'Set up the Prefect execution parameters'}
            {currentStep === 6 && 'Review your configuration and submit'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select 
                  value={formData.tenantId} 
                  onValueChange={(v) => {
                    const tenant = tenants.find(t => t.tenant_id === v);
                    updateForm('tenantId', v);
                    updateForm('customerName', tenant?.tenant_name || '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(t => (
                      <SelectItem key={t.tenant_id} value={t.tenant_id}>
                        {t.tenant_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {formData.tenantId && (
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Training name will be auto-generated as utc timestamp: <span className="font-mono text-foreground">{generateTrainingName()}</span>
                  </p>
                </div>
              )}
            </>
          )}

          {/* Step 2: Select Data */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {loadingDataPreparations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading training data preparations...</span>
                </div>
              ) : trainingDataPreparations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No training data preparations available for this customer.
                </p>
              ) : (
                trainingDataPreparations.map((prep) => (
                  <div
                    key={prep.training_data_preparation_id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.selectedDataGens.includes(prep.training_data_preparation_id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleDataGen(prep.training_data_preparation_id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={formData.selectedDataGens.includes(prep.training_data_preparation_id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{prep.dataset_name}</h4>
                          <span className="text-sm text-muted-foreground">{prep.customer_name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                          ID: {prep.training_data_preparation_id}
                        </p>
                        {(prep.date_range_start || prep.date_range_end) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {prep.date_range_start && new Date(prep.date_range_start).toLocaleDateString()} 
                            {prep.date_range_start && prep.date_range_end && ' - '}
                            {prep.date_range_end && new Date(prep.date_range_end).toLocaleDateString()}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                          {prep.s3_root_path}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 3: Select Base Weight Model */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {loadingModels ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading models...</span>
                </div>
              ) : weightModels.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No base models available for this customer.
                </p>
              ) : (
                weightModels.map((model) => (
                  <div
                    key={model.artifact_id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.baseModelArtifactId === model.artifact_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateForm('baseModelArtifactId', model.artifact_id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        formData.baseModelArtifactId === model.artifact_id
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {formData.baseModelArtifactId === model.artifact_id && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{model.model_artifact_name}</h4>
                          {model.tenant_id === null && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                              Base Model
                            </span>
                          )}
                          {model.published && model.model_tag && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                              {model.model_tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                          {model.s3_path}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {model.model_size_mb && <span>Size: {model.model_size_mb} MB</span>}
                          <span>Created: {new Date(model.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 4: Hyperparameters */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleHyperparameters.map((config) => (
                  <div key={config.argument} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">{config.argument}</Label>
                      {config.argument === 'lora-merge-and-unload' && (
                        <span className="text-xs text-muted-foreground">(linked to use-lora)</span>
                      )}
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

          {/* Step 5: Prefect Parameters */}
          {currentStep === 5 && (
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

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-muted-foreground">Basic Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium font-mono text-xs">{generateTrainingName()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer</span>
                      <span>{formData.customerName}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-muted-foreground">Base Model</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model Tag</span>
                      <span>{selectedBaseModel?.model_tag || 'Not selected'}</span>
                    </div>
                    {selectedBaseModel?.model_size_mb && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size</span>
                        <span>{selectedBaseModel.model_size_mb} MB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
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
                      <span className="text-muted-foreground">Use LoRA</span>
                      <span>{hyperparams['use-lora'] ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-muted-foreground">Prefect Parameters</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GPU Type</span>
                      <span>{formData.gpuType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Instance</span>
                      <span>{formData.instanceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory</span>
                      <span>{formData.memory}GB</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-muted-foreground">Training Data Preparations ({formData.selectedDataGens.length})</h4>
                <div className="space-y-2">
                  {formData.selectedDataGens.map(id => {
                    const prep = trainingDataPreparations.find(p => p.training_data_preparation_id === id);
                    return prep ? (
                      <div key={id} className="text-sm p-2 bg-secondary rounded">
                        <div className="font-medium">{prep.dataset_name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {prep.date_range_start && prep.date_range_end && 
                            `${new Date(prep.date_range_start).toLocaleDateString()} - ${new Date(prep.date_range_end).toLocaleDateString()}`
                          }
                        </div>
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
            {currentStep < 6 ? (
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
