/**
 * Standard File Storage utilities for Rohilla Advertising CRM.
 * Adheres to standard storage structure: projects/{projectId}/{category}/...
 */

export type FileCategory = 'design' | 'production' | 'qc' | 'dispatch' | 'installation';

export const FILE_CATEGORIES: Record<string, FileCategory> = {
  DESIGN: 'design',
  PRODUCTION: 'production',
  QC: 'qc',
  DISPATCH: 'dispatch',
  INSTALLATION: 'installation',
};

/**
 * Returns the download URL for a given file ID.
 */
export function getFileDownloadUrl(fileId: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
  return `${baseUrl}/files/${fileId}/download`;
}

/**
 * Validates file extension against allowed whitelist for Rohilla Advertising CRM.
 */
export function isAllowedFileType(filename: string): boolean {
  const allowed = ['pdf', 'ai', 'psd', 'cdr', 'png', 'jpg', 'jpeg', 'tiff', 'zip'];
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowed.includes(ext) : false;
}
