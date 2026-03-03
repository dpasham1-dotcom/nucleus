import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Sun,
  CheckCircle2,
  Target,
  BookOpen,
  Sparkles,
  Link2,
  Lightbulb,
  Flame
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const [intention, setIntention] = useState("");
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    habits_streak: 0,
    tasks_completed: 0,
    ideas_captured: 0,
    words_collected: 0,
    links_saved: 0
  });
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [habitsRes, tasksRes, intentionRes, statsRes] = await Promise.all([
        axios.get(`${API}/habits`, { withCredentials: true }),
        axios.get(`${API}/tasks?date=${today}`, { withCredentials: true }),
        axios.get(`${API}/intention/${today}`, { withCredentials: true }),
        axios.get(`${API}/stats`, { withCredentials: true })
      ]);

      setHabits(habitsRes.data);
      setTasks(tasksRes.data);
      setIntention(intentionRes.data.intention || "");
      setStats(statsRes.data);
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
      fetchDashboardData();
      toast.success(isCompleted ? "Habit unchecked" : "Habit completed!");
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
      fetchDashboardData();
      toast.success(task.completed ? "Task marked incomplete" : "Task completed!");
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

  // Calculate habit completion for today
  const todayHabits = habits.map(h => ({
    ...h,
    completed: h.completions?.includes(today) || false
  }));
  const completedHabits = todayHabits.filter(h => h.completed).length;
  const habitProgress = habits.length > 0 ? (completedHabits / habits.length) * 100 : 0;

  // Get top 3 priority tasks
  const priorityTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      const priorityOrder = { "urgent-important": 0, "important": 1, "urgent": 2, "medium": 3, "neither": 4 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    })
    .slice(0, 3);

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[var(--gold-accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div
      data-testid="dashboard-page"
      className="p-6 md:p-12 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--dashboard-bg)', minHeight: '100vh' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Sun className="w-6 h-6" style={{ color: 'var(--gold-accent)' }} />
          <span className="text-sm font-body" style={{ color: 'var(--dashboard-text-secondary)' }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        <h1
          className="font-heading text-4xl md:text-5xl"
          style={{ color: 'var(--dashboard-text)' }}
        >
          {greeting}, {user?.name?.split(' ')[0]}
        </h1>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {/* Daily Intention - Spans 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-2 lg:col-span-3"
        >
          <Card className="nucleus-card h-full border-0">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2" style={{ color: 'var(--dashboard-text)' }}>
                <Target className="w-5 h-5" style={{ color: 'var(--gold-accent)' }} />
                Daily Intention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                data-testid="daily-intention-input"
                placeholder="Today I want to..."
                value={intention}
                onChange={(e) => handleIntentionChange(e.target.value)}
                className="border-0 bg-transparent text-lg font-body placeholder:opacity-40 focus-visible:ring-0 p-0"
                style={{ color: 'var(--dashboard-text)' }}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Habit Progress Ring - Spans 1 column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="md:col-span-2 lg:col-span-3"
        >
          <Card className="nucleus-card h-full border-0">
            <CardContent className="p-6 flex items-center gap-6">
              {/* Progress Ring */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#EBE8E3"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="var(--gold-accent)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${habitProgress * 2.136} 213.6`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-heading text-xl" style={{ color: 'var(--dashboard-text)' }}>
                    {completedHabits}/{habits.length}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-heading text-lg" style={{ color: 'var(--dashboard-text)' }}>Today's Habits</p>
                <p className="text-sm font-body" style={{ color: 'var(--dashboard-text-secondary)' }}>
                  {habits.length === 0 ? "No habits yet" : `${completedHabits} completed`}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Habits - Spans 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:col-span-2 lg:col-span-3"
        >
          <Card className="nucleus-card h-full border-0">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2" style={{ color: 'var(--dashboard-text)' }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--gold-accent)' }} />
                Today's Habits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayHabits.length === 0 ? (
                <p className="text-sm font-body" style={{ color: 'var(--dashboard-text-secondary)' }}>
                  No habits yet. Add some in the Habit Tracker!
                </p>
              ) : (
                todayHabits.slice(0, 4).map((habit) => (
                  <div
                    key={habit.habit_id}
                    data-testid={`habit-quick-${habit.habit_id}`}
                    className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-black/5 cursor-pointer"
                    onClick={() => handleToggleHabit(habit)}
                  >
                    <Checkbox
                      checked={habit.completed}
                      onCheckedChange={() => handleToggleHabit(habit)}
                      className="border-2"
                      style={{
                        borderColor: habit.color,
                        backgroundColor: habit.completed ? habit.color : 'transparent'
                      }}
                    />
                    <span
                      className={`font-body ${habit.completed ? 'line-through opacity-60' : ''}`}
                      style={{ color: 'var(--dashboard-text)' }}
                    >
                      {habit.name}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Priorities - Spans 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="md:col-span-2 lg:col-span-3"
        >
          <Card className="nucleus-card h-full border-0">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2" style={{ color: 'var(--dashboard-text)' }}>
                <Sparkles className="w-5 h-5" style={{ color: 'var(--gold-accent)' }} />
                Today's Priorities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {priorityTasks.length === 0 ? (
                <p className="text-sm font-body" style={{ color: 'var(--dashboard-text-secondary)' }}>
                  No tasks for today. Add some in the Planner!
                </p>
              ) : (
                priorityTasks.map((task, index) => (
                  <div
                    key={task.task_id}
                    data-testid={`priority-task-${task.task_id}`}
                    className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-black/5 cursor-pointer"
                    onClick={() => handleToggleTask(task)}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium text-white"
                      style={{ backgroundColor: 'var(--gold-accent)' }}
                    >
                      {index + 1}
                    </span>
                    <span className="font-body" style={{ color: 'var(--dashboard-text)' }}>
                      {task.title}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Strip - Full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="md:col-span-4 lg:col-span-6"
        >
          <Card className="nucleus-card border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <StatItem
                  icon={<Flame className="w-5 h-5" />}
                  label="Habit Streak"
                  value={stats.habits_streak}
                  suffix="days"
                  highlight
                />
                <StatItem
                  icon={<Link2 className="w-5 h-5" />}
                  label="Links Saved"
                  value={stats.links_saved}
                />
                <StatItem
                  icon={<BookOpen className="w-5 h-5" />}
                  label="Words Collected"
                  value={stats.words_collected}
                />
                <StatItem
                  icon={<Lightbulb className="w-5 h-5" />}
                  label="Ideas Captured"
                  value={stats.ideas_captured}
                />
                <StatItem
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  label="Tasks Done"
                  value={stats.tasks_completed}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

const StatItem = ({ icon, label, value, suffix, highlight }) => (
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
      {value}
      {suffix && <span className="text-sm ml-1 opacity-60">{suffix}</span>}
    </p>
    <p className="text-xs font-body" style={{ color: 'var(--dashboard-text-secondary)' }}>{label}</p>
  </div>
);

export default Dashboard;
