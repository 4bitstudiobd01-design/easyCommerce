import { PostJournalEntryService } from './post-journal-entry.service';
import { JournalEntryEntity, JournalStatusEnum } from '../entities/journal-entry.entity';
import { JournalLineEntity } from '../entities/journal-line.entity';

describe('PostJournalEntryService', () => {
  const ACCOUNT_A = { id: 'acc-1', storeId: 'store-1', code: '1010', name: 'Cash', isActive: true };
  const ACCOUNT_B = { id: 'acc-2', storeId: 'store-1', code: '4010', name: 'Sales Revenue', isActive: true };

  const build = () => {
    const journalRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const accountRepository = {
      find: jest.fn().mockResolvedValue([ACCOUNT_A, ACCOUNT_B]),
    };
    const allocateNextNumberService = {
      execute: jest.fn().mockResolvedValue('JE-2026-0001'),
    };

    // Fake savedEntry/lines captured for assertions.
    let savedEntry: any;
    const savedLines: any[] = [];

    const entryRepo = {
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest.fn().mockImplementation((data) => {
        savedEntry = { id: 'entry-1', ...data };
        return Promise.resolve(savedEntry);
      }),
      findOne: jest.fn().mockImplementation(() =>
        Promise.resolve({ ...savedEntry, lines: savedLines }),
      ),
    };
    const lineRepo = {
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest.fn().mockImplementation((rows) => {
        const created = rows.map((r: any, i: number) => ({ id: `line-${i + 1}`, ...r }));
        savedLines.push(...created);
        return Promise.resolve(created);
      }),
    };

    const manager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === JournalEntryEntity) return entryRepo;
        if (entity === JournalLineEntity) return lineRepo;
        throw new Error('Unexpected repository requested');
      }),
    };

    const dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => cb(manager)),
    };

    const service = new PostJournalEntryService(
      journalRepository as any,
      accountRepository as any,
      allocateNextNumberService as any,
      dataSource as any,
    );

    return { service, entryRepo, lineRepo };
  };

  const baseInput = {
    date: '2026-09-04',
    description: 'Test entry',
    status: JournalStatusEnum.POSTED as JournalStatusEnum.POSTED,
    lines: [
      { accountId: 'acc-1', debit: 100 },
      { accountId: 'acc-2', credit: 100 },
    ],
  };

  it('persists branchId on the journal entry and every line when provided', async () => {
    const { service, entryRepo, lineRepo } = build();

    const result = await service.execute('tenant-1', 'store-1', {
      ...baseInput,
      branchId: 'branch-1',
    });

    expect(entryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1' }),
    );
    expect(lineRepo.save).toHaveBeenCalledWith([
      expect.objectContaining({ branchId: 'branch-1' }),
      expect.objectContaining({ branchId: 'branch-1' }),
    ]);
    expect(result.lines.every((l: any) => l.branchId === 'branch-1')).toBe(true);
  });

  it('leaves branchId null/undefined on the entry and lines when omitted (backward compatible)', async () => {
    const { service, entryRepo, lineRepo } = build();

    const result = await service.execute('tenant-1', 'store-1', baseInput);

    expect(entryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: undefined }),
    );
    expect(lineRepo.save).toHaveBeenCalledWith([
      expect.objectContaining({ branchId: undefined }),
      expect.objectContaining({ branchId: undefined }),
    ]);
    expect(result.lines.every((l: any) => !l.branchId)).toBe(true);
  });
});
