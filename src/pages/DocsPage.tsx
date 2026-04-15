import { useState, useEffect } from "react";
import { getDocs, addDoc, updateDoc, deleteDoc, type DocPage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Trash2, Edit2, Save, X, Eye, ArrowLeft } from "lucide-react";

function renderContent(content: string) {
  // Simple markdown-like rendering
  const lines = content.split("\n");
  return lines.map((line, i) => {
    // Code blocks
    if (line.startsWith("```")) return null;
    
    // Headers
    if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold text-foreground mt-4 mb-2">{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold text-foreground mt-6 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold text-foreground mt-6 mb-3">{line.slice(2)}</h1>;
    
    // Links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    if (linkRegex.test(line)) {
      const parts = line.split(linkRegex);
      return (
        <p key={i} className="text-secondary-foreground mb-1">
          {parts.map((part, j) => {
            if (j % 3 === 1) return <a key={j} href={parts[j + 1]} target="_blank" rel="noopener noreferrer" className="text-primary underline">{part}</a>;
            if (j % 3 === 2) return null;
            return part;
          })}
        </p>
      );
    }

    // Bold
    if (line.includes("**")) {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return <p key={i} className="text-secondary-foreground mb-1">{parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-foreground">{p}</strong> : p)}</p>;
    }

    // Lists
    if (line.startsWith("- ")) return <li key={i} className="text-secondary-foreground ml-4 list-disc">{line.slice(2)}</li>;

    // Empty line
    if (line.trim() === "") return <br key={i} />;

    return <p key={i} className="text-secondary-foreground mb-1">{line}</p>;
  });
}

function renderWithCodeBlocks(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.split("\n");
      const lang = lines[0].slice(3);
      const code = lines.slice(1, -1).join("\n");
      return (
        <div key={i} className="my-4 rounded-lg overflow-hidden border border-border">
          {lang && <div className="bg-secondary px-4 py-1 text-xs text-muted-foreground border-b border-border">{lang}</div>}
          <pre className="bg-secondary/50 p-4 overflow-x-auto"><code className="text-sm font-mono text-foreground">{code}</code></pre>
        </div>
      );
    }
    return <div key={i}>{renderContent(part)}</div>;
  });
}

const categories = ["Generelt", "Oppsett", "Konfigurasjon", "Feilsøking", "Prosedyrer"];

export default function DocsPage() {
  const [docs, setDocs] = useState<DocPage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewDoc, setViewDoc] = useState<DocPage | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "Generelt", tags: "" });
  const [filter, setFilter] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);

  useEffect(() => { setDocs(getDocs()); }, []);

  const filtered = docs.filter(d => {
    const matchText = d.title.toLowerCase().includes(filter.toLowerCase()) || d.content.toLowerCase().includes(filter.toLowerCase());
    const matchCat = !catFilter || d.category === catFilter;
    return matchText && matchCat;
  });

  const handleSave = () => {
    if (!form.title) return;
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (editId) {
      updateDoc(editId, { title: form.title, content: form.content, category: form.category, tags });
    } else {
      addDoc({ title: form.title, content: form.content, category: form.category, tags });
    }
    setDocs(getDocs());
    setShowForm(false);
    setEditId(null);
    setForm({ title: "", content: "", category: "Generelt", tags: "" });
  };

  const handleEdit = (d: DocPage) => {
    setForm({ title: d.title, content: d.content, category: d.category, tags: d.tags.join(", ") });
    setEditId(d.id);
    setViewDoc(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteDoc(id);
    setDocs(getDocs());
    setViewDoc(null);
  };

  if (viewDoc) {
    return (
      <div>
        <button onClick={() => setViewDoc(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Tilbake
        </button>
        <div className="bg-card border border-border rounded-lg p-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{viewDoc.category}</span>
            {viewDoc.tags.map(t => <span key={t} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">{t}</span>)}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-6">{viewDoc.title}</h1>
          <div className="prose-dark">{renderWithCodeBlocks(viewDoc.content)}</div>
          <div className="flex gap-2 mt-8 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => handleEdit(viewDoc)}><Edit2 className="h-3 w-3 mr-1" /> Rediger</Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(viewDoc.id)}><Trash2 className="h-3 w-3 mr-1" /> Slett</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dokumentasjon</h1>
          <p className="text-sm text-muted-foreground mt-1">{docs.length} dokumenter</p>
        </div>
        <div className="flex gap-3">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Søk dokumenter..." className="w-56 bg-secondary border-border" />
          <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ title: "", content: "", category: "Generelt", tags: "" }); }}>
            <Plus className="h-4 w-4 mr-1" /> Nytt dokument
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setCatFilter(null)} className={`text-xs px-3 py-1 rounded-full transition-colors ${!catFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>Alle</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`text-xs px-3 py-1 rounded-full transition-colors ${catFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{c}</button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editId ? "Rediger dokument" : "Nytt dokument"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Tittel *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Kategori</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1 block">Tags (kommaseparert)</label>
            <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="vpn, openvpn, tunnel" className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Innhold (støtter markdown, kodeblokker med ```)</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full h-64 rounded-md bg-secondary border border-border px-4 py-3 text-sm font-mono text-foreground resize-y" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(d => (
          <div key={d.id} onClick={() => setViewDoc(d)} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{d.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{d.content.slice(0, 120)}...</div>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0">{d.category}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !showForm && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Ingen dokumenter ennå</p>
        </div>
      )}
    </div>
  );
}
