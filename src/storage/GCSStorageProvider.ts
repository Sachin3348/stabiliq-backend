// Stub for Google Cloud Storage — swap in when needed.
// Install: npm install @google-cloud/storage
// import { Storage } from '@google-cloud/storage';
import type { IStorageProvider, UploadOptions, UploadResult } from './IStorageProvider';

export class GCSStorageProvider implements IStorageProvider {
  // private client: Storage;
  private defaultBucket: string;

  constructor() {
    this.defaultBucket = process.env.GCS_BUCKET_NAME || '';

    // this.client = new Storage({
    //   projectId: process.env.GCS_PROJECT_ID,
    //   keyFilename: process.env.GCS_KEY_FILE,   // path to service-account JSON
    // });
  }

  async upload(_options: UploadOptions): Promise<UploadResult> {
    throw new Error('GCSStorageProvider: not implemented. Install @google-cloud/storage and uncomment the code.');
  }

  async delete(_key: string, _bucket?: string): Promise<void> {
    throw new Error('GCSStorageProvider: not implemented.');
  }

  getUrl(key: string, bucket?: string): string {
    const b = bucket || this.defaultBucket;
    return `https://storage.googleapis.com/${b}/${key}`;
  }
}
