import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Sparkles, 
  MessageSquare,
  Play,
  ChevronRight,
  Trash2,
  Star,
  Loader2,
  RefreshCw,
  Check,
  X,
  Target,
  Users,
  Zap,
  TrendingUp,
  AlertCircle,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const THEMES = [
  { id: "problem-solving", label: "Problem Solving", icon: Target },
  { id: "teamwork", label: "Teamwork", icon: Users },
  { id: "leadership", label: "Leadership", icon: Zap },
  { id: "failure", label: "Failure", icon: AlertCircle },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "conflict", label: "Conflict", icon: X },
  { id: "goals", label: "Goals", icon: Award },
];

const STAR_COLORS = {
  situation: "#5C7A9A",
  task: "#7C9A6E",
  action: "#C9A96E",
  result: "#C1714A"
};

const BQPractice = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gettingFeedback, setGettingFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState("questions");
  const [filterTheme, setFilterTheme] = useState("all");
  const [walkMode, setWalkMode] = useState(false);
  const [walkQuestions, setWalkQuestions] = useState([]);
  const [walkIndex, setWalkIndex] = useState(0);
  const [practiceSession, setPracticeSession] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [newAnswer, setNewAnswer] = useState({
    situation: "",
    task: "",
    action: "",
    result: "",
    tags: []
  });
  const [newQuestion, setNewQuestion] = useState({ question: "", theme: "general" });

  useEffect(() => {
    fetchData();
  }, [filterTheme]);

  const fetchData = async () => {
    try {
      let qUrl = `${API}/bq/questions`;
      if (filterTheme !== "all") qUrl += `?theme=${filterTheme}`;
      
      const [questionsRes, answersRes] = await Promise.all([
        axios.get(qUrl, { withCredentials: true }),
        axios.get(`${API}/bq/answers`, { withCredentials: true })
      ]);
      
      setQuestions(questionsRes.data);
      setAnswers(answersRes.data);
    } catch (error) {
      toast.error("Failed to load BQ data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQuestion.question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    try {
      await axios.post(`${API}/bq/questions`, newQuestion, { withCredentials: true });
      toast.success("Question added!");
      setCreateDialogOpen(false);
      setNewQuestion({ question: "", theme: "general" });
      fetchData();
    } catch (error) {
      toast.error("Failed to add question");
    }
  };

  const handleSaveAnswer = async () => {
    if (!newAnswer.situation.trim() || !newAnswer.action.trim()) {
      toast.error("Please fill in Situation and Action at minimum");
      return;
    }

    try {
      await axios.post(`${API}/bq/answers`, {
        ...newAnswer,
        question_id: selectedQuestion.question_id,
        question_text: selectedQuestion.question
      }, { withCredentials: true });
      
      toast.success("Answer saved!");
      setAnswerDialogOpen(false);
      setNewAnswer({ situation: "", task: "", action: "", result: "", tags: [] });
      setSelectedQuestion(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to save answer");
    }
  };

  const handleGetFeedback = async (answerId) => {
    setGettingFeedback(answerId);
    try {
      const response = await axios.post(`${API}/bq/answers/${answerId}/feedback`, {}, { withCredentials: true });
      setSelectedAnswer(response.data);
      fetchData();
      toast.success("Feedback received!");
    } catch (error) {
      toast.error("Failed to get feedback");
    } finally {
      setGettingFeedback(null);
    }
  };

  const handleUpdateConfidence = async (answerId, confidence) => {
    try {
      await axios.put(`${API}/bq/answers/${answerId}`, { confidence }, { withCredentials: true });
      fetchData();
    } catch (error) {
      toast.error("Failed to update confidence");
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    try {
      await axios.delete(`${API}/bq/answers/${answerId}`, { withCredentials: true });
      fetchData();
      setSelectedAnswer(null);
      toast.success("Answer deleted");
    } catch (error) {
      toast.error("Failed to delete answer");
    }
  };

  const startPracticeSession = async () => {
    try {
      const response = await axios.get(`${API}/bq/practice-session${filterTheme !== "all" ? `?theme=${filterTheme}` : ""}`, { withCredentials: true });
      setPracticeSession({
        questions: response.data,
        currentIndex: 0,
        ratings: []
      });
    } catch (error) {
      toast.error("Failed to start practice session");
    }
  };

  const startWalkMode = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setWalkQuestions(shuffled.slice(0, 10));
    setWalkIndex(0);
    setWalkMode(true);
  };

  const getThemeIcon = (themeId) => {
    const theme = THEMES.find(t => t.id === themeId);
    return theme ? theme.icon : MessageSquare;
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]" style={{ backgroundColor: 'var(--bq-bg)' }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--bq-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // Walk Mode View
  if (walkMode && walkQuestions.length > 0) {
    return (
      <div data-testid="bq-walk-mode" className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ backgroundColor: 'var(--bq-bg)' }}>
        <motion.div
          key={walkIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="text-center max-w-3xl"
        >
          <p className="text-sm font-body mb-8 opacity-40" style={{ color: 'var(--bq-text)' }}>
            Question {walkIndex + 1} of {walkQuestions.length}
          </p>
          <h1 className="font-heading text-3xl md:text-5xl leading-tight" style={{ color: 'var(--bq-text)' }}>
            {walkQuestions[walkIndex].question}
          </h1>
          <div className="flex justify-center gap-4 mt-12">
            <Button variant="outline" onClick={() => setWalkMode(false)}
              className="rounded-full" style={{ borderColor: 'var(--bq-text)', color: 'var(--bq-text)' }}>
              Exit
            </Button>
            {walkIndex > 0 && (
              <Button variant="outline" onClick={() => setWalkIndex(i => i - 1)}
                className="rounded-full" style={{ borderColor: 'var(--bq-accent)', color: 'var(--bq-accent)' }}>
                Previous
              </Button>
            )}
            {walkIndex < walkQuestions.length - 1 ? (
              <Button onClick={() => setWalkIndex(i => i + 1)}
                className="rounded-full text-white" style={{ backgroundColor: 'var(--bq-accent)' }}>
                Next Question
              </Button>
            ) : (
              <Button onClick={() => setWalkMode(false)}
                className="rounded-full text-white" style={{ backgroundColor: 'var(--bq-accent)' }}>
                Finish
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Practice Session View
  if (practiceSession) {
    const currentQ = practiceSession.questions[practiceSession.currentIndex];
    
    return (
      <div data-testid="bq-practice-session" className="min-h-screen p-8" style={{ backgroundColor: 'var(--bq-bg)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <p className="text-sm font-body opacity-60" style={{ color: 'var(--bq-text)' }}>
              Practice Session - Question {practiceSession.currentIndex + 1} of {practiceSession.questions.length}
            </p>
            <Button variant="ghost" onClick={() => setPracticeSession(null)} style={{ color: 'var(--bq-text)' }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <Card className="nucleus-card-dark border border-white/10">
            <CardContent className="p-8">
              <h2 className="font-heading text-2xl mb-8" style={{ color: 'var(--bq-text)' }}>
                {currentQ.question}
              </h2>
              
              <div className="space-y-4">
                <Label style={{ color: 'var(--bq-text)' }}>How confident are you with this question?</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button key={rating} variant="outline"
                      onClick={() => {
                        const newRatings = [...practiceSession.ratings, { question_id: currentQ.question_id, rating }];
                        if (practiceSession.currentIndex < practiceSession.questions.length - 1) {
                          setPracticeSession({
                            ...practiceSession,
                            currentIndex: practiceSession.currentIndex + 1,
                            ratings: newRatings
                          });
                        } else {
                          toast.success("Practice session complete!");
                          setPracticeSession(null);
                        }
                      }}
                      className="flex-1 h-16"
                      style={{ borderColor: 'var(--bq-accent)', color: 'var(--bq-text)' }}>
                      {rating}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-center opacity-40" style={{ color: 'var(--bq-text)' }}>
                  1 = Not confident at all • 5 = Very confident
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="bq-practice-page" className="p-6 md:p-12 max-w-7xl mx-auto min-h-screen"
      style={{ backgroundColor: 'var(--bq-bg)' }}>
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl mb-2" style={{ color: 'var(--bq-text)' }}>
              BQ Practice
            </h1>
            <p className="font-body text-sm" style={{ color: 'var(--bq-text)', opacity: 0.6 }}>
              {questions.length} questions • {answers.length} STAR answers saved
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={startWalkMode}
              className="rounded-full" style={{ borderColor: 'var(--bq-accent)', color: 'var(--bq-accent)' }}>
              <Play className="w-4 h-4 mr-2" /> Walk Mode
            </Button>
            <Button onClick={startPracticeSession}
              className="rounded-full text-white" style={{ backgroundColor: 'var(--bq-accent)' }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Practice Session
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-white/5">
          <TabsTrigger value="questions" style={{ color: 'var(--bq-text)' }}>Question Bank</TabsTrigger>
          <TabsTrigger value="answers" style={{ color: 'var(--bq-text)' }}>My Answers</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter */}
      <div className="flex gap-4 mb-6">
        <Select value={filterTheme} onValueChange={setFilterTheme}>
          <SelectTrigger className="w-[200px] bg-white/5 border-white/10" style={{ color: 'var(--bq-text)' }}>
            <SelectValue placeholder="Filter by theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Themes</SelectItem>
            {THEMES.map(theme => (
              <SelectItem key={theme.id} value={theme.id}>{theme.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {activeTab === "questions" && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full" style={{ borderColor: 'var(--bq-accent)', color: 'var(--bq-accent)' }}>
                <Plus className="w-4 h-4 mr-2" /> Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="nucleus-card border-0">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Add Custom Question</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Question</Label>
                  <Textarea placeholder="Enter your question..."
                    value={newQuestion.question} onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    className="mt-1" />
                </div>
                <div>
                  <Label>Theme</Label>
                  <Select value={newQuestion.theme} onValueChange={(v) => setNewQuestion({ ...newQuestion, theme: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {THEMES.map(theme => (
                        <SelectItem key={theme.id} value={theme.id}>{theme.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateQuestion} className="w-full rounded-full text-white"
                  style={{ backgroundColor: 'var(--bq-accent)' }}>
                  Add Question
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Questions Tab */}
      {activeTab === "questions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.filter(q => filterTheme === "all" || q.theme === filterTheme).map((question) => {
            const ThemeIcon = getThemeIcon(question.theme);
            const hasAnswer = answers.some(a => a.question_id === question.question_id);
            
            return (
              <motion.div key={question.question_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="nucleus-card-dark border border-white/10 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${STAR_COLORS.action}20` }}>
                        <ThemeIcon className="w-5 h-5" style={{ color: 'var(--bq-accent)' }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-body text-sm" style={{ color: 'var(--bq-text)' }}>
                          {question.question}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--bq-accent)', color: 'var(--bq-accent)' }}>
                            {question.theme}
                          </Badge>
                          {hasAnswer && (
                            <Badge className="text-xs" style={{ backgroundColor: '#2D5016' }}>
                              <Check className="w-3 h-3 mr-1" /> Answered
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm"
                      onClick={() => { setSelectedQuestion(question); setAnswerDialogOpen(true); }}
                      className="w-full mt-4 rounded-full"
                      style={{ borderColor: 'var(--bq-accent)', color: 'var(--bq-accent)' }}>
                      {hasAnswer ? "Add Another Answer" : "Write STAR Answer"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Answers Tab */}
      {activeTab === "answers" && (
        <div className="space-y-4">
          {answers.map((answer) => (
            <motion.div key={answer.answer_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedAnswer(answer)} className="cursor-pointer">
              <Card className="nucleus-card-dark border border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-4">
                  <p className="font-body text-sm mb-3" style={{ color: 'var(--bq-text)', opacity: 0.7 }}>
                    {answer.question_text}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {["situation", "task", "action", "result"].map((part) => (
                      <div key={part} className="p-2 rounded" style={{ backgroundColor: `${STAR_COLORS[part]}20` }}>
                        <p className="text-xs font-bold uppercase mb-1" style={{ color: STAR_COLORS[part] }}>
                          {part.charAt(0)}
                        </p>
                        <p className="text-xs line-clamp-2" style={{ color: 'var(--bq-text)' }}>
                          {answer[part] || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= answer.confidence ? '' : 'opacity-20'}`}
                          style={{ color: 'var(--bq-accent)', fill: s <= answer.confidence ? 'var(--bq-accent)' : 'none' }} />
                      ))}
                    </div>
                    {answer.ai_feedback && (
                      <Badge style={{ backgroundColor: 'var(--bq-accent)' }}>Has Feedback</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {answers.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: 'var(--bq-text)' }} />
              <p className="font-body" style={{ color: 'var(--bq-text)', opacity: 0.5 }}>
                No answers yet. Start practicing!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Answer Dialog */}
      <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
        <DialogContent className="nucleus-card border-0 max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedQuestion && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">STAR Answer Builder</DialogTitle>
                <p className="text-sm opacity-60 mt-2">{selectedQuestion.question}</p>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {["situation", "task", "action", "result"].map((part) => (
                  <div key={part}>
                    <Label className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: STAR_COLORS[part] }}>
                        {part.charAt(0).toUpperCase()}
                      </span>
                      {part.charAt(0).toUpperCase() + part.slice(1)}
                    </Label>
                    <Textarea placeholder={getPlaceholder(part)}
                      value={newAnswer[part]} onChange={(e) => setNewAnswer({ ...newAnswer, [part]: e.target.value })}
                      className="mt-1" rows={3} />
                  </div>
                ))}
                <Button onClick={handleSaveAnswer} className="w-full rounded-full text-white"
                  style={{ backgroundColor: 'var(--bq-accent)' }}>
                  Save Answer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Answer Detail Dialog */}
      <Dialog open={!!selectedAnswer} onOpenChange={() => setSelectedAnswer(null)}>
        <DialogContent className="nucleus-card border-0 max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedAnswer && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">STAR Answer</DialogTitle>
                <p className="text-sm opacity-60 mt-2">{selectedAnswer.question_text}</p>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {["situation", "task", "action", "result"].map((part) => (
                  <div key={part} className="p-4 rounded-lg" style={{ backgroundColor: `${STAR_COLORS[part]}10` }}>
                    <Label className="text-xs uppercase tracking-wide" style={{ color: STAR_COLORS[part] }}>
                      {part}
                    </Label>
                    <p className="mt-1">{selectedAnswer[part] || "-"}</p>
                  </div>
                ))}

                <div className="pt-4 border-t border-black/5">
                  <Label className="text-xs uppercase tracking-wide opacity-60 block mb-2">Confidence Level</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Button key={level} size="sm"
                        variant={selectedAnswer.confidence === level ? "default" : "outline"}
                        onClick={() => handleUpdateConfidence(selectedAnswer.answer_id, level)}>
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedAnswer.ai_feedback ? (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `var(--bq-accent)10` }}>
                    <Label className="text-xs uppercase tracking-wide" style={{ color: 'var(--bq-accent)' }}>
                      AI Feedback
                    </Label>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{selectedAnswer.ai_feedback}</p>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => handleGetFeedback(selectedAnswer.answer_id)}
                    disabled={gettingFeedback === selectedAnswer.answer_id}>
                    {gettingFeedback === selectedAnswer.answer_id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Getting Feedback...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Get AI Feedback</>
                    )}
                  </Button>
                )}

                <div className="flex justify-end">
                  <Button variant="destructive" onClick={() => handleDeleteAnswer(selectedAnswer.answer_id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function getPlaceholder(part) {
  switch (part) {
    case "situation": return "Set the scene. What was the context?";
    case "task": return "What was your specific responsibility?";
    case "action": return "What steps did you take? Be specific.";
    case "result": return "What was the outcome? Use metrics if possible.";
    default: return "";
  }
}

export default BQPractice;
