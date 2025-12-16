// Hyperparameters configuration from CSV
// Last 3 parameters (wandb-*) are hidden from UI but included in API calls

export interface HyperparameterConfig {
  argument: string;
  type: 'str' | 'int' | 'float' | 'custom_bool' | 'str_or_list';
  defaultValue: string;
  description: string;
  hidden?: boolean;
}

export const hyperparameters: HyperparameterConfig[] = [
  // Note: train-data-path, test-data-path, validation-data-path are auto-generated from selected datasets
  {
    argument: 'gradient-accumulation-steps',
    type: 'int',
    defaultValue: '2',
    description: 'gradient accumulation steps',
  },
  {
    argument: 'max-steps',
    type: 'int',
    defaultValue: '20000',
    description: 'number of update steps to train for',
  },
  {
    argument: 'save-steps',
    type: 'int',
    defaultValue: '1000',
    description: 'number of every steps to save model checkpoint',
  },
  {
    argument: 'eval-steps',
    type: 'int',
    defaultValue: '1000',
    description: 'number of every steps to evaluate the model',
  },
  {
    argument: 'batch-size',
    type: 'int',
    defaultValue: '8',
    description: 'batch size',
  },
  {
    argument: 'lr',
    type: 'float',
    defaultValue: '0.0001',
    description: 'learning rate',
  },
  {
    argument: 'optim',
    type: 'str',
    defaultValue: 'adafactor',
    description: 'optimization strategy',
  },
  {
    argument: 'debug-mode',
    type: 'custom_bool',
    defaultValue: 'false',
    description: 'use limited amount of eval data',
  },
  {
    argument: 'debug-examples',
    type: 'int',
    defaultValue: '1000',
    description: 'use debug-examples amount of eval data',
  },
  {
    argument: 'whisper-model-name',
    type: 'str',
    defaultValue: 'openai/whisper-large-v2',
    description: "open ai's whisper model name",
  },
  {
    argument: 'parts-to-freeze',
    type: 'str',
    defaultValue: 'None',
    description: 'which model parts to freeze (various choices)',
  },
  {
    argument: 'kws-prompt-prob',
    type: 'float',
    defaultValue: '0',
    description: 'probability to sample keyword spotter prompt',
  },
  {
    argument: 'max-tokens',
    type: 'int',
    defaultValue: '4',
    description: 'max number of tokens to sample for keyword',
  },
  {
    argument: 'min-keyword-len',
    type: 'int',
    defaultValue: '3',
    description: 'min keyword length',
  },
  {
    argument: 'max-prompt-keywords',
    type: 'int',
    defaultValue: '5',
    description: 'max number of keywords to sample for prompt',
  },
  {
    argument: 'neg-keyword-prob',
    type: 'float',
    defaultValue: '0.1',
    description: 'max number of keywords to sample for prompt',
  },
  {
    argument: 'use-lora',
    type: 'custom_bool',
    defaultValue: 'false',
    description: 'use training with LoRA',
  },
  {
    argument: 'lora-merge-and-unload',
    type: 'custom_bool',
    defaultValue: 'false',
    description: 'This method merges the LoRa layers into the base model. This is needed if someone wants to use the base model as a standalone model.',
  },
  {
    argument: 'sot-prob',
    type: 'float',
    defaultValue: '0',
    description: 'Probability of adding start of transcript tokens to an audio sample (0.0 to 1.0)',
  },
  {
    argument: 'max-sot-tokens',
    type: 'int',
    defaultValue: '10',
    description: 'Maximum number of start of transcript tokens to add to an audio sample',
  },
  // Hidden parameters - included in API but not shown in UI
  {
    argument: 'wandb-logging',
    type: 'custom_bool',
    defaultValue: 'true',
    description: 'Enable wandb logging',
    hidden: true,
  },
  {
    argument: 'wandb-project',
    type: 'str',
    defaultValue: 'aiola-internal-asr',
    description: 'wandb project name',
    hidden: true,
  },
  {
    argument: 'wandb-entity',
    type: 'str',
    defaultValue: 'aiola-ds',
    description: 'wandb entity name',
    hidden: true,
  },
];

export const visibleHyperparameters = hyperparameters.filter(h => !h.hidden);
export const hiddenHyperparameters = hyperparameters.filter(h => h.hidden);

export function getDefaultHyperparameters(): Record<string, string | number | boolean> {
  const defaults: Record<string, string | number | boolean> = {};
  hyperparameters.forEach(h => {
    const key = h.argument;
    if (h.type === 'int') {
      defaults[key] = h.defaultValue ? parseInt(h.defaultValue) : 0;
    } else if (h.type === 'float') {
      defaults[key] = h.defaultValue ? parseFloat(h.defaultValue) : 0;
    } else if (h.type === 'custom_bool') {
      defaults[key] = h.defaultValue.toLowerCase() === 'true';
    } else {
      defaults[key] = h.defaultValue || '';
    }
  });
  return defaults;
}
