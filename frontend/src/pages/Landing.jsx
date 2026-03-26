import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Target, 
  Calendar, 
  Link2, 
  BookOpen, 
  Lightbulb, 
  UtensilsCrossed,
  MessageSquare,
  Sparkles
} from "lucide-react";

const FEATURES = [
  { icon: Target, label: "Habit Tracking", desc: "90-day visual grids with streaks" },
  { icon: Calendar, label: "Daily Planner", desc: "Time-blocking with AI prioritization" },
  { icon: UtensilsCrossed, label: "Calorie Tracker", desc: "AI-powered meal estimation" },
  { icon: Link2, label: "Link Vault", desc: "Save & organize all your links" },
  { icon: BookOpen, label: "Vocabulary", desc: "Build your word mastery" },
  { icon: Lightbulb, label: "Ideas Capture", desc: "Never lose a thought again" },
  { icon: MessageSquare, label: "BQ Practice", desc: "STAR method interview prep" },
  { icon: Sparkles, label: "AI Powered", desc: "Smart insights across modules" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--dashboard-bg)' }}
    >
      {/* Hero Section */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, var(--gold-accent), transparent)' }} />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #7C9A6E, transparent)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.02]"
            style={{ background: 'radial-gradient(circle, var(--gold-accent), transparent)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl relative z-10"
        >
          {/* Logo Mark */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-heading text-2xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)' }}>
              N
            </div>
          </motion.div>

          <h1
            className="font-heading text-6xl md:text-7xl lg:text-8xl mb-4"
            style={{ color: 'var(--dashboard-text)' }}
          >
            Nucleus
          </h1>

          <p
            className="text-xl md:text-2xl font-body mb-3 max-w-xl mx-auto"
            style={{ color: 'var(--dashboard-text)', opacity: 0.6 }}
          >
            Your personal command center & second brain
          </p>

          <p
            className="text-sm font-body mb-12 max-w-md mx-auto"
            style={{ color: 'var(--dashboard-text)', opacity: 0.35 }}
          >
            Track habits, plan your day, capture ideas, build vocabulary, log meals — all in one beautiful space.
          </p>

          {/* Login Button */}
          <motion.button
            data-testid="google-login-btn"
            onClick={handleLogin}
            whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(201, 169, 110, 0.25)' }}
            whileTap={{ scale: 0.97 }}
            className="py-4 px-10 rounded-full flex items-center justify-center gap-3 font-body font-medium text-lg transition-all shadow-lg mx-auto"
            style={{
              background: 'linear-gradient(135deg, var(--gold-accent), #E8D5A3)',
              color: 'white'
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 max-w-4xl mx-auto w-full relative z-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.06 }}
                  className="p-4 rounded-2xl text-center transition-all hover:shadow-md"
                  style={{ backgroundColor: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(201, 169, 110, 0.1)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: 'var(--gold-accent)' }} />
                  </div>
                  <p className="font-heading text-sm mb-1" style={{ color: 'var(--dashboard-text)' }}>
                    {feature.label}
                  </p>
                  <p className="text-xs font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.4 }}>
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-16 text-center text-xs font-body mb-8"
          style={{ color: 'var(--dashboard-text)', opacity: 0.25 }}
        >
          Reduce friction · Capture everything · Build habits
        </motion.p>
      </div>

      {/* Grain Overlay */}
      <div className="grain-overlay" />
    </div>
  );
};

export default Landing;
