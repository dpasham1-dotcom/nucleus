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
  CheckCircle2,
  Target,
  BookOpen,
  Sparkles,
  Link2,
  Lightbulb,
  Flame,
  UtensilsCrossed,
  MessageSquare,
  Calendar,
  ArrowRight,
  TrendingUp,
  Zap,
  Activity,
  ChevronRight,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Confetti from "@/components/Confetti";

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
  "Progress, not perfection."
];

const MODULE_CONFIGS = {
  habits: { icon: Target, path: "/habits", label: "Habits" },
  tasks: { icon: Calendar, path: "/planner", label: "Planner" },
  calories: { icon: UtensilsCrossed, path: "/calories", label: "Calories" },
  links: { icon: Link2, path: "/links", label: "Link Vault" },
  vocabulary: { icon: BookOpen, path: "/vocabulary", label: "Vocabulary" },
  ideas: { icon: Lightbulb, path: "/ideas", label: "Ideas" },
  bq_practice: { icon: MessageSquare, path: "/bq-practice", label: "BQ Practice" }
};

const ACTIVITY_ICONS = {
  "check-circle": CheckCircle2,
  "check-square": CheckCircle2,
  "utensils": UtensilsCrossed,
  "link": Link2,
  "book-open": BookOpen,
  "lightbulb": Lightbulb
};

// Animated counter component
const AnimatedCounter = ({ value, duration = 1200, suffix = "", className = "", style = {} }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
    if (numValue === 0) { setDisplayValue(0); return; }

    startRef.current = performance.now();
    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(numValue * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span className={className} style={style}>{displayValue}{suffix}</span>;
};

// SVG Progress Ring
const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = "#7C9A6E", label, sublabel }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="opacity-10"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-2xl" style={{ color: 'var(--dashboard-text)' }}>
          <AnimatedCounter value={Math.round(progress)} suffix="%" duration={1500} />
        </span>
        {label && <span className="text-[10px] font-body font-medium opacity-60">{label}</span>}
        {sublabel && <span className="text-[9px] font-body opacity-40">{sublabel}</span>}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [intention, setIntention] = useState("");
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const today = format(new Date(), "yyyy-MM-dd");

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Sun };
    if (hour < 17) return { text: "Good afternoon", icon: Sunset };
    return { text: "Good evening", icon: Moon };
  }

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllData = async () => {
    try {
      const [habitsRes, tasksRes, intentionRes, statsRes, summaryRes, activityRes] = await Promise.all([
        axios.get(`${API}/habits`, { withCredentials: true }),
        axios.get(`${API}/tasks?date=${today}`, { withCredentials: true }),
        axios.get(`${API}/intention/${today}`, { withCredentials: true }),
        axios.get(`${API}/stats`, { withCredentials: true }),
        axios.get(`${API}/dashboard-summary`, { withCredentials: true }).catch(() => ({ data: null })),
        axios.get(`${API}/activity-feed?limit=10`, { withCredentials: true }).catch(() => ({ data: [] }))
      ]);

      setHabits(habitsRes.data);
      setTasks(tasksRes.data);
      setIntention(intentionRes.data.intention || "");
      setStats(statsRes.data);
      setSummary(summaryRes.data);
      setActivities(activityRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabit = async (habit) => {
    const isCompleted = habit.completions?.includes(today);
    try {
      await axios.post(
        `${API}/habits/${habit.habit_id}/toggle`,
        { date: today, completed: !isCompleted, freeze: false },
        { withCredentials: true }
      );
      fetchAllData();
      if (!isCompleted) {
        toast.success("Habit completed! 🎉");
        // Check if all habits are now complete
        const remainingIncomplete = habits.filter(h => 
          !h.completions?.includes(today) && h.habit_id !== habit.habit_id
        ).length;
        if (remainingIncomplete === 0 && habits.length > 1) {
          setShowConfetti(true);
          toast.success("🏆 All habits completed today! Amazing!", { duration: 5000 });
          setTimeout(() => setShowConfetti(false), 4000);
        }
      } else {
        toast.success("Habit unchecked");
      }
    } catch (error) {
      toast.error("Failed to update habit");
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await axios.put(
        `${API}/tasks/${task.task_id}`,
        { completed: !task.completed },
        { withCredentials: true }
      );
      fetchAllData();
      toast.success(task.completed ? "Task reopened" : "Task completed! ✅");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleIntentionChange = async (value) => {
    setIntention(value);
    try {
      await axios.put(
        `${API}/intention/${today}`,
        { intention: value },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error saving intention:", error);
    }
  };

  const todayHabits = habits.map(h => ({
    ...h,
    completed: h.completions?.includes(today) || false
  }));
  const completedHabits = todayHabits.filter(h => h.completed).length;
  const habitProgress = habits.length > 0 ? (completedHabits / habits.length) * 100 : 0;

  const priorityTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      const priorityOrder = { "urgent-important": 0, "important": 1, "urgent": 2, "medium": 3, "neither": 4 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    })
    .slice(0, 5);

  const completedTasks = tasks.filter(t => t.completed).length;

  // Calculate productivity score
  const productivityScore = Math.round(
    (habitProgress * 0.4) +
    (tasks.length > 0 ? (completedTasks / tasks.length) * 100 * 0.35 : 0) +
    (intention ? 15 : 0) +
    (activities.length > 0 ? 10 : 0)
  );

  // Smart tips
  const getSmartTips = () => {
    const tips = [];
    const hour = new Date().getHours();

    if (habits.length > 0 && completedHabits === 0 && hour > 10) {
      tips.push("☀️ You haven't checked off any habits yet — start with the easiest one!");
    }
    if (habits.length > 0 && completedHabits === habits.length) {
      tips.push("🏆 All habits done! You're on fire today.");
    }
    if (tasks.length > 0 && completedTasks === 0 && hour > 12) {
      tips.push("📋 No tasks done yet — try tackling your top priority for 25 minutes.");
    }
    if (!intention && hour < 14) {
      tips.push("🎯 Set your intention for the day to stay focused.");
    }
    if (habits.length > 0 && completedHabits > 0 && completedHabits < habits.length) {
      tips.push(`💪 ${habits.length - completedHabits} habit${habits.length - completedHabits > 1 ? 's' : ''} left — you got this!`);
    }
    if (stats?.habits_streak >= 7) {
      tips.push(`🔥 ${stats.habits_streak}-day streak! Don't break the chain.`);
    }

    return tips.length > 0 ? tips[0] : "✨ Make today count. You're building something special.";
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--gold-accent)', borderTopColor: 'transparent' }} />
          <p className="font-body text-sm opacity-60">Loading your command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="dashboard-page"
      className="p-6 md:p-12 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--dashboard-bg)', minHeight: '100vh' }}
    >
      <Confetti active={showConfetti} />

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-3">
          <GreetingIcon className="w-5 h-5" style={{ color: 'var(--gold-accent)' }} />
          <span className="text-sm font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        <h1
          className="font-heading text-4xl md:text-5xl lg:text-6xl mb-2"
          style={{ color: 'var(--dashboard-text)' }}
        >
          {greeting.text}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="font-body text-base md:text-lg italic" style={{ color: 'var(--dashboard-text)', opacity: 0.4 }}>
          "{quote}"
        </p>
      </motion.div>

      {/* Score + Ring + Tips Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <Card className="nucleus-card border-0 overflow-hidden" style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: `linear-gradient(90deg, var(--gold-accent), #E8D5A3, ${habitProgress === 100 ? '#7C9A6E' : 'var(--gold-accent)'})`
          }} />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Progress Ring */}
              <div className="flex-shrink-0">
                <ProgressRing
                  progress={habitProgress}
                  size={110}
                  strokeWidth={8}
                  color={habitProgress === 100 ? '#7C9A6E' : 'var(--gold-accent)'}
                  label="Habits"
                  sublabel={`${completedHabits}/${habits.length}`}
                />
              </div>

              {/* Intention + Score */}
              <div className="flex-1 w-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(201, 169, 110, 0.1)' }}>
                    <Target className="w-4 h-4" style={{ color: 'var(--gold-accent)' }} />
                  </div>
                  <span className="font-heading text-sm tracking-wider uppercase" style={{ color: 'var(--gold-accent)' }}>
                    Today's Intention
                  </span>
                </div>
                <Input
                  data-testid="daily-intention-input"
                  placeholder="What's your main focus for today?"
                  value={intention}
                  onChange={(e) => handleIntentionChange(e.target.value)}
                  className="border-0 bg-transparent text-xl font-body placeholder:opacity-30 focus-visible:ring-0 p-0"
                  style={{ color: 'var(--dashboard-text)' }}
                />
                {/* Smart Tip */}
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-sm font-body mt-3 px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(201, 169, 110, 0.08)' : 'rgba(201, 169, 110, 0.06)',
                    color: 'var(--dashboard-text)', 
                    opacity: 0.7 
                  }}
                >
                  {getSmartTips()}
                </motion.p>
              </div>

              {/* Productivity Score */}
              <div className="flex-shrink-0 text-center px-4">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4, type: "spring" }}
                >
                  <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center mx-auto mb-2"
                    style={{ 
                      background: productivityScore >= 80 
                        ? 'linear-gradient(135deg, #7C9A6E, #9ABF8A)' 
                        : productivityScore >= 50 
                          ? 'linear-gradient(135deg, var(--gold-accent), #E8D5A3)'
                          : `linear-gradient(135deg, ${isDark ? '#333' : '#E8E0D5'}, ${isDark ? '#444' : '#F0EDE8'})`,
                      color: productivityScore >= 50 ? 'white' : 'var(--dashboard-text)'
                    }}
                  >
                    <AnimatedCounter 
                      value={productivityScore} 
                      className="font-heading text-2xl" 
                      duration={1500}
                    />
                    <span className="text-[9px] font-body opacity-80">score</span>
                  </div>
                  <p className="text-xs font-body opacity-50">Productivity</p>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Module Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg" style={{ color: 'var(--dashboard-text)' }}>
            Your Modules
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(MODULE_CONFIGS).map(([key, config], index) => {
            const moduleData = summary?.modules?.[key] || {};
            const Icon = config.icon;
            const gradient = moduleData.gradient || ['#666', '#999'];

            let mainValue = '';
            let subText = '';

            if (key === 'habits') {
              mainValue = `${moduleData.completed_today || 0}/${moduleData.total || 0}`;
              subText = 'today';
            } else if (key === 'tasks') {
              mainValue = `${moduleData.completed_today || 0}/${moduleData.total || 0}`;
              subText = 'done';
            } else if (key === 'calories') {
              mainValue = moduleData.total_today || 0;
              subText = 'kcal';
            } else {
              mainValue = moduleData.total || 0;
              subText = 'total';
            }

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
              >
                <button
                  onClick={() => navigate(config.path)}
                  className="w-full rounded-2xl p-4 text-left transition-shadow hover:shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                    color: 'white'
                  }}
                >
                  <Icon className="w-5 h-5 mb-3 opacity-80" />
                  <p className="font-heading text-2xl leading-none">{mainValue}</p>
                  <p className="text-xs mt-1 opacity-70 font-body">{subText}</p>
                  <p className="text-[10px] mt-2 font-body font-medium opacity-60 uppercase tracking-wider">
                    {config.label}
                  </p>
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Habits + Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Habits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Card className="nucleus-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-lg flex items-center gap-2" style={{ color: 'var(--dashboard-text)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#7C9A6E20' }}>
                      <CheckCircle2 className="w-4 h-4" style={{ color: '#7C9A6E' }} />
                    </div>
                    Today's Habits
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    {/* Mini progress */}
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: '#7C9A6E' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${habitProgress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <span className="text-xs font-heading" style={{ color: '#7C9A6E' }}>
                        {completedHabits}/{habits.length}
                      </span>
                    </div>
                    <button onClick={() => navigate('/habits')} className="p-1 rounded-full hover:bg-black/5">
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {todayHabits.length === 0 ? (
                  <p className="text-sm font-body py-4 text-center" style={{ color: 'var(--dashboard-text)', opacity: 0.4 }}>
                    No habits yet. Start building your routine!
                  </p>
                ) : (
                  todayHabits.map((habit) => (
                    <motion.div
                      key={habit.habit_id}
                      data-testid={`habit-quick-${habit.habit_id}`}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all cursor-pointer group"
                      onClick={() => handleToggleHabit(habit)}
                      whileTap={{ scale: 0.98 }}
                      style={{ backgroundColor: 'transparent' }}
                      whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                    >
                      <motion.div
                        className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          backgroundColor: habit.completed ? habit.color : 'transparent',
                          border: `2px solid ${habit.color}`
                        }}
                        animate={habit.completed ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {habit.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </motion.div>
                      <span
                        className={`font-body flex-1 transition-all ${habit.completed ? 'line-through opacity-40' : ''}`}
                        style={{ color: 'var(--dashboard-text)' }}
                      >
                        {habit.name}
                      </span>
                      {habit.completed && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs px-2 py-0.5 rounded-full font-body" 
                          style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                        >
                          Done
                        </motion.span>
                      )}
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="nucleus-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-lg flex items-center gap-2" style={{ color: 'var(--dashboard-text)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(201, 169, 110, 0.1)' }}>
                      <Sparkles className="w-4 h-4" style={{ color: 'var(--gold-accent)' }} />
                    </div>
                    Today's Tasks
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
                      {completedTasks}/{tasks.length} done
                    </span>
                    <button onClick={() => navigate('/planner')} className="p-1 rounded-full hover:bg-black/5">
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {priorityTasks.length === 0 && completedTasks === 0 ? (
                  <p className="text-sm font-body py-4 text-center" style={{ color: 'var(--dashboard-text)', opacity: 0.4 }}>
                    No tasks for today. Plan your day!
                  </p>
                ) : (
                  <>
                    {priorityTasks.map((task, index) => {
                      const priorityColors = {
                        "urgent-important": "#EF4444",
                        "important": "#F59E0B",
                        "urgent": "#3B82F6",
                        "medium": "#6B7280",
                        "neither": "#9CA3AF"
                      };
                      const color = priorityColors[task.priority] || '#6B7280';

                      return (
                        <motion.div
                          key={task.task_id}
                          data-testid={`priority-task-${task.task_id}`}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer group"
                          onClick={() => handleToggleTask(task)}
                          whileTap={{ scale: 0.98 }}
                          style={{ backgroundColor: 'transparent' }}
                          whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                        >
                          <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center"
                            style={{ borderColor: color }}>
                            <span className="text-[10px] font-bold" style={{ color }}>{index + 1}</span>
                          </div>
                          <span className="font-body flex-1" style={{ color: 'var(--dashboard-text)' }}>
                            {task.title}
                          </span>
                          {task.estimated_time && (
                            <span className="text-xs opacity-40 font-body">{task.estimated_time}m</span>
                          )}
                        </motion.div>
                      );
                    })}
                    {completedTasks > 0 && (
                      <div className="pt-2 mt-2" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` }}>
                        <p className="text-xs font-body px-3 py-1" style={{ color: 'var(--dashboard-text)', opacity: 0.35 }}>
                          ✓ {completedTasks} task{completedTasks > 1 ? 's' : ''} completed today
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Card className="nucleus-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--gold-accent)' }} />
                  <span className="font-heading text-sm tracking-wider uppercase" style={{ color: 'var(--gold-accent)' }}>
                    All-time Stats
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <StatItem icon={<Flame className="w-5 h-5" />} label="Best Streak" value={stats?.habits_streak || 0} suffix=" days" highlight />
                  <StatItem icon={<Link2 className="w-5 h-5" />} label="Links" value={stats?.links_saved || 0} />
                  <StatItem icon={<BookOpen className="w-5 h-5" />} label="Words" value={stats?.words_collected || 0} />
                  <StatItem icon={<Lightbulb className="w-5 h-5" />} label="Ideas" value={stats?.ideas_captured || 0} />
                  <StatItem icon={<CheckCircle2 className="w-5 h-5" />} label="Tasks Done" value={stats?.tasks_completed || 0} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Activity Feed + Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="nucleus-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2" style={{ color: 'var(--dashboard-text)' }}>
                  <Zap className="w-4 h-4" style={{ color: 'var(--gold-accent)' }} />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {[
                  { label: "Log Meal", icon: UtensilsCrossed, path: "/calories", color: "#4CAF50" },
                  { label: "Add Word", icon: BookOpen, path: "/vocabulary", color: "#9C27B0" },
                  { label: "Save Link", icon: Link2, path: "/links", color: "#2196F3" },
                  { label: "New Idea", icon: Lightbulb, path: "/ideas", color: "#FF9800" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(action.path)}
                      className="flex items-center gap-2 p-3 rounded-xl hover:shadow-md transition-all text-left"
                      style={{ 
                        backgroundColor: isDark ? `${action.color}10` : `${action.color}08`, 
                        border: `1px solid ${isDark ? `${action.color}20` : `${action.color}15`}` 
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${action.color}15` }}>
                        <Icon className="w-4 h-4" style={{ color: action.color }} />
                      </div>
                      <span className="font-body text-sm" style={{ color: 'var(--dashboard-text)' }}>
                        {action.label}
                      </span>
                    </motion.button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="nucleus-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2" style={{ color: 'var(--dashboard-text)' }}>
                  <Activity className="w-4 h-4" style={{ color: 'var(--gold-accent)' }} />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-sm font-body py-6 text-center" style={{ color: 'var(--dashboard-text)', opacity: 0.4 }}>
                    Your activity will show up here
                  </p>
                ) : (
                  <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {activities.slice(0, 15).map((activity, index) => {
                      const IconComp = ACTIVITY_ICONS[activity.icon] || Activity;
                      return (
                        <motion.div
                          key={`${activity.type}-${activity.title}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.03 }}
                          className="flex items-start gap-3 py-2.5 px-2 rounded-lg transition-colors"
                          style={{ backgroundColor: 'transparent' }}
                        >
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `${activity.color}15` }}>
                            <IconComp className="w-3.5 h-3.5" style={{ color: activity.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm truncate" style={{ color: 'var(--dashboard-text)' }}>
                              <span className="capitalize opacity-50">{activity.action}</span>{' '}
                              <span className="font-medium">{activity.title}</span>
                            </p>
                            {activity.subtitle && (
                              <p className="text-xs font-body opacity-40 truncate">{activity.subtitle}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-body opacity-30 flex-shrink-0 mt-1">
                            {activity.date === today ? 'Today' : 
                              (() => {
                                try { return format(new Date(activity.date + 'T00:00:00'), "MMM d"); }
                                catch { return activity.date; }
                              })()
                            }
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ icon, label, value, suffix = "", highlight }) => (
  <div className="text-center">
    <div
      className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
      style={{
        backgroundColor: highlight ? 'var(--gold-accent)' : 'rgba(0,0,0,0.05)',
        color: highlight ? 'white' : 'var(--gold-accent)'
      }}
    >
      {icon}
    </div>
    <p className="font-heading text-2xl" style={{ color: 'var(--dashboard-text)' }}>
      <AnimatedCounter value={value} duration={1200} />
      {suffix && <span className="text-xs ml-1 opacity-50">{suffix}</span>}
    </p>
    <p className="text-xs font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.45 }}>{label}</p>
  </div>
);

export default Dashboard;
