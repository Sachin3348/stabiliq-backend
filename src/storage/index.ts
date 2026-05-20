import { createStorageProvider } from './StorageFactory';

// Singleton — initialized once on app startup using STORAGE_PROVIDER env var
export const storageProvider = createStorageProvider();

export type { IStorageProvider, UploadOptions, UploadResult } from './IStorageProvider';
export { createStorageProvider } from './StorageFactory';
