import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Plus,
  Link2,
  ExternalLink,
  Archive,
  Search,
  Filter,
  Briefcase,
  FileText,
  Wrench,
  Sparkles,
  Play,
  Check,
  Clock,
  Trash2,
  Edit2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "job-lead", label: "Job Lead", icon: Briefcase, color: "#1E3A5F" },
  { id: "article", label: "Article", icon: FileText, color: "#2D5016" },
  { id: "resource", label: "Resource", icon: Link2, color: "#5C3D7A" },
  { id: "tool", label: "Tool", icon: Wrench, color: "#3D5A7A" },
  { id: "inspiration", label: "Inspiration", icon: Sparkles, color: "#8A3D2C" },
  { id: "watch-later", label: "Watch Later", icon: Play, color: "#7A6A3D" },
];

const SOURCES = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "Twitter/X" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "reddit", label: "Reddit" },
  { id: "newsletter", label: "Newsletter" },
  { id: "manual", label: "Manual" },
];

const STATUSES = [
  { id: "saved", label: "Saved", color: "#8A7A6A" },
  { id: "reviewed", label: "Reviewed", color: "#5C7A9A" },
  { id: "applied", label: "Applied", color: "#2D5016" },
  { id: "read", label: "Read", color: "#7C9A6E" },
  { id: "archived", label: "Archived", color: "#999" },
];

const LinkVault = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [newLink, setNewLink] = useState({
    url: "",
    title: "",
    category: "resource",
    source: "manual",
    note: "",
    company: "",
    role: "",
    deadline: "",
    tags: []
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchLinks();
  }, [filterCategory, filterStatus]);

  const fetchLinks = async () => {
    try {
      let url = `${API}/links`;
      const params = new URLSearchParams();
      if (filterCategory !== "all") params.append("category", filterCategory);
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, { withCredentials: true });
      setLinks(response.data);
    } catch (error) {
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!newLink.url.trim() || !newLink.title.trim()) {
      toast.error("Please enter URL and title");
      return;
    }

    try {
      await axios.post(`${API}/links`, newLink, { withCredentials: true });
      toast.success("Link saved!");
      setCreateDialogOpen(false);
      setNewLink({
        url: "", title: "", category: "resource", source: "manual",
        note: "", company: "", role: "", deadline: "", tags: []
      });
      fetchLinks();
    } catch (error) {
      toast.error("Failed to save link");
    }
  };

  const handleUpdateStatus = async (linkId, status) => {
    try {
      await axios.put(`${API}/links/${linkId}`, { status }, { withCredentials: true });
      fetchLinks();
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await axios.delete(`${API}/links/${linkId}`, { withCredentials: true });
      fetchLinks();
      toast.success("Link deleted");
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const handleBulkArchive = async () => {
    const oldLinks = links.filter(l => l.status === "saved" &&
      new Date(l.created_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    if (oldLinks.length === 0) {
      toast.info("No old links to archive");
      return;
    }

    try {
      await axios.post(`${API}/links/bulk-archive`,
        { link_ids: oldLinks.map(l => l.link_id) },
        { withCredentials: true }
      );
      fetchLinks();
      toast.success(`Archived ${oldLinks.length} old links`);
    } catch (error) {
      toast.error("Failed to archive links");
    }
  };

  const filteredLinks = links.filter(link => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return link.title.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query) ||
      (link.note && link.note.toLowerCase().includes(query));
  });

  const getCategoryIcon = (categoryId) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.icon : Link2;
  };

  const getCategoryColor = (categoryId) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.color : "#8A7A6A";
  };

  const unreviewed = links.filter(l => l.status === "saved").length;

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--vault-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div data-testid="link-vault-page" className="p-6 md:p-12 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--vault-bg)', minHeight: '100vh' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl mb-2" style={{ color: 'var(--dashboard-text)' }}>
              Link Vault
            </h1>
            <p className="font-body text-sm" style={{ color: 'var(--dashboard-text)', opacity: 0.6 }}>
              Your curated collection of resources
            </p>
            {unreviewed > 0 && (
              <Badge className="mt-2" style={{ backgroundColor: 'var(--vault-accent)', color: 'white' }}>
                {unreviewed} unreviewed
              </Badge>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBulkArchive} className="rounded-full">
              <Archive className="w-4 h-4 mr-2" /> Sweep Old
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="create-link-btn" className="rounded-full px-6 text-white"
                  style={{ backgroundColor: 'var(--vault-accent)' }}>
                  <Plus className="w-4 h-4 mr-2" /> Save Link
                </Button>
              </DialogTrigger>
              <DialogContent className="nucleus-card border-0 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">Save New Link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <Label>URL</Label>
                    <Input data-testid="link-url-input" placeholder="https://..."
                      value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      className="mt-1" />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input data-testid="link-title-input" placeholder="Link title"
                      value={newLink.title} onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                      className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select value={newLink.category} onValueChange={(v) => setNewLink({ ...newLink, category: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Source</Label>
                      <Select value={newLink.source} onValueChange={(v) => setNewLink({ ...newLink, source: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SOURCES.map(src => (
                            <SelectItem key={src.id} value={src.id}>{src.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newLink.category === "job-lead" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Company</Label>
                          <Input value={newLink.company} onChange={(e) => setNewLink({ ...newLink, company: e.target.value })}
                            className="mt-1" />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Input value={newLink.role} onChange={(e) => setNewLink({ ...newLink, role: e.target.value })}
                            className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label>Application Deadline</Label>
                        <Input type="date" value={newLink.deadline}
                          onChange={(e) => setNewLink({ ...newLink, deadline: e.target.value })}
                          className="mt-1" />
                      </div>
                    </>
                  )}
                  <div>
                    <Label>Note</Label>
                    <Textarea placeholder="Personal note about this link..."
                      value={newLink.note} onChange={(e) => setNewLink({ ...newLink, note: e.target.value })}
                      className="mt-1" />
                  </div>
                  <Button data-testid="save-link-btn" onClick={handleCreateLink}
                    className="w-full rounded-full text-white" style={{ backgroundColor: 'var(--vault-accent)' }}>
                    Save Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <Input placeholder="Search links..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10" />
          </div>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLinks.map((link) => {
          const CategoryIcon = getCategoryIcon(link.category);
          const categoryColor = getCategoryColor(link.category);

          return (
            <motion.div key={link.link_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="nucleus-card border-0 h-full group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${categoryColor}20` }}>
                      <CategoryIcon className="w-5 h-5" style={{ color: categoryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-body font-medium text-sm truncate" style={{ color: 'var(--dashboard-text)' }}>
                        {link.title}
                      </h3>
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs opacity-60 truncate block hover:opacity-100 transition-opacity">
                        {link.url}
                      </a>
                      {link.category === "job-lead" && link.company && (
                        <p className="text-xs mt-1" style={{ color: categoryColor }}>
                          {link.company} {link.role && `• ${link.role}`}
                        </p>
                      )}
                      {link.note && (
                        <p className="text-xs mt-2 opacity-60 line-clamp-2">{link.note}</p>
                      )}
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5">
                    <div className="flex gap-1">
                      {STATUSES.filter(s => s.id !== "archived").map((status) => (
                        <button key={status.id}
                          onClick={() => handleUpdateStatus(link.link_id, status.id)}
                          className={`px-2 py-1 rounded text-xs transition-all ${link.status === status.id ? 'text-white' : 'opacity-50 hover:opacity-100'
                            }`}
                          style={{ backgroundColor: link.status === status.id ? status.color : 'transparent' }}>
                          {status.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => handleDeleteLink(link.link_id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredLinks.length === 0 && (
        <div className="text-center py-12">
          <Link2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-body" style={{ color: 'var(--dashboard-text)', opacity: 0.5 }}>
            No links found. Save your first link!
          </p>
        </div>
      )}
    </div>
  );
};

export default LinkVault;
