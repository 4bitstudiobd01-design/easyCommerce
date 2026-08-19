import { UpdateStoreService } from './update-store.service';
import { FindStoreByUserService } from './find-store-by-user.service';

/**
 * PUT /stores/me previously resolved the target store by ownerId only, ignoring
 * x-store-id and staff membership — inconsistent with GET /stores/me, which
 * already delegates to FindStoreByUserService. A merchant with multiple stores
 * (or a staff member) could therefore update the wrong store, or be silently
 * rejected. This locks in resolution parity between the two routes.
 */
describe('UpdateStoreService', () => {
  const build = (resolvedStore: any) => {
    const storeRepository = {
      save: jest.fn().mockImplementation((store) => Promise.resolve(store)),
    };
    const findStoreByUserService = {
      execute: jest.fn().mockResolvedValue(resolvedStore),
    } as unknown as FindStoreByUserService;

    return {
      service: new UpdateStoreService(storeRepository as any, findStoreByUserService),
      storeRepository,
      findStoreByUserService,
    };
  };

  it('resolves the store via FindStoreByUserService using the caller and x-store-id header', async () => {
    const store = { id: 'store-1', ownerId: 'owner-1', primaryColor: '#2563eb' };
    const { service, findStoreByUserService } = build(store);

    await service.execute('owner-1', { primaryColor: '#dc2626' }, 'store-1');

    expect(findStoreByUserService.execute).toHaveBeenCalledWith('owner-1', 'store-1');
  });

  it('applies the DTO onto the resolved store and persists it', async () => {
    const store = { id: 'store-1', ownerId: 'owner-1', primaryColor: '#2563eb', fontFamily: 'Inter' };
    const { service, storeRepository } = build(store);

    const result = await service.execute('owner-1', { primaryColor: '#dc2626' });

    expect(result.primaryColor).toBe('#dc2626');
    expect(result.fontFamily).toBe('Inter');
    expect(storeRepository.save).toHaveBeenCalledWith(expect.objectContaining({ primaryColor: '#dc2626' }));
  });

  it('throws NotFoundException when the caller has no accessible store', async () => {
    const { service } = build(null);
    await expect(service.execute('stranger-1', { primaryColor: '#dc2626' })).rejects.toThrow(
      'No active store found for this merchant.',
    );
  });
});
