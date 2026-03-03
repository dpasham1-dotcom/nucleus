import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Target, 
  Calendar, 
  Link2, 
  Plus
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "/habits", icon: Target, label: "Habits" },
  { path: "/planner", icon: Calendar, label: "Planner" },
  { path: "/links", icon: Link2, label: "Links" },
];

const MobileNav = ({ onQuickCapture }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-16 border-t border-black/5 bg-white/80 backdrop-blur-md z-30 flex items-center justify-around px-4"
    >
      {NAV_ITEMS.slice(0, 2).map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1 p-2"
          >
            <Icon 
              className="w-5 h-5"
              style={{ color: isActive ? 'var(--gold-accent)' : 'var(--dashboard-text)' }}
            />
            <span 
              className="text-xs font-body"
              style={{ color: isActive ? 'var(--gold-accent)' : 'var(--dashboard-text)' }}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Center Quick Capture Button */}
      <button
        onClick={onQuickCapture}
        className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg -mt-6"
        style={{ backgroundColor: 'var(--gold-accent)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {NAV_ITEMS.slice(2).map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1 p-2"
          >
            <Icon 
              className="w-5 h-5"
              style={{ color: isActive ? 'var(--gold-accent)' : 'var(--dashboard-text)' }}
            />
            <span 
              className="text-xs font-body"
              style={{ color: isActive ? 'var(--gold-accent)' : 'var(--dashboard-text)' }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
