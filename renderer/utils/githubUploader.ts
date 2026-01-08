import { apiClient } from 'app';
import { UploadFileRequest } from 'types';

// Utility to upload files to QSAI-Printer-Helper repository
export class GitHubUploader {
  private owner = 'Bodzaman';
  private repoName = 'QSAI-Printer-Helper';

  async uploadFile(path: string, content: string, message: string): Promise<boolean> {
    try {
      const request: UploadFileRequest = {
        path,
        content,
        message,
        branch: 'main',
        encoding: 'base64'
      };

      const response = await apiClient.upload_file(
        { owner: this.owner, repoName: this.repoName },
        request
      );

      const result = await response.json();
      console.log(`Upload ${path}:`, result);
      
      return result.success || false;
    } catch (error) {
      console.error(`Failed to upload ${path}:`, error);
      return false;
    }
  }

  async uploadMultipleFiles(files: Array<{path: string, content: string, message: string}>): Promise<boolean> {
    const requests: UploadFileRequest[] = files.map(file => ({
      path: file.path,
      content: file.content,
      message: file.message,
      branch: 'main',
      encoding: 'base64'
    }));

    try {
      const response = await apiClient.upload_multiple_files(
        { owner: this.owner, repoName: this.repoName },
        requests
      );

      const result = await response.json();
      console.log('Multiple file upload result:', result);
      
      return result.success || false;
    } catch (error) {
      console.error('Failed to upload multiple files:', error);
      return false;
    }
  }

  // Helper to convert string to base64
  stringToBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

export const githubUploader = new GitHubUploader();
