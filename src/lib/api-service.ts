// API Service Layer - switches between dummy data and real API based on config
import { APP_CONFIG } from './config';
import { dataGenerations, trainingRuns, evaluations, modelArtifacts, tenantMappings, workflowsByTenant, trtllmModels, baseModelArtifacts } from './mock-data';
import type {
  TrainingDataPreparationFilterRequest,
  TrainingDataPreparationFilterResponse,
  SaveFetchedDataRequest,
  SaveFetchedDataResponse,
  TrainingDataPreparationResponse,
  TrainingExecutionCreate,
  TrainingExecutionResponse,
  PaginatedResponse,
  TenantMapping,
  WorkflowInfo,
  TRTLLMModel,
  ModelArtifactResponse,
  ArtifactType,
  SnowflakeFilters,
  AuthUser,
  TrainingRunsFilterParams,
} from './api-types';
import type { DataGeneration, TrainingRun, Evaluation, ModelArtifact } from './mock-data';

// Helper to make API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// ========== Tenant & Workflow APIs ==========

export async function fetchTenantMappings(): Promise<TenantMapping[]> {
  // if (APP_CONFIG.useDummyData) {
  //   return Promise.resolve(tenantMappings);
  // }
  
  return apiCall<TenantMapping[]>('/training_data/tenant_ids_mapping');
}

export async function fetchWorkflowsByTenant(tenantId: string): Promise<WorkflowInfo[]> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve(workflowsByTenant[tenantId] || []);
  }
  
  return apiCall<WorkflowInfo[]>(`/training/tenant/${tenantId}/workflow_ids`);
}

export async function fetchTrtllmModels(): Promise<TRTLLMModel[]> {
  // if (APP_CONFIG.useDummyData) {
  //   return Promise.resolve(trtllmModels);
  // }
  
  return apiCall<TRTLLMModel[]>('/training_data/trtllm_models');
}

export async function fetchTenantTrtllmModels(tenantId: string): Promise<TRTLLMModel[]> {
  return apiCall<TRTLLMModel[]>(`/training/tenant/${tenantId}/trtllm_models`);
}

// ========== Model Artifacts by Type ==========

export async function fetchModelArtifactsByType(artifactType: ArtifactType): Promise<ModelArtifactResponse[]> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve(baseModelArtifacts.filter(a => a.artifact_type === artifactType));
  }
  
  return apiCall<ModelArtifactResponse[]>(`/model_artifacts/by-type?artifact_type=${artifactType}`);
}

// ========== Datasets (Training Data Preparation) ==========

export async function fetchDatasets(): Promise<DataGeneration[]> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve(dataGenerations);
  }
  
  const response = await apiCall<PaginatedResponse<TrainingDataPreparationResponse>>(
    '/training_data/'
  );
  
  return response.items.map(mapApiDatasetToDataGeneration);
}

export async function fetchDatasetById(id: string): Promise<DataGeneration | null> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve(dataGenerations.find(d => d.id === id) || null);
  }
  
  const response = await apiCall<TrainingDataPreparationResponse>(
    `/training_data/${id}`
  );
  
  return mapApiDatasetToDataGeneration(response);
}

export async function filterTrainingData(request: TrainingDataPreparationFilterRequest): Promise<TrainingDataPreparationFilterResponse> {
  if (APP_CONFIG.useDummyData) {
    // Simulate a filter response
    return Promise.resolve({
      fetch_id: `fetch_${Date.now()}`,
      record_count: Math.floor(Math.random() * 50000) + 10000,
      preview: [
        { id: '1', audio_path: 's3://...', transcript: 'Sample transcript 1' },
        { id: '2', audio_path: 's3://...', transcript: 'Sample transcript 2' },
        { id: '3', audio_path: 's3://...', transcript: 'Sample transcript 3' },
      ],
      cached: true,
    });
  }
  
  return apiCall<TrainingDataPreparationFilterResponse>('/training_data/filter', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function saveDataset(request: SaveFetchedDataRequest): Promise<SaveFetchedDataResponse> {
  if (APP_CONFIG.useDummyData) {
    const newId = `data_gen_${Date.now()}`;
    return Promise.resolve({
      training_data_preparation_id: newId,
      s3_root_path: `s3://aiola-datasets/${request.dataset_name}/${newId}/`,
      record_count: Math.floor(Math.random() * 50000) + 10000,
    });
  }
  
  return apiCall<SaveFetchedDataResponse>('/training_data/save_fetched_data', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function deleteDataset(id: string): Promise<void> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve();
  }
  
  await apiCall(`/training_data/${id}`, { method: 'DELETE' });
}

// ========== Auth Users ==========

export async function fetchAuthUsers(): Promise<AuthUser[]> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve([
      { user_id: '1', email: 'john.doe@aiola.com' },
      { user_id: '2', email: 'jane.smith@aiola.com' },
      { user_id: '3', email: 'bob.wilson@aiola.com' },
    ]);
  }
  
  return apiCall<AuthUser[]>('/auth/users');
}

// ========== Training Runs ==========

export async function fetchTrainingRuns(filters: TrainingRunsFilterParams = {}): Promise<TrainingRun[]> {
  if (APP_CONFIG.useDummyData) {
    // Filter mock data
    let filteredRuns = [...trainingRuns];
    
    if (filters.start_date) {
      const startDate = new Date(filters.start_date);
      filteredRuns = filteredRuns.filter(run => new Date(run.startedAt) >= startDate);
    }
    
    if (filters.end_date) {
      const endDate = new Date(filters.end_date);
      endDate.setHours(23, 59, 59, 999);
      filteredRuns = filteredRuns.filter(run => new Date(run.startedAt) <= endDate);
    }
    
    return Promise.resolve(filteredRuns);
  }
  
  // Build query params
  const params = new URLSearchParams();
  
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.created_by?.length) {
    filters.created_by.forEach(id => params.append('created_by', id));
  }
  if (filters.tenant_id?.length) {
    filters.tenant_id.forEach(id => params.append('tenant_id', id));
  }
  if (filters.status) params.append('status', filters.status);
  if (filters.training_execution_name) params.append('training_execution_name', filters.training_execution_name);
  if (filters.prefect_run_id) params.append('prefect_run_id', filters.prefect_run_id);
  
  const queryString = params.toString();
  const response = await apiCall<PaginatedResponse<TrainingExecutionResponse>>(
    `/training/${queryString ? `?${queryString}` : ''}`
  );
  
  return response.items.map(mapApiTrainingToTrainingRun);
}

export async function fetchTrainingRunById(id: string): Promise<TrainingRun | null> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve(trainingRuns.find(t => t.id === id) || null);
  }
  
  const response = await apiCall<TrainingExecutionResponse>(`/training/${id}`);
  return mapApiTrainingToTrainingRun(response);
}

export async function createTrainingRun(request: TrainingExecutionCreate): Promise<TrainingExecutionResponse> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve({
      training_execution_id: `train_${Date.now()}`,
      training_execution_name: request.training_execution_name,
      customer_name: request.customer_name,
      description: request.description,
      user_id: '1',
      status: 'PENDING',
      created_at: new Date().toISOString(),
    });
  }
  
  return apiCall<TrainingExecutionResponse>('/training/start', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function abortTrainingRun(id: string, reason?: string): Promise<void> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve();
  }
  
  await apiCall('/training/abort', {
    method: 'POST',
    body: JSON.stringify({ training_execution_id: id, reason }),
  });
}

// ========== Evaluations ==========

export async function fetchEvaluations(): Promise<Evaluation[]> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve(evaluations);
  }
  
  // TODO: Implement real API call when endpoint is available
  return Promise.resolve(evaluations);
}

// ========== Model Artifacts ==========

export async function fetchModelArtifacts(): Promise<ModelArtifact[]> {
  if (APP_CONFIG.useDummyData) {
    return Promise.resolve(modelArtifacts);
  }
  
  // TODO: Implement real API call when endpoint is available
  return Promise.resolve(modelArtifacts);
}

// ========== Mappers ==========

function mapApiDatasetToDataGeneration(api: TrainingDataPreparationResponse): DataGeneration {
  // Calculate record counts from files if available
  const trainFile = api.files?.find(f => f.file_type === 'train');
  const testFile = api.files?.find(f => f.file_type === 'test');
  const valFile = api.files?.find(f => f.file_type === 'val');
  
  const trainRecords = trainFile?.record_count || 0;
  const testRecords = testFile?.record_count || 0;
  const valRecords = valFile?.record_count || 0;
  
  return {
    id: api.training_data_preparation_id,
    name: api.dataset_name,
    client: api.customer_name || 'Unknown',
    dateRangeStart: api.date_range_start?.split('T')[0] || '',
    dateRangeEnd: api.date_range_end?.split('T')[0] || '',
    totalRecords: trainRecords + testRecords + valRecords,
    trainRecords,
    testRecords,
    valRecords,
    s3Path: api.s3_root_path,
    createdAt: api.created_at,
    filters: {
      languages: api.languages || [],
      asrModelVersions: api.asr_model_versions || [],
      workflowIds: api.workflow_ids || null,
      isNoisy: api.is_noisy ?? null,
      overlappingSpeech: api.overlapping_speech ?? null,
      isNotRelevant: api.is_not_relevant ?? null,
      isVoiceRecordingNa: api.is_voice_recording_na ?? null,
      isPartialAudio: api.is_partial_audio ?? null,
      isUnclearAudio: api.is_unclear_audio ?? null,
    },
    trainS3Path: trainFile?.s3_path || '',
    testS3Path: testFile?.s3_path || '',
    valS3Path: valFile?.s3_path || '',
  };
}

function mapApiTrainingToTrainingRun(api: TrainingExecutionResponse): TrainingRun {
  const statusMap: Record<string, TrainingRun['status']> = {
    PENDING: 'queued',
    RUNNING: 'running',
    COMPLETED: 'success',
    FAILED: 'failed',
    CANCELLED: 'failed',
    CANCELLING: 'running',
  };
  
  return {
    id: api.training_execution_id,
    name: api.training_execution_name,
    status: statusMap[api.status] || 'queued',
    client: api.customer_name || 'Unknown',
    userId: api.user_id,
    startedAt: api.started_at || api.created_at,
    completedAt: api.completed_at || null,
    dataGenerations: [],
    s3Path: api.s3_model_path || '',
    description: api.description || '',
    errorMessage: api.error_message || null,
    prefectRunId: api.prefect_run_id || null,
    tenantId: api.tenant_id || '',
    parameters: {
      hyperparameters: (api.hyperparameters as TrainingRun['parameters']['hyperparameters']) || {
        batchSize: 32,
        learningRate: 0.001,
        epochs: 50,
        optimizer: 'Adam',
      },
      prefectParams: (api.prefect_parameters as TrainingRun['parameters']['prefectParams']) || {
        gpuType: 'V100',
        instanceType: 'p3.2xlarge',
        memory: '16GB',
      },
      modelFormat: 'Triton',
    },
  };
}

// Legacy function for backward compatibility
export async function createDatasetFetch(request: { filters: SnowflakeFilters }): Promise<{
  fetch_id: string;
  preview: { total_count: number; sample_records: Record<string, unknown>[] };
  filters_applied: SnowflakeFilters;
}> {
  const response = await filterTrainingData({ filters: request.filters });
  return {
    fetch_id: response.fetch_id,
    preview: {
      total_count: response.record_count,
      sample_records: response.preview,
    },
    filters_applied: request.filters,
  };
}
