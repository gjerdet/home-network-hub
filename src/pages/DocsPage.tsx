import { useState, useEffect, useMemo } from "react";
import { getDocs, addDoc, updateDoc, deleteDoc, getDevices, getNetworks, type DocPage, type Device, type NetworkInfo } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TiptapEditor } from "@/components/TiptapEditor";
import {
  Plus, FileText, Trash2, Edit2, Save, X, ChevronRight, ChevronDown,
  FolderOpen, Search, Server, Globe, Copy, Check,
  Settings, AlertTriangle, BookOpen, Clock, Folder, FolderPlus
} from "lucide-react";

const categories = ["Generelt", "Oppsett", "Konfigurasjon", "Feilsøking", "Prosedyrer"];

const templates: { name: string; icon: typeof FileText; category: string; content: string }[] = [
  {
    name: "Enhetskonfigurasjon",
    icon: Settings,
    category: "Konfigurasjon",
    content: `<h2>Enhetsinformasjon</h2><p>Enhet: <strong>[navn]</strong></p><p>Type: [type]</p><p>IP: [ip-adresse]</p><hr><h2>Konfigurasjon</h2><h3>Grensesnitt</h3><p>Beskriv grensesnittkonfigurasjonen her.</p><h3>Ruting</h3><p>Beskriv rutingkonfigurasjonen her.</p><h3>Brannmurregler</h3><p>Beskriv relevante brannmurregler.</p><hr><h2>Notater</h2><p>Tilleggsinformasjon og kommentarer.</p>`,
  },
  {
    name: "Feilsøkingsguide",
    icon: AlertTriangle,
    category: "Feilsøking",
    content: `<h2>Problem</h2><p>Beskriv problemet her.</p><h2>Symptomer</h2><ul><li>Symptom 1</li><li>Symptom 2</li></ul><h2>Feilsøkingssteg</h2><ol><li>Steg 1: Verifiser tilkobling</li><li>Steg 2: Sjekk logger</li><li>Steg 3: Test med alternativ konfigurasjon</li></ol><h2>Løsning</h2><p>Beskriv løsningen her.</p><h2>Forebygging</h2><p>Hva kan gjøres for å unngå dette i fremtiden?</p>`,
  },
  {
    name: "Nettverksoppsett",
    icon: Globe,
    category: "Oppsett",
    content: `<h2>Nettverksoversikt</h2><p>Beskriv nettverket og dets formål.</p><h3>Subnett</h3><p>VLAN / subnett-informasjon.</p><h3>DHCP</h3><p>DHCP-konfigurasjon og scope.</p><h3>DNS</h3><p>DNS-konfigurasjon.</p><hr><h2>Tilgangskontroll</h2><p>Brannmurregler og ACL-er som gjelder.</p><h2>Tilkoblede enheter</h2><p>Liste over enheter i dette nettverket.</p>`,
  },
  {
    name: "Endringslogg",
    icon: Clock,
    category: "Generelt",
    content: `<h2>Endringslogg</h2><h3>[Dato]</h3><ul><li><strong>Hva:</strong> Beskriv endringen</li><li><strong>Hvorfor:</strong> Årsak til endringen</li><li><strong>Hvem:</strong> Utført av</li><li><strong>Rollback:</strong> Hvordan reversere</li></ul><hr><h3>[Forrige dato]</h3><ul><li>Forrige endring...</li></ul>`,
  },
  {
    name: "Prosedyre / Runbook",
    icon: BookOpen,
    category: "Prosedyrer",
    content: `<h2>Formål</h2><p>Beskriv hva denne prosedyren dekker.</p><h2>Forutsetninger</h2><ul><li>Tilgang til [system]</li><li>Verktøy: [verktøy]</li></ul><h2>Steg-for-steg</h2><ol><li>Logg inn på enheten</li><li>Kjør kommando: <code>show running-config</code></li><li>Verifiser output</li></ol><h2>Verifisering</h2><p>Beskriv hvordan du bekrefter at prosedyren var vellykket.</p><h2>Kontaktpersoner</h2><p>Hvem skal kontaktes ved problemer.</p>`,
  },
];

// Tree node type
interface TreeNode {
  doc: DocPage;
  children: TreeNode[];
}

function buildTree(docs: DocPage[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  docs.forEach(d => map.set(d.id, { doc: d, children: [] }));
  docs.forEach(d => {
    const node = map.get(d.id)!;
    if (d.parentId && map.has(d.parentId)) {
      map.get(d.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.doc.order || 0) - (b.doc.order || 0));
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

export default function DocsPage() {
  const [docs, setDocs] = useState<DocPage[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "Generelt", tags: "", parentId: "", linkedDevices: [] as string[], linkedNetworks: [] as string[] });
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    setDocs(getDocs());
    setDevices(getDevices());
    setNetworks(getNetworks());
  }, []);

  const tree = useMemo(() => buildTree(docs), [docs]);
  const selectedDoc = docs.find(d => d.id === selectedDocId) || null;

  const filteredDocs = searchFilter
    ? docs.filter(d => d.title.toLowerCase().includes(searchFilter.toLowerCase()) || d.content.toLowerCase().includes(searchFilter.toLowerCase()))
    : null;

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodes);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedNodes(next);
  };

  const reload = () => setDocs(getDocs());

  const handleSave = () => {
    if (!form.title) return;
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    const payload = {
      title: form.title,
      content: form.content,
      category: form.category,
      tags,
      parentId: form.parentId || undefined,
      linkedDevices: form.linkedDevices,
      linkedNetworks: form.linkedNetworks,
    };
    if (editId) {
      updateDoc(editId, payload);
    } else {
      addDoc(payload);
    }
    reload();
    setShowForm(false);
    setEditId(null);
    setForm({ title: "", content: "", category: "Generelt", tags: "", parentId: "", linkedDevices: [], linkedNetworks: [] });
  };

  const startEdit = (d: DocPage) => {
    setForm({
      title: d.title,
      content: d.content,
      category: d.category,
      tags: d.tags.join(", "),
      parentId: d.parentId || "",
      linkedDevices: d.linkedDevices || [],
      linkedNetworks: d.linkedNetworks || [],
    });
    setEditId(d.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    // Re-parent children to root
    const children = docs.filter(d => d.parentId === id);
    children.forEach(c => updateDoc(c.id, { parentId: undefined }));
    deleteDoc(id);
    reload();
    if (selectedDocId === id) setSelectedDocId(null);
  };

  const startNewDoc = (parentId?: string) => {
    setForm({ title: "", content: "", category: "Generelt", tags: "", parentId: parentId || "", linkedDevices: [], linkedNetworks: [] });
    setEditId(null);
    setShowForm(true);
    setShowTemplates(true);
  };

  const applyTemplate = (t: typeof templates[0]) => {
    setForm(f => ({ ...f, content: t.content, category: t.category }));
    setShowTemplates(false);
  };

  // Render tree node
  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.doc.id);
    const isSelected = selectedDocId === node.doc.id;

    return (
      <div key={node.doc.id}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors group ${
            isSelected ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary"
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            setSelectedDocId(node.doc.id);
            setShowForm(false);
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.doc.id); }}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="truncate flex-1">{node.doc.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); startNewDoc(node.doc.id); }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary shrink-0"
            title="Ny underside"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children.map(c => renderNode(c, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-4rem)] -m-6">
      {/* Sidebar / Tree */}
      <div className="w-72 border-r border-border flex flex-col bg-card shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-foreground flex-1">Dokumentasjon</h2>
            <button onClick={() => startNewDoc()} className="text-primary hover:text-primary/80" title="Nytt dokument"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Søk..."
              className="bg-secondary border-border h-8 text-xs pl-8"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {searchFilter && filteredDocs ? (
            filteredDocs.length > 0 ? (
              filteredDocs.map(d => (
                <div
                  key={d.id}
                  onClick={() => { setSelectedDocId(d.id); setShowForm(false); setSearchFilter(""); }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
                    selectedDocId === d.id ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{d.title}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{d.category}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Ingen treff</p>
            )
          ) : (
            tree.map(n => renderNode(n))
          )}

          {docs.length === 0 && !searchFilter && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Ingen dokumenter ennå</p>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-border text-[10px] text-muted-foreground">
          {docs.length} dokumenter
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {showForm ? (
          <div className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{editId ? "Rediger dokument" : "Nytt dokument"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            {/* Templates */}
            {!editId && showTemplates && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Start fra mal</p>
                <div className="grid grid-cols-3 gap-2">
                  {templates.map(t => (
                    <button
                      key={t.name}
                      onClick={() => applyTemplate(t)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/50 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                    >
                      <t.icon className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t.category}</p>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/50 hover:border-primary/40 transition-colors text-left"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Tomt dokument</p>
                      <p className="text-[10px] text-muted-foreground">Start fra scratch</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Title + category + parent */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="col-span-1">
                <label className="text-xs text-muted-foreground mb-1 block">Tittel *</label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" placeholder="Dokumenttittel" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Kategori</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Overordnet side</label>
                <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
                  <option value="">Ingen (toppnivå)</option>
                  {docs.filter(d => d.id !== editId).map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Tags (kommaseparert)</label>
              <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="vpn, openvpn, tunnel" className="bg-secondary border-border" />
            </div>

            {/* Linked devices and networks */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Server className="h-3 w-3" /> Koblede enheter</label>
                <div className="bg-secondary border border-border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                  {devices.map(d => (
                    <label key={d.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-background rounded px-1 py-0.5">
                      <input
                        type="checkbox"
                        checked={form.linkedDevices.includes(d.id)}
                        onChange={e => {
                          const next = e.target.checked ? [...form.linkedDevices, d.id] : form.linkedDevices.filter(x => x !== d.id);
                          setForm({ ...form, linkedDevices: next });
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-foreground">{d.name}</span>
                      <span className="text-muted-foreground ml-auto">{d.ip}</span>
                    </label>
                  ))}
                  {devices.length === 0 && <p className="text-[10px] text-muted-foreground">Ingen enheter registrert</p>}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Globe className="h-3 w-3" /> Koblede nettverk</label>
                <div className="bg-secondary border border-border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                  {networks.map(n => (
                    <label key={n.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-background rounded px-1 py-0.5">
                      <input
                        type="checkbox"
                        checked={form.linkedNetworks.includes(n.id)}
                        onChange={e => {
                          const next = e.target.checked ? [...form.linkedNetworks, n.id] : form.linkedNetworks.filter(x => x !== n.id);
                          setForm({ ...form, linkedNetworks: next });
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-foreground">{n.name}</span>
                      <span className="text-muted-foreground ml-auto">{n.subnet}</span>
                    </label>
                  ))}
                  {networks.length === 0 && <p className="text-[10px] text-muted-foreground">Ingen nettverk registrert</p>}
                </div>
              </div>
            </div>

            {/* Editor */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Innhold</label>
              <TiptapEditor content={form.content} onChange={html => setForm({ ...form, content: html })} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Avbryt</Button>
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button>
            </div>
          </div>
        ) : selectedDoc ? (
          /* View document */
          <div className="p-6 max-w-4xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{selectedDoc.category}</span>
              {selectedDoc.tags.map(t => <span key={t} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">{t}</span>)}
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">{selectedDoc.title}</h1>
            <p className="text-xs text-muted-foreground mb-6">
              Oppdatert {new Date(selectedDoc.updatedAt).toLocaleDateString("nb-NO")}
            </p>

            {/* Linked items */}
            {((selectedDoc.linkedDevices && selectedDoc.linkedDevices.length > 0) || (selectedDoc.linkedNetworks && selectedDoc.linkedNetworks.length > 0)) && (
              <div className="flex flex-wrap gap-2 mb-6 p-3 bg-secondary/50 rounded-lg border border-border">
                {selectedDoc.linkedDevices?.map(id => {
                  const d = devices.find(dev => dev.id === id);
                  return d ? (
                    <span key={id} className="flex items-center gap-1 text-xs bg-background border border-border px-2 py-1 rounded">
                      <Server className="h-3 w-3 text-primary" /> {d.name}
                    </span>
                  ) : null;
                })}
                {selectedDoc.linkedNetworks?.map(id => {
                  const n = networks.find(net => net.id === id);
                  return n ? (
                    <span key={id} className="flex items-center gap-1 text-xs bg-background border border-border px-2 py-1 rounded">
                      <Globe className="h-3 w-3 text-info" /> {n.name} ({n.subnet})
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* Content with copy buttons on code blocks */}
            <DocContent html={selectedDoc.content} />

            <div className="flex gap-2 mt-8 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => startEdit(selectedDoc)}><Edit2 className="h-3 w-3 mr-1" /> Rediger</Button>
              <Button variant="outline" size="sm" onClick={() => startNewDoc(selectedDoc.id)}><Plus className="h-3 w-3 mr-1" /> Ny underside</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedDoc.id)}><Trash2 className="h-3 w-3 mr-1" /> Slett</Button>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-1">Dokumentasjon</h2>
              <p className="text-sm text-muted-foreground mb-4">Velg et dokument fra treet, eller opprett et nytt.</p>
              <Button onClick={() => startNewDoc()}><Plus className="h-4 w-4 mr-1" /> Nytt dokument</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
