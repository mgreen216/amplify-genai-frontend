import { Model, Models } from "@/types/model";
import { FeatureFlagConfig } from "@/types/admin";

// Default model configurations
export const DEFAULT_MODELS: Models = {
  "gpt-3.5-turbo": {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    inputContextWindow: 4096,
    outputTokenLimit: 4096,
    outputTokenCost: 0.002,
    inputTokenCost: 0.001,
    cachedTokenCost: 0.0005,
    description: "Fast, efficient model for most tasks",
    supportsImages: false,
    supportsReasoning: true
  },
  "gpt-4": {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    inputContextWindow: 8192,
    outputTokenLimit: 4096,
    outputTokenCost: 0.06,
    inputTokenCost: 0.03,
    cachedTokenCost: 0.015,
    description: "Advanced model with better reasoning",
    supportsImages: true,
    supportsReasoning: true
  },
  "text-embedding-ada-002": {
    id: "text-embedding-ada-002",
    name: "Text Embedding Ada",
    provider: "OpenAI",
    inputContextWindow: 8191,
    outputTokenLimit: 0,
    outputTokenCost: 0,
    inputTokenCost: 0.0001,
    cachedTokenCost: 0,
    description: "Embedding model for semantic search",
    supportsImages: false,
    supportsReasoning: false
  },
  "claude-3-opus-20240229": {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    inputContextWindow: 200000,
    outputTokenLimit: 4096,
    outputTokenCost: 0.075,
    inputTokenCost: 0.015,
    cachedTokenCost: 0.0075,
    description: "Most capable Claude model",
    supportsImages: true,
    supportsReasoning: true
  },
  "claude-3-sonnet-20240229": {
    id: "claude-3-sonnet-20240229",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    inputContextWindow: 200000,
    outputTokenLimit: 4096,
    outputTokenCost: 0.015,
    inputTokenCost: 0.003,
    cachedTokenCost: 0.0015,
    description: "Balanced Claude model",
    supportsImages: true,
    supportsReasoning: true
  },
  "claude-3-haiku-20240307": {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    inputContextWindow: 200000,
    outputTokenLimit: 4096,
    outputTokenCost: 0.00125,
    inputTokenCost: 0.00025,
    cachedTokenCost: 0.000125,
    description: "Fast and efficient Claude model",
    supportsImages: true,
    supportsReasoning: true
  }
};

// Default feature flags
export const DEFAULT_FEATURE_FLAGS: FeatureFlagConfig = {
  chatEnabled: {
    enabled: true,
    userExceptions: [],
    amplifyGroupExceptions: []
  },
  artifactsEnabled: {
    enabled: true,
    userExceptions: [],
    amplifyGroupExceptions: []
  },
  assistantsEnabled: {
    enabled: true,
    userExceptions: [],
    amplifyGroupExceptions: []
  },
  integrationsEnabled: {
    enabled: true,
    userExceptions: [],
    amplifyGroupExceptions: []
  },
  adminPanelEnabled: {
    enabled: false,
    userExceptions: ["admin@example.com"],
    amplifyGroupExceptions: ["Administrators"]
  },
  codeInterpreterEnabled: {
    enabled: false,
    userExceptions: [],
    amplifyGroupExceptions: ["Developers", "PowerUsers"]
  },
  ragEnabled: {
    enabled: true,
    userExceptions: [],
    amplifyGroupExceptions: []
  },
  memoryEnabled: {
    enabled: true,
    userExceptions: [],
    amplifyGroupExceptions: []
  },
  workflowsEnabled: {
    enabled: false,
    userExceptions: [],
    amplifyGroupExceptions: ["PowerUsers", "Developers"]
  },
  marketplaceEnabled: {
    enabled: true,
    userExceptions: [],
    amplifyGroupExceptions: []
  },
  sharingEnabled: {
    enabled: true,
    userExceptions: [],
    amplifyGroupExceptions: []
  },
  apiKeysEnabled: {
    enabled: true,
    userExceptions: [],
    amplifyGroupExceptions: []
  }
};

// Default model IDs
export const DEFAULT_MODEL_ID = "gpt-3.5-turbo";
export const DEFAULT_ADVANCED_MODEL_ID = "gpt-4";
export const DEFAULT_CHEAPEST_MODEL_ID = "gpt-3.5-turbo";

// Default system settings
export const DEFAULT_SYSTEM_SETTINGS = {
  maxTokensDefault: 2048,
  temperatureDefault: 0.7,
  rateLimitRequestsPerMinute: 60,
  rateLimitTokensPerMinute: 40000,
  maxFileUploadSize: 10485760, // 10MB
  maxConversationLength: 100,
  autoSaveEnabled: true,
  notificationsEnabled: true
};

// Get default model configuration
export const getDefaultModelConfig = () => {
  return {
    models: DEFAULT_MODELS,
    default: DEFAULT_MODELS[DEFAULT_MODEL_ID],
    cheapest: DEFAULT_MODELS[DEFAULT_CHEAPEST_MODEL_ID],
    advanced: DEFAULT_MODELS[DEFAULT_ADVANCED_MODEL_ID]
  };
};

// Check if a feature is enabled for a user
export const isFeatureEnabled = (
  featureName: string,
  featureFlags: FeatureFlagConfig,
  userEmail?: string,
  userGroups?: string[]
): boolean => {
  const feature = featureFlags[featureName];
  if (!feature) return false;
  
  // Check if user is in exceptions
  if (userEmail && feature.userExceptions?.includes(userEmail)) {
    return !feature.enabled; // Opposite of the general setting
  }
  
  // Check if user's group is in exceptions
  if (userGroups && feature.amplifyGroupExceptions) {
    const hasGroupException = userGroups.some(group => 
      feature.amplifyGroupExceptions?.includes(group)
    );
    if (hasGroupException) {
      return !feature.enabled; // Opposite of the general setting
    }
  }
  
  return feature.enabled;
};