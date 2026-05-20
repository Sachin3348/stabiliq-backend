export interface UploadOptions {
  buffer: Buffer;
  key: string;           // e.g. "resumes/abc123.pdf"
  contentType: string;   // e.g. "application/pdf"
  bucket?: string;       // overrides default bucket if needed
}

export interface UploadResult {
  key: string;
  url: string;           // public or signed URL to the file
  bucket: string;
}

export interface IStorageProvider {
  upload(options: UploadOptions): Promise<UploadResult>;
  delete(key: string, bucket?: string): Promise<void>;
  getUrl(key: string, bucket?: string): string;
}
