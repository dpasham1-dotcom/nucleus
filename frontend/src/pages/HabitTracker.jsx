import { useState, useEffect, useMemo } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { format, subDays, addDays, startOfDay, differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Flame,
  Snowflake,
  Star,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const HABIT_COLORS = [
  { name: "Sage", value: "#7C9A6E" },
  { name: "Terracotta", value: "#C1714A" },
  { name: "Dusty Mauve", value: "#9A7A9A" },
  { name: "Slate Blue", value: "#5C7A9A" },
  { name: "Warm Stone", value: "#8A7A6A" },
  { name: "Deep Teal", value: "#3D7A7A" },
  { name: "Wheat Gold", value: "#C9A96E" },
  { name: "Muted Navy", value: "#3D5A7A" }
];

const HABIT_GROUPS = ["Morning", "Health", "Career", "Mind", "Evening"];

const MILESTONES = [7, 14, 21, 30, 60, 90];
const MILESTONE_BADGES = {
  7: "Week Warrior",
  14: "Two Weeks Strong",
  21: "21-Day Locked In",
  30: "Monthly Master",
  60: "Halfway There",
  90: "Legend"
};

const STREAK_MESSAGES = {
  1: "You're building something.",
  7: "The habit is taking shape.",
  21: "This is becoming you.",
  30: "You're locked in.",
  60: "Almost legendary.",
  90: "You changed."
};

const HabitTracker = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: "",
    color: "#7C9A6E",
    group: "Morning",
    why_started: ""
  });

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await axios.get(`${API}/habits`, { withCredentials: true });
      setHabits(response.data);
      if (response.data.length > 0 && !selectedHabit) {
        setSelectedHabit(response.data[0]);
      }
    } catch (error) {
      toast.error("Failed to load habits");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) {
      toast.error("Please enter a habit name");
      return;
    }

    try {
      await axios.post(`${API}/habits`, newHabit, { withCredentials: true });
      toast.success("Habit created!");
      setCreateDialogOpen(false);
      setNewHabit({ name: "", color: "#7C9A6E", group: "Morning", why_started: "" });
      fetchHabits();
    } catch (error) {
      toast.error("Failed to create habit");
    }
  };

  const handleUpdateHabit = async () => {
    if (!selectedHabit) return;

    try {
      await axios.put(
        `${API}/habits/${selectedHabit.habit_id}`,
        {
          name: selectedHabit.name,
          color: selectedHabit.color,
          group: selectedHabit.group,
          why_started: selectedHabit.why_started
        },
        { withCredentials: true }
      );
      toast.success("Habit updated!");
      setEditDialogOpen(false);
      fetchHabits();
    } catch (error) {
      toast.error("Failed to update habit");
    }
  };

  const handleDeleteHabit = async () => {
    if (!selectedHabit) return;

    try {
      await axios.delete(`${API}/habits/${selectedHabit.habit_id}`, { withCredentials: true });
      toast.success("Habit deleted");
      setEditDialogOpen(false);
      setSelectedHabit(null);
      fetchHabits();
    } catch (error) {
      toast.error("Failed to delete habit");
    }
  };

  const handleToggleDay = async (dateStr, isFreeze = false) => {
    if (!selectedHabit) return;

    const isCompleted = selectedHabit.completions?.includes(dateStr);
    const isFrozen = selectedHabit.freeze_days?.includes(dateStr);

    try {
      const response = await axios.post(
        `${API}/habits/${selectedHabit.habit_id}/toggle`,
        {
          date: dateStr,
          completed: isFreeze ? false : !isCompleted,
          freeze: isFreeze
        },
        { withCredentials: true }
      );

      setSelectedHabit(response.data);
      setHabits(prev => prev.map(h =>
        h.habit_id === selectedHabit.habit_id ? response.data : h
      ));

      if (isFreeze) {
        toast.success(isFrozen ? "Freeze removed" : "Day frozen ❄️");
      } else {
        toast.success(isCompleted ? "Unchecked" : "Completed! 🎉");
      }
    } catch (error) {
      toast.error("Failed to update habit");
    }
  };

  // Calculate streak
  const calculateStreak = (habit) => {
    if (!habit) return 0;
    const completions = habit.completions || [];
    const freezeDays = habit.freeze_days || [];
    let streak = 0;
    let currentDate = new Date();

    for (let i = 0; i < 90; i++) {
      const dateStr = format(subDays(currentDate, i), "yyyy-MM-dd");
      if (completions.includes(dateStr) || freezeDays.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = selectedHabit ? calculateStreak(selectedHabit) : 0;

  // Get streak message
  const getStreakMessage = (streak) => {
    if (streak >= 90) return STREAK_MESSAGES[90];
    if (streak >= 60) return STREAK_MESSAGES[60];
    if (streak >= 30) return STREAK_MESSAGES[30];
    if (streak >= 21) return STREAK_MESSAGES[21];
    if (streak >= 7) return STREAK_MESSAGES[7];
    return STREAK_MESSAGES[1];
  };

  // Generate 90-day grid dates (oldest to newest, left to right, top to bottom)
  const gridDates = useMemo(() => {
    const dates = [];
    const startDate = subDays(new Date(), 89);
    for (let i = 0; i < 90; i++) {
      dates.push(format(addDays(startDate, i), "yyyy-MM-dd"));
    }
    return dates;
  }, []);

  // Group habits by category
  const groupedHabits = useMemo(() => {
    const groups = {};
    habits.forEach(habit => {
      const group = habit.group || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(habit);
    });
    return groups;
  }, [habits]);

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--habit-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="habit-tracker-page"
      className="p-6 md:p-12 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--habit-bg)', minHeight: '100vh' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1
            className="font-heading text-4xl md:text-5xl mb-2"
            style={{ color: 'var(--habit-text)' }}
          >
            Habit Tracker
          </h1>
          <p className="font-body text-sm" style={{ color: 'var(--habit-text)', opacity: 0.6 }}>
            Building discipline, one day at a time
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="create-habit-btn"
              className="rounded-full px-6 text-white"
              style={{ backgroundColor: 'var(--habit-accent)' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="nucleus-card border-0">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="font-body">Habit Name</Label>
                <Input
                  data-testid="habit-name-input"
                  placeholder="e.g., Morning Reading"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="font-body">Color</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {HABIT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewHabit({ ...newHabit, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${newHabit.color === color.value ? 'ring-2 ring-offset-2 scale-110' : ''
                        }`}
                      style={{
                        backgroundColor: color.value,
                        ringColor: color.value
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="font-body">Group</Label>
                <Select
                  value={newHabit.group}
                  onValueChange={(value) => setNewHabit({ ...newHabit, group: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HABIT_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body">Why I'm Starting (shown on low-streak days)</Label>
                <Textarea
                  placeholder="Remind yourself why this matters..."
                  value={newHabit.why_started}
                  onChange={(e) => setNewHabit({ ...newHabit, why_started: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button
                data-testid="save-habit-btn"
                onClick={handleCreateHabit}
                className="w-full rounded-full text-white"
                style={{ backgroundColor: 'var(--habit-accent)' }}
              >
                Create Habit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Habit List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card className="nucleus-card border-0">
            <CardHeader>
              <CardTitle className="font-heading text-lg" style={{ color: 'var(--habit-text)' }}>
                Your Habits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(groupedHabits).map(([group, groupHabits]) => (
                <div key={group}>
                  <p className="text-xs font-body uppercase tracking-wide mb-2" style={{ color: 'var(--habit-text)', opacity: 0.5 }}>
                    {group}
                  </p>
                  <div className="space-y-2">
                    {groupHabits.map((habit) => (
                      <button
                        key={habit.habit_id}
                        data-testid={`habit-select-${habit.habit_id}`}
                        onClick={() => setSelectedHabit(habit)}
                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${selectedHabit?.habit_id === habit.habit_id
                            ? 'shadow-md'
                            : 'hover:bg-black/5'
                          }`}
                        style={{
                          backgroundColor: selectedHabit?.habit_id === habit.habit_id
                            ? `${habit.color}20`
                            : 'transparent',
                          borderLeft: `3px solid ${habit.color}`
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: habit.color }}
                        />
                        <span className="font-body text-sm" style={{ color: 'var(--habit-text)' }}>
                          {habit.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {habits.length === 0 && (
                <p className="text-sm font-body text-center py-8" style={{ color: 'var(--habit-text)', opacity: 0.5 }}>
                  No habits yet. Create your first one!
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 90-Day Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3"
        >
          {selectedHabit ? (
            <Card className="nucleus-card border-0">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: selectedHabit.color }}
                    />
                    <CardTitle className="font-heading text-2xl" style={{ color: 'var(--habit-text)' }}>
                      {selectedHabit.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditDialogOpen(true)}
                      className="h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm font-body mt-1" style={{ color: 'var(--habit-text)', opacity: 0.6 }}>
                    {getStreakMessage(currentStreak)}
                  </p>
                </div>

                {/* Streak Counter */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: `${selectedHabit.color}20` }}>
                  <Flame className="w-6 h-6" style={{ color: 'var(--habit-streak)' }} />
                  <span className="font-heading text-2xl" style={{ color: 'var(--habit-text)' }}>
                    {currentStreak}
                  </span>
                  <span className="text-sm font-body" style={{ color: 'var(--habit-text)', opacity: 0.6 }}>
                    day streak
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                {/* 90-Day Grid (10x9) */}
                <div className="grid grid-cols-10 gap-1 md:gap-2">
                  {gridDates.map((dateStr, index) => {
                    const isCompleted = selectedHabit.completions?.includes(dateStr);
                    const isFrozen = selectedHabit.freeze_days?.includes(dateStr);
                    const isToday = dateStr === today;
                    const isMilestone = MILESTONES.includes(index + 1);
                    const isFuture = dateStr > today;

                    return (
                      <div
                        key={dateStr}
                        data-testid={`habit-day-${dateStr}`}
                        onClick={() => !isFuture && handleToggleDay(dateStr)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (!isFuture) handleToggleDay(dateStr, true);
                        }}
                        className={`
                          aspect-square rounded-lg cursor-pointer transition-all relative
                          ${isToday ? 'habit-today' : ''}
                          ${isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'}
                        `}
                        style={{
                          backgroundColor: isCompleted
                            ? selectedHabit.color
                            : isFrozen
                              ? '#E8F4FC'
                              : 'var(--habit-empty)',
                          border: isToday ? `2px solid var(--gold-accent)` : 'none'
                        }}
                        title={`${format(new Date(dateStr), 'MMM d')}${isFrozen ? ' (Frozen)' : ''}`}
                      >
                        {isFrozen && (
                          <Snowflake
                            className="absolute inset-0 m-auto w-3 h-3 md:w-4 md:h-4"
                            style={{ color: '#5C7A9A' }}
                          />
                        )}
                        {isMilestone && (
                          <Star
                            className="absolute -top-1 -right-1 w-3 h-3"
                            style={{ color: 'var(--gold-accent)', fill: 'var(--gold-accent)' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-black/5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: selectedHabit.color }}
                    />
                    <span className="text-xs font-body" style={{ color: 'var(--habit-text)' }}>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: 'var(--habit-empty)' }}
                    />
                    <span className="text-xs font-body" style={{ color: 'var(--habit-text)' }}>Empty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center"
                      style={{ backgroundColor: '#E8F4FC' }}
                    >
                      <Snowflake className="w-3 h-3" style={{ color: '#5C7A9A' }} />
                    </div>
                    <span className="text-xs font-body" style={{ color: 'var(--habit-text)' }}>Freeze Day (right-click)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" style={{ color: 'var(--gold-accent)', fill: 'var(--gold-accent)' }} />
                    <span className="text-xs font-body" style={{ color: 'var(--habit-text)' }}>Milestone</span>
                  </div>
                </div>

                {/* Why Started (shown on low streak) */}
                {currentStreak < 7 && selectedHabit.why_started && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-xl"
                    style={{ backgroundColor: `${selectedHabit.color}10` }}
                  >
                    <p className="text-sm font-body italic" style={{ color: 'var(--habit-text)' }}>
                      "{selectedHabit.why_started}"
                    </p>
                    <p className="text-xs font-body mt-2" style={{ color: 'var(--habit-text)', opacity: 0.5 }}>
                      — Why you started
                    </p>
                  </motion.div>
                )}

                {/* Milestone Badges */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {MILESTONES.filter(m => currentStreak >= m).map((milestone) => (
                    <div
                      key={milestone}
                      className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-body"
                      style={{
                        backgroundColor: 'var(--gold-accent)',
                        color: 'white'
                      }}
                    >
                      <Trophy className="w-3 h-3" />
                      {MILESTONE_BADGES[milestone]}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="nucleus-card border-0 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="font-body text-lg" style={{ color: 'var(--habit-text)', opacity: 0.5 }}>
                  Select a habit to view its grid
                </p>
              </div>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="nucleus-card border-0">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Edit Habit</DialogTitle>
          </DialogHeader>
          {selectedHabit && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="font-body">Habit Name</Label>
                <Input
                  value={selectedHabit.name}
                  onChange={(e) => setSelectedHabit({ ...selectedHabit, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="font-body">Color</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {HABIT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedHabit({ ...selectedHabit, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${selectedHabit.color === color.value ? 'ring-2 ring-offset-2 scale-110' : ''
                        }`}
                      style={{
                        backgroundColor: color.value,
                        ringColor: color.value
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="font-body">Group</Label>
                <Select
                  value={selectedHabit.group}
                  onValueChange={(value) => setSelectedHabit({ ...selectedHabit, group: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HABIT_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body">Why I Started</Label>
                <Textarea
                  value={selectedHabit.why_started || ""}
                  onChange={(e) => setSelectedHabit({ ...selectedHabit, why_started: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateHabit}
                  className="flex-1 rounded-full text-white"
                  style={{ backgroundColor: 'var(--habit-accent)' }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteHabit}
                  className="rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HabitTracker;
