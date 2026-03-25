import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Plus,
  Sparkles,
  BookOpen,
  Search,
  Check,
  MessageSquare,
  Trash2,
  Star,
  Loader2,
  Volume2
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
import { toast } from "sonner";

const WORD_TAGS = [
  "Power Word", "Transition Phrase", "Academic", "Casual", "Rare", "Business", "Literary"
];

const MASTERY_LEVELS = [
  { id: "new", label: "New", color: "#C1714A" },
  { id: "familiar", label: "Familiar", color: "#C9A96E" },
  { id: "owned", label: "Owned", color: "#2D5016" },
];

const Vocabulary = () => {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [wordOfDay, setWordOfDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMastery, setFilterMastery] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [newWord, setNewWord] = useState({
    word: "",
    definition: "",
    example_sentence: "",
    source_context: "",
    notes: "",
    tags: []
  });

  useEffect(() => {
    fetchWords();
    fetchWordOfDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMastery]);

  const fetchWords = async () => {
    try {
      let url = `${API}/vocabulary`;
      if (filterMastery !== "all") url += `?mastery=${filterMastery}`;
      const response = await axios.get(url, { withCredentials: true });
      setWords(response.data);
    } catch (error) {
      toast.error("Failed to load vocabulary");
    } finally {
      setLoading(false);
    }
  };

  const fetchWordOfDay = async () => {
    try {
      const response = await axios.get(`${API}/vocabulary/word-of-day`, { withCredentials: true });
      setWordOfDay(response.data);
    } catch (error) {
      console.error("Error fetching word of day");
    }
  };

  const handleCreateWord = async () => {
    if (!newWord.word.trim()) {
      toast.error("Please enter a word");
      return;
    }

    try {
      const response = await axios.post(`${API}/vocabulary`, newWord, { withCredentials: true });
      toast.success("Word added!");
      setCreateDialogOpen(false);
      setNewWord({ word: "", definition: "", example_sentence: "", source_context: "", notes: "", tags: [] });
      fetchWords();

      // Auto-generate if no definition provided
      if (!newWord.definition) {
        handleGenerate(response.data.word_id);
      }
    } catch (error) {
      toast.error("Failed to add word");
    }
  };

  const handleGenerate = async (wordId) => {
    setGenerating(wordId);
    try {
      await axios.post(`${API}/vocabulary/${wordId}/generate`, {}, { withCredentials: true });
      fetchWords();
      toast.success("Definition generated!");
    } catch (error) {
      toast.error("Failed to generate definition");
    } finally {
      setGenerating(null);
    }
  };

  const handleUpdateMastery = async (wordId, mastery) => {
    try {
      await axios.put(`${API}/vocabulary/${wordId}`, { mastery_level: mastery }, { withCredentials: true });
      fetchWords();
    } catch (error) {
      toast.error("Failed to update mastery");
    }
  };

  const handleToggleUsage = async (wordId, field, currentValue) => {
    try {
      await axios.put(`${API}/vocabulary/${wordId}`, { [field]: !currentValue }, { withCredentials: true });
      fetchWords();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDeleteWord = async (wordId) => {
    try {
      await axios.delete(`${API}/vocabulary/${wordId}`, { withCredentials: true });
      fetchWords();
      setSelectedWord(null);
      toast.success("Word deleted");
    } catch (error) {
      toast.error("Failed to delete word");
    }
  };

  const playVoice = (text, e) => {
    e?.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Text-to-speech not supported in this browser");
    }
  };

  const filteredWords = words.filter(word => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return word.word.toLowerCase().includes(query) ||
      (word.definition && word.definition.toLowerCase().includes(query));
  });

  const getMasteryColor = (level) => {
    const m = MASTERY_LEVELS.find(l => l.id === level);
    return m ? m.color : "#8A7A6A";
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--vocab-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div data-testid="vocabulary-page" className="p-6 md:p-12 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--vocab-bg)', minHeight: '100vh' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl mb-2" style={{ color: 'var(--vocab-text)' }}>
              Vocabulary Bank
            </h1>
            <p className="font-body text-sm" style={{ color: 'var(--vocab-text)', opacity: 0.6 }}>
              {words.length} words collected • {words.filter(w => w.mastery_level === "owned").length} mastered
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-word-btn" className="rounded-full px-6 text-white"
                style={{ backgroundColor: 'var(--vocab-accent)' }}>
                <Plus className="w-4 h-4 mr-2" /> Add Word
              </Button>
            </DialogTrigger>
            <DialogContent className="nucleus-card border-0">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Add New Word</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Word</Label>
                  <Input data-testid="word-input" placeholder="Enter a word"
                    value={newWord.word} onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    className="mt-1" />
                </div>
                <div>
                  <Label>Definition (optional - AI can generate)</Label>
                  <Textarea placeholder="Word definition..."
                    value={newWord.definition} onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
                    className="mt-1" />
                </div>
                <div>
                  <Label>Example Sentence (optional)</Label>
                  <Textarea placeholder="Use the word in a sentence..."
                    value={newWord.example_sentence} onChange={(e) => setNewWord({ ...newWord, example_sentence: e.target.value })}
                    className="mt-1" />
                </div>
                <div>
                  <Label>Source Context (where did you find it?)</Label>
                  <Input placeholder="e.g., The Great Gatsby, chapter 3"
                    value={newWord.source_context} onChange={(e) => setNewWord({ ...newWord, source_context: e.target.value })}
                    className="mt-1" />
                </div>
                <div>
                  <Label>Notes (what did you learn?)</Label>
                  <Textarea placeholder="Any thoughts on this word..."
                    value={newWord.notes} onChange={(e) => setNewWord({ ...newWord, notes: e.target.value })}
                    className="mt-1" />
                </div>
                <Button data-testid="save-word-btn" onClick={handleCreateWord}
                  className="w-full rounded-full text-white" style={{ backgroundColor: 'var(--vocab-accent)' }}>
                  {newWord.definition ? "Save Word" : <><Sparkles className="w-4 h-4 mr-2" /> Save & Generate Definition</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Word of the Day */}
      {wordOfDay && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card className="nucleus-card border-0 border-l-4" style={{ borderLeftColor: 'var(--gold-accent)' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4" style={{ color: 'var(--gold-accent)', fill: 'var(--gold-accent)' }} />
                <span className="text-xs font-body uppercase tracking-wide opacity-60">Word of the Day</span>
              </div>
              <h2 className="font-heading text-2xl mb-2" style={{ color: 'var(--vocab-text)' }}>
                {wordOfDay.word}
              </h2>
              <p className="font-body" style={{ color: 'var(--vocab-text)', opacity: 0.8 }}>
                {wordOfDay.definition || "Click to generate definition"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <Input placeholder="Search words..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>
        <Select value={filterMastery} onValueChange={setFilterMastery}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Mastery" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {MASTERY_LEVELS.map(level => (
              <SelectItem key={level.id} value={level.id}>{level.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Words Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.map((word) => (
          <motion.div key={word.word_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedWord(word)} className="cursor-pointer">
            <Card className="nucleus-card border-0 border-l-4 h-full hover:shadow-lg transition-shadow"
              style={{ borderLeftColor: getMasteryColor(word.mastery_level) }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg" style={{ color: 'var(--vocab-text)' }}>
                      {word.word}
                    </h3>
                    <button onClick={(e) => playVoice(word.word, e)} className="p-1 rounded-full hover:bg-black/5 opacity-50 hover:opacity-100 transition-all">
                      <Volume2 className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                  <Badge variant="outline" style={{ borderColor: getMasteryColor(word.mastery_level), color: getMasteryColor(word.mastery_level) }}>
                    {word.mastery_level}
                  </Badge>
                </div>

                {word.definition ? (
                  <p className="text-sm font-body mt-2 line-clamp-2" style={{ color: 'var(--vocab-text)', opacity: 0.8 }}>
                    {word.definition}
                  </p>
                ) : (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleGenerate(word.word_id); }}
                    disabled={generating === word.word_id} className="mt-2 rounded-full">
                    {generating === word.word_id ? (
                      <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-3 h-3 mr-2" /> Generate</>
                    )}
                  </Button>
                )}

                <div className="flex gap-2 mt-3">
                  {word.used_in_writing && (
                    <Badge variant="secondary" className="text-xs">Used in Writing ✓</Badge>
                  )}
                  {word.used_in_speech && (
                    <Badge variant="secondary" className="text-xs">Used in Speech ✓</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredWords.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-body" style={{ color: 'var(--vocab-text)', opacity: 0.5 }}>
            No words found. Start building your vocabulary!
          </p>
        </div>
      )}

      {/* Word Detail Dialog */}
      <Dialog open={!!selectedWord} onOpenChange={() => setSelectedWord(null)}>
        <DialogContent className="nucleus-card border-0 max-w-lg">
          {selectedWord && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-heading text-2xl">{selectedWord.word}</DialogTitle>
                  <button onClick={() => playVoice(selectedWord.word)} className="p-1 rounded-full hover:bg-black/5 opacity-50 hover:opacity-100 transition-all">
                    <Volume2 className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {selectedWord.definition && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide opacity-60">Definition</Label>
                    <p className="font-body mt-1">{selectedWord.definition}</p>
                  </div>
                )}
                {selectedWord.example_sentence && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide opacity-60">Example</Label>
                    <p className="font-body mt-1 italic">"{selectedWord.example_sentence}"</p>
                  </div>
                )}
                {selectedWord.usage_tips && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide opacity-60">Usage Tips</Label>
                    <p className="font-body mt-1">{selectedWord.usage_tips}</p>
                  </div>
                )}
                {selectedWord.notes && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide opacity-60">Notes</Label>
                    <p className="font-body mt-1">{selectedWord.notes}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-black/5">
                  <Label className="text-xs uppercase tracking-wide opacity-60 block mb-2">Mastery Level</Label>
                  <div className="flex gap-2">
                    {MASTERY_LEVELS.map((level) => (
                      <Button key={level.id} size="sm" variant={selectedWord.mastery_level === level.id ? "default" : "outline"}
                        onClick={() => handleUpdateMastery(selectedWord.word_id, level.id)}
                        style={selectedWord.mastery_level === level.id ? { backgroundColor: level.color } : {}}>
                        {level.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant={selectedWord.used_in_writing ? "default" : "outline"}
                    onClick={() => handleToggleUsage(selectedWord.word_id, "used_in_writing", selectedWord.used_in_writing)}
                    className="flex-1">
                    <Check className="w-3 h-3 mr-1" /> Used in Writing
                  </Button>
                  <Button size="sm" variant={selectedWord.used_in_speech ? "default" : "outline"}
                    onClick={() => handleToggleUsage(selectedWord.word_id, "used_in_speech", selectedWord.used_in_speech)}
                    className="flex-1">
                    <MessageSquare className="w-3 h-3 mr-1" /> Used in Speech
                  </Button>
                </div>

                <div className="flex justify-between pt-4">
                  {!selectedWord.definition && (
                    <Button variant="outline" onClick={() => handleGenerate(selectedWord.word_id)}
                      disabled={generating === selectedWord.word_id}>
                      {generating === selectedWord.word_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate Definition
                    </Button>
                  )}
                  <Button variant="destructive" onClick={() => handleDeleteWord(selectedWord.word_id)}>
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

export default Vocabulary;
