import type { TenantMapping, WorkflowInfo, TRTLLMModel, ModelArtifactResponse, TrainingDataPreparationResponse } from './api-types';

export const users = [
  { id: '1', username: 'john.doe', email: 'john@aiola.com', avatar: '' },
  { id: '2', username: 'jane.smith', email: 'jane@aiola.com', avatar: '' }
];

// ========== Tenant Mappings ==========
export const tenantMappings: TenantMapping[] = [
  { tenant_id: 'tenant_001', tenant_name: 'Customer A', cells: { region: 'US-EAST' } },
  { tenant_id: 'tenant_002', tenant_name: 'Customer B', cells: { region: 'EU-WEST' } },
  { tenant_id: 'tenant_003', tenant_name: 'Customer C', cells: { region: 'US-WEST' } },
  { tenant_id: 'tenant_004', tenant_name: 'Customer D', cells: { region: 'APAC' } },
];

// ========== Workflows by Tenant ==========
export const workflowsByTenant: Record<string, WorkflowInfo[]> = {
  'tenant_001': [
    { workflow_id: 'wf_12345', workflow_name: 'Main Production Workflow' },
    { workflow_id: 'wf_12346', workflow_name: 'Voice Recording Pipeline' },
    { workflow_id: 'wf_12347', workflow_name: 'QA Testing Workflow' },
  ],
  'tenant_002': [
    { workflow_id: 'wf_22345', workflow_name: 'Multilingual Processing' },
    { workflow_id: 'wf_22346', workflow_name: 'European Transcription' },
  ],
  'tenant_003': [
    { workflow_id: 'wf_32345', workflow_name: 'Customer Service Recording' },
  ],
  'tenant_004': [
    { workflow_id: 'wf_42345', workflow_name: 'APAC Voice Pipeline' },
    { workflow_id: 'wf_42346', workflow_name: 'Japanese Transcription' },
    { workflow_id: 'wf_42347', workflow_name: 'Korean ASR Pipeline' },
  ],
};

// ========== TRTLLM Models (ASR Models) ==========
export const trtllmModels: TRTLLMModel[] = [
  { artifact_id: 'asr_001', training_execution_id: 'train_001', s3_path: 's3://models/whisper-v2.0', model_artifact_name: 'Whisper V2.0', model_size_mb: 1500, published: true, model_tag: 'v2.0', created_at: '2024-12-01T10:00:00Z', description: 'Whisper V2.0 base model' },
  { artifact_id: 'asr_002', training_execution_id: 'train_002', s3_path: 's3://models/whisper-v2.1', model_artifact_name: 'Whisper V2.1', model_size_mb: 1600, published: true, model_tag: 'v2.1', created_at: '2025-01-01T10:00:00Z', description: 'Whisper V2.1 improved' },
  { artifact_id: 'asr_003', training_execution_id: 'train_003', s3_path: 's3://models/whisper-large-v3', model_artifact_name: 'Whisper Large V3', model_size_mb: 2500, published: false, created_at: '2025-01-10T10:00:00Z', description: 'Whisper Large V3' },
];

// ========== Base Model Artifacts (RAW_WEIGHT) ==========
export const baseModelArtifacts: ModelArtifactResponse[] = [
  { 
    artifact_id: 'base_001', 
    training_execution_id: null, 
    training_execution_name: null,
    tenant_id: null,
    artifact_type: 'RAW_WEIGHT', 
    s3_path: 's3://models/base/whisper-large-v2', 
    model_artifact_name: 'Whisper Large V2 Base',
    model_size_mb: 1500, 
    published: true,
    model_tag: 'whisper-large-v2',
    created_at: '2024-06-01T10:00:00Z' 
  },
  { 
    artifact_id: 'base_002', 
    training_execution_id: null, 
    training_execution_name: null,
    tenant_id: null,
    artifact_type: 'RAW_WEIGHT', 
    s3_path: 's3://models/base/whisper-large-v3', 
    model_artifact_name: 'Whisper Large V3 Base',
    model_size_mb: 2500, 
    published: true,
    model_tag: 'whisper-large-v3',
    created_at: '2024-10-01T10:00:00Z' 
  },
  { 
    artifact_id: 'base_003', 
    training_execution_id: 'train_base_003', 
    training_execution_name: 'Customer A Fine-tuned v1',
    tenant_id: 'tenant_001',
    artifact_type: 'RAW_WEIGHT', 
    s3_path: 's3://models/customer-a/finetuned-v1', 
    model_artifact_name: 'Customer A Fine-tuned v1',
    model_size_mb: 1550, 
    published: false,
    created_at: '2025-01-05T10:00:00Z' 
  },
  { 
    artifact_id: 'trtllm_001', 
    training_execution_id: 'train_001', 
    training_execution_name: 'Customer A ASR Model v2.1',
    tenant_id: 'tenant_001',
    artifact_type: 'TRTLLM', 
    s3_path: 's3://models/customer-a/trtllm-v1', 
    model_artifact_name: 'Customer A TRTLLM v1',
    model_size_mb: 800, 
    published: true,
    model_tag: 'customer-a-v1',
    created_at: '2025-01-15T14:30:00Z' 
  },
];

export type TrainingStatus = 'running' | 'success' | 'failed' | 'queued';

export interface TrainingRun {
  id: string;
  name: string;
  status: TrainingStatus;
  client: string;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  dataGenerations: string[];
  s3Path: string;
  description: string;
  errorMessage: string | null;
  prefectRunId: string | null;
  tenantId: string;
  parameters: {
    hyperparameters: {
      batchSize: number;
      learningRate: number;
      epochs: number;
      optimizer: string;
    };
    prefectParams: {
      gpuType: string;
      instanceType: string;
      memory: string;
    };
    modelFormat: string;
  };
}

export const trainingRuns: TrainingRun[] = [
  {
    id: 'train_001',
    name: 'Customer A ASR Model v2.1',
    status: 'success',
    client: 'Customer A',
    userId: '1',
    startedAt: '2025-01-15T10:00:00Z',
    completedAt: '2025-01-15T14:30:00Z',
    dataGenerations: ['data_gen_001', 'data_gen_002'],
    s3Path: 's3://aiola-models/customer-a/train_001/',
    description: 'Quarterly model update with improved accuracy',
    errorMessage: null,
    prefectRunId: 'prefect_abc123',
    tenantId: '1',
    parameters: {
      hyperparameters: { batchSize: 32, learningRate: 0.001, epochs: 50, optimizer: 'Adam' },
      prefectParams: { gpuType: 'V100', instanceType: 'p3.2xlarge', memory: '16GB' },
      modelFormat: 'Triton'
    }
  },
  {
    id: 'train_002',
    name: 'Customer B Multilingual Model',
    status: 'running',
    client: 'Customer B',
    userId: '2',
    startedAt: '2025-01-20T08:00:00Z',
    completedAt: null,
    dataGenerations: ['data_gen_003'],
    s3Path: 's3://aiola-models/customer-b/train_002/',
    description: 'Training on multiple languages',
    errorMessage: null,
    prefectRunId: 'prefect_def456',
    tenantId: '2',
    parameters: {
      hyperparameters: { batchSize: 64, learningRate: 0.0005, epochs: 100, optimizer: 'AdamW' },
      prefectParams: { gpuType: 'A100', instanceType: 'p4d.24xlarge', memory: '32GB' },
      modelFormat: 'LLM'
    }
  },
  {
    id: 'train_003',
    name: 'Customer A Quick Test',
    status: 'failed',
    client: 'Customer A',
    userId: '1',
    startedAt: '2025-01-18T16:00:00Z',
    completedAt: '2025-01-18T16:45:00Z',
    dataGenerations: ['data_gen_001'],
    s3Path: 's3://aiola-models/customer-a/train_003/',
    description: 'Testing new preprocessing pipeline',
    errorMessage: 'CUDA out of memory. Tried to allocate 2.00 GiB. GPU memory usage: 14.5 GiB / 16.0 GiB',
    prefectRunId: 'prefect_ghi789',
    tenantId: '1',
    parameters: {
      hyperparameters: { batchSize: 16, learningRate: 0.01, epochs: 10, optimizer: 'SGD' },
      prefectParams: { gpuType: 'T4', instanceType: 'g4dn.xlarge', memory: '8GB' },
      modelFormat: 'RT'
    }
  },
  {
    id: 'train_004',
    name: 'Customer C Voice Recognition',
    status: 'queued',
    client: 'Customer C',
    userId: '2',
    startedAt: '2025-01-21T09:00:00Z',
    completedAt: null,
    dataGenerations: ['data_gen_002'],
    s3Path: 's3://aiola-models/customer-c/train_004/',
    description: 'New client onboarding model',
    errorMessage: null,
    prefectRunId: null,
    tenantId: '3',
    parameters: {
      hyperparameters: { batchSize: 32, learningRate: 0.001, epochs: 75, optimizer: 'Adam' },
      prefectParams: { gpuType: 'V100', instanceType: 'p3.2xlarge', memory: '16GB' },
      modelFormat: 'Triton'
    }
  }
];

export interface DataGeneration {
  id: string;
  name: string;
  client: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  totalRecords: number;
  trainRecords: number;
  testRecords: number;
  valRecords: number;
  s3Path: string;
  trainS3Path: string;
  testS3Path: string;
  valS3Path: string;
  createdAt: string;
  filters: {
    languages: string[] | null;
    asrModelVersions: string[] | null;
    workflowIds: string[] | null;
    isNoisy: boolean | null;
    overlappingSpeech: boolean | null;
    isNotRelevant: boolean | null;
    isVoiceRecordingNa: boolean | null;
    isPartialAudio: boolean | null;
    isUnclearAudio: boolean | null;
  };
}

export const dataGenerations: DataGeneration[] = [
  {
    id: 'data_gen_001',
    name: 'Customer A - Q4 2024 Dataset',
    client: 'Customer A',
    dateRangeStart: '2024-10-01',
    dateRangeEnd: '2024-12-31',
    totalRecords: 50000,
    trainRecords: 35000,
    testRecords: 10000,
    valRecords: 5000,
    s3Path: 's3://aiola-datasets/customer-a/q4-2024/',
    trainS3Path: 's3://aiola-datasets/customer-a/q4-2024/train.csv',
    testS3Path: 's3://aiola-datasets/customer-a/q4-2024/test.csv',
    valS3Path: 's3://aiola-datasets/customer-a/q4-2024/val.csv',
    createdAt: '2025-01-10T12:00:00Z',
    filters: {
      languages: ['English', 'Spanish'],
      asrModelVersions: ['v2.0'],
      workflowIds: ['wf_12345'],
      isNoisy: false,
      overlappingSpeech: false,
      isNotRelevant: null,
      isVoiceRecordingNa: null,
      isPartialAudio: null,
      isUnclearAudio: null
    }
  },
  {
    id: 'data_gen_002',
    name: 'Customer A - Recent Updates',
    client: 'Customer A',
    dateRangeStart: '2025-01-01',
    dateRangeEnd: '2025-01-15',
    totalRecords: 12000,
    trainRecords: 8400,
    testRecords: 2400,
    valRecords: 1200,
    s3Path: 's3://aiola-datasets/customer-a/jan-2025/',
    trainS3Path: 's3://aiola-datasets/customer-a/jan-2025/train.csv',
    testS3Path: 's3://aiola-datasets/customer-a/jan-2025/test.csv',
    valS3Path: 's3://aiola-datasets/customer-a/jan-2025/val.csv',
    createdAt: '2025-01-16T09:00:00Z',
    filters: {
      languages: ['English'],
      asrModelVersions: ['v2.1'],
      workflowIds: null,
      isNoisy: null,
      overlappingSpeech: null,
      isNotRelevant: null,
      isVoiceRecordingNa: null,
      isPartialAudio: false,
      isUnclearAudio: false
    }
  },
  {
    id: 'data_gen_003',
    name: 'Customer B - Multilingual Dataset',
    client: 'Customer B',
    dateRangeStart: '2024-11-01',
    dateRangeEnd: '2025-01-15',
    totalRecords: 80000,
    trainRecords: 56000,
    testRecords: 16000,
    valRecords: 8000,
    s3Path: 's3://aiola-datasets/customer-b/multilingual/',
    trainS3Path: 's3://aiola-datasets/customer-b/multilingual/train.csv',
    testS3Path: 's3://aiola-datasets/customer-b/multilingual/test.csv',
    valS3Path: 's3://aiola-datasets/customer-b/multilingual/val.csv',
    createdAt: '2025-01-18T14:00:00Z',
    filters: {
      languages: ['English', 'Spanish', 'French', 'German'],
      asrModelVersions: ['v2.1'],
      workflowIds: ['wf_22345', 'wf_22346'],
      isNoisy: false,
      overlappingSpeech: true,
      isNotRelevant: false,
      isVoiceRecordingNa: false,
      isPartialAudio: null,
      isUnclearAudio: null
    }
  }
];

export interface Evaluation {
  id: string;
  trainingRunId: string;
  testDataGenerationId: string;
  evaluationType: string;
  status: string;
  errorMessage: string | null;
  metrics: {
    accuracy: number;
    wer: number;
    precision: number;
    recall: number;
  };
  evaluatedAt: string;
  s3ResultsPath: string;
  tenantId: number;
}

export const evaluations: Evaluation[] = [
  {
    id: 'eval_001',
    trainingRunId: 'train_001',
    testDataGenerationId: 'data_gen_002',
    evaluationType: 'WER',
    status: 'completed',
    errorMessage: null,
    metrics: { accuracy: 0.94, wer: 0.12, precision: 0.93, recall: 0.95 },
    evaluatedAt: '2025-01-16T10:00:00Z',
    s3ResultsPath: 's3://aiola-evaluations/train_001/eval_001/',
    tenantId: 1
  },
  {
    id: 'eval_002',
    trainingRunId: 'train_001',
    testDataGenerationId: 'data_gen_001',
    evaluationType: 'Accuracy',
    status: 'completed',
    errorMessage: null,
    metrics: { accuracy: 0.96, wer: 0.10, precision: 0.95, recall: 0.97 },
    evaluatedAt: '2025-01-15T15:00:00Z',
    s3ResultsPath: 's3://aiola-evaluations/train_001/eval_002/',
    tenantId: 1
  }
];

export type ModelType = 'trtllm' | 'weights';

export interface ModelArtifact {
  id: string;
  trainingRunId: string;
  artifactType: string;
  modelType: ModelType;
  modelFormat: string;
  s3Path: string;
  sizeMb: number;
  createdAt: string;
}

export const modelArtifacts: ModelArtifact[] = [
  {
    id: 'artifact_001',
    trainingRunId: 'train_001',
    artifactType: 'model',
    modelType: 'trtllm',
    modelFormat: 'Triton',
    s3Path: 's3://aiola-models/customer-a/train_001/model.tar.gz',
    sizeMb: 245.5,
    createdAt: '2025-01-15T14:30:00Z'
  },
  {
    id: 'artifact_002',
    trainingRunId: 'train_001',
    artifactType: 'checkpoint',
    modelType: 'weights',
    modelFormat: 'Triton',
    s3Path: 's3://aiola-models/customer-a/train_001/checkpoint_best.pt',
    sizeMb: 122.3,
    createdAt: '2025-01-15T12:00:00Z'
  }
];

// ========== Training Data Preparations ==========
export const trainingDataPreparations: TrainingDataPreparationResponse[] = [
  {
    training_data_preparation_id: '660e8400-e29b-41d4-a716-446655440003',
    dataset_name: 'Customer A - Q4 2024 Dataset',
    customer_name: 'Customer A',
    s3_root_path: 's3://aiola-datasets/customer-a/q4-2024/',
    tenant_id: 'tenant_001',
    prefect_run_id: 'prefect_data_001',
    error_message: null,
    date_range_start: '2024-10-01',
    date_range_end: '2024-12-31',
    languages: ['English', 'Spanish'],
    asr_model_versions: ['v2.0'],
    workflow_ids: ['wf_12345'],
    is_noisy: false,
    overlapping_speech: false,
    is_not_relevant: null,
    is_voice_recording_na: null,
    is_partial_audio: null,
    is_unclear_audio: null,
    created_at: '2025-01-10T12:00:00Z',
    files: [
      {
        file_id: 'file_001',
        file_type: 'train',
        s3_path: 's3://aiola-datasets/customer-a/q4-2024/train.csv',
        file_name: 'train.csv',
        record_count: 35000,
        created_at: '2025-01-10T12:00:00Z'
      },
      {
        file_id: 'file_002',
        file_type: 'test',
        s3_path: 's3://aiola-datasets/customer-a/q4-2024/test.csv',
        file_name: 'test.csv',
        record_count: 10000,
        created_at: '2025-01-10T12:00:00Z'
      },
      {
        file_id: 'file_003',
        file_type: 'val',
        s3_path: 's3://aiola-datasets/customer-a/q4-2024/val.csv',
        file_name: 'val.csv',
        record_count: 5000,
        created_at: '2025-01-10T12:00:00Z'
      }
    ]
  },
  {
    training_data_preparation_id: '660e8400-e29b-41d4-a716-446655440004',
    dataset_name: 'Customer B - Multilingual Dataset',
    customer_name: 'Customer B',
    s3_root_path: 's3://aiola-datasets/customer-b/multilingual/',
    tenant_id: 'tenant_002',
    prefect_run_id: 'prefect_data_002',
    error_message: null,
    date_range_start: '2024-11-01',
    date_range_end: '2025-01-15',
    languages: ['English', 'Spanish', 'French', 'German'],
    asr_model_versions: ['v2.1'],
    workflow_ids: ['wf_22345', 'wf_22346'],
    is_noisy: false,
    overlapping_speech: true,
    is_not_relevant: false,
    is_voice_recording_na: false,
    is_partial_audio: null,
    is_unclear_audio: null,
    created_at: '2025-01-18T14:00:00Z',
    files: [
      {
        file_id: 'file_004',
        file_type: 'train',
        s3_path: 's3://aiola-datasets/customer-b/multilingual/train.csv',
        file_name: 'train.csv',
        record_count: 56000,
        created_at: '2025-01-18T14:00:00Z'
      },
      {
        file_id: 'file_005',
        file_type: 'test',
        s3_path: 's3://aiola-datasets/customer-b/multilingual/test.csv',
        file_name: 'test.csv',
        record_count: 16000,
        created_at: '2025-01-18T14:00:00Z'
      },
      {
        file_id: 'file_006',
        file_type: 'val',
        s3_path: 's3://aiola-datasets/customer-b/multilingual/val.csv',
        file_name: 'val.csv',
        record_count: 8000,
        created_at: '2025-01-18T14:00:00Z'
      }
    ]
  },
  {
    training_data_preparation_id: '660e8400-e29b-41d4-a716-446655440005',
    dataset_name: 'Customer A - January 2025 Update',
    customer_name: 'Customer A',
    s3_root_path: 's3://aiola-datasets/customer-a/jan-2025/',
    tenant_id: 'tenant_001',
    prefect_run_id: 'prefect_data_003',
    error_message: null,
    date_range_start: '2025-01-01',
    date_range_end: '2025-01-15',
    languages: ['English'],
    asr_model_versions: ['v2.1'],
    workflow_ids: null,
    is_noisy: null,
    overlapping_speech: null,
    is_not_relevant: null,
    is_voice_recording_na: null,
    is_partial_audio: false,
    is_unclear_audio: false,
    created_at: '2025-01-16T09:00:00Z',
    files: [
      {
        file_id: 'file_007',
        file_type: 'train',
        s3_path: 's3://aiola-datasets/customer-a/jan-2025/train.csv',
        file_name: 'train.csv',
        record_count: 8400,
        created_at: '2025-01-16T09:00:00Z'
      },
      {
        file_id: 'file_008',
        file_type: 'test',
        s3_path: 's3://aiola-datasets/customer-a/jan-2025/test.csv',
        file_name: 'test.csv',
        record_count: 2400,
        created_at: '2025-01-16T09:00:00Z'
      },
      {
        file_id: 'file_009',
        file_type: 'val',
        s3_path: 's3://aiola-datasets/customer-a/jan-2025/val.csv',
        file_name: 'val.csv',
        record_count: 1200,
        created_at: '2025-01-16T09:00:00Z'
      }
    ]
  }
];

export const clients = ['Customer A', 'Customer B', 'Customer C', 'Customer D'];
export const modelFormats = ['Triton', 'LLM', 'RT', 'ONNX'];
export const optimizers = ['Adam', 'AdamW', 'SGD', 'RMSprop'];
export const gpuTypes = ['V100', 'A100', 'T4', 'A10G'];
export const instanceTypes = ['p3.2xlarge', 'p3.8xlarge', 'p4d.24xlarge', 'g4dn.xlarge', 'g5.xlarge'];
