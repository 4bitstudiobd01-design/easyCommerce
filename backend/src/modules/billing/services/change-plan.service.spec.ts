import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ChangePlanService } from './change-plan.service';
import { GetMySubscriptionService } from './get-my-subscription.service';
import { PlanEntity, PlanCodeEnum } from '../entities/plan.entity';
import { SubscriptionEntity, SubscriptionStatusEnum } from '../entities/subscription.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { StaffMemberEntity } from '../../staff/entities/staff.entity';

const FREE_PLAN = {
  id: 'plan-free',
  code: PlanCodeEnum.FREE,
  name: 'Free Plan',
  monthlyPriceBdt: 0,
  maxStores: 1,
  maxStaffPerStore: 3,
} as PlanEntity;

const GROWTH_PLAN = {
  id: 'plan-growth',
  code: PlanCodeEnum.GROWTH,
  name: 'Growth Plan',
  monthlyPriceBdt: 990,
  maxStores: 5,
  maxStaffPerStore: 10,
} as PlanEntity;

const ENTERPRISE_PLAN = {
  id: 'plan-enterprise',
  code: PlanCodeEnum.ENTERPRISE,
  name: 'Enterprise Plan',
  monthlyPriceBdt: 2990,
  maxStores: null,
  maxStaffPerStore: null,
} as PlanEntity;

const TENANT = 'tenant-1';

describe('ChangePlanService', () => {
  let service: ChangePlanService;

  const mockPlanRepository = { findOne: jest.fn() };
  const mockSubscriptionRepository = { findOne: jest.fn(), save: jest.fn((s) => Promise.resolve(s)) };
  const mockStoreRepository = { count: jest.fn(), find: jest.fn() };
  const mockStaffRepository = { count: jest.fn() };
  const mockGetMySubscription = { execute: jest.fn() };

  /** A paid subscription with a month still left on it. */
  const activePaidSubscription = () => {
    const end = new Date();
    end.setDate(end.getDate() + 20);
    return {
      id: 'sub-1',
      tenantId: TENANT,
      planId: ENTERPRISE_PLAN.id,
      status: SubscriptionStatusEnum.ACTIVE,
      currentPeriodEnd: end,
      pendingPlanId: null,
      pendingPlanEffectiveAt: null,
    } as SubscriptionEntity;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangePlanService,
        { provide: getRepositoryToken(PlanEntity), useValue: mockPlanRepository },
        { provide: getRepositoryToken(SubscriptionEntity), useValue: mockSubscriptionRepository },
        { provide: getRepositoryToken(StoreEntity), useValue: mockStoreRepository },
        { provide: getRepositoryToken(StaffMemberEntity), useValue: mockStaffRepository },
        { provide: GetMySubscriptionService, useValue: mockGetMySubscription },
      ],
    }).compile();

    service = module.get<ChangePlanService>(ChangePlanService);
  });

  it('schedules the downgrade for the end of the paid period', async () => {
    const sub = activePaidSubscription();
    mockPlanRepository.findOne.mockResolvedValue(GROWTH_PLAN);
    mockGetMySubscription.execute.mockResolvedValue({ subscription: sub, plan: ENTERPRISE_PLAN });
    mockSubscriptionRepository.findOne.mockResolvedValue(sub);
    mockStoreRepository.count.mockResolvedValue(2);
    mockStoreRepository.find.mockResolvedValue([]);

    const result = await service.execute(TENANT, PlanCodeEnum.GROWTH);

    expect(result.isScheduled).toBe(true);
    expect(result.effectiveAt).toEqual(sub.currentPeriodEnd);
    expect(result.pendingPlanCode).toBe(PlanCodeEnum.GROWTH);
    // The merchant keeps what they paid for until the period ends.
    expect(sub.planId).toBe(ENTERPRISE_PLAN.id);
    expect(sub.pendingPlanId).toBe(GROWTH_PLAN.id);
  });

  it('blocks the downgrade when active stores exceed the target plan', async () => {
    const sub = activePaidSubscription();
    mockPlanRepository.findOne.mockResolvedValue(GROWTH_PLAN);
    mockGetMySubscription.execute.mockResolvedValue({ subscription: sub, plan: ENTERPRISE_PLAN });
    mockStoreRepository.count.mockResolvedValue(8);

    await expect(service.execute(TENANT, PlanCodeEnum.GROWTH)).rejects.toThrow(ForbiddenException);
    await expect(service.execute(TENANT, PlanCodeEnum.GROWTH)).rejects.toThrow(
      /8 active stores.*allows 5.*Deactivate 3/s,
    );
    expect(mockSubscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('blocks the downgrade when a store has too many staff', async () => {
    const sub = activePaidSubscription();
    mockPlanRepository.findOne.mockResolvedValue(GROWTH_PLAN);
    mockGetMySubscription.execute.mockResolvedValue({ subscription: sub, plan: ENTERPRISE_PLAN });
    mockStoreRepository.count.mockResolvedValue(2);
    mockStoreRepository.find.mockResolvedValue([{ id: 'store-1', name: 'Urban Attire' }]);
    mockStaffRepository.count.mockResolvedValue(14);

    await expect(service.execute(TENANT, PlanCodeEnum.GROWTH)).rejects.toThrow(
      /Urban Attire.*14 staff.*allows 10/s,
    );
    expect(mockSubscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('rejects an upgrade, which must go through the payment flow', async () => {
    mockPlanRepository.findOne.mockResolvedValue(ENTERPRISE_PLAN);
    mockGetMySubscription.execute.mockResolvedValue({
      subscription: activePaidSubscription(),
      plan: GROWTH_PLAN,
    });

    await expect(service.execute(TENANT, PlanCodeEnum.ENTERPRISE)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects switching to the plan already active', async () => {
    mockPlanRepository.findOne.mockResolvedValue(GROWTH_PLAN);
    mockGetMySubscription.execute.mockResolvedValue({
      subscription: activePaidSubscription(),
      plan: GROWTH_PLAN,
    });

    await expect(service.execute(TENANT, PlanCodeEnum.GROWTH)).rejects.toThrow(
      /already on the Growth Plan/,
    );
  });

  it('applies immediately when the current plan is free (nothing was paid for)', async () => {
    const sub = { ...activePaidSubscription(), planId: FREE_PLAN.id } as SubscriptionEntity;
    mockPlanRepository.findOne.mockResolvedValue(FREE_PLAN);
    mockGetMySubscription.execute.mockResolvedValue({
      subscription: sub,
      plan: { ...GROWTH_PLAN, monthlyPriceBdt: 0 } as PlanEntity,
    });
    mockSubscriptionRepository.findOne.mockResolvedValue(sub);
    mockStoreRepository.count.mockResolvedValue(0);
    mockStoreRepository.find.mockResolvedValue([]);

    const result = await service.execute(TENANT, PlanCodeEnum.FREE);

    expect(result.isScheduled).toBe(false);
    expect(sub.planId).toBe(FREE_PLAN.id);
  });

  it('cancels a scheduled change', async () => {
    const sub = {
      ...activePaidSubscription(),
      pendingPlanId: GROWTH_PLAN.id,
      pendingPlanEffectiveAt: new Date(),
    } as SubscriptionEntity;
    mockSubscriptionRepository.findOne.mockResolvedValue(sub);
    mockGetMySubscription.execute.mockResolvedValue({ subscription: sub, plan: ENTERPRISE_PLAN });

    const result = await service.cancelScheduledChange(TENANT);

    expect(sub.pendingPlanId).toBeNull();
    expect(sub.pendingPlanEffectiveAt).toBeNull();
    expect(result.currentPlanCode).toBe(PlanCodeEnum.ENTERPRISE);
  });

  it('rejects cancelling when nothing is scheduled', async () => {
    mockSubscriptionRepository.findOne.mockResolvedValue(activePaidSubscription());

    await expect(service.cancelScheduledChange(TENANT)).rejects.toThrow(
      /no scheduled plan change/i,
    );
  });
});
