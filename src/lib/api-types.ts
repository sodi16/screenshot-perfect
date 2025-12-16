// API types matching the swagger.json specification

export type StatusEnum = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'CANCELLING';
export type FileTypeEnum = 'train' | 'test' | 'val' | 'origin' | 'processed';
export type ArtifactType = 'TRTLLM' | 'RAW_WEIGHT';

export interface TenantMapping {
  tenant_id: string;
  tenant_name: string;
  cells?: object | null;
  region?: string | null;
}

export interface WorkflowInfo {
  workflow_id: string;
  workflow_name: string;
}

export interface TRTLLMModel {
  artifact_id: string;
  training_execution_id?: string | null;
  s3_path: string;
  model_artifact_name: string;
  model_size_mb?: number | null;
  published: boolean;
  model_tag?: string | null;
  created_at: string;
  tenant_id?: string | null;
  description?: string | null;
}

export interface SnowflakeFilters {
  customer_name?: string | null;
  tenant_id?: string | null;
  date_range_start?: string | null;
  date_range_end?: string | null;
  languages?: string[] | null;
  asr_model_versions?: string[] | null;
  workflow_ids?: string[] | null;
  is_noisy?: boolean | null;
  overlapping_speech?: boolean | null;
  is_not_relevant?: boolean | null;
  is_voice_recording_na?: boolean | null;
  is_partial_audio?: boolean | null;
  is_unclear_audio?: boolean | null;
}

export interface TrainingDataPreparationFilterRequest {
  filters: SnowflakeFilters;
  limit?: number | null;
}

export interface TrainingDataPreparationFilterResponse {
  fetch_id: string;
  record_count: number;
  preview: Record<string, unknown>[];
  cached?: boolean;
}

export interface SaveFetchedDataRequest {
  fetch_id: string;
  dataset_name: string;
  filters: SnowflakeFilters;
}

export interface SaveFetchedDataResponse {
  training_data_preparation_id: string;
  s3_root_path: string;
  record_count: number;
}

export interface TrainingDataFileResponse {
  file_id: string;
  file_type: FileTypeEnum;
  s3_path: string;
  file_name: string;
  record_count?: number | null;
  created_at: string;
}

export interface TrainingDataPreparationResponse {
  training_data_preparation_id: string;
  dataset_name: string;
  customer_name?: string | null;
  s3_root_path: string;
  tenant_id?: string | null;
  prefect_run_id?: string | null;
  error_message?: string | null;
  date_range_start?: string | null;
  date_range_end?: string | null;
  languages?: string[] | null;
  asr_model_versions?: string[] | null;
  workflow_ids?: string[] | null;
  is_noisy?: boolean | null;
  overlapping_speech?: boolean | null;
  is_not_relevant?: boolean | null;
  is_voice_recording_na?: boolean | null;
  is_partial_audio?: boolean | null;
  is_unclear_audio?: boolean | null;
  created_at: string;
  files?: TrainingDataFileResponse[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TrainingExecutionCreate {
  training_execution_name: string;
  customer_name?: string | null;
  description?: string | null;
  hyperparameters?: Record<string, unknown> | null;
  configuration?: Record<string, unknown> | null;
  prefect_parameters?: Record<string, unknown> | null;
  training_data_preparation_ids?: string[];
  base_model_artifact_id?: string | null;
}

export interface TrainingExecutionResponse {
  training_execution_id: string;
  training_execution_name: string;
  customer_name?: string | null;
  description?: string | null;
  user_id: string;
  status: StatusEnum;
  started_at?: string | null;
  completed_at?: string | null;
  hyperparameters?: Record<string, unknown> | null;
  prefect_parameters?: Record<string, unknown> | null;
  s3_model_path?: string | null;
  error_message?: string | null;
  prefect_run_id?: string | null;
  wandb_url?: string | null;
  base_model_artifact_id?: string | null;
  tenant_id?: string | null;
  batch_size?: number | null;
  learning_rate?: number | null;
  created_at: string;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ModelArtifactResponse {
  artifact_id: string;
  training_execution_id?: string | null;
  training_execution_name?: string | null;
  tenant_id?: string | null;
  artifact_type: string;
  s3_path: string;
  model_artifact_name: string;
  model_size_mb?: number | null;
  published: boolean;
  model_tag?: string | null;
  model_registry_url?: string | null;
  created_at: string;
}

// Training Execution Details nested types
export interface TrainingDataPreparationNested {
  training_data_preparation_id: string;
  dataset_name: string;
  customer_name?: string | null;
  s3_root_path: string;
}

export interface ModelArtifactNested {
  artifact_id: string;
  artifact_type: string;
  s3_path: string;
  model_artifact_name: string;
  model_size_mb?: number | null;
  published: boolean;
  model_tag?: string | null;
  created_at: string;
}

export interface EvaluationNested {
  evaluation_id: string;
  s3_results_path: string;
  accuracy?: number | null;
  error_message?: string | null;
  evaluated_at: string;
}

export interface TrainingExecutionDetailsResponse {
  training_execution_id: string;
  training_execution_name: string;
  status: StatusEnum;
  created_at: string;
  updated_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  tenant_id?: string | null;
  customer_name?: string | null;
  prefect_run_id?: string | null;
  wandb_url?: string | null;
  base_model_artifact_id?: string | null;
  description?: string | null;
  s3_model_path?: string | null;
  hyperparameters?: Record<string, unknown> | null;
  prefect_parameters?: Record<string, unknown> | null;
  created_by_user_email?: string | null;
  updated_by_user_email?: string | null;
  training_data_preparations?: TrainingDataPreparationNested[];
  model_artifacts?: ModelArtifactNested[];
  evaluations?: EvaluationNested[];
}

export interface UserResponse {
  user_id: string;
  email: string;
  full_name?: string;
  picture_url?: string;
}

export interface AuthUser {
  user_id: string;
  email: string;
}

export interface TrainingRunsFilterParams {
  start_date?: string;
  end_date?: string;
  created_by?: string[];
  tenant_id?: string[];
  status?: StatusEnum;
  training_execution_name?: string;
  prefect_run_id?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserResponse;
}

// Legacy types for backward compatibility
export interface ManualFetchRequest {
  filters: SnowflakeFilters;
}

export interface ManualFetchResponse {
  fetch_id: string;
  preview: {
    total_count: number;
    sample_records: Record<string, unknown>[];
  };
  filters_applied: SnowflakeFilters;
}
