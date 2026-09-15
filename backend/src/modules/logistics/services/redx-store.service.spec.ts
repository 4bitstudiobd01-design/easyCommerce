import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { RedxStoreService } from './redx-store.service';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { CreateRedxStoreDto } from '../dto/redx-store.dto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BASE_URL = 'https://sandbox.redx.com.bd/v1.0.0-beta';

const VALID_CREDS = { apiKey: 'tok-1', sandbox: true };

const DTO: CreateRedxStoreDto = {
  name: 'Test Pickup Store',
  phone: '01712345678',
  address: 'Test Address',
  areaId: 1,
};

describe('RedxStoreService', () => {
  let service: RedxStoreService;
  let resolveCredentials: { execute: jest.Mock };

  beforeEach(async () => {
    resolveCredentials = { execute: jest.fn().mockResolvedValue(VALID_CREDS) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedxStoreService,
        { provide: ConfigService, useValue: new ConfigService({}) },
        { provide: ResolveCourierCredentialsService, useValue: resolveCredentials },
      ],
    }).compile();

    service = module.get(RedxStoreService);
    jest.clearAllMocks();
    resolveCredentials.execute.mockResolvedValue(VALID_CREDS);
  });

  describe('createStore', () => {
    it('rejects when RedX credentials are not configured', async () => {
      resolveCredentials.execute.mockResolvedValue({});
      await expect(service.createStore(TENANT, null, DTO)).rejects.toThrow(BadRequestException);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('creates a pickup store and maps the response', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          id: 1,
          name: 'Test Pickup Store',
          address: 'Test Address',
          area_name: 'Mohammadpur(Dhaka)',
          area_id: 1,
          phone: '8801898000999',
        },
      });

      const result = await service.createStore(TENANT, null, DTO);

      expect(result).toEqual({
        id: 1,
        name: 'Test Pickup Store',
        address: 'Test Address',
        areaName: 'Mohammadpur(Dhaka)',
        areaId: 1,
        phone: '8801898000999',
        createdAt: undefined,
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${BASE_URL}/pickup/store`,
        { name: 'Test Pickup Store', phone: '01712345678', address: 'Test Address', area_id: 1 },
        expect.objectContaining({ headers: { 'API-ACCESS-TOKEN': 'Bearer tok-1', 'Content-Type': 'application/json' } }),
      );
    });
  });

  describe('listStores', () => {
    it('maps the pickup_stores array', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          pickup_stores: [
            { id: 1, name: 'Store A', address: 'Addr A', area_name: 'Dhanmondi', area_id: 2, phone: '8801000000000', created_at: '2021-09-13T10:39:15.000Z' },
          ],
        },
      });

      const result = await service.listStores(TENANT, null);

      expect(result).toEqual([
        { id: 1, name: 'Store A', address: 'Addr A', areaName: 'Dhanmondi', areaId: 2, phone: '8801000000000', createdAt: '2021-09-13T10:39:15.000Z' },
      ]);
    });
  });

  describe('getStore', () => {
    it('maps the pickup_store object', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { pickup_store: { id: 1, name: 'Store A', address: 'Addr A', area_name: 'Dhanmondi', area_id: 2, phone: '8801000000000' } },
      });

      const result = await service.getStore(TENANT, null, 1);

      expect(result.id).toBe(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${BASE_URL}/pickup/store/info/1`,
        expect.objectContaining({ headers: { 'API-ACCESS-TOKEN': 'Bearer tok-1' } }),
      );
    });

    it('rejects when RedX has no such store', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });
      await expect(service.getStore(TENANT, null, 999)).rejects.toThrow(BadRequestException);
    });
  });
});
