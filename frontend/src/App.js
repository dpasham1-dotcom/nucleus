import { useEffect, useState, createContext, useContext, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "framer-motion";

// Pages
import Landing from "@/pages/Landing";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import HabitTracker from "@/pages/HabitTracker";
import DailyPlanner from "@/pages/DailyPlanner";
import LinkVault from "@/pages/LinkVault";
import CalorieTracker from "@/pages/CalorieTracker";
import Vocabulary from "@/pages/Vocabulary";
import Ideas from "@/pages/Ideas";
import BQPractice from "@/pages/BQPractice";
import Settings from "@/pages/Settings";

// Components
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import QuickCapture from "@/components/QuickCapture";
import GlobalSearch from "@/components/GlobalSearch";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--dashboard-bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--gold-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-heading text-lg" style={{ color: 'var(--dashboard-text)' }}>Loading Nucleus...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// Theme Wrapper - sets CSS variables based on current route
const ThemeWrapper = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const path = location.pathname;

    // Reset to defaults first
    root.style.setProperty('--module-bg', 'var(--dashboard-bg)');
    root.style.setProperty('--module-accent', 'var(--dashboard-accent)');
    root.style.setProperty('--module-text', 'var(--dashboard-text)');

    if (path.includes('/habits')) {
      root.style.setProperty('--module-bg', 'var(--habit-bg)');
      root.style.setProperty('--module-accent', 'var(--habit-accent)');
      root.style.setProperty('--module-text', 'var(--habit-text)');
    } else if (path.includes('/planner')) {
      root.style.setProperty('--module-bg', 'var(--planner-bg)');
      root.style.setProperty('--module-accent', 'var(--planner-accent)');
      root.style.setProperty('--module-text', 'var(--dashboard-text)');
    } else if (path.includes('/links')) {
      root.style.setProperty('--module-bg', 'var(--vault-bg)');
      root.style.setProperty('--module-accent', 'var(--vault-accent)');
      root.style.setProperty('--module-text', 'var(--dashboard-text)');
    } else if (path.includes('/vocabulary')) {
      root.style.setProperty('--module-bg', 'var(--vocab-bg)');
      root.style.setProperty('--module-accent', 'var(--vocab-accent)');
      root.style.setProperty('--module-text', 'var(--vocab-text)');
    } else if (path.includes('/ideas')) {
      root.style.setProperty('--module-bg', 'var(--ideas-bg)');
      root.style.setProperty('--module-accent', 'var(--ideas-accent)');
      root.style.setProperty('--module-text', 'var(--dashboard-text)');
    } else if (path.includes('/bq-practice')) {
      root.style.setProperty('--module-bg', 'var(--bq-bg)');
      root.style.setProperty('--module-accent', 'var(--bq-accent)');
      root.style.setProperty('--module-text', 'var(--bq-text)');
    } else if (path.includes('/calories')) {
      root.style.setProperty('--module-bg', 'var(--calorie-bg)');
      root.style.setProperty('--module-accent', 'var(--calorie-accent)');
      root.style.setProperty('--module-text', 'var(--dashboard-text)');
    }

    document.body.style.backgroundColor = getComputedStyle(root).getPropertyValue('--module-bg');
  }, [location.pathname]);

  return children;
};

// App Layout with Sidebar
const AppLayout = ({ children }) => {
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Quick Capture: Press /
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        const isInput = activeElement?.tagName === 'INPUT' || 
                       activeElement?.tagName === 'TEXTAREA' ||
                       activeElement?.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setQuickCaptureOpen(true);
        }
      }
      // Global Search: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--module-bg)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar onQuickCapture={() => setQuickCaptureOpen(true)} />
      </div>

      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav onQuickCapture={() => setQuickCaptureOpen(true)} />
      </div>

      {/* Quick Capture Modal */}
      <QuickCapture 
        open={quickCaptureOpen} 
        onOpenChange={setQuickCaptureOpen} 
      />

      {/* Global Search Modal */}
      <GlobalSearch
        open={globalSearchOpen}
        onOpenChange={setGlobalSearchOpen}
      />

      {/* Floating Quick Capture Button */}
      <button
        data-testid="quick-capture-fab"
        onClick={() => setQuickCaptureOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl font-bold transition-all hover:scale-105 active:scale-95 z-40"
        style={{ backgroundColor: 'var(--gold-accent)' }}
      >
        +
      </button>

      {/* Search shortcut hint */}
      <div className="hidden md:block fixed bottom-8 left-72 text-xs opacity-40 font-body">
        Press <kbd className="px-1.5 py-0.5 rounded bg-black/10 mx-1">⌘K</kbd> to search
      </div>

      {/* Grain Overlay */}
      <div className="grain-overlay" />
    </div>
  );
};

// Main App Router
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <ThemeWrapper>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/habits"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HabitTracker />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/planner"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DailyPlanner />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/links"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LinkVault />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calories"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CalorieTracker />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vocabulary"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Vocabulary />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ideas"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Ideas />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bq-practice"
          element={
            <ProtectedRoute>
              <AppLayout>
                <BQPractice />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeWrapper>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
export { API };
