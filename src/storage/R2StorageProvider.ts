import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { IStorageProvider, UploadOptions, UploadResult } from './IStorageProvider';

export class R2StorageProvider implements IStorageProvider {
  private client: S3Client;
  private defaultBucket: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    this.defaultBucket = process.env.R2_BUCKET_NAME || 'resume-uploads';
    this.publicUrl = process.env.R2_PUBLIC_URL || `https://${this.defaultBucket}.${accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const bucket = options.bucket || this.defaultBucket;
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: options.key,
        Body: options.buffer,
        ContentType: options.contentType,
      })
    );
    return {
      key: options.key,
      url: this.getUrl(options.key, bucket),
      bucket,
    };
  }

  async delete(key: string, bucket?: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket || this.defaultBucket,
        Key: key,
      })
    );
  }

  getUrl(key: string, _bucket?: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
