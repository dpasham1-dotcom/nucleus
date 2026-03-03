import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { 
  LayoutDashboard, 
  Target, 
  Calendar, 
  Link2, 
  BookOpen, 
  Lightbulb, 
  MessageSquare,
  UtensilsCrossed,
  Settings,
  LogOut,
  Plus
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/habits", icon: Target, label: "Habits" },
  { path: "/planner", icon: Calendar, label: "Planner" },
  { path: "/links", icon: Link2, label: "Link Vault", badge: true },
  { path: "/vocabulary", icon: BookOpen, label: "Vocabulary" },
  { path: "/ideas", icon: Lightbulb, label: "Ideas" },
  { path: "/bq-practice", icon: MessageSquare, label: "BQ Practice" },
  { path: "/calories", icon: UtensilsCrossed, label: "Calories" },
];

const Sidebar = ({ onQuickCapture }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <aside 
      className="fixed left-0 top-0 h-full w-64 border-r border-black/5 bg-white/50 backdrop-blur-md z-30"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
    >
      <div className="flex flex-col h-full p-6">
        {/* Logo */}
        <div className="mb-8">
          <h1 
            className="font-heading text-2xl"
            style={{ color: 'var(--dashboard-text)' }}
          >
            Nucleus
          </h1>
          <div 
            className="w-8 h-1 rounded-full mt-2"
            style={{ backgroundColor: 'var(--gold-accent)' }}
          />
        </div>

        {/* Quick Capture Button */}
        <button
          data-testid="sidebar-quick-capture"
          onClick={onQuickCapture}
          className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 mb-6 text-white font-body font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: 'var(--gold-accent)' }}
        >
          <Plus className="w-4 h-4" />
          Quick Capture
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                data-testid={`nav-${item.path.slice(1)}`}
                onClick={() => navigate(item.path)}
                className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 transition-all ${
                  isActive 
                    ? 'shadow-md' 
                    : 'hover:bg-black/5'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--gold-accent)' : 'transparent',
                  color: isActive ? 'white' : 'var(--dashboard-text)'
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-body">{item.label}</span>
                {item.badge && (
                  <span 
                    className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: isActive ? 'white' : 'var(--gold-accent)',
                      color: isActive ? 'var(--gold-accent)' : 'white'
                    }}
                  >
                    4
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="pt-6 border-t border-black/5">
          <button
            data-testid="nav-settings"
            onClick={() => navigate("/settings")}
            className="w-full py-3 px-4 rounded-xl flex items-center gap-3 hover:bg-black/5 transition-all"
          >
            <Settings className="w-5 h-5" style={{ color: 'var(--dashboard-text)' }} />
            <span className="font-body" style={{ color: 'var(--dashboard-text)' }}>Settings</span>
          </button>

          <div className="flex items-center gap-3 mt-4 px-4">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: 'var(--gold-accent)' }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm truncate" style={{ color: 'var(--dashboard-text)' }}>
                {user?.name}
              </p>
              <p className="font-body text-xs truncate" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
                {user?.email}
              </p>
            </div>
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" style={{ color: 'var(--dashboard-text)' }} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
