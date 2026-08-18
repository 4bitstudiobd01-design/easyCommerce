import { PieChart } from 'lucide-react';
import { WidgetCard } from '../core/WidgetCard';
import { ROLE_DISTRIBUTION, ADMIN_USER_STATS } from '../../data/admin-users.mock';

export function RoleDistributionCard() {
  const donutGradient = (() => {
    let cursor = 0;
    const stops = ROLE_DISTRIBUTION.map(({ percent, color }) => {
      const start = cursor;
      cursor += percent;
      return `${color} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  })();

  return (
    <WidgetCard title="Role Distribution" icon={PieChart}>
      <div className="flex items-center gap-5">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundImage: donutGradient }}
        >
          <div className="w-14 h-14 rounded-full bg-white flex flex-col items-center justify-center">
            <span className="text-base font-black text-blue-950 leading-none">{ADMIN_USER_STATS.total.value}</span>
            <span className="text-[9px] font-bold text-slate-400 mt-0.5">Total Users</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          {ROLE_DISTRIBUTION.map((r) => (
            <div key={r.role} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                <span className="font-semibold text-slate-600 truncate">{r.role}</span>
              </span>
              <span className="font-bold text-slate-900 shrink-0">
                {r.count} <span className="text-slate-400 font-medium">({r.percent}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
