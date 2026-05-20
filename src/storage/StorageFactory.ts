import type { IStorageProvider } from './IStorageProvider';
import { R2StorageProvider } from './R2StorageProvider';
import { S3StorageProvider } from './S3StorageProvider';
import { GCSStorageProvider } from './GCSStorageProvider';

export type StorageProviderType = 'r2' | 's3' | 'gcs';

export function createStorageProvider(type?: StorageProviderType): IStorageProvider {
  const provider = type || (process.env.STORAGE_PROVIDER as StorageProviderType) || 'r2';

  switch (provider) {
    case 'r2':
      return new R2StorageProvider();
    case 's3':
      return new S3StorageProvider();
    case 'gcs':
      return new GCSStorageProvider();
    default:
      throw new Error(`Unknown storage provider: "${provider}". Valid options: r2, s3, gcs`);
  }
}
