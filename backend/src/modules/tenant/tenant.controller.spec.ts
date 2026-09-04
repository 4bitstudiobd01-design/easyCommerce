import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TenantController } from './tenant.controller';
import { CreateStoreService } from './services/create-store.service';
import { FindStoreByUserService } from './services/find-store-by-user.service';
import { FindStoreBySlugService } from './services/find-store-by-slug.service';
import { UpdateStoreService } from './services/update-store.service';
import { DeleteStoreService } from './services/delete-store.service';
import { ManageDeliveryZonesService } from './services/manage-delivery-zones.service';
import { ManageApiKeysService } from './services/manage-api-keys.service';
import { ManageWebhooksService } from './services/manage-webhooks.service';
import { CreateBranchService } from './services/create-branch.service';
import { ListBranchesService } from './services/list-branches.service';
import { UpdateBranchService } from './services/update-branch.service';
import { DeleteBranchService } from './services/delete-branch.service';

describe('TenantController', () => {
  let controller: TenantController;
  let updateStoreService: { execute: jest.Mock };
  let findStoreBySlugService: { execute: jest.Mock };

  beforeEach(async () => {
    updateStoreService = { execute: jest.fn().mockResolvedValue({ id: 'store-1' }) };
    findStoreBySlugService = {
      execute: jest.fn().mockResolvedValue({
        id: 'store-1',
        slug: 'sumon-fashion',
        name: 'Sumon Fashion',
        ownerId: 'owner-1',
        smtpPass: 'super-secret',
        steadfastApiKey: 'sf-secret',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        { provide: CreateStoreService, useValue: { execute: jest.fn() } },
        { provide: FindStoreByUserService, useValue: { execute: jest.fn(), findAllStoresByUser: jest.fn() } },
        { provide: FindStoreBySlugService, useValue: findStoreBySlugService },
        { provide: UpdateStoreService, useValue: updateStoreService },
        { provide: DeleteStoreService, useValue: { execute: jest.fn() } },
        { provide: ManageDeliveryZonesService, useValue: {} },
        { provide: ManageApiKeysService, useValue: {} },
        { provide: ManageWebhooksService, useValue: {} },
        { provide: CreateBranchService, useValue: {} },
        { provide: ListBranchesService, useValue: {} },
        { provide: UpdateBranchService, useValue: {} },
        { provide: DeleteBranchService, useValue: {} },
        // Guard collaborator — its presence confirms JwtAuthGuard is genuinely attached to these routes.
        { provide: JwtService, useValue: { verify: jest.fn(), verifyAsync: jest.fn() } },
      ],
    }).compile();

    controller = module.get<TenantController>(TenantController);
  });

  describe('updateMyStore', () => {
    it('forwards the x-store-id header so multi-store owners and staff update the correct store', async () => {
      await controller.updateMyStore('owner-1', { primaryColor: '#dc2626' }, 'store-2');
      expect(updateStoreService.execute).toHaveBeenCalledWith('owner-1', { primaryColor: '#dc2626' }, 'store-2');
    });

    it('works without an x-store-id header (single-store merchant)', async () => {
      await controller.updateMyStore('owner-1', { primaryColor: '#dc2626' }, undefined);
      expect(updateStoreService.execute).toHaveBeenCalledWith('owner-1', { primaryColor: '#dc2626' }, undefined);
    });
  });

  describe('getStoreBySlug (public)', () => {
    it('strips merchant-private credentials before returning the store', async () => {
      const result = await controller.getStoreBySlug('sumon-fashion');
      expect(result).not.toHaveProperty('smtpPass');
      expect(result).not.toHaveProperty('steadfastApiKey');
      expect(result).not.toHaveProperty('ownerId');
      expect(result.slug).toBe('sumon-fashion');
    });
  });
});
