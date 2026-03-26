import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Plus,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  Sun,
  Moon,
  Apple,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "lunch", label: "Lunch", icon: Sun },
  { id: "dinner", label: "Dinner", icon: Moon },
  { id: "snack", label: "Snack", icon: Apple },
];

const DAILY_GOALS = {
  calories: 2000,
  protein: 50,
  carbs: 250,
  fat: 65
};

const CalorieTracker = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [recentMeals, setRecentMeals] = useState([]);
  const [weekSummary, setWeekSummary] = useState([]);
  const [dailyWeight, setDailyWeight] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLog, setNewLog] = useState({ description: "", meal_type: "breakfast" });
  const [estimating, setEstimating] = useState(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    fetchDayData();
    fetchRecentMeals();
    fetchWeekSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  const fetchRecentMeals = async () => {
    try {
      const response = await axios.get(`${API}/calories/recent-meals`, { withCredentials: true });
      if (Array.isArray(response.data)) {
        setRecentMeals(response.data);
      }
    } catch (e) { console.error(e) }
  };

  const fetchWeekSummary = async () => {
    try {
      const response = await axios.get(`${API}/calories/week-summary`, { withCredentials: true });
      if (Array.isArray(response.data)) {
        setWeekSummary(response.data.map(d => ({
          ...d,
          displayDate: format(new Date(d.date), "MMM d")
        })));
      }
    } catch (e) { console.error(e) }
  };

  const fetchDayData = async () => {
    try {
      const response = await axios.get(`${API}/calories/daily-summary/${dateStr}`, { withCredentials: true });
      setSummary(response.data);
      setLogs(response.data.logs || []);
      setDailyWeight(response.data.weight ? response.data.weight.toString() : "");
    } catch (error) {
      console.error("Error fetching calorie data:", error);
      setLogs([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLog = async () => {
    if (!newLog.description.trim()) {
      toast.error("Please describe what you ate");
      return;
    }

    try {
      const response = await axios.post(`${API}/calories`,
        { ...newLog, date: dateStr },
        { withCredentials: true }
      );
      toast.success("Meal logged!");
      setCreateDialogOpen(false);
      setNewLog({ description: "", meal_type: "meal" });
      fetchDayData();

      // Auto-trigger AI estimation
      handleEstimate(response.data.log_id);
    } catch (error) {
      toast.error("Failed to log meal");
    }
  };

  const handleEstimate = async (logId) => {
    setEstimating(logId);
    try {
      await axios.post(`${API}/calories/${logId}/estimate`, {}, { withCredentials: true });
      fetchDayData();
      toast.success("Calories estimated!");
    } catch (error) {
      toast.error("Failed to estimate calories");
    } finally {
      setEstimating(null);
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      await axios.delete(`${API}/calories/${logId}`, { withCredentials: true });
      fetchDayData();
      toast.success("Log deleted");
    } catch (error) {
      toast.error("Failed to delete log");
    }
  };

  const getMealIcon = (mealType) => {
    const meal = MEAL_TYPES.find(m => m.id === mealType);
    return meal ? meal.icon : UtensilsCrossed;
  };

  const calorieProgress = summary ? (summary.total_calories / DAILY_GOALS.calories) * 100 : 0;
  const proteinProgress = summary ? (summary.total_protein / DAILY_GOALS.protein) * 100 : 0;
  const carbsProgress = summary ? (summary.total_carbs / DAILY_GOALS.carbs) * 100 : 0;
  const fatProgress = summary ? (summary.total_fat / DAILY_GOALS.fat) * 100 : 0;

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--calorie-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div data-testid="calorie-tracker-page" className="p-6 md:p-12 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--calorie-bg)', minHeight: '100vh' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl mb-2" style={{ color: 'var(--dashboard-text)' }}>
              Calorie Tracker
            </h1>
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedDate(d => new Date(d.getTime() - 86400000))}
                className="p-2 rounded-full hover:bg-black/5 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-body text-lg" style={{ color: 'var(--dashboard-text)' }}>
                {format(selectedDate, "EEEE, MMMM d")}
              </span>
              <button onClick={() => setSelectedDate(d => new Date(d.getTime() + 86400000))}
                className="p-2 rounded-full hover:bg-black/5 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="log-meal-btn" className="rounded-full px-6 text-white"
                style={{ backgroundColor: 'var(--calorie-accent)' }}>
                <Plus className="w-4 h-4 mr-2" /> Log Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="nucleus-card border-0">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Log a Meal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>What did you eat?</Label>
                  <Textarea data-testid="meal-description-input"
                    placeholder="e.g., rice and dal with a small roti, glass of buttermilk"
                    value={newLog.description}
                    onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                    className="mt-1" rows={3} />
                  
                  {Array.isArray(recentMeals) && recentMeals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-xs font-medium opacity-60 w-full mb-1">Recent Meals:</span>
                      {recentMeals.slice(0, 5).map(meal => (
                        <button key={meal._id} onClick={() => setNewLog({ ...newLog, description: meal._id, meal_type: meal.meal_type })}
                          className="text-xs px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-left max-w-full truncate"
                        >
                          {meal._id}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs mt-1 opacity-60">
                    Be descriptive for better AI estimation
                  </p>
                </div>
                <div>
                  <Label>Meal Type</Label>
                  <Select value={newLog.meal_type} onValueChange={(v) => setNewLog({ ...newLog, meal_type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map(meal => (
                        <SelectItem key={meal.id} value={meal.id}>{meal.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button data-testid="save-meal-btn" onClick={handleCreateLog}
                  className="w-full rounded-full text-white" style={{ backgroundColor: 'var(--calorie-accent)' }}>
                  <Sparkles className="w-4 h-4 mr-2" /> Log & Estimate Calories
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Summary */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
          <Card className="nucleus-card border-0">
            <CardHeader>
              <CardTitle className="font-heading text-lg" style={{ color: 'var(--dashboard-text)' }}>
                Daily Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Calories */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-body text-sm">Calories</span>
                  <span className="font-heading text-lg">
                    {summary?.total_calories || 0} / {DAILY_GOALS.calories}
                  </span>
                </div>
                <Progress value={Math.min(calorieProgress, 100)} className="h-3"
                  style={{ '--progress-color': 'var(--calorie-accent)' }} />
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#E8F5E9' }}>
                  <p className="font-heading text-xl" style={{ color: 'var(--calorie-accent)' }}>
                    {summary?.total_protein || 0}g
                  </p>
                  <p className="text-xs font-body opacity-60">Protein</p>
                  <Progress value={Math.min(proteinProgress, 100)} className="h-1 mt-2" />
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#FFF3E0' }}>
                  <p className="font-heading text-xl" style={{ color: '#F57C00' }}>
                    {summary?.total_carbs || 0}g
                  </p>
                  <p className="text-xs font-body opacity-60">Carbs</p>
                  <Progress value={Math.min(carbsProgress, 100)} className="h-1 mt-2" />
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#FCE4EC' }}>
                  <p className="font-heading text-xl" style={{ color: '#C2185B' }}>
                    {summary?.total_fat || 0}g
                  </p>
                  <p className="text-xs font-body opacity-60">Fat</p>
                  <Progress value={Math.min(fatProgress, 100)} className="h-1 mt-2" />
                </div>
              </div>

              {/* Daily Weight Log */}
              <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                <div>
                  <p className="font-heading text-lg" style={{ color: 'var(--dashboard-text)' }}>Daily Weight</p>
                  <p className="text-xs font-body opacity-60">Track your progress</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="kg/lbs" 
                    value={dailyWeight} 
                    onChange={(e) => setDailyWeight(e.target.value)} 
                    className="w-24 bg-black/5 border-0 focus-visible:ring-1"
                  />
                  <Button size="sm" variant="outline" onClick={async () => {
                    if(!dailyWeight) return;
                    setSavingWeight(true);
                    try {
                      await axios.post(`${API}/weight`, { date: dateStr, weight: parseFloat(dailyWeight) }, { withCredentials: true });
                      toast.success("Weight saved");
                      fetchWeekSummary();
                    } catch (e) {toast.error("Failed to save weight");}
                    setSavingWeight(false);
                  }} disabled={savingWeight || !dailyWeight}>
                    Save
                  </Button>
                </div>
              </div>

              {/* Meals count */}
              <div className="text-center pt-4 border-t border-black/5">
                <p className="font-heading text-3xl" style={{ color: 'var(--calorie-accent)' }}>
                  {summary?.meals || 0}
                </p>
                <p className="text-sm font-body opacity-60">meals logged today</p>
              </div>
            </CardContent>
          </Card>

        <div className="w-full">
          {/* Progress Chart */}
          <Card className="nucleus-card border-0 mt-6 overflow-hidden">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2" style={{ color: 'var(--dashboard-text)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--calorie-accent)' }} />
                7-Day Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full flex items-end justify-between gap-2 pt-8 text-xs font-body" style={{ color: 'var(--dashboard-text)' }}>
                {Array.isArray(weekSummary) && weekSummary.map((day, i) => {
                  // Find max calories to scale the bars relative to 100%
                  const maxCal = Math.max(...weekSummary.map(d => d.calories || 10), 2000);
                  const heightPercent = Math.min(((day.calories || 0) / maxCal) * 100, 100);
                  
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end gap-2 group">
                      <div className="w-full relative flex items-end justify-center h-full rounded-t-sm" style={{ backgroundColor: 'var(--dashboard-bg)' }}>
                        {/* Custom tooltip on hover */}
                        <div className="absolute -top-8 bg-black text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          {day.calories} kcal
                        </div>
                        {/* The actual filled bar */}
                        <div 
                          className="w-full rounded-t-sm transition-all duration-500 ease-out" 
                          style={{ height: `${heightPercent}%`, backgroundColor: 'var(--calorie-accent)' }} 
                        />
                      </div>
                      <span className="opacity-60">{day.displayDate?.split(' ')[1]}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        </motion.div>

        {/* Meal Logs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <Card className="nucleus-card border-0">
            <CardHeader>
              <CardTitle className="font-heading text-lg" style={{ color: 'var(--dashboard-text)' }}>
                Today's Meals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
                    No meals logged yet. Log your first meal!
                  </p>
                </div>
              ) : (
                logs.map((log) => {
                  const MealIcon = getMealIcon(log.meal_type);
                  const hasEstimate = log.calories !== null;

                  return (
                    <div key={log.log_id}
                      className="p-4 rounded-xl bg-white/50 group" data-testid={`meal-log-${log.log_id}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `var(--calorie-accent)20` }}>
                          <MealIcon className="w-5 h-5" style={{ color: 'var(--calorie-accent)' }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-body" style={{ color: 'var(--dashboard-text)' }}>
                            {log.description}
                          </p>

                          {hasEstimate ? (
                            <div className="flex flex-wrap gap-4 mt-2">
                              <span className="text-sm font-medium" style={{ color: 'var(--calorie-accent)' }}>
                                {log.calories} kcal
                              </span>
                              <span className="text-sm opacity-60">
                                P: {log.protein}g • C: {log.carbs}g • F: {log.fat}g
                              </span>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline"
                              onClick={() => handleEstimate(log.log_id)}
                              disabled={estimating === log.log_id}
                              className="mt-2 rounded-full">
                              {estimating === log.log_id ? (
                                <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Estimating...</>
                              ) : (
                                <><Sparkles className="w-3 h-3 mr-2" /> Estimate Calories</>
                              )}
                            </Button>
                          )}

                          {log.ai_analysis && (
                            <p className="text-xs mt-2 opacity-60 italic">{log.ai_analysis}</p>
                          )}
                        </div>
                        <button onClick={() => handleDeleteLog(log.log_id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CalorieTracker;
