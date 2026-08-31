import { Lead } from '../types/crm.types';
import { formatCrmDate } from './formatDate';

export type FollowUpFilterType = 'ALL' | 'MISSED' | 'TODAY' | 'TOMORROW' | 'UPCOMING' | 'CUSTOM';

export interface FollowUpInfo {
  category: 'MISSED' | 'TODAY' | 'TOMORROW' | 'UPCOMING' | 'NONE';
  isMissed: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  isUpcoming: boolean;
  label: string;
  formattedDate: string;
  badgeClasses: string;
  cardClasses: string;
}

export function getFollowUpInfo(nextFollowUpAt?: string | Date | null, stage?: string): FollowUpInfo {
  if (!nextFollowUpAt) {
    return {
      category: 'NONE',
      isMissed: false,
      isToday: false,
      isTomorrow: false,
      isUpcoming: false,
      label: 'None',
      formattedDate: '',
      badgeClasses: 'bg-slate-100 text-slate-600 border-slate-200',
      cardClasses: 'bg-white border-slate-200',
    };
  }

  const d = typeof nextFollowUpAt === 'string' ? new Date(nextFollowUpAt) : nextFollowUpAt;
  const now = new Date();

  // If already contacted, won, or lost, it is not considered missed
  const isClosedOrContacted = stage === 'CONTACTED' || stage === 'WON' || stage === 'LOST';

  const isPast = d.getTime() < now.getTime();
  const isMissed = isPast && !isClosedOrContacted;

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(todayMidnight.getDate() + 1);
  const dayAfterTomorrowMidnight = new Date(todayMidnight);
  dayAfterTomorrowMidnight.setDate(todayMidnight.getDate() + 2);

  const targetDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const isToday = targetDateOnly.getTime() === todayMidnight.getTime();
  const isTomorrow = targetDateOnly.getTime() === tomorrowMidnight.getTime();
  const isUpcoming = d.getTime() >= dayAfterTomorrowMidnight.getTime();

  const formattedDate = formatCrmDate(d, { showTime: true });

  if (isMissed) {
    // Calculate how long ago it was missed
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let timeAgo = '';
    if (diffDays > 0) {
      timeAgo = `${diffDays}d ago`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours}h ago`;
    } else {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      timeAgo = `${diffMins}m ago`;
    }

    return {
      category: 'MISSED',
      isMissed: true,
      isToday,
      isTomorrow: false,
      isUpcoming: false,
      label: `Missed (${timeAgo})`,
      formattedDate,
      badgeClasses: 'bg-rose-100 text-rose-800 border-rose-200/90 ring-1 ring-rose-300/50',
      cardClasses: 'bg-rose-50/70 border-rose-300/90 text-rose-950 shadow-rose-100/50 hover:border-rose-400',
    };
  }

  if (isToday) {
    return {
      category: 'TODAY',
      isMissed: false,
      isToday: true,
      isTomorrow: false,
      isUpcoming: false,
      label: `Today (${formatCrmDate(d, { showTime: true }).split(', ')[1] || 'Today'})`,
      formattedDate,
      badgeClasses: 'bg-amber-100 text-amber-900 border-amber-200/90',
      cardClasses: 'bg-amber-50/50 border-amber-300/80 text-amber-950 hover:border-amber-400',
    };
  }

  if (isTomorrow) {
    return {
      category: 'TOMORROW',
      isMissed: false,
      isToday: false,
      isTomorrow: true,
      isUpcoming: false,
      label: `Tomorrow (${formatCrmDate(d, { showTime: true }).split(', ')[1] || 'Tomorrow'})`,
      formattedDate,
      badgeClasses: 'bg-blue-100 text-blue-800 border-blue-200/90',
      cardClasses: 'bg-blue-50/40 border-blue-200 text-slate-900 hover:border-blue-300',
    };
  }

  return {
    category: 'UPCOMING',
    isMissed: false,
    isToday: false,
    isTomorrow: false,
    isUpcoming: true,
    label: formattedDate,
    formattedDate,
    badgeClasses: 'bg-slate-100 text-slate-700 border-slate-200',
    cardClasses: 'bg-white border-slate-200 text-slate-900 hover:border-slate-300',
  };
}

export function getFollowUpCounts(leads: Lead[]) {
  let total = 0;
  let missed = 0;
  let today = 0;
  let tomorrow = 0;
  let upcoming = 0;

  for (const lead of leads) {
    if (!lead.nextFollowUpAt) continue;
    total++;
    const info = getFollowUpInfo(lead.nextFollowUpAt, lead.stage);
    if (info.isMissed) {
      missed++;
    } else if (info.isToday) {
      today++;
    } else if (info.isTomorrow) {
      tomorrow++;
    } else if (info.isUpcoming) {
      upcoming++;
    }
  }

  return { total, missed, today, tomorrow, upcoming };
}

export function filterFollowUpLeads(
  leads: Lead[],
  filter: FollowUpFilterType,
  customDate?: string,
  searchQuery?: string,
): Lead[] {
  let followUpLeads = leads.filter((l) => Boolean(l.nextFollowUpAt));

  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    followUpLeads = followUpLeads.filter((l) => {
      const nameMatch = l.name?.toLowerCase().includes(q);
      const phoneMatch = l.phone?.toLowerCase().includes(q);
      const companyMatch = l.companyName?.toLowerCase().includes(q);
      const noteMatch = l.followUpNote?.toLowerCase().includes(q);
      const emailMatch = l.email?.toLowerCase().includes(q);
      return nameMatch || phoneMatch || companyMatch || noteMatch || emailMatch;
    });
  }

  if (filter === 'ALL') {
    return followUpLeads;
  }

  if (filter === 'MISSED') {
    return followUpLeads.filter((l) => getFollowUpInfo(l.nextFollowUpAt, l.stage).isMissed);
  }

  if (filter === 'TODAY') {
    return followUpLeads.filter((l) => {
      const info = getFollowUpInfo(l.nextFollowUpAt, l.stage);
      return info.isToday && !info.isMissed;
    });
  }

  if (filter === 'TOMORROW') {
    return followUpLeads.filter((l) => getFollowUpInfo(l.nextFollowUpAt, l.stage).isTomorrow);
  }

  if (filter === 'UPCOMING') {
    return followUpLeads.filter((l) => getFollowUpInfo(l.nextFollowUpAt, l.stage).isUpcoming);
  }

  if (filter === 'CUSTOM' && customDate) {
    return followUpLeads.filter((l) => {
      if (!l.nextFollowUpAt) return false;
      const d = new Date(l.nextFollowUpAt);
      const isoDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      return isoDate === customDate;
    });
  }

  return followUpLeads;
}
