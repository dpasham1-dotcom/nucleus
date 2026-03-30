import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { useTheme } from "@/App";
import { motion } from "framer-motion";
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
  Plus,
  Sun,
  Moon,
  Flame
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Home", color: "#C9A96E" },
  { path: "/habits", icon: Target, label: "Habits", color: "#7C9A6E" },
  { path: "/planner", icon: Calendar, label: "Planner", color: "#D4A574" },
  { path: "/links", icon: Link2, label: "Link Vault", color: "#2196F3" },
  { path: "/vocabulary", icon: BookOpen, label: "Vocabulary", color: "#9C27B0" },
  { path: "/ideas", icon: Lightbulb, label: "Ideas", color: "#FF9800" },
  { path: "/bq-practice", icon: MessageSquare, label: "BQ Practice", color: "#607D8B" },
  { path: "/calories", icon: UtensilsCrossed, label: "Calories", color: "#4CAF50" },
];

const Sidebar = ({ onQuickCapture }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Calculate a simple "days active" streak from localStorage
  const getLoginStreak = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = JSON.parse(localStorage.getItem('nucleus_login_streak') || '{"dates":[],"streak":0}');
      if (!stored.dates.includes(today)) {
        stored.dates.push(today);
        // Keep only last 90 days
        stored.dates = stored.dates.slice(-90);
        // Calculate consecutive days
        let streak = 1;
        for (let i = stored.dates.length - 2; i >= 0; i--) {
          const curr = new Date(stored.dates[i + 1]);
          const prev = new Date(stored.dates[i]);
          const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
          if (diffDays <= 1) {
            streak++;
          } else {
            break;
          }
        }
        stored.streak = streak;
        localStorage.setItem('nucleus_login_streak', JSON.stringify(stored));
      }
      return stored.streak || 1;
    } catch {
      return 1;
    }
  };

  const loginStreak = getLoginStreak();

  return (
    <aside 
      className="fixed left-0 top-0 h-full w-64 z-30 flex flex-col"
      style={{ 
        backgroundColor: isDark ? 'rgba(15, 15, 15, 0.95)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
      }}
    >
      <div className="flex flex-col h-full px-4 py-6">
        {/* Logo + Streak */}
        <div className="mb-5 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-heading text-sm"
                style={{ background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)' }}>
                N
              </div>
              <h1 className="font-heading text-xl" style={{ color: 'var(--dashboard-text)' }}>
                Nucleus
              </h1>
            </div>
            {/* Login Streak Badge */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.1)' }}
            >
              <Flame className={`w-3.5 h-3.5 ${loginStreak >= 3 ? 'flame-active' : ''}`} style={{ color: '#D97706' }} />
              <span className="text-xs font-bold font-body" style={{ color: '#D97706' }}>{loginStreak}</span>
            </motion.div>
          </div>
        </div>

        {/* Quick Capture Button */}
        <button
          data-testid="sidebar-quick-capture"
          onClick={onQuickCapture}
          className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 mb-2 text-white font-body text-sm font-medium transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
          style={{ 
            background: 'linear-gradient(135deg, var(--gold-accent), #E8D5A3)',
          }}
        >
          <Plus className="w-4 h-4" />
          Quick Capture
        </button>

        {/* Keyboard shortcut hint */}
        <p className="text-[10px] font-body text-center mb-4 opacity-30" style={{ color: 'var(--dashboard-text)' }}>
          Press <kbd className="px-1 py-0.5 rounded mx-0.5 font-mono" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>/</kbd> to capture
        </p>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                data-testid={`nav-${item.path.slice(1)}`}
                onClick={() => navigate(item.path)}
                className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-all group relative ${isActive ? 'nav-active-glow' : ''}`}
                style={{
                  backgroundColor: isActive ? `${item.color}12` : 'transparent',
                  color: isActive ? item.color : 'var(--dashboard-text)',
                }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                    style={{ backgroundColor: item.color }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isActive ? `${item.color}20` : 'transparent',
                  }}
                >
                  <Icon className="w-[18px] h-[18px] transition-all" 
                    style={{ 
                      color: isActive ? item.color : 'var(--dashboard-text)',
                      opacity: isActive ? 1 : 0.5
                    }}
                  />
                </div>
                <span className={`font-body text-sm ${isActive ? 'font-medium' : ''}`} 
                  style={{ opacity: isActive ? 1 : 0.7 }}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="pt-4 space-y-1" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` }}>
          {/* Dark Mode Toggle */}
          <button
            data-testid="dark-mode-toggle"
            onClick={toggleTheme}
            className="w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-all"
            style={{ 
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'transparent',
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(234, 179, 8, 0.15)' : 'rgba(0,0,0,0.04)' }}>
              {isDark ? (
                <Sun className="w-[18px] h-[18px]" style={{ color: '#EAB308' }} />
              ) : (
                <Moon className="w-[18px] h-[18px] opacity-50" style={{ color: 'var(--dashboard-text)' }} />
              )}
            </div>
            <span className="font-body text-sm opacity-70" style={{ color: 'var(--dashboard-text)' }}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          <button
            data-testid="nav-settings"
            onClick={() => navigate("/settings")}
            className="w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-all"
            style={{ backgroundColor: location.pathname === '/settings' ? 'var(--subtle-hover)' : 'transparent' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Settings className="w-[18px] h-[18px] opacity-50" style={{ color: 'var(--dashboard-text)' }} />
            </div>
            <span className="font-body text-sm opacity-70" style={{ color: 'var(--dashboard-text)' }}>Settings</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
            style={{ backgroundColor: 'transparent' }}>
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name}
                className="w-9 h-9 rounded-full ring-2 shadow-sm"
                style={{ ringColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' }}
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                style={{ background: 'linear-gradient(135deg, var(--gold-accent), #E8D5A3)' }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm truncate font-medium" style={{ color: 'var(--dashboard-text)' }}>
                {user?.name}
              </p>
              <p className="font-body text-[10px] truncate" style={{ color: 'var(--dashboard-text)', opacity: 0.4 }}>
                {user?.email}
              </p>
            </div>
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors group"
              style={{ backgroundColor: 'transparent' }}
              title="Logout"
            >
              <LogOut className="w-4 h-4 opacity-30 group-hover:opacity-70 group-hover:text-red-500 transition-all" style={{ color: 'var(--dashboard-text)' }} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
