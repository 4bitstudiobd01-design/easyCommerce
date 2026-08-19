export interface StorageDriver {
  /**
   * Upload a file to the storage provider
   * @param file The multer file object
   * @param folder Optional subfolder/prefix
   * @param tenantId Optional tenant ID for multi-tenant isolation
   * @returns Object containing the public URL and the unique path/key
   */
  upload(
    file: Express.Multer.File,
    folder?: string,
    tenantId?: string,
  ): Promise<{ url: string; key: string }>;

  /**
   * Upload a raw buffer to the storage provider
   * @param buffer The file buffer
   * @param fileName The name of the file
   * @param mimetype The mimetype of the file
   * @param folder Optional subfolder/prefix
   * @param tenantId Optional tenant ID for multi-tenant isolation
   * @returns Object containing the public URL and the unique path/key
   */
  uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimetype: string,
    folder?: string,
    tenantId?: string,
  ): Promise<{ url: string; key: string }>;

  /**
   * Delete a file from the storage provider
   * @param key The unique path/key of the file
   */
  delete(key: string): Promise<void>;
}
