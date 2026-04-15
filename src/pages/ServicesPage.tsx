import { useState } from "react";
import { ExternalLink, Plus, Trash2, Pencil, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export interface ServiceLink {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
}

const STORAGE_KEY = "netdocs_services";

const getServices = (): ServiceLink[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveServices = (s: ServiceLink[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceLink[]>(getServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceLink | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const openNew = () => {
    setEditing(null);
    setName("");
    setUrl("https://");
    setDescription("");
    setDialogOpen(true);
  };

  const openEdit = (s: ServiceLink) => {
    setEditing(s);
    setName(s.name);
    setUrl(s.url);
    setDescription(s.description || "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !url.trim()) return;
    let updated: ServiceLink[];
    if (editing) {
      updated = services.map(s =>
        s.id === editing.id ? { ...s, name: name.trim(), url: url.trim(), description: description.trim() } : s
      );
    } else {
      updated = [...services, { id: crypto.randomUUID(), name: name.trim(), url: url.trim(), description: description.trim() }];
    }
    setServices(updated);
    saveServices(updated);
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = services.filter(s => s.id !== deleteId);
    setServices(updated);
    saveServices(updated);
    setDeleteId(null);
  };

  const getFavicon = (serviceUrl: string) => {
    try {
      const u = new URL(serviceUrl);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenester</h1>
          <p className="text-muted-foreground text-sm mt-1">Snarvegar til system og appar</p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Legg til
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Ingen tenester lagt til enno</p>
            <Button onClick={openNew} variant="outline" size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-1" /> Legg til første teneste
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {services.map(s => {
            const favicon = getFavicon(s.url);
            return (
              <Card
                key={s.id}
                className="bg-card border-border hover:border-primary/40 transition-colors group cursor-pointer"
                onClick={() => window.open(s.url, "_blank", "noopener")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {favicon ? (
                        <img src={favicon} alt="" className="h-6 w-6 shrink-0 rounded" onError={e => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <Globe className="h-6 w-6 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{s.name}</p>
                        {s.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{s.description}</p>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono mt-2 truncate">{s.url}</p>
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost" size="sm" className="h-6 px-2 text-xs"
                      onClick={e => { e.stopPropagation(); openEdit(s); }}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Rediger
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive"
                      onClick={e => { e.stopPropagation(); setDeleteId(s.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Rediger teneste" : "Legg til teneste"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Namn</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Proxmox, Unifi, Portainer..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL</label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://192.168.1.1:8006" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Skildring (valfritt)</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Hovud-hypervisor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={!name.trim() || !url.trim()}>Lagre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => { if (!open) setDeleteId(null); }}
        title="Slett teneste"
        description="Er du sikker på at du vil slette denne tenesta?"
        onConfirm={handleDelete}
      />
    </div>
  );
}
