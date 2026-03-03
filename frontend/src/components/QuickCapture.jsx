import { useState } from "react";
import { API } from "@/App";
import axios from "axios";
import { format } from "date-fns";
import { 
  Lightbulb, 
  Link2, 
  BookOpen, 
  CheckSquare,
  UtensilsCrossed,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CAPTURE_TYPES = [
  { id: "idea", icon: Lightbulb, label: "Idea", color: "#F59E0B" },
  { id: "link", icon: Link2, label: "Link", color: "#C17A3D" },
  { id: "word", icon: BookOpen, label: "Word", color: "#8A3D2C" },
  { id: "task", icon: CheckSquare, label: "Task", color: "#B8860B" },
  { id: "food", icon: UtensilsCrossed, label: "Food", color: "#2D9A6A" },
];

const QuickCapture = ({ open, onOpenChange }) => {
  const [selectedType, setSelectedType] = useState("idea");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter something to capture");
      return;
    }

    setLoading(true);

    try {
      switch (selectedType) {
        case "idea":
          await axios.post(
            `${API}/ideas`,
            { title: inputValue, status: "raw", tags: [] },
            { withCredentials: true }
          );
          toast.success("Idea captured!");
          break;

        case "link":
          await axios.post(
            `${API}/links`,
            { url: inputValue, title: inputValue, category: "resource", status: "saved" },
            { withCredentials: true }
          );
          toast.success("Link saved!");
          break;

        case "word":
          await axios.post(
            `${API}/vocabulary`,
            { word: inputValue, definition: "", tags: [] },
            { withCredentials: true }
          );
          toast.success("Word added!");
          break;

        case "task":
          await axios.post(
            `${API}/tasks`,
            { title: inputValue, priority: "important", date: today },
            { withCredentials: true }
          );
          toast.success("Task created!");
          break;

        case "food":
          await axios.post(
            `${API}/calories`,
            { description: inputValue, date: today },
            { withCredentials: true }
          );
          toast.success("Food logged!");
          break;

        default:
          toast.error("Unknown capture type");
      }

      setInputValue("");
      onOpenChange(false);
    } catch (error) {
      // Handle 404 for features not yet implemented
      if (error.response?.status === 404) {
        toast.info("This feature is coming in a future phase!");
      } else {
        toast.error("Failed to capture. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const currentType = CAPTURE_TYPES.find(t => t.id === selectedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="nucleus-card border-0 max-w-lg"
        onKeyDown={(e) => e.key === "Escape" && onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            Quick Capture
            <span className="text-xs font-body opacity-50 ml-2">Press "/" anywhere</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Type Selector */}
          <div className="flex gap-2 flex-wrap">
            {CAPTURE_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;

              return (
                <button
                  key={type.id}
                  data-testid={`capture-type-${type.id}`}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    isSelected ? 'shadow-md text-white' : 'hover:bg-black/5'
                  }`}
                  style={{
                    backgroundColor: isSelected ? type.color : 'transparent',
                    color: isSelected ? 'white' : 'var(--dashboard-text)'
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-body text-sm">{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input */}
          <div className="relative">
            <Input
              data-testid="quick-capture-input"
              placeholder={getPlaceholder(selectedType)}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-12 py-6 text-lg font-body"
              style={{ borderColor: currentType?.color }}
              autoFocus
            />
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5"
              >
                <X className="w-4 h-4" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }} />
              </button>
            )}
          </div>

          {/* Submit Button */}
          <Button
            data-testid="quick-capture-submit"
            onClick={handleSubmit}
            disabled={loading || !inputValue.trim()}
            className="w-full rounded-full py-6 text-white font-body"
            style={{ backgroundColor: currentType?.color }}
          >
            {loading ? "Saving..." : `Capture ${currentType?.label}`}
          </Button>

          {/* Keyboard hint */}
          <p className="text-center text-xs font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
            Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 mx-1">Enter</kbd> to save or 
            <kbd className="px-1.5 py-0.5 rounded bg-black/5 mx-1">Esc</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function getPlaceholder(type) {
  switch (type) {
    case "idea": return "What's on your mind?";
    case "link": return "Paste a URL...";
    case "word": return "Enter a word to learn...";
    case "task": return "What needs to be done?";
    case "food": return "What did you eat? e.g., rice and dal with roti";
    default: return "Capture something...";
  }
}

export default QuickCapture;
