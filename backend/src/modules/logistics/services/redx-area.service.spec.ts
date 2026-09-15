import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { RedxAreaService } from './redx-area.service';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BASE_URL = 'https://sandbox.redx.com.bd/v1.0.0-beta';

const VALID_CREDS = { apiKey: 'tok-1', sandbox: true };

const SAMPLE_AREAS = [
  { id: 1, name: 'Mohammadpur(Dhaka)', post_code: 1207, division_name: 'Dhaka', zone_id: 1 },
  { id: 2, name: 'Dhanmondi', post_code: 1209, division_name: 'Dhaka', zone_id: 1 },
  { id: 3, name: 'Agrabad', post_code: 4100, division_name: 'Chattogram', zone_id: 2 },
];

describe('RedxAreaService', () => {
  let service: RedxAreaService;
  let resolveCredentials: { execute: jest.Mock };

  beforeEach(async () => {
    resolveCredentials = { execute: jest.fn().mockResolvedValue(VALID_CREDS) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedxAreaService,
        { provide: ConfigService, useValue: new ConfigService({}) },
        { provide: ResolveCourierCredentialsService, useValue: resolveCredentials },
      ],
    }).compile();

    service = module.get(RedxAreaService);
    jest.clearAllMocks();
    resolveCredentials.execute.mockResolvedValue(VALID_CREDS);
  });

  it('rejects when RedX credentials are not configured', async () => {
    resolveCredentials.execute.mockResolvedValue({});
    await expect(service.listAllAreas(TENANT, null)).rejects.toThrow(BadRequestException);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('fetches and maps the area list on a cache miss', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { areas: SAMPLE_AREAS } });

    const result = await service.listAllAreas(TENANT, null);

    expect(result).toEqual([
      { id: 1, name: 'Mohammadpur(Dhaka)', postCode: 1207, divisionName: 'Dhaka', zoneId: 1 },
      { id: 2, name: 'Dhanmondi', postCode: 1209, divisionName: 'Dhaka', zoneId: 1 },
      { id: 3, name: 'Agrabad', postCode: 4100, divisionName: 'Chattogram', zoneId: 2 },
    ]);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${BASE_URL}/areas`,
      expect.objectContaining({ headers: { 'API-ACCESS-TOKEN': 'Bearer tok-1' } }),
    );
  });

  it('serves the area list from cache on a second call, without hitting RedX again', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { areas: SAMPLE_AREAS } });

    await service.listAllAreas(TENANT, null);
    const second = await service.listAllAreas(TENANT, null);

    expect(second).toHaveLength(3);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('filters by post code from the cached list', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { areas: SAMPLE_AREAS } });

    const result = await service.listAreasByPostCode(TENANT, null, 1209);

    expect(result).toEqual([
      { id: 2, name: 'Dhanmondi', postCode: 1209, divisionName: 'Dhaka', zoneId: 1 },
    ]);
  });

  it('filters by district name case-insensitively from the cached list', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { areas: SAMPLE_AREAS } });

    const result = await service.listAreasByDistrict(TENANT, null, 'chattogram');

    expect(result).toEqual([
      { id: 3, name: 'Agrabad', postCode: 4100, divisionName: 'Chattogram', zoneId: 2 },
    ]);
  });
});
