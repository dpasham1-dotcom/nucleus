import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { useTheme } from "@/App";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  ArrowRight, 
  Target, 
  Calendar, 
  Link2, 
  BookOpen, 
  Lightbulb, 
  UtensilsCrossed,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Flame,
  Zap,
  BarChart3,
  Brain,
  Shield
} from "lucide-react";

const FEATURES = [
  { icon: Target, label: "Habit Tracking", desc: "90-day visual grids with streaks & milestones", color: "#7C9A6E" },
  { icon: Calendar, label: "Daily Planner", desc: "Eisenhower matrix with Pomodoro timer", color: "#D4A574" },
  { icon: UtensilsCrossed, label: "Calorie Tracker", desc: "AI-powered meal estimation & macros", color: "#2D9A6A" },
  { icon: Link2, label: "Link Vault", desc: "Save & organize links by category", color: "#2196F3" },
  { icon: BookOpen, label: "Vocabulary", desc: "Build word mastery with AI definitions", color: "#9C27B0" },
  { icon: Lightbulb, label: "Ideas Capture", desc: "Kanban board with AI expansion", color: "#FF9800" },
  { icon: MessageSquare, label: "BQ Practice", desc: "STAR method interview prep with AI feedback", color: "#607D8B" },
  { icon: Sparkles, label: "AI Powered", desc: "Smart insights across all modules", color: "#C9A96E" },
];

const HIGHLIGHTS = [
  { icon: CheckCircle2, text: "Track habits with 90-day visual grids" },
  { icon: Flame, text: "Build streaks that keep you motivated" },
  { icon: Zap, text: "Pomodoro timer built into your planner" },
  { icon: BarChart3, text: "AI-powered calorie estimation" },
  { icon: Brain, text: "Smart weekly reviews of your progress" },
  { icon: Shield, text: "Your data, your control — export anytime" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -60]);

  if (!loading && user) {
    navigate("/home", { replace: true });
    return null;
  }

  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/home';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen mesh-gradient"
    >
      {/* === HERO SECTION === */}
      <motion.div 
        className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
        style={{ opacity: heroOpacity, y: heroY }}
      >
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full"
            style={{ 
              background: isDark 
                ? 'radial-gradient(circle, rgba(201, 169, 110, 0.08), transparent)' 
                : 'radial-gradient(circle, rgba(201, 169, 110, 0.06), transparent)' 
            }}
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full"
            style={{ 
              background: isDark 
                ? 'radial-gradient(circle, rgba(124, 154, 110, 0.08), transparent)' 
                : 'radial-gradient(circle, rgba(124, 154, 110, 0.06), transparent)' 
            }}
            animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
            style={{ 
              background: isDark 
                ? 'radial-gradient(circle, rgba(201, 169, 110, 0.04), transparent)' 
                : 'radial-gradient(circle, rgba(201, 169, 110, 0.03), transparent)' 
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
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
            <motion.div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-heading text-3xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)' }}
              animate={{ rotate: [0, -2, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              N
            </motion.div>
          </motion.div>

          <h1
            className="font-heading text-6xl md:text-7xl lg:text-8xl mb-4"
          >
            <span className="gradient-text">Nucleus</span>
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
            whileHover={{ scale: 1.03, boxShadow: '0 20px 50px rgba(201, 169, 110, 0.3)' }}
            whileTap={{ scale: 0.97 }}
            className="py-4 px-10 rounded-full flex items-center justify-center gap-3 font-body font-medium text-lg transition-all shadow-lg mx-auto shimmer-btn relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--gold-accent), #E8D5A3, var(--gold-accent))',
              backgroundSize: '200% auto',
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

        {/* Floating Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 max-w-5xl mx-auto w-full relative z-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.07 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`p-5 rounded-2xl text-center transition-all cursor-default ${index % 2 === 0 ? 'float-card' : 'float-card-delayed'}`}
                  style={{ 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)', 
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                    animationDelay: `${index * 0.5}s`,
                    boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.04)'
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
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

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full flex items-start justify-center pt-2"
            style={{ border: `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}` }}
          >
            <motion.div 
              className="w-1.5 h-3 rounded-full"
              style={{ backgroundColor: 'var(--gold-accent)' }}
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* === WHY NUCLEUS SECTION === */}
      <div className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl md:text-5xl mb-4" style={{ color: 'var(--dashboard-text)' }}>
              Everything you need,{' '}
              <span className="gradient-text">one place</span>
            </h2>
            <p className="text-lg font-body max-w-lg mx-auto" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
              Stop switching between 10 apps. Nucleus brings your habits, tasks, ideas, and growth into a single command center.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HIGHLIGHTS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(201, 169, 110, 0.1)' }}>
                    <Icon className="w-5 h-5" style={{ color: 'var(--gold-accent)' }} />
                  </div>
                  <p className="font-body text-sm" style={{ color: 'var(--dashboard-text)', opacity: 0.8 }}>
                    {item.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* === CTA SECTION === */}
      <div className="py-24 px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-heading text-4xl shadow-xl mx-auto mb-8"
            style={{ background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)' }}>
            N
          </div>
          <h2 className="font-heading text-3xl md:text-4xl mb-4" style={{ color: 'var(--dashboard-text)' }}>
            Ready to <span className="gradient-text">take control</span>?
          </h2>
          <p className="font-body text-lg mb-8" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
            Your future self will thank you for starting today.
          </p>
          <motion.button
            onClick={handleLogin}
            whileHover={{ scale: 1.03, boxShadow: '0 20px 50px rgba(201, 169, 110, 0.3)' }}
            whileTap={{ scale: 0.97 }}
            className="py-4 px-12 rounded-full font-body font-medium text-lg shadow-lg shimmer-btn"
            style={{
              background: 'linear-gradient(135deg, var(--gold-accent), #E8D5A3, var(--gold-accent))',
              backgroundSize: '200% auto',
              color: 'white'
            }}
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 inline ml-2" />
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="py-8 px-6 text-center" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
        <p
          className="text-xs font-body"
          style={{ color: 'var(--dashboard-text)', opacity: 0.25 }}
        >
          Reduce friction · Capture everything · Build habits
        </p>
        <p className="text-xs font-body mt-1" style={{ color: 'var(--dashboard-text)', opacity: 0.15 }}>
          Nucleus — Made with care
        </p>
      </div>

      {/* Grain Overlay */}
      <div className="grain-overlay" />
    </div>
  );
};

export default Landing;
