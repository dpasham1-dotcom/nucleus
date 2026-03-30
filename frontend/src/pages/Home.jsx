import { useState, useEffect, useRef } from "react";
import { useAuth, API } from "@/App";
import { useTheme } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  Sunset,
  Target,
  Calendar,
  Link2,
  BookOpen,
  Lightbulb,
  UtensilsCrossed,
  MessageSquare,
  Flame,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Small daily improvements lead to stunning results.",
  "What you do today can improve all your tomorrows.",
  "Focus on being productive instead of busy.",
  "Success is the sum of small efforts repeated daily.",
  "Don't watch the clock; do what it does. Keep going.",
  "The only way to do great work is to love what you do.",
  "Your future self will thank you for the work you put in today.",
  "Discipline is choosing between what you want now and what you want most.",
  "Progress, not perfection.",
  "You don't have to be extreme, just consistent.",
  "The best time to start was yesterday. The next best time is now.",
  "A year from now you'll wish you had started today."
];

const MODULES = [
  { 
    key: "habits", icon: Target, label: "Habit Tracker", 
    desc: "Build your streak", path: "/habits",
    gradient: ["#7C9A6E", "#5A7A4E"], emoji: "🎯"
  },
  { 
    key: "planner", icon: Calendar, label: "Daily Planner", 
    desc: "Own your day", path: "/planner",
    gradient: ["#C9A96E", "#A88A4E"], emoji: "📅"
  },
  { 
    key: "calories", icon: UtensilsCrossed, label: "Calorie Tracker", 
    desc: "Fuel your body", path: "/calories",
    gradient: ["#2D9A6A", "#1D7A5A"], emoji: "🍽"
  },
  { 
    key: "vocabulary", icon: BookOpen, label: "Vocabulary", 
    desc: "Expand your mind", path: "/vocabulary",
    gradient: ["#8A3D2C", "#6A2D1C"], emoji: "📖"
  },
  { 
    key: "ideas", icon: Lightbulb, label: "Ideas", 
    desc: "Capture everything", path: "/ideas",
    gradient: ["#F59E0B", "#D97706"], emoji: "💡"
  },
  { 
    key: "links", icon: Link2, label: "Link Vault", 
    desc: "Your knowledge base", path: "/links",
    gradient: ["#3D5A7A", "#2D4A6A"], emoji: "🔗"
  },
  { 
    key: "bq", icon: MessageSquare, label: "BQ Practice", 
    desc: "Ace every interview", path: "/bq-practice",
    gradient: ["#607D8B", "#455A64"], emoji: "🎤"
  },
  {
    key: "dashboard", icon: BarChart3, label: "Dashboard",
    desc: "See your full picture", path: "/dashboard",
    gradient: ["#9A7A9A", "#7A5A7A"], emoji: "📊"
  }
];

const Home = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [intention, setIntention] = useState("");
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const today = format(new Date(), "yyyy-MM-dd");

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Sun, period: "morning" };
    if (hour < 17) return { text: "Good afternoon", icon: Sunset, period: "afternoon" };
    return { text: "Good evening", icon: Moon, period: "evening" };
  }

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [intentionRes, statsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/intention/${today}`, { withCredentials: true }).catch(() => ({ data: {} })),
        axios.get(`${API}/stats`, { withCredentials: true }).catch(() => ({ data: {} })),
        axios.get(`${API}/dashboard-summary`, { withCredentials: true }).catch(() => ({ data: null }))
      ]);
      setIntention(intentionRes.data.intention || "");
      setStats(statsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Error fetching home data:", error);
    }
  };

  const handleIntentionChange = async (value) => {
    setIntention(value);
    try {
      await axios.put(`${API}/intention/${today}`, { intention: value }, { withCredentials: true });
    } catch (error) {
      console.error("Error saving intention:", error);
    }
  };

  // Get a quick stat for a module
  const getModuleStat = (key) => {
    if (!summary?.modules) return null;
    const mod = summary.modules;
    switch (key) {
      case "habits":
        return mod.habits ? `${mod.habits.completed_today || 0}/${mod.habits.total || 0} today` : null;
      case "planner":
        return mod.tasks ? `${mod.tasks.completed_today || 0} done` : null;
      case "calories":
        return mod.calories ? `${mod.calories.total_today || 0} kcal` : null;
      case "vocabulary":
        return mod.vocabulary ? `${mod.vocabulary.total || 0} words` : null;
      case "ideas":
        return mod.ideas ? `${mod.ideas.total || 0} captured` : null;
      case "links":
        return mod.links ? `${mod.links.total || 0} saved` : null;
      default:
        return null;
    }
  };

  // Day progress (rough % of waking hours 6am-11pm)
  const getDayProgress = () => {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    const wakeStart = 6, wakeEnd = 23;
    if (hours < wakeStart) return 0;
    if (hours > wakeEnd) return 100;
    return Math.round(((hours - wakeStart) / (wakeEnd - wakeStart)) * 100);
  };

  const dayProgress = getDayProgress();

  return (
    <div
      data-testid="home-page"
      className="min-h-screen"
      style={{ backgroundColor: 'var(--dashboard-bg)' }}
    >
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <div className="relative overflow-hidden">
        {/* Ambient gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(201, 169, 110, 0.06), transparent 70%)'
                : 'radial-gradient(circle, rgba(201, 169, 110, 0.08), transparent 70%)'
            }}
            animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(124, 154, 110, 0.05), transparent 70%)'
                : 'radial-gradient(circle, rgba(124, 154, 110, 0.06), transparent 70%)'
            }}
            animate={{ scale: [1, 1.15, 1], y: [0, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 px-6 md:px-12 pt-12 pb-6 max-w-6xl mx-auto">
          {/* Date pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              }}>
              <GreetingIcon className="w-4 h-4" style={{ color: 'var(--gold-accent)' }} />
              <span className="text-sm font-body font-medium" style={{ color: 'var(--dashboard-text)', opacity: 0.6 }}>
                {format(new Date(), "EEEE, MMMM d")}
              </span>
            </div>

            {/* Day progress pill */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-full"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
              <div className="w-16 h-1.5 rounded-full overflow-hidden" 
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: 'var(--gold-accent)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${dayProgress}%` }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </div>
              <span className="text-xs font-body opacity-40">{dayProgress}% of day</span>
            </div>
          </motion.div>

          {/* Big greeting */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl mb-3 leading-tight"
              style={{ color: 'var(--dashboard-text)' }}>
              {greeting.text},
              <br />
              <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>
            </h1>
          </motion.div>

          {/* Quote */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-body text-lg md:text-xl italic max-w-xl mb-10"
            style={{ color: 'var(--dashboard-text)', opacity: 0.35 }}
          >
            "{quote}"
          </motion.p>

          {/* Intention */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-xl mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--gold-accent)' }} />
              <span className="text-xs font-body uppercase tracking-widest font-semibold" style={{ color: 'var(--gold-accent)' }}>
                Today's Intention
              </span>
            </div>
            <Input
              data-testid="home-intention-input"
              placeholder="What's your one focus for today?"
              value={intention}
              onChange={(e) => handleIntentionChange(e.target.value)}
              className="border-0 bg-transparent text-2xl md:text-3xl font-heading placeholder:opacity-20 focus-visible:ring-0 p-0 h-auto"
              style={{ color: 'var(--dashboard-text)' }}
            />
            <div className="w-16 h-0.5 mt-4 rounded-full" style={{ backgroundColor: 'var(--gold-accent)', opacity: 0.3 }} />
          </motion.div>
        </div>
      </div>

      {/* ═══════════════ QUICK STATS STRIP ═══════════════ */}
      {stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="px-6 md:px-12 max-w-6xl mx-auto mb-10"
        >
          <div className="flex items-center gap-6 md:gap-10 py-4 overflow-x-auto hide-scrollbar">
            {[
              { icon: Flame, label: "Streak", value: stats.habits_streak || 0, unit: "days", color: "#D97706" },
              { icon: Target, label: "Habits Built", value: stats.total_habits || 0, unit: "", color: "#7C9A6E" },
              { icon: BookOpen, label: "Words Learned", value: stats.words_collected || 0, unit: "", color: "#8A3D2C" },
              { icon: TrendingUp, label: "Tasks Done", value: stats.tasks_completed || 0, unit: "", color: "#C9A96E" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="flex items-center gap-3 flex-shrink-0"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}12` }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="font-heading text-xl leading-none" style={{ color: 'var(--dashboard-text)' }}>
                      {stat.value}
                      {stat.unit && <span className="text-xs ml-1 opacity-50 font-body">{stat.unit}</span>}
                    </p>
                    <p className="text-[10px] font-body uppercase tracking-wider opacity-40">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══════════════ MODULE GRID ═══════════════ */}
      <div className="px-6 md:px-12 max-w-6xl mx-auto pb-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-body uppercase tracking-widest font-semibold" style={{ color: 'var(--gold-accent)' }}>
              Your Modules
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MODULES.map((mod, index) => {
            const Icon = mod.icon;
            const stat = getModuleStat(mod.key);

            return (
              <motion.button
                key={mod.key}
                data-testid={`home-module-${mod.key}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.55 + index * 0.06 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(mod.path)}
                className="relative group rounded-2xl p-6 text-left overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${mod.gradient[0]}, ${mod.gradient[1]})`,
                  minHeight: '160px'
                }}
              >
                {/* Shine overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/10 group-hover:via-white/5 group-hover:to-white/0 transition-all duration-500 rounded-2xl" />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4 backdrop-blur-sm">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-heading text-lg text-white leading-tight mb-1">
                      {mod.label}
                    </h3>
                    <p className="text-xs font-body text-white/60">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {stat && (
                      <span className="text-xs font-body text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
                        {stat}
                      </span>
                    )}
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center ml-auto group-hover:bg-white/20 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════ FOOTER TAGLINE ═══════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center pb-12 px-6"
      >
        <div className="w-8 h-0.5 mx-auto mb-4 rounded-full" style={{ backgroundColor: 'var(--gold-accent)', opacity: 0.2 }} />
        <p className="text-xs font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.2 }}>
          Nucleus — Your personal command center
        </p>
      </motion.div>
    </div>
  );
};

export default Home;
