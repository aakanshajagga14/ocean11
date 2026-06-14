import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { STITCH } from '../../constants/stitchAssets';

const NAV = [
  { to: '/', label: 'Live Map' },
  { to: '/investigations', label: 'Investigations' },
  { to: '/reports', label: 'Reports' },
  { to: '/alerts', label: 'Alerts' },
] as const;

export const Navbar = memo(function Navbar() {
  const location = useLocation();
  const isReports = location.pathname === '/reports';
  const isAlerts = location.pathname === '/alerts';

  return (
    <header className="flex justify-between items-center bg-[#051424] px-6 py-3">
      <div className="flex shrink-0 items-center">
        <img src={isReports || isAlerts ? STITCH.logoAlt : STITCH.logo} alt="" className="w-8 h-8 mr-4 object-fill" />
        <div className="flex flex-col shrink-0 items-start mr-[11px]">
          <span className="text-[#FFB690] text-2xl font-bold">Ocean11</span>
          <span className={`text-[#E0C0B1] ${isReports || isAlerts ? 'text-base' : 'text-sm'}`}>
            Maritime Intelligence
          </span>
        </div>
      </div>

      <nav className="flex shrink-0 items-center gap-8">
        {NAV.map(({ to, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`text-sm transition ${
                active
                  ? 'text-[#FFB690] font-bold'
                  : 'text-[#E0C0B1] hover:text-[#D4E4FA]'
              } ${isReports || isAlerts ? 'text-base' : ''}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-5">
        {isReports && (
          <button
            type="button"
            className="flex items-center bg-[#0D1C2D] text-left py-[5px] px-4 rounded border border-solid border-[#584237] gap-4"
          >
            <span className="text-[#D4E4FA] text-sm">Search reports...</span>
            <img src={STITCH.reportSearch} alt="" className="w-6 h-6 object-fill" />
          </button>
        )}
        {!isReports && (
          <>
            <img src={STITCH.search} alt="" className="w-6 h-6 object-fill" />
            <img src={STITCH.bell} alt="" className="w-6 h-6 object-fill" />
          </>
        )}
        <button
          type="button"
          className="flex flex-col shrink-0 items-start bg-[#273647] text-left py-[3px] px-[1px] rounded-xl border border-solid border-[#584237]"
        >
          <img src={STITCH.avatar} alt="" className="w-6 h-6 rounded-xl object-fill" />
        </button>
      </div>
    </header>
  );
});
