// API types matching the swagger.json specification

export type StatusEnum = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'CANCELLING';
export type FileTypeEnum = 'train' | 'test' | 'validation';

export interface SnowflakeFilters {
  date_range_start?: string;
  date_range_end?: string;
  languages?: string[];
  asr_model_version?: string;
  workflow_ids?: string[];
  is_noisy?: boolean | null;
  overlapping_speech?: boolean | null;
  is_not_relevant?: boolean | null;
  is_voice_recording_na?: boolean | null;
}

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

export interface SaveFetchedDataRequest {
  fetch_id: string;
  generation_name: string;
  customer_name?: string;
  split_config?: {
    train_ratio: number;
    test_ratio: number;
    val_ratio: number;
  };
}

export interface SaveFetchedDataResponse {
  training_data_preparation_id: string;
  generation_name: string;
  s3_root_path: string;
  files: TrainingDataFileResponse[];
}

export interface TrainingDataFileResponse {
  file_id: string;
  file_type: FileTypeEnum;
  s3_path: string;
  file_name: string;
  record_count?: number;
  created_at: string;
}

export interface TrainingDataPreparationResponse {
  training_data_preparation_id: string;
  generation_name: string;
  customer_name?: string;
  s3_root_path: string;
  tenant_id?: number;
  date_range_start?: string;
  date_range_end?: string;
  languages?: string[];
  asr_model_version?: string;
  workflow_ids?: string[];
  is_noisy?: boolean | null;
  overlapping_speech?: boolean | null;
  is_not_relevant?: boolean | null;
  is_voice_recording_na?: boolean | null;
  created_at: string;
  files: TrainingDataFileResponse[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface TrainingExecutionCreate {
  training_execution_name: string;
  client_name?: string;
  description?: string;
  hyperparameters?: Record<string, unknown>;
  prefect_parameters?: Record<string, unknown>;
  batch_size?: number;
  learning_rate?: number;
  training_data_preparation_ids: string[];
}

export interface TrainingExecutionResponse {
  training_execution_id: string;
  training_execution_name: string;
  client_name?: string;
  description?: string;
  user_id: string;
  status: StatusEnum;
  started_at?: string;
  completed_at?: string;
  hyperparameters?: Record<string, unknown>;
  prefect_parameters?: Record<string, unknown>;
  s3_output_path?: string;
  error_message?: string;
  prefect_run_id?: string;
  tenant_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface UserResponse {
  user_id: string;
  email: string;
  full_name?: string;
  picture_url?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserResponse;
}
