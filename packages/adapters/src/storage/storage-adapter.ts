export interface IFileStorageAdapter {
  generatePresignedUploadUrl(
    fileKey: string,
    contentType: string,
    expiresInSeconds?: number
  ): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }>;

  generatePresignedDownloadUrl(fileKey: string, expiresInSeconds?: number): Promise<string>;
}

export class SimulatedFileStorageAdapter implements IFileStorageAdapter {
  private baseStorageUrl: string;

  constructor(baseStorageUrl = 'https://storage.bulkkx.internal') {
    this.baseStorageUrl = baseStorageUrl;
  }

  async generatePresignedUploadUrl(
    fileKey: string,
    contentType: string,
    expiresInSeconds = 900 // 15 mins default
  ): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
    const token = Math.random().toString(36).substring(2, 10);
    const uploadUrl = `${this.baseStorageUrl}/upload/${fileKey}?token=${token}&expires=${expiresInSeconds}`;
    const publicUrl = `${this.baseStorageUrl}/files/${fileKey}`;
    return { uploadUrl, fileKey, publicUrl };
  }

  async generatePresignedDownloadUrl(fileKey: string, expiresInSeconds = 900): Promise<string> {
    const token = Math.random().toString(36).substring(2, 10);
    return `${this.baseStorageUrl}/download/${fileKey}?token=${token}&exp=${expiresInSeconds}`;
  }
}
