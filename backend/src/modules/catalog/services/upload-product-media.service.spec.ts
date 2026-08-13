import { BadRequestException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { UploadProductMediaService } from './upload-product-media.service';

/**
 * Product images can now be uploaded as files rather than pasted as URLs. These cover
 * the rules that keep that safe: type/size limits, tenant-scoped storage, generated
 * filenames (never the client-supplied one) and cross-tenant product checks.
 */
describe('UploadProductMediaService', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  let uploadDir: string;
  let originalUploadDir: string | undefined;

  const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
    ({
      originalname: 'photo.png',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('fake-image-bytes'),
      ...overrides,
    }) as Express.Multer.File;

  const build = (product: unknown = { id: 'p1', tenantId }) => {
    const productRepository = { findOne: jest.fn().mockResolvedValue(product) };
    return {
      service: new UploadProductMediaService(productRepository as any),
      productRepository,
    };
  };

  beforeEach(async () => {
    originalUploadDir = process.env.UPLOAD_DIR;
    uploadDir = await fs.mkdtemp(join(tmpdir(), 'ec-upload-test-'));
    process.env.UPLOAD_DIR = uploadDir;
  });

  afterEach(async () => {
    if (originalUploadDir === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = originalUploadDir;
    await fs.rm(uploadDir, { recursive: true, force: true });
  });

  it('writes uploaded files under a tenant-scoped directory', async () => {
    const { service } = build();

    const result = await service.execute(tenantId, [makeFile()]);

    expect(result).toHaveLength(1);
    expect(result[0].url).toContain(`/uploads/products/${tenantId}/`);

    const written = await fs.readdir(join(uploadDir, 'products', tenantId));
    expect(written).toHaveLength(1);
  });

  it('never stores the client-supplied filename', async () => {
    // A crafted name like ../../etc/passwd must not influence the path on disk.
    const { service } = build();

    const result = await service.execute(tenantId, [
      makeFile({ originalname: '../../../etc/passwd.png' }),
    ]);

    expect(result[0].fileName).not.toContain('..');
    expect(result[0].fileName).not.toContain('passwd');
    expect(result[0].fileName).toMatch(/^[0-9a-f-]{36}\.png$/);
  });

  it('stores multiple files in one call', async () => {
    const { service } = build();

    const result = await service.execute(tenantId, [makeFile(), makeFile(), makeFile()]);

    expect(result).toHaveLength(3);
    // Distinct generated names, so uploads cannot overwrite each other.
    expect(new Set(result.map((r) => r.fileName)).size).toBe(3);
  });

  it('rejects unsupported file types such as SVG', async () => {
    const { service } = build();

    await expect(
      service.execute(tenantId, [
        makeFile({ mimetype: 'image/svg+xml', originalname: 'x.svg' }),
      ]),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects files larger than 5MB', async () => {
    const { service } = build();

    await expect(
      service.execute(tenantId, [makeFile({ size: 6 * 1024 * 1024 })]),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an empty upload', async () => {
    const { service } = build();

    await expect(service.execute(tenantId, [])).rejects.toThrow(BadRequestException);
  });

  it('rejects attaching media to another tenant\'s product', async () => {
    const { service, productRepository } = build(null);

    await expect(service.execute(tenantId, [makeFile()], 'other-tenant-product')).rejects.toThrow(
      NotFoundException,
    );
    expect(productRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'other-tenant-product', tenantId },
    });
  });

  it('writes nothing to disk when validation fails', async () => {
    const { service } = build();

    await expect(
      service.execute(tenantId, [
        makeFile(),
        makeFile({ mimetype: 'application/pdf' }),
      ]),
    ).rejects.toThrow(BadRequestException);

    // The whole batch is validated before any file is written, so a bad file in the
    // batch must not leave the good one behind.
    const dirExists = await fs
      .readdir(join(uploadDir, 'products', tenantId))
      .catch(() => null);
    expect(dirExists).toBeNull();
  });
});
