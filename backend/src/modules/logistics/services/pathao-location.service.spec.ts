import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PathaoLocationService } from './pathao-location.service';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { PathaoAuthService } from './pathao-auth.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const VALID_CREDS = {
  clientId: 'c1',
  clientSecret: 's1',
  username: 'merchant@test.com',
  password: 'pw',
  sandbox: true,
};

describe('PathaoLocationService', () => {
  let service: PathaoLocationService;
  let resolveCredentials: { execute: jest.Mock };
  let pathaoAuth: { getValidAccessToken: jest.Mock };

  beforeEach(async () => {
    resolveCredentials = { execute: jest.fn().mockResolvedValue(VALID_CREDS) };
    pathaoAuth = { getValidAccessToken: jest.fn().mockResolvedValue('tok-1') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathaoLocationService,
        { provide: ConfigService, useValue: new ConfigService({}) },
        { provide: ResolveCourierCredentialsService, useValue: resolveCredentials },
        { provide: PathaoAuthService, useValue: pathaoAuth },
      ],
    }).compile();

    service = module.get(PathaoLocationService);
    jest.clearAllMocks();
    resolveCredentials.execute.mockResolvedValue(VALID_CREDS);
    pathaoAuth.getValidAccessToken.mockResolvedValue('tok-1');
  });

  it('rejects when Pathao credentials are not configured', async () => {
    resolveCredentials.execute.mockResolvedValue({});
    await expect(service.listCities(TENANT, null)).rejects.toThrow(BadRequestException);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('fetches and maps the city list on a cache miss', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: { data: [{ city_id: 1, city_name: 'Dhaka' }, { city_id: 2, city_name: 'Chittagong' }] } },
    });

    const result = await service.listCities(TENANT, null);

    expect(result).toEqual([
      { cityId: 1, cityName: 'Dhaka' },
      { cityId: 2, cityName: 'Chittagong' },
    ]);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('serves the city list from cache on a second call, without hitting Pathao again', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: { data: [{ city_id: 1, city_name: 'Dhaka' }] } },
    });

    await service.listCities(TENANT, null);
    const second = await service.listCities(TENANT, null);

    expect(second).toEqual([{ cityId: 1, cityName: 'Dhaka' }]);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    // Second call served from cache — no token was even requested again.
    expect(pathaoAuth.getValidAccessToken).toHaveBeenCalledTimes(1);
  });

  it('caches zones per city_id independently', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { data: { data: [{ zone_id: 10, zone_name: 'Zone A' }] } } })
      .mockResolvedValueOnce({ data: { data: { data: [{ zone_id: 20, zone_name: 'Zone B' }] } } });

    const zonesForCity1 = await service.listZones(TENANT, null, 1);
    const zonesForCity2 = await service.listZones(TENANT, null, 2);

    expect(zonesForCity1).toEqual([{ zoneId: 10, zoneName: 'Zone A' }]);
    expect(zonesForCity2).toEqual([{ zoneId: 20, zoneName: 'Zone B' }]);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/cities/1/zone-list'),
      expect.any(Object),
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/cities/2/zone-list'),
      expect.any(Object),
    );
  });

  it('maps the area list including availability flags', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          data: [
            { area_id: 37, area_name: 'Bonolota', home_delivery_available: true, pickup_available: false },
          ],
        },
      },
    });

    const result = await service.listAreas(TENANT, null, 100);

    expect(result).toEqual([
      { areaId: 37, areaName: 'Bonolota', homeDeliveryAvailable: true, pickupAvailable: false },
    ]);
  });
});
