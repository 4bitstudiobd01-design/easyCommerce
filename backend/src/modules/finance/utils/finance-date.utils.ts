/**
 * Timezone-safe date utilities for BitCommerce Finance Module.
 * Avoids .toISOString().split('T')[0] off-by-one shifts in non-UTC timezones (e.g. GMT+6).
 */

export function getLocalTodayYmd(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const mStr = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    startDate: `${year}-${mStr}-01`,
    endDate: `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function resolveTimezoneSafeDateRange(dto: {
  period?: string;
  startDate?: string;
  endDate?: string;
}): {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
} {
  // 1. Custom explicit date range
  if (dto.startDate && dto.endDate) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    return {
      startDate: dto.startDate,
      endDate: dto.endDate,
      previousStartDate: getLocalTodayYmd(prevStart),
      previousEndDate: getLocalTodayYmd(prevEnd),
    };
  }

  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth(); // 0-11
  const month = monthIndex + 1; // 1-12

  // 2. Last Month
  if (dto.period === 'last_month') {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const currentRange = getMonthDateRange(prevYear, prevMonth);

    const prevPrevMonth = prevMonth === 1 ? 12 : prevMonth - 1;
    const prevPrevYear = prevMonth === 1 ? prevYear - 1 : prevYear;
    const prevRange = getMonthDateRange(prevPrevYear, prevPrevMonth);

    return {
      startDate: currentRange.startDate,
      endDate: currentRange.endDate,
      previousStartDate: prevRange.startDate,
      previousEndDate: prevRange.endDate,
    };
  }

  // 3. This Quarter
  if (dto.period === 'this_quarter') {
    const quarter = Math.floor(monthIndex / 3); // 0, 1, 2, 3
    const qStartMonth = quarter * 3 + 1;
    const qEndMonth = (quarter + 1) * 3;
    const lastDay = new Date(year, qEndMonth, 0).getDate();

    const startDate = formatYmd(year, qStartMonth, 1);
    const endDate = formatYmd(year, qEndMonth, lastDay);

    const prevQYear = quarter === 0 ? year - 1 : year;
    const prevQ = quarter === 0 ? 3 : quarter - 1;
    const pStartMonth = prevQ * 3 + 1;
    const pEndMonth = (prevQ + 1) * 3;
    const pLastDay = new Date(prevQYear, pEndMonth, 0).getDate();

    return {
      startDate,
      endDate,
      previousStartDate: formatYmd(prevQYear, pStartMonth, 1),
      previousEndDate: formatYmd(prevQYear, pEndMonth, pLastDay),
    };
  }

  // 4. This Year
  if (dto.period === 'this_year') {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      previousStartDate: `${year - 1}-01-01`,
      previousEndDate: `${year - 1}-12-31`,
    };
  }

  // 5. Default: this_month
  const currentMonthRange = getMonthDateRange(year, month);
  const pMonth = month === 1 ? 12 : month - 1;
  const pYear = month === 1 ? year - 1 : year;
  const prevMonthRange = getMonthDateRange(pYear, pMonth);

  return {
    startDate: currentMonthRange.startDate,
    endDate: currentMonthRange.endDate,
    previousStartDate: prevMonthRange.startDate,
    previousEndDate: prevMonthRange.endDate,
  };
}
