// Stub for AWS S3 — swap in when needed.
// Install: npm install @aws-sdk/client-s3
// import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { IStorageProvider, UploadOptions, UploadResult } from './IStorageProvider';

export class S3StorageProvider implements IStorageProvider {
  // private client: S3Client;
  private defaultBucket: string;
  private region: string;

  constructor() {
    this.defaultBucket = process.env.AWS_S3_BUCKET_NAME || '';
    this.region = process.env.AWS_REGION || 'us-east-1';

    // this.client = new S3Client({
    //   region: this.region,
    //   credentials: {
    //     accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    //   },
    // });
  }

  async upload(_options: UploadOptions): Promise<UploadResult> {
    throw new Error('S3StorageProvider: not implemented. Install @aws-sdk/client-s3 and uncomment the code.');
  }

  async delete(_key: string, _bucket?: string): Promise<void> {
    throw new Error('S3StorageProvider: not implemented.');
  }

  getUrl(key: string, bucket?: string): string {
    const b = bucket || this.defaultBucket;
    return `https://${b}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
