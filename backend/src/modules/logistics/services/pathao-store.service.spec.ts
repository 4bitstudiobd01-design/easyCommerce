import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PathaoStoreService } from './pathao-store.service';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { PathaoAuthService } from './pathao-auth.service';
import { CreatePathaoStoreDto } from '../dto/pathao-store.dto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BASE_URL = 'https://courier-api-sandbox.pathao.com';

const VALID_CREDS = {
  clientId: 'c1',
  clientSecret: 's1',
  username: 'merchant@test.com',
  password: 'pw',
  sandbox: true,
};

describe('PathaoStoreService', () => {
  let service: PathaoStoreService;
  let resolveCredentials: { execute: jest.Mock };
  let pathaoAuth: { getValidAccessToken: jest.Mock };

  beforeEach(async () => {
    resolveCredentials = { execute: jest.fn().mockResolvedValue(VALID_CREDS) };
    pathaoAuth = { getValidAccessToken: jest.fn().mockResolvedValue('tok-1') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathaoStoreService,
        { provide: ConfigService, useValue: new ConfigService({}) },
        { provide: ResolveCourierCredentialsService, useValue: resolveCredentials },
        { provide: PathaoAuthService, useValue: pathaoAuth },
      ],
    }).compile();

    service = module.get(PathaoStoreService);
    jest.clearAllMocks();
    resolveCredentials.execute.mockResolvedValue(VALID_CREDS);
    pathaoAuth.getValidAccessToken.mockResolvedValue('tok-1');
  });

  describe('createStore', () => {
    const dto: CreatePathaoStoreDto = {
      name: 'Main Warehouse',
      contactName: 'Rahim Uddin',
      contactNumber: '01712345678',
      address: 'House 1, Road 2, Gulshan, Dhaka',
      cityId: 1,
      zoneId: 10,
      areaId: 100,
    };

    it('rejects when Pathao credentials are not configured', async () => {
      resolveCredentials.execute.mockResolvedValue({});
      await expect(service.createStore(TENANT, null, dto)).rejects.toThrow(BadRequestException);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('creates a store against the sandbox host with a bearer token', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { message: 'Store created successfully, Please wait one hour for approval.', data: { store_name: 'Main Warehouse' } },
      });

      const result = await service.createStore(TENANT, null, dto);

      expect(result.storeName).toBe('Main Warehouse');
      expect(pathaoAuth.getValidAccessToken).toHaveBeenCalledWith(
        TENANT,
        BASE_URL,
        true,
        expect.objectContaining({ clientId: 'c1' }),
      );
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${BASE_URL}/aladdin/api/v1/stores`,
        expect.objectContaining({
          name: 'Main Warehouse',
          contact_name: 'Rahim Uddin',
          contact_number: '01712345678',
          city_id: 1,
          zone_id: 10,
          area_id: 100,
        }),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok-1' }) }),
      );
    });
  });

  describe('listStores', () => {
    it('maps Pathao store rows to the response shape', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            data: [
              {
                store_id: 12345,
                store_name: 'Main Warehouse',
                store_address: 'House 1, Road 2, Gulshan',
                is_active: 1,
                city_id: 1,
                zone_id: 10,
                hub_id: 3,
                is_default_store: true,
                is_default_return_store: false,
              },
            ],
          },
        },
      });

      const result = await service.listStores(TENANT, null);

      expect(result).toEqual([
        {
          storeId: 12345,
          storeName: 'Main Warehouse',
          storeAddress: 'House 1, Road 2, Gulshan',
          isActive: true,
          cityId: 1,
          zoneId: 10,
          hubId: 3,
          isDefaultStore: true,
          isDefaultReturnStore: false,
        },
      ]);
    });

    it('rejects when Pathao credentials are not configured', async () => {
      resolveCredentials.execute.mockResolvedValue({});
      await expect(service.listStores(TENANT, null)).rejects.toThrow(BadRequestException);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });
});
