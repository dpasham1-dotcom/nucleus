import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/App";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  Target, 
  Link2, 
  BookOpen, 
  Lightbulb, 
  MessageSquare,
  CheckSquare,
  ArrowRight
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const TYPE_ICONS = {
  habit: Target,
  task: CheckSquare,
  link: Link2,
  word: BookOpen,
  idea: Lightbulb,
  bq_answer: MessageSquare,
};

const TYPE_ROUTES = {
  habit: "/habits",
  task: "/planner",
  link: "/links",
  word: "/vocabulary",
  idea: "/ideas",
  bq_answer: "/bq-practice",
};

const TYPE_COLORS = {
  habit: "#7C9A6E",
  task: "#B8860B",
  link: "#C17A3D",
  word: "#8A3D2C",
  idea: "#F59E0B",
  bq_answer: "#C9A96E",
};

const GlobalSearch = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const search = useCallback(async (q) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/search?q=${encodeURIComponent(q)}`, { withCredentials: true });
      setResults(response.data.results || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, search]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result) => {
    const route = TYPE_ROUTES[result.type];
    if (route) {
      navigate(route);
      onOpenChange(false);
    }
  };

  const getResultTitle = (result) => {
    const data = result.data;
    switch (result.type) {
      case "habit": return data.name;
      case "task": return data.title;
      case "link": return data.title;
      case "word": return data.word;
      case "idea": return data.title;
      case "bq_answer": return data.question_text?.substring(0, 50) + "...";
      default: return "Unknown";
    }
  };

  const getResultSubtitle = (result) => {
    const data = result.data;
    switch (result.type) {
      case "habit": return data.group;
      case "task": return data.date;
      case "link": return data.url?.substring(0, 40) + "...";
      case "word": return data.definition?.substring(0, 50) + "...";
      case "idea": return data.status;
      case "bq_answer": return `Confidence: ${data.confidence}/5`;
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nucleus-card border-0 max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-black/5">
          <Search className="w-5 h-5 opacity-40" />
          <Input
            data-testid="global-search-input"
            placeholder="Search across all modules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 text-lg p-0"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 rounded-full hover:bg-black/5">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                style={{ borderColor: 'var(--gold-accent)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="p-8 text-center opacity-50">
              <p className="font-body">No results found for "{query}"</p>
            </div>
          )}

          {!loading && results.length === 0 && query.length < 2 && (
            <div className="p-8 text-center opacity-40">
              <p className="font-body text-sm">Type at least 2 characters to search</p>
              <p className="font-body text-xs mt-2">
                Search across habits, tasks, links, vocabulary, ideas, and BQ answers
              </p>
            </div>
          )}

          <AnimatePresence>
            {results.map((result, index) => {
              const Icon = TYPE_ICONS[result.type] || Search;
              const color = TYPE_COLORS[result.type] || "#8A7A6A";

              return (
                <motion.button
                  key={`${result.type}-${result.data.habit_id || result.data.task_id || result.data.link_id || result.data.word_id || result.data.idea_id || result.data.answer_id || index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => handleSelect(result)}
                  className={`w-full p-4 flex items-center gap-4 text-left transition-colors ${
                    index === selectedIndex ? 'bg-black/5' : 'hover:bg-black/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium truncate">{getResultTitle(result)}</p>
                    <p className="font-body text-xs opacity-60 truncate">{getResultSubtitle(result)}</p>
                  </div>
                  <span className="text-xs font-body px-2 py-1 rounded" style={{ backgroundColor: `${color}20`, color }}>
                    {result.type.replace("_", " ")}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-40" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-black/5 flex items-center justify-between text-xs opacity-50">
          <div className="flex gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-black/5">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-black/5">Enter</kbd> Open</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-black/5">Esc</kbd> Close</span>
          </div>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-black/5">⌘K</kbd> anywhere</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
