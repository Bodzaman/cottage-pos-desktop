// Shared state for media upload tracking across components

export let isUploading = false;
export let uploadProgress = 0;

// Functions to update the state
export const setIsUploading = (value: boolean) => {
  isUploading = value;
};

export const setUploadProgress = (value: number) => {
  uploadProgress = Math.min(100, Math.max(0, value));
};

export const resetUploadState = () => {
  isUploading = false;
  uploadProgress = 0;
};
