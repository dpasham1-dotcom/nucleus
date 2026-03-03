import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { 
  User, 
  Download, 
  Upload, 
  FileText, 
  Sparkles,
  LogOut,
  Calendar,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const Settings = () => {
  const { user, logout } = useAuth();
  const [exportingData, setExportingData] = useState(false);
  const [exportingNote, setExportingNote] = useState(false);
  const [generatingReview, setGeneratingReview] = useState(false);
  const [weeklyReviews, setWeeklyReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    fetchWeeklyReviews();
  }, []);

  const fetchWeeklyReviews = async () => {
    try {
      const response = await axios.get(`${API}/weekly-reviews`, { withCredentials: true });
      setWeeklyReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleExportAllData = async () => {
    setExportingData(true);
    try {
      const response = await axios.get(`${API}/export/all-data`, { withCredentials: true });
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nucleus-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully!");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setExportingData(false);
    }
  };

  const handleExportDailyNote = async (date) => {
    setExportingNote(true);
    try {
      const response = await axios.get(`${API}/export/daily-note/${date}`, { withCredentials: true });
      
      // Download as markdown file
      const blob = new Blob([response.data.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Daily note exported!");
    } catch (error) {
      toast.error("Failed to export daily note");
    } finally {
      setExportingNote(false);
    }
  };

  const handleGenerateWeeklyReview = async () => {
    setGeneratingReview(true);
    try {
      const weekStart = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const response = await axios.post(`${API}/weekly-review`, { week_start: weekStart }, { withCredentials: true });
      setSelectedReview(response.data);
      fetchWeeklyReviews();
      toast.success("Weekly review generated!");
    } catch (error) {
      toast.error("Failed to generate weekly review");
    } finally {
      setGeneratingReview(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div data-testid="settings-page" className="p-6 md:p-12 max-w-4xl mx-auto"
      style={{ backgroundColor: 'var(--dashboard-bg)', minHeight: '100vh' }}>
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-4xl md:text-5xl mb-2" style={{ color: 'var(--dashboard-text)' }}>
          Settings
        </h1>
        <p className="font-body text-sm" style={{ color: 'var(--dashboard-text)', opacity: 0.6 }}>
          Manage your account and data
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card className="nucleus-card border-0">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <User className="w-5 h-5" style={{ color: 'var(--gold-accent)' }} />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white font-medium"
                  style={{ backgroundColor: 'var(--gold-accent)' }}>
                  {user?.name?.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-heading text-xl" style={{ color: 'var(--dashboard-text)' }}>{user?.name}</p>
                <p className="font-body text-sm" style={{ color: 'var(--dashboard-text)', opacity: 0.6 }}>{user?.email}</p>
              </div>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="mt-6 rounded-full">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Data Export Section */}
        <Card className="nucleus-card border-0">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Download className="w-5 h-5" style={{ color: 'var(--gold-accent)' }} />
              Data Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-body font-medium mb-2">Full Backup</h4>
              <p className="text-sm opacity-60 mb-3">Export all your data as a JSON file for backup</p>
              <Button onClick={handleExportAllData} disabled={exportingData}
                className="rounded-full" style={{ backgroundColor: 'var(--gold-accent)', color: 'white' }}>
                {exportingData ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export All Data
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-body font-medium mb-2">Obsidian Daily Note</h4>
              <p className="text-sm opacity-60 mb-3">Export today's data as an Obsidian-compatible markdown file</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExportDailyNote(format(new Date(), "yyyy-MM-dd"))}
                  disabled={exportingNote} className="rounded-full">
                  {exportingNote ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Export Today
                </Button>
                <Button variant="outline" onClick={() => handleExportDailyNote(format(subDays(new Date(), 1), "yyyy-MM-dd"))}
                  disabled={exportingNote} className="rounded-full">
                  Export Yesterday
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Review Section */}
        <Card className="nucleus-card border-0">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: 'var(--gold-accent)' }} />
              Weekly Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm opacity-60">Generate an AI-powered summary of your week's productivity</p>
            
            <Button onClick={handleGenerateWeeklyReview} disabled={generatingReview}
              className="rounded-full" style={{ backgroundColor: 'var(--gold-accent)', color: 'white' }}>
              {generatingReview ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate Weekly Summary</>
              )}
            </Button>

            {selectedReview && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-black/5">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" style={{ color: 'var(--gold-accent)' }} />
                  <span className="text-sm font-body">
                    {selectedReview.week_start} to {selectedReview.week_end}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="font-heading text-xl">{selectedReview.stats.tasks_completed}/{selectedReview.stats.tasks_total}</p>
                    <p className="text-xs opacity-60">Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-xl">{selectedReview.stats.habit_completions}</p>
                    <p className="text-xs opacity-60">Habit Check-ins</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-xl">{selectedReview.stats.ideas_captured}</p>
                    <p className="text-xs opacity-60">Ideas</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{selectedReview.summary}</p>
                </div>
              </motion.div>
            )}

            {weeklyReviews.length > 0 && !selectedReview && (
              <div className="mt-4">
                <h4 className="font-body font-medium mb-2">Past Reviews</h4>
                <div className="space-y-2">
                  {weeklyReviews.slice(0, 5).map((review) => (
                    <button key={review.review_id}
                      onClick={() => setSelectedReview(review)}
                      className="w-full p-3 rounded-lg text-left hover:bg-black/5 transition-colors">
                      <p className="font-body text-sm">{review.week_start} to {review.week_end}</p>
                      <p className="text-xs opacity-60">
                        {review.stats.tasks_completed} tasks • {review.stats.habit_completions} habit check-ins
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="nucleus-card border-0">
          <CardContent className="p-6 text-center">
            <h2 className="font-heading text-2xl mb-2" style={{ color: 'var(--dashboard-text)' }}>Nucleus</h2>
            <p className="font-body text-sm opacity-60">Your personal command center & second brain</p>
            <div className="w-12 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: 'var(--gold-accent)' }} />
            <p className="text-xs opacity-40 mt-4">Version 2.0.0 • Made with care</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
