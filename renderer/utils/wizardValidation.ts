/**
 * Validation utilities for AIStaffManagementHub wizard
 * Provides validation rules, error messages, and real-time validation
 */

export type ValidationError = {
  field: string;
  message: string;
};

export type FieldValidationResult = {
  isValid: boolean;
  error?: string;
};

export type StageValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};

// Validation rules for each field
export const validationRules = {
  // Identity stage
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s-']+$/,
    errorMessages: {
      required: 'Agent name is required',
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name cannot exceed 50 characters',
      pattern: 'Name can only contain letters, numbers, spaces, hyphens and apostrophes',
    },
  },
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    errorMessages: {
      required: 'Agent title/role is required',
      minLength: 'Title must be at least 3 characters',
      maxLength: 'Title cannot exceed 100 characters',
    },
  },
  nationality: {
    required: true,
    errorMessages: {
      required: 'Nationality is required',
    },
  },
  avatarUrl: {
    required: false,
    pattern: /^https?:\/\/.+/,
    errorMessages: {
      pattern: 'Please enter a valid URL starting with http:// or https://',
    },
  },
  // Chat stage
  chatSystemPrompt: {
    required: true,
    minLength: 20,
    maxLength: 50000,
    errorMessages: {
      required: 'Chat system prompt is required',
      minLength: 'System prompt must be at least 20 characters',
      maxLength: 'System prompt cannot exceed 50,000 characters',
    },
  },
  // Voice stage
  voiceSystemPrompt: {
    required: true,
    minLength: 20,
    maxLength: 50000,
    errorMessages: {
      required: 'Voice system prompt is required',
      minLength: 'System prompt must be at least 20 characters',
      maxLength: 'System prompt cannot exceed 50,000 characters',
    },
  },
  firstResponse: {
    required: true,
    minLength: 5,
    maxLength: 500,
    errorMessages: {
      required: 'First response/greeting is required',
      minLength: 'First response must be at least 5 characters',
      maxLength: 'First response cannot exceed 500 characters',
    },
  },
  voiceModel: {
    required: true,
    errorMessages: {
      required: 'Voice model is required',
    },
  },
};

/**
 * Validate a single field based on its rules
 */
export function validateField(
  fieldName: keyof typeof validationRules,
  value: string | null | undefined
): FieldValidationResult {
  const rules = validationRules[fieldName];
  const val = value?.trim() || '';

  // Check required
  if (rules.required && !val) {
    return {
      isValid: false,
      error: rules.errorMessages.required,
    };
  }

  // If not required and empty, it's valid
  if (!rules.required && !val) {
    return { isValid: true };
  }

  // Check minLength
  if ('minLength' in rules && val.length < rules.minLength) {
    return {
      isValid: false,
      error: rules.errorMessages.minLength,
    };
  }

  // Check maxLength
  if ('maxLength' in rules && val.length > rules.maxLength) {
    return {
      isValid: false,
      error: rules.errorMessages.maxLength,
    };
  }

  // Check pattern
  if ('pattern' in rules && rules.pattern && !rules.pattern.test(val)) {
    return {
      isValid: false,
      error: rules.errorMessages.pattern,
    };
  }

  return { isValid: true };
}

/**
 * Validate all fields in the Identity stage
 */
export function validateIdentityStage(identity: {
  name: string;
  title: string;
  nationality: string;
  avatar_url?: string | null;
}): StageValidationResult {
  const errors: ValidationError[] = [];

  const nameValidation = validateField('name', identity.name);
  if (!nameValidation.isValid) {
    errors.push({ field: 'name', message: nameValidation.error! });
  }

  const titleValidation = validateField('title', identity.title);
  if (!titleValidation.isValid) {
    errors.push({ field: 'title', message: titleValidation.error! });
  }

  const nationalityValidation = validateField('nationality', identity.nationality);
  if (!nationalityValidation.isValid) {
    errors.push({ field: 'nationality', message: nationalityValidation.error! });
  }

  if (identity.avatar_url) {
    const avatarValidation = validateField('avatarUrl', identity.avatar_url);
    if (!avatarValidation.isValid) {
      errors.push({ field: 'avatar_url', message: avatarValidation.error! });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all fields in the Chat stage
 */
export function validateChatStage(chatBot: {
  system_prompt: string;
}): StageValidationResult {
  const errors: ValidationError[] = [];

  const promptValidation = validateField('chatSystemPrompt', chatBot.system_prompt);
  if (!promptValidation.isValid) {
    errors.push({ field: 'system_prompt', message: promptValidation.error! });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all fields in the Voice stage
 */
export function validateVoiceStage(voice: {
  system_prompt: string;
  first_response: string;
  voice_model: string;
}): StageValidationResult {
  const errors: ValidationError[] = [];

  const promptValidation = validateField('voiceSystemPrompt', voice.system_prompt);
  if (!promptValidation.isValid) {
    errors.push({ field: 'system_prompt', message: promptValidation.error! });
  }

  const firstResponseValidation = validateField('firstResponse', voice.first_response);
  if (!firstResponseValidation.isValid) {
    errors.push({ field: 'first_response', message: firstResponseValidation.error! });
  }

  const voiceModelValidation = validateField('voiceModel', voice.voice_model);
  if (!voiceModelValidation.isValid) {
    errors.push({ field: 'voice_model', message: voiceModelValidation.error! });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if all stages are complete for publishing
 */
export function validatePublishReadiness(wizardState: {
  identity: { name: string; title: string; nationality: string; avatar_url?: string | null };
  chatBot: { system_prompt: string };
  voice: { system_prompt: string; first_response: string; voice_model: string };
}): StageValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate all stages
  const identityResult = validateIdentityStage(wizardState.identity);
  const chatResult = validateChatStage(wizardState.chatBot);
  const voiceResult = validateVoiceStage(wizardState.voice);

  allErrors.push(...identityResult.errors);
  allErrors.push(...chatResult.errors);
  allErrors.push(...voiceResult.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}
