import { useState, useEffect } from "react";
import {
  getFirewalls, addFirewall, deleteFirewall, updateFirewall, type Firewall,
  getFirewallRules, addFirewallRule, deleteFirewallRule, saveFirewallRules, updateFirewallRule,
  getNetworks, getDevices, type FirewallRule, type Device,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Trash2, X, Save, Flame, ArrowUp, ArrowDown, Shield, ShieldOff,
  ChevronDown, ChevronRight, LayoutGrid, List, Edit2, ArrowLeft, Server,
} from "lucide-react";
import { RuleFlowDiagram } from "@/components/RuleFlowDiagram";
import { SubNav } from "@/components/SubNav";

const zoneColors: Record<string, string> = {
  WAN: "bg-destructive/20 text-destructive border-destructive/30",
  LAN: "bg-success/20 text-success border-success/30",
  DMZ: "bg-warning/20 text-warning border-warning/30",
  WLAN: "bg-info/20 text-info border-info/30",
  VPN: "bg-primary/20 text-primary border-primary/30",
  MGMT: "bg-accent text-accent-foreground border-accent-foreground/30",
  IOT: "bg-warning/15 text-warning border-warning/20",
  GUEST: "bg-muted text-muted-foreground border-border",
};

const actionColors = { allow: "bg-success/20 text-success", deny: "bg-destructive/20 text-destructive", reject: "bg-warning/20 text-warning" };
const actionLabels = { allow: "Tillat", deny: "Blokker", reject: "Avvis" };

const fwStatusBadge: Record<Firewall["status"], { bg: string; dot: string; label: string }> = {
  online: { bg: "bg-success/15 text-success border-success/30", dot: "bg-success", label: "Online" },
  offline: { bg: "bg-destructive/15 text-destructive border-destructive/30", dot: "bg-destructive", label: "Offline" },
  maintenance: { bg: "bg-warning/15 text-warning border-warning/30", dot: "bg-warning", label: "Vedlikehold" },
};

// ═══════════════════════════════
// Firewall Detail (rules view)
// ═══════════════════════════════
function FirewallDetail({ fw, onBack }: { fw: Firewall; onBack: () => void }) {
  const [allRules, setAllRules] = useState<FirewallRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "matrix">("list");
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);

  const networks = getNetworks();
  const networkZones = networks.map(n => n.name);
  const zones = networkZones.length > 0 ? networkZones : ["LAN", "WAN"];

  const emptyForm = {
    name: "", action: "allow" as FirewallRule["action"], protocol: "TCP",
    sourceZone: zones[0] || "LAN", destinationZone: zones[1] || "WAN",
    source: "any", destination: "any", port: "",
    service: "", schedule: "", logging: true, enabled: true, notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const reload = () => setAllRules(getFirewallRules());
  useEffect(reload, []);

  const rules = allRules.filter(r => r.firewallId === fw.id);
  const filteredRules = zoneFilter ? rules.filter(r => r.sourceZone === zoneFilter || r.destinationZone === zoneFilter) : rules;

  const handleSave = () => {
    if (!form.name) return;
    if (editId) {
      updateFirewallRule(editId, form);
    } else {
      addFirewallRule({ ...form, firewallId: fw.id, order: rules.length, hitCount: 0 });
    }
    reload(); setShowForm(false); setEditId(null); setForm(emptyForm);
  };

  const handleEdit = (r: FirewallRule) => {
    setForm({
      name: r.name, action: r.action, protocol: r.protocol,
      sourceZone: r.sourceZone, destinationZone: r.destinationZone,
      source: r.source, destination: r.destination, port: r.port,
      service: r.service || "", schedule: r.schedule || "",
      logging: r.logging, enabled: r.enabled, notes: r.notes || "",
    });
    setEditId(r.id); setShowForm(true); setExpandedRule(null);
  };

  const handleDelete = (id: string) => { deleteFirewallRule(id); reload(); if (expandedRule === id) setExpandedRule(null); };

  const toggleEnabled = (id: string) => {
    const updated = allRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    saveFirewallRules(updated); setAllRules(updated);
  };

  const moveRule = (id: string, dir: -1 | 1) => {
    const fwRules = [...rules];
    const idx = fwRules.findIndex(r => r.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === fwRules.length - 1)) return;
    [fwRules[idx], fwRules[idx + dir]] = [fwRules[idx + dir], fwRules[idx]];
    fwRules.forEach((r, i) => r.order = i);
    const otherRules = allRules.filter(r => r.firewallId !== fw.id);
    saveFirewallRules([...otherRules, ...fwRules]);
    setAllRules([...otherRules, ...fwRules]);
  };

  const usedZones = [...new Set(rules.flatMap(r => [r.sourceZone, r.destinationZone]))].sort();
  const matrixData = (src: string, dst: string) => rules.filter(r => r.sourceZone === src && r.destinationZone === dst);
  const selectClass = "w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground";
  const s = fwStatusBadge[fw.status];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <button onClick={onBack} className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Brannmurer</button>
        <span>/</span>
        <span className="text-foreground">{fw.name}</span>
      </div>

      {/* Header */}
      <div className="bg-card border border-border rounded p-4 mb-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center">
          <Shield className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground">{fw.name}</h1>
            <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full border ${s.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {fw.manufacturer && <span>{fw.manufacturer}</span>}
            {fw.model && <><span>·</span><span>{fw.model}</span></>}
            {fw.ip && <><span>·</span><span className="font-mono">{fw.ip}</span></>}
            {fw.os && <><span>·</span><span>{fw.os}</span></>}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{rules.length} regler</span>
      </div>

      {/* Sub navigation */}
      <SubNav
        tabs={[
          { key: "list", label: "Regler", icon: List },
          { key: "matrix", label: "Matrise", icon: LayoutGrid },
        ]}
        active={viewMode}
        onChange={k => setViewMode(k as any)}
        right={
          <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}>
            <Plus className="h-4 w-4 mr-1" /> Ny regel
          </Button>
        }
      />

      {/* Zone filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setZoneFilter(null)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${!zoneFilter ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"}`}>Alle soner</button>
        {zones.map(z => (
          <button key={z} onClick={() => setZoneFilter(zoneFilter === z ? null : z)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${zoneFilter === z ? zoneColors[z] || "bg-primary/20 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:text-foreground"}`}>{z}</button>
        ))}
      </div>

      {/* Rule form */}
      {showForm && (
        <div className="bg-card border border-border rounded p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">{editId ? "Rediger regel" : "Ny regel"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>

          <div className="flex items-center gap-4 mb-6 p-4 bg-background rounded border border-border">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Kildesone</label>
              <select value={form.sourceZone} onChange={e => setForm({ ...form, sourceZone: e.target.value })} className={selectClass}>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="text-muted-foreground text-lg mt-4">→</div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Handling</label>
              <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value as any })} className={selectClass}>
                <option value="allow">✅ Tillat</option><option value="deny">❌ Blokker</option><option value="reject">⚠️ Avvis</option>
              </select>
            </div>
            <div className="text-muted-foreground text-lg mt-4">→</div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Destinasjonssone</label>
              <select value={form.destinationZone} onChange={e => setForm({ ...form, destinationZone: e.target.value })} className={selectClass}>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Navn *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Protokoll</label>
              <select value={form.protocol} onChange={e => setForm({ ...form, protocol: e.target.value })} className={selectClass}>
                <option>TCP</option><option>UDP</option><option>ICMP</option><option>TCP/UDP</option><option>Any</option>
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Kilde</label><Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Destinasjon</label><Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Port</label><Input value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} placeholder="80, 443" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Tjeneste</label><Input value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} placeholder="HTTP, HTTPS" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Tidsplan</label><Input value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="Alltid" className="bg-secondary border-border" /></div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.logging} onChange={e => setForm({ ...form, logging: e.target.checked })} className="rounded" /> Logg
              </label>
            </div>
          </div>
          <div className="mt-4"><label className="text-xs text-muted-foreground mb-1 block">Notater</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full h-16 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground resize-none" />
          </div>
          {form.name && (
            <div className="mt-4 border border-border rounded bg-background p-2">
              <p className="text-[10px] text-muted-foreground mb-1 text-center uppercase tracking-wide">Forhåndsvisning</p>
              <RuleFlowDiagram rule={{ id: "preview", firewallId: fw.id, ...form, order: 0, hitCount: 0 }} />
            </div>
          )}
          <div className="mt-4 flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button></div>
        </div>
      )}

      {/* Matrix */}
      {viewMode === "matrix" && usedZones.length > 0 && (
        <div className="bg-card border border-border rounded p-4 mb-6 overflow-x-auto">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-semibold">Sonematrise — Kilde (↓) til Destinasjon (→)</p>
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-muted-foreground font-medium"></th>
                {usedZones.map(z => <th key={z} className="px-3 py-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded border ${zoneColors[z] || "bg-secondary text-foreground border-border"}`}>{z}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {usedZones.map(src => (
                <tr key={src} className="border-t border-border">
                  <td className="px-3 py-2"><span className={`text-[10px] px-2 py-0.5 rounded border ${zoneColors[src] || "bg-secondary text-foreground border-border"}`}>{src}</span></td>
                  {usedZones.map(dst => {
                    const cellRules = matrixData(src, dst);
                    const hasAllow = cellRules.some(r => r.action === "allow" && r.enabled);
                    const hasDeny = cellRules.some(r => r.action === "deny" && r.enabled);
                    return (
                      <td key={dst} className="px-3 py-2 text-center">
                        {cellRules.length > 0 ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${hasAllow && !hasDeny ? "bg-success/15 text-success" : hasDeny && !hasAllow ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
                            {cellRules.length} {cellRules.length === 1 ? "regel" : "regler"}
                          </div>
                        ) : <span className="text-muted-foreground/30">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rules table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full text-sm table-striped">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground bg-secondary/50">
              <th className="px-3 py-2.5 font-medium text-xs w-8">#</th>
              <th className="px-3 py-2.5 font-medium text-xs w-6"></th>
              <th className="px-3 py-2.5 font-medium text-xs">Navn</th>
              <th className="px-3 py-2.5 font-medium text-xs">Handling</th>
              <th className="px-3 py-2.5 font-medium text-xs">Fra</th>
              <th className="px-3 py-2.5 font-medium text-xs">Til</th>
              <th className="px-3 py-2.5 font-medium text-xs">Tjeneste</th>
              <th className="px-3 py-2.5 font-medium text-xs">Kilde</th>
              <th className="px-3 py-2.5 font-medium text-xs">Dest.</th>
              <th className="px-3 py-2.5 font-medium text-xs w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((r, i) => (
              <tbody key={r.id}>
                <tr
                  className={`border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors ${!r.enabled ? "opacity-40" : ""} ${expandedRule === r.id ? "bg-secondary/30" : ""}`}
                  onClick={() => setExpandedRule(prev => prev === r.id ? null : r.id)}
                >
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{expandedRule === r.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground text-xs">{r.name}</td>
                  <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded ${actionColors[r.action]}`}>{actionLabels[r.action]}</span></td>
                  <td className="px-3 py-2.5"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${zoneColors[r.sourceZone] || "bg-secondary border-border"}`}>{r.sourceZone}</span></td>
                  <td className="px-3 py-2.5"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${zoneColors[r.destinationZone] || "bg-secondary border-border"}`}>{r.destinationZone}</span></td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{r.service || `${r.protocol}/${r.port || "*"}`}</td>
                  <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs">{r.source}</td>
                  <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs">{r.destination}</td>
                  <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(r)} className="p-1 text-muted-foreground hover:text-primary"><Edit2 className="h-3 w-3" /></button>
                      <button onClick={() => moveRule(r.id, -1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowUp className="h-3 w-3" /></button>
                      <button onClick={() => moveRule(r.id, 1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowDown className="h-3 w-3" /></button>
                      <button onClick={() => toggleEnabled(r.id)} className="p-1 text-muted-foreground hover:text-foreground">{r.enabled ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}</button>
                      <button onClick={() => handleDelete(r.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
                {expandedRule === r.id && (
                  <tr className="border-b border-border bg-background/50">
                    <td colSpan={10}><RuleFlowDiagram rule={r} /></td>
                  </tr>
                )}
              </tbody>
            ))}
          </tbody>
        </table>
        {filteredRules.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Ingen regler {zoneFilter ? `for sone ${zoneFilter}` : "definert"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════
// Main Firewall Page (list of firewalls)
// ═══════════════════════════════
export default function FirewallPage() {
  const [firewalls, setFirewalls] = useState<Firewall[]>([]);
  const [selectedFw, setSelectedFw] = useState<Firewall | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [allRules, setAllRules] = useState<FirewallRule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const emptyForm = { name: "", manufacturer: "", model: "", ip: "", os: "", description: "", status: "online" as Firewall["status"] };
  const [form, setForm] = useState(emptyForm);

  const reload = () => { setFirewalls(getFirewalls()); setAllRules(getFirewallRules()); setDevices(getDevices()); };
  useEffect(reload, []);

  const handleSave = () => {
    if (!form.name) return;
    if (editId) {
      updateFirewall(editId, form);
    } else {
      addFirewall(form);
    }
    reload(); setShowForm(false); setEditId(null); setForm(emptyForm);
  };

  const handleEdit = (fw: Firewall) => {
    setForm({
      name: fw.name, manufacturer: fw.manufacturer || "", model: fw.model || "",
      ip: fw.ip || "", os: fw.os || "", description: fw.description || "", status: fw.status,
    });
    setEditId(fw.id); setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteFirewall(id); reload();
  };

  const selectClass = "w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground";

  if (selectedFw) {
    return <FirewallDetail fw={selectedFw} onBack={() => { setSelectedFw(null); reload(); }} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Brannmurer</h1>
          <p className="text-xs text-muted-foreground mt-1">{firewalls.length} brannmurer registrert</p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}>
          <Plus className="h-4 w-4 mr-1" /> Ny brannmur
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">{editId ? "Rediger brannmur" : "Ny brannmur"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">Navn *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="pfSense-01" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Produsent</label><Input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} placeholder="Netgate" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Modell</label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="SG-3100" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">IP</label><Input value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} placeholder="192.168.1.1" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">OS</label><Input value={form.os} onChange={e => setForm({ ...form, os: e.target.value })} placeholder="pfSense 2.7" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className={selectClass}>
                {Object.entries(fwStatusBadge).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Beskrivelse</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" /></div>
          </div>
          <div className="flex justify-end mt-3"><Button size="sm" onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1" /> Lagre</Button></div>
        </div>
      )}

      {/* Firewall list */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full text-sm table-striped">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground bg-secondary/50">
              <th className="px-3 py-2.5 font-medium text-xs">Navn</th>
              <th className="px-3 py-2.5 font-medium text-xs">Status</th>
              <th className="px-3 py-2.5 font-medium text-xs">IP</th>
              <th className="px-3 py-2.5 font-medium text-xs">OS</th>
              <th className="px-3 py-2.5 font-medium text-xs">Produsent / Modell</th>
              <th className="px-3 py-2.5 font-medium text-xs">Regler</th>
              <th className="px-3 py-2.5 font-medium text-xs w-20"></th>
            </tr>
          </thead>
          <tbody>
            {firewalls.map(fw => {
              const s = fwStatusBadge[fw.status];
              const ruleCount = allRules.filter(r => r.firewallId === fw.id).length;
              return (
                <tr key={fw.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <button onClick={() => setSelectedFw(fw)} className="text-primary hover:underline font-medium text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-destructive/70" />
                      {fw.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${s.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-foreground">{fw.ip || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{fw.os || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{[fw.manufacturer, fw.model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded text-foreground">{ruleCount}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(fw)} className="p-1 text-muted-foreground hover:text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(fw.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {firewalls.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Ingen brannmurer registrert</p>
            <p className="text-xs mt-1">Opprett en brannmur for å begynne å legge til regler</p>
          </div>
        )}
      </div>
    </div>
  );
}
