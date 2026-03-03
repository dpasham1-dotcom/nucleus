import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { format, addDays, subDays } from "date-fns";
import { motion } from "framer-motion";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  Target,
  Trash2,
  GripVertical,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const PRIORITY_COLORS = {
  "urgent-important": { bg: "#2C3E2D", label: "Do First" },
  "important": { bg: "#5C7A9A", label: "Schedule" },
  "urgent": { bg: "#C1714A", label: "Delegate" },
  "neither": { bg: "#8A7A6A", label: "Eliminate" }
};

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6; // 6 AM to 10 PM
  return `${hour.toString().padStart(2, '0')}:00`;
});

const DailyPlanner = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [brainDump, setBrainDump] = useState([]);
  const [intention, setIntention] = useState("");
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    estimated_time: 30,
    priority: "important",
    scheduled_time: "none",
    tags: []
  });
  const [newDumpItem, setNewDumpItem] = useState("");

  // Pomodoro State
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes
  const [pomodoroTask, setPomodoroTask] = useState(null);
  const [isBreak, setIsBreak] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    fetchDayData();
  }, [dateStr]);

  // Pomodoro Timer
  useEffect(() => {
    let interval;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      if (isBreak) {
        toast.success("Break over! Ready for another session?");
        setPomodoroTime(25 * 60);
        setIsBreak(false);
      } else {
        toast.success("Great work! Take a 5-minute break.");
        setPomodoroTime(5 * 60);
        setIsBreak(true);
      }
      setPomodoroActive(false);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroTime, isBreak]);

  const fetchDayData = async () => {
    try {
      const [tasksRes, dumpRes, intentionRes] = await Promise.all([
        axios.get(`${API}/tasks?date=${dateStr}`, { withCredentials: true }),
        axios.get(`${API}/brain-dump?date=${dateStr}`, { withCredentials: true }),
        axios.get(`${API}/intention/${dateStr}`, { withCredentials: true })
      ]);

      setTasks(tasksRes.data);
      setBrainDump(dumpRes.data);
      setIntention(intentionRes.data.intention || "");
    } catch (error) {
      console.error("Error fetching day data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      const taskToCreate = { 
        ...newTask, 
        date: dateStr,
        scheduled_time: newTask.scheduled_time === "none" ? null : newTask.scheduled_time
      };
      
      await axios.post(
        `${API}/tasks`,
        taskToCreate,
        { withCredentials: true }
      );
      toast.success("Task created!");
      setCreateDialogOpen(false);
      setNewTask({
        title: "",
        estimated_time: 30,
        priority: "important",
        scheduled_time: "none",
        tags: []
      });
      fetchDayData();
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await axios.put(
        `${API}/tasks/${task.task_id}`,
        { completed: !task.completed },
        { withCredentials: true }
      );
      fetchDayData();
      toast.success(task.completed ? "Task reopened" : "Task completed!");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`, { withCredentials: true });
      fetchDayData();
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleAddBrainDump = async () => {
    if (!newDumpItem.trim()) return;

    try {
      await axios.post(
        `${API}/brain-dump`,
        { text: newDumpItem, date: dateStr },
        { withCredentials: true }
      );
      setNewDumpItem("");
      fetchDayData();
    } catch (error) {
      toast.error("Failed to add item");
    }
  };

  const handleDeleteDumpItem = async (itemId) => {
    try {
      await axios.delete(`${API}/brain-dump/${itemId}`, { withCredentials: true });
      fetchDayData();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleIntentionChange = async (value) => {
    setIntention(value);
    try {
      await axios.put(
        `${API}/intention/${dateStr}`,
        { intention: value },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error saving intention:", error);
    }
  };

  // Group tasks by priority for Eisenhower Matrix
  const matrixTasks = {
    "urgent-important": tasks.filter(t => t.priority === "urgent-important"),
    "important": tasks.filter(t => t.priority === "important"),
    "urgent": tasks.filter(t => t.priority === "urgent"),
    "neither": tasks.filter(t => t.priority === "neither")
  };

  // Tasks with scheduled time
  const scheduledTasks = tasks.filter(t => t.scheduled_time);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
        <div 
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--planner-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div 
      data-testid="daily-planner-page"
      className="p-6 md:p-12 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--planner-bg)', minHeight: '100vh' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 
              className="font-heading text-4xl md:text-5xl mb-2"
              style={{ color: 'var(--dashboard-text)' }}
            >
              Daily Planner
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-body text-lg" style={{ color: 'var(--dashboard-text)' }}>
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </span>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="create-task-btn"
                  className="rounded-full px-6 text-white"
                  style={{ backgroundColor: 'var(--planner-accent)' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="nucleus-card border-0">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="font-body">Task Title</Label>
                    <Input
                      data-testid="task-title-input"
                      placeholder="What needs to be done?"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-body">Estimated Time (min)</Label>
                      <Input
                        type="number"
                        value={newTask.estimated_time}
                        onChange={(e) => setNewTask({ ...newTask, estimated_time: parseInt(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="font-body">Priority</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PRIORITY_COLORS).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="font-body">Scheduled Time (optional)</Label>
                    <Select
                      value={newTask.scheduled_time}
                      onValueChange={(value) => setNewTask({ ...newTask, scheduled_time: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific time</SelectItem>
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    data-testid="save-task-btn"
                    onClick={handleCreateTask}
                    className="w-full rounded-full text-white"
                    style={{ backgroundColor: 'var(--planner-accent)' }}
                  >
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Daily Intention + Pomodoro */}
        <div className="space-y-6">
          {/* Daily Intention */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="nucleus-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2" style={{ color: 'var(--dashboard-text)' }}>
                  <Target className="w-5 h-5" style={{ color: 'var(--gold-accent)' }} />
                  Today's Intention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  data-testid="planner-intention-input"
                  placeholder="Today I want to..."
                  value={intention}
                  onChange={(e) => handleIntentionChange(e.target.value)}
                  className="border-0 bg-transparent text-lg font-body placeholder:opacity-40 focus-visible:ring-0 p-0"
                  style={{ color: 'var(--dashboard-text)' }}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Pomodoro Timer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="nucleus-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2" style={{ color: 'var(--dashboard-text)' }}>
                  <Clock className="w-5 h-5" style={{ color: 'var(--planner-pomodoro)' }} />
                  Pomodoro Timer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p 
                    className="font-heading text-5xl mb-4"
                    style={{ color: isBreak ? 'var(--habit-accent)' : 'var(--planner-pomodoro)' }}
                  >
                    {formatTime(pomodoroTime)}
                  </p>
                  <p className="text-sm font-body mb-4" style={{ color: 'var(--dashboard-text)', opacity: 0.6 }}>
                    {isBreak ? "Break Time" : pomodoroTask ? pomodoroTask.title : "Select a task"}
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      data-testid="pomodoro-toggle-btn"
                      onClick={() => setPomodoroActive(!pomodoroActive)}
                      className="rounded-full"
                      style={{ backgroundColor: 'var(--planner-pomodoro)', color: 'white' }}
                    >
                      {pomodoroActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {pomodoroActive ? "Pause" : "Start"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPomodoroTime(25 * 60);
                        setPomodoroActive(false);
                        setIsBreak(false);
                      }}
                      className="rounded-full"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Brain Dump */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="nucleus-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg" style={{ color: 'var(--dashboard-text)' }}>
                  Brain Dump
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    data-testid="brain-dump-input"
                    placeholder="Dump your thoughts..."
                    value={newDumpItem}
                    onChange={(e) => setNewDumpItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddBrainDump()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddBrainDump}
                    size="icon"
                    className="rounded-full"
                    style={{ backgroundColor: 'var(--planner-accent)', color: 'white' }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {brainDump.map((item) => (
                    <div
                      key={item.item_id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-black/5 group"
                    >
                      <GripVertical className="w-4 h-4 opacity-30" />
                      <span className="flex-1 text-sm font-body" style={{ color: 'var(--dashboard-text)' }}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleDeleteDumpItem(item.item_id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                  {brainDump.length === 0 && (
                    <p className="text-sm font-body text-center py-4" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
                      Empty your mind here
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Middle Column - Eisenhower Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="nucleus-card border-0 h-full">
            <CardHeader>
              <CardTitle className="font-heading text-lg" style={{ color: 'var(--dashboard-text)' }}>
                Priority Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Urgent + Important */}
                <div 
                  className="p-4 rounded-xl min-h-[200px]"
                  style={{ backgroundColor: `${PRIORITY_COLORS["urgent-important"].bg}10` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PRIORITY_COLORS["urgent-important"].bg }}
                    />
                    <span className="text-sm font-body font-medium" style={{ color: 'var(--dashboard-text)' }}>
                      Do First
                    </span>
                  </div>
                  <div className="space-y-2">
                    {matrixTasks["urgent-important"].map((task) => (
                      <TaskCard 
                        key={task.task_id} 
                        task={task} 
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                        onPomodoro={() => {
                          setPomodoroTask(task);
                          setPomodoroTime(task.estimated_time ? task.estimated_time * 60 : 25 * 60);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Important */}
                <div 
                  className="p-4 rounded-xl min-h-[200px]"
                  style={{ backgroundColor: `${PRIORITY_COLORS["important"].bg}10` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PRIORITY_COLORS["important"].bg }}
                    />
                    <span className="text-sm font-body font-medium" style={{ color: 'var(--dashboard-text)' }}>
                      Schedule
                    </span>
                  </div>
                  <div className="space-y-2">
                    {matrixTasks["important"].map((task) => (
                      <TaskCard 
                        key={task.task_id} 
                        task={task} 
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                        onPomodoro={() => {
                          setPomodoroTask(task);
                          setPomodoroTime(task.estimated_time ? task.estimated_time * 60 : 25 * 60);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Urgent */}
                <div 
                  className="p-4 rounded-xl min-h-[200px]"
                  style={{ backgroundColor: `${PRIORITY_COLORS["urgent"].bg}10` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PRIORITY_COLORS["urgent"].bg }}
                    />
                    <span className="text-sm font-body font-medium" style={{ color: 'var(--dashboard-text)' }}>
                      Delegate
                    </span>
                  </div>
                  <div className="space-y-2">
                    {matrixTasks["urgent"].map((task) => (
                      <TaskCard 
                        key={task.task_id} 
                        task={task} 
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                        onPomodoro={() => {
                          setPomodoroTask(task);
                          setPomodoroTime(task.estimated_time ? task.estimated_time * 60 : 25 * 60);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Neither */}
                <div 
                  className="p-4 rounded-xl min-h-[200px]"
                  style={{ backgroundColor: `${PRIORITY_COLORS["neither"].bg}10` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PRIORITY_COLORS["neither"].bg }}
                    />
                    <span className="text-sm font-body font-medium" style={{ color: 'var(--dashboard-text)' }}>
                      Eliminate
                    </span>
                  </div>
                  <div className="space-y-2">
                    {matrixTasks["neither"].map((task) => (
                      <TaskCard 
                        key={task.task_id} 
                        task={task} 
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                        onPomodoro={() => {
                          setPomodoroTask(task);
                          setPomodoroTime(task.estimated_time ? task.estimated_time * 60 : 25 * 60);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Task count summary */}
              <div className="mt-6 pt-4 border-t border-black/5 flex justify-between items-center">
                <p className="text-sm font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.6 }}>
                  {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
                </p>
                <div className="flex gap-2">
                  {Object.entries(PRIORITY_COLORS).map(([key, { bg, label }]) => (
                    <div key={key} className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: bg }}
                      />
                      <span className="text-xs font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.6 }}>
                        {matrixTasks[key].length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onToggle, onDelete, onPomodoro }) => (
  <div
    data-testid={`task-card-${task.task_id}`}
    className={`p-3 rounded-lg bg-white/80 backdrop-blur-sm flex items-start gap-3 group transition-all ${
      task.completed ? 'opacity-60' : ''
    }`}
  >
    <Checkbox
      checked={task.completed}
      onCheckedChange={() => onToggle(task)}
      className="mt-0.5"
    />
    <div className="flex-1 min-w-0">
      <p 
        className={`text-sm font-body ${task.completed ? 'line-through' : ''}`}
        style={{ color: 'var(--dashboard-text)' }}
      >
        {task.title}
      </p>
      {task.estimated_time && (
        <p className="text-xs font-body mt-1" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
          ~{task.estimated_time} min
        </p>
      )}
    </div>
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={onPomodoro}
        className="p-1 rounded hover:bg-black/5"
        title="Start Pomodoro"
      >
        <Play className="w-3 h-3" style={{ color: 'var(--planner-pomodoro)' }} />
      </button>
      <button
        onClick={() => onDelete(task.task_id)}
        className="p-1 rounded hover:bg-black/5"
      >
        <Trash2 className="w-3 h-3 text-red-500" />
      </button>
    </div>
  </div>
);

export default DailyPlanner;
