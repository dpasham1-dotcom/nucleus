import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Plus,
  Sparkles,
  Lightbulb,
  Star,
  Search,
  Trash2,
  Link,
  ChevronRight,
  Loader2,
  Archive,
  Rocket,
  Clock,
  FileText
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

const IDEA_TYPES = [
  { id: "raw", label: "Raw", icon: Lightbulb },
  { id: "blog-post", label: "Blog Post", icon: FileText },
  { id: "project", label: "Project", icon: Rocket },
  { id: "business", label: "Business", icon: Star },
  { id: "personal", label: "Personal", icon: Clock },
  { id: "career", label: "Career", icon: ChevronRight },
  { id: "random", label: "Random", icon: Sparkles },
];

const STATUSES = [
  { id: "raw", label: "Raw", color: "#FFF8F0" },
  { id: "exploring", label: "Exploring", color: "#F0F4FF" },
  { id: "in-progress", label: "In Progress", color: "#F0FFF4" },
  { id: "shipped", label: "Shipped", color: "#F5F0FF" },
  { id: "archived", label: "Archived", color: "#F5F5F5" },
];

const Ideas = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [resurfacedIdea, setResurfacedIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanding, setExpanding] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("kanban");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [newIdea, setNewIdea] = useState({
    title: "",
    content: "",
    idea_type: "raw",
    tags: []
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchIdeas();
    fetchResurfacedIdea();
  }, [filterStatus]);

  const fetchIdeas = async () => {
    try {
      let url = `${API}/ideas`;
      if (filterStatus !== "all") url += `?status=${filterStatus}`;
      const response = await axios.get(url, { withCredentials: true });
      setIdeas(response.data);
    } catch (error) {
      toast.error("Failed to load ideas");
    } finally {
      setLoading(false);
    }
  };

  const fetchResurfacedIdea = async () => {
    try {
      const response = await axios.get(`${API}/ideas/resurface`, { withCredentials: true });
      setResurfacedIdea(response.data);
    } catch (error) {
      console.error("Error fetching resurfaced idea");
    }
  };

  const handleCreateIdea = async () => {
    if (!newIdea.title.trim()) {
      toast.error("Please enter an idea title");
      return;
    }

    try {
      await axios.post(`${API}/ideas`, newIdea, { withCredentials: true });
      toast.success("Idea captured!");
      setCreateDialogOpen(false);
      setNewIdea({ title: "", content: "", idea_type: "raw", tags: [] });
      fetchIdeas();
    } catch (error) {
      toast.error("Failed to save idea");
    }
  };

  const handleExpand = async (ideaId) => {
    setExpanding(ideaId);
    try {
      await axios.post(`${API}/ideas/${ideaId}/expand`, {}, { withCredentials: true });
      fetchIdeas();
      toast.success("Idea expanded!");
    } catch (error) {
      toast.error("Failed to expand idea");
    } finally {
      setExpanding(null);
    }
  };

  const handleUpdateStatus = async (ideaId, status) => {
    try {
      await axios.put(`${API}/ideas/${ideaId}`, { status }, { withCredentials: true });
      fetchIdeas();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleToggleStar = async (ideaId, currentStarred) => {
    try {
      await axios.put(`${API}/ideas/${ideaId}`, { starred: !currentStarred }, { withCredentials: true });
      fetchIdeas();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDeleteIdea = async (ideaId) => {
    try {
      await axios.delete(`${API}/ideas/${ideaId}`, { withCredentials: true });
      fetchIdeas();
      setSelectedIdea(null);
      toast.success("Idea deleted");
    } catch (error) {
      toast.error("Failed to delete idea");
    }
  };

  const filteredIdeas = ideas.filter(idea => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return idea.title.toLowerCase().includes(query) ||
      (idea.content && idea.content.toLowerCase().includes(query));
  });

  const getStatusColor = (status) => {
    const s = STATUSES.find(st => st.id === status);
    return s ? s.color : "#F5F5F5";
  };

  // Group ideas by status for kanban view
  const kanbanColumns = STATUSES.filter(s => s.id !== "archived").map(status => ({
    ...status,
    ideas: filteredIdeas.filter(i => i.status === status.id)
  }));

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--ideas-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div data-testid="ideas-page" className="p-6 md:p-12 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--ideas-bg)', minHeight: '100vh' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl mb-2" style={{ color: 'var(--dashboard-text)' }}>
              Ideas Notepad
            </h1>
            <p className="font-body text-sm" style={{ color: 'var(--dashboard-text)', opacity: 0.6 }}>
              {ideas.length} ideas captured • {ideas.filter(i => i.starred).length} starred
            </p>
          </div>

          <div className="flex gap-3">
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList>
                <TabsTrigger value="kanban">Kanban</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="create-idea-btn" className="rounded-full px-6 text-white"
                  style={{ backgroundColor: 'var(--ideas-accent)' }}>
                  <Plus className="w-4 h-4 mr-2" /> Capture Idea
                </Button>
              </DialogTrigger>
              <DialogContent className="nucleus-card border-0">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">Capture New Idea</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Idea Title</Label>
                    <Input data-testid="idea-title-input" placeholder="What's on your mind?"
                      value={newIdea.title} onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                      className="mt-1" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={newIdea.idea_type} onValueChange={(v) => setNewIdea({ ...newIdea, idea_type: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {IDEA_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Content (optional - AI can expand)</Label>
                    <Textarea placeholder="Add more details..."
                      value={newIdea.content} onChange={(e) => setNewIdea({ ...newIdea, content: e.target.value })}
                      className="mt-1" rows={4} />
                  </div>
                  <Button data-testid="save-idea-btn" onClick={handleCreateIdea}
                    className="w-full rounded-full text-white" style={{ backgroundColor: 'var(--ideas-accent)' }}>
                    Capture Idea
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Resurfaced Idea */}
      {resurfacedIdea && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="nucleus-card border-0 border-l-4" style={{ borderLeftColor: 'var(--ideas-accent)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" style={{ color: 'var(--ideas-accent)' }} />
                <span className="text-xs font-body uppercase tracking-wide opacity-60">Forgotten Idea from 30+ days ago</span>
              </div>
              <h3 className="font-heading text-lg" style={{ color: 'var(--dashboard-text)' }}>
                {resurfacedIdea.title}
              </h3>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(resurfacedIdea.idea_id, "exploring")}>
                  Explore Now
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(resurfacedIdea.idea_id, "archived")}>
                  Archive
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <Input placeholder="Search ideas..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((column) => (
            <div key={column.id} className="min-h-[400px]">
              <div className="flex items-center gap-2 mb-3 px-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color === "#FFF8F0" ? 'var(--ideas-accent)' : 'var(--dashboard-text)' }} />
                <span className="font-body font-medium text-sm">{column.label}</span>
                <Badge variant="secondary" className="ml-auto">{column.ideas.length}</Badge>
              </div>

              <div className="space-y-3 p-2 rounded-xl min-h-[350px]" style={{ backgroundColor: column.color }}>
                {column.ideas.map((idea) => (
                  <motion.div key={idea.idea_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="cursor-pointer" onClick={() => setSelectedIdea(idea)}>
                    <Card className="nucleus-card border-0 hover:shadow-lg transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-body font-medium text-sm line-clamp-2" style={{ color: 'var(--dashboard-text)' }}>
                            {idea.title}
                          </h4>
                          {idea.starred && (
                            <Star className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--gold-accent)', fill: 'var(--gold-accent)' }} />
                          )}
                        </div>
                        {idea.content && (
                          <p className="text-xs mt-2 opacity-60 line-clamp-2">{idea.content}</p>
                        )}
                        <div className="flex gap-1 mt-2">
                          {idea.tags?.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {column.ideas.length === 0 && (
                  <p className="text-center text-xs opacity-40 py-8">Drop ideas here</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {filteredIdeas.filter(i => i.status !== "archived").map((idea) => (
            <motion.div key={idea.idea_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="cursor-pointer" onClick={() => setSelectedIdea(idea)}>
              <Card className="nucleus-card border-0 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); handleToggleStar(idea.idea_id, idea.starred); }}>
                    <Star className={`w-5 h-5 ${idea.starred ? '' : 'opacity-20'}`}
                      style={{ color: 'var(--gold-accent)', fill: idea.starred ? 'var(--gold-accent)' : 'none' }} />
                  </button>
                  <div className="flex-1">
                    <h3 className="font-body font-medium" style={{ color: 'var(--dashboard-text)' }}>
                      {idea.title}
                    </h3>
                    {idea.content && (
                      <p className="text-sm opacity-60 line-clamp-1 mt-1">{idea.content}</p>
                    )}
                  </div>
                  <Badge style={{ backgroundColor: getStatusColor(idea.status) }}>{idea.status}</Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {filteredIdeas.length === 0 && (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
            No ideas yet. Capture your first one!
          </p>
        </div>
      )}

      {/* Idea Detail Dialog */}
      <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
        <DialogContent className="nucleus-card border-0 max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedIdea && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <DialogTitle className="font-heading text-2xl">{selectedIdea.title}</DialogTitle>
                  <button onClick={() => handleToggleStar(selectedIdea.idea_id, selectedIdea.starred)}>
                    <Star className={`w-6 h-6 ${selectedIdea.starred ? '' : 'opacity-20'}`}
                      style={{ color: 'var(--gold-accent)', fill: selectedIdea.starred ? 'var(--gold-accent)' : 'none' }} />
                  </button>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {selectedIdea.content ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{selectedIdea.content}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="opacity-60 mb-4">This idea hasn't been expanded yet.</p>
                    <Button onClick={() => handleExpand(selectedIdea.idea_id)}
                      disabled={expanding === selectedIdea.idea_id}
                      style={{ backgroundColor: 'var(--ideas-accent)' }} className="text-white">
                      {expanding === selectedIdea.idea_id ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Expanding...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" /> Expand with AI</>
                      )}
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t border-black/5">
                  <Label className="text-xs uppercase tracking-wide opacity-60 block mb-2">Status</Label>
                  <div className="flex gap-2 flex-wrap">
                    {STATUSES.map((status) => (
                      <Button key={status.id} size="sm"
                        variant={selectedIdea.status === status.id ? "default" : "outline"}
                        onClick={() => handleUpdateStatus(selectedIdea.idea_id, status.id)}
                        style={selectedIdea.status === status.id ? { backgroundColor: status.color === "#F5F5F5" ? "#999" : 'var(--ideas-accent)' } : {}}>
                        {status.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedIdea.content && (
                  <Button variant="outline" onClick={() => handleExpand(selectedIdea.idea_id)}
                    disabled={expanding === selectedIdea.idea_id}>
                    {expanding === selectedIdea.idea_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Expand Further
                  </Button>
                )}

                <div className="flex justify-end">
                  <Button variant="destructive" onClick={() => handleDeleteIdea(selectedIdea.idea_id)}>
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

export default Ideas;
