import { useState, useEffect } from "react";
import { getFirewallRules, addFirewallRule, deleteFirewallRule, saveFirewallRules, updateFirewallRule, getNetworks, type FirewallRule, type FirewallZone } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Save, Flame, ArrowUp, ArrowDown, Shield, ShieldOff, ChevronDown, ChevronRight, LayoutGrid, List, Edit2 } from "lucide-react";
import { RuleFlowDiagram } from "@/components/RuleFlowDiagram";

const defaultZones: string[] = ["WAN", "LAN", "DMZ", "WLAN", "VPN", "MGMT", "IOT", "GUEST"];

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

type ViewMode = "list" | "matrix";

export default function FirewallPage() {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);

  // Build zones from user's networks + defaults
  const networks = getNetworks();
  const networkZones = networks.map(n => n.name.toUpperCase());
  const zones = [...new Set([...networkZones, ...defaultZones])].sort();

  const [form, setForm] = useState({
    name: "", action: "allow" as FirewallRule["action"], protocol: "TCP",
    sourceZone: zones[0] || "LAN" as string, destinationZone: zones.includes("WAN") ? "WAN" : zones[1] || "WAN" as string,
    source: "any", destination: "any", port: "",
    service: "", schedule: "", logging: true, enabled: true, notes: ""
  });

  useEffect(() => { setRules(getFirewallRules()); }, []);

  const handleSave = () => {
    if (!form.name) return;
    const newRule = addFirewallRule({ ...form, order: rules.length, hitCount: 0 });
    setRules(getFirewallRules());
    setShowForm(false);
    setExpandedRule(newRule.id);
    setForm({ name: "", action: "allow", protocol: "TCP", sourceZone: "LAN", destinationZone: "WAN", source: "any", destination: "any", port: "", service: "", schedule: "", logging: true, enabled: true, notes: "" });
  };

  const handleDelete = (id: string) => { deleteFirewallRule(id); setRules(getFirewallRules()); if (expandedRule === id) setExpandedRule(null); };

  const toggleEnabled = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    saveFirewallRules(updated);
    setRules(updated);
  };

  const moveRule = (id: string, dir: -1 | 1) => {
    const idx = rules.findIndex(r => r.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === rules.length - 1)) return;
    const newRules = [...rules];
    [newRules[idx], newRules[idx + dir]] = [newRules[idx + dir], newRules[idx]];
    newRules.forEach((r, i) => r.order = i);
    saveFirewallRules(newRules);
    setRules(newRules);
  };

  const filteredRules = zoneFilter
    ? rules.filter(r => r.sourceZone === zoneFilter || r.destinationZone === zoneFilter)
    : rules;

  // Build zone matrix data
  const usedZones = [...new Set(rules.flatMap(r => [r.sourceZone, r.destinationZone]))].sort();
  const matrixData = (srcZone: string, dstZone: string) =>
    rules.filter(r => r.sourceZone === srcZone && r.destinationZone === dstZone);

  const selectClass = "w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brannmurregler</h1>
          <p className="text-sm text-muted-foreground mt-1">{rules.length} regler</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-secondary rounded-md border border-border">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs flex items-center gap-1 rounded-l-md transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><List className="h-3 w-3" /> Liste</button>
            <button onClick={() => setViewMode("matrix")} className={`px-3 py-1.5 text-xs flex items-center gap-1 rounded-r-md transition-colors ${viewMode === "matrix" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><LayoutGrid className="h-3 w-3" /> Matrise</button>
          </div>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Ny regel</Button>
        </div>
      </div>

      {/* Zone filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setZoneFilter(null)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${!zoneFilter ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"}`}>Alle soner</button>
        {zones.map(z => (
          <button key={z} onClick={() => setZoneFilter(zoneFilter === z ? null : z)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${zoneFilter === z ? zoneColors[z] : "bg-secondary text-muted-foreground border-border hover:text-foreground"}`}>{z}</button>
        ))}
      </div>

      {/* New rule form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ny brannmurregel</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>

          {/* Zone selection - SonicWall style */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-background rounded-lg border border-border">
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
            <div><label className="text-xs text-muted-foreground mb-1 block">Tjeneste</label><Input value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} placeholder="HTTP, HTTPS, SSH" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Tidsplan</label><Input value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="Alltid" className="bg-secondary border-border" /></div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.logging} onChange={e => setForm({ ...form, logging: e.target.checked })} className="rounded" />
                Logg trafikk
              </label>
            </div>
          </div>
          <div className="mt-4"><label className="text-xs text-muted-foreground mb-1 block">Notater</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full h-16 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground resize-none" />
          </div>

          {/* Live preview */}
          {form.name && (
            <div className="mt-4 border border-border rounded-lg bg-background p-2">
              <p className="text-[10px] text-muted-foreground mb-1 text-center uppercase tracking-wide">Forhåndsvisning</p>
              <RuleFlowDiagram rule={{ id: "preview", ...form, order: 0, hitCount: 0 }} />
            </div>
          )}

          <div className="mt-4 flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button></div>
        </div>
      )}

      {/* Matrix view */}
      {viewMode === "matrix" && usedZones.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6 overflow-x-auto">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-semibold">Sonematrise — Kilde (↓) til Destinasjon (→)</p>
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-muted-foreground font-medium"></th>
                {usedZones.map(z => (
                  <th key={z} className="px-3 py-2 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${zoneColors[z] || "bg-secondary text-foreground border-border"}`}>{z}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usedZones.map(src => (
                <tr key={src} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${zoneColors[src] || "bg-secondary text-foreground border-border"}`}>{src}</span>
                  </td>
                  {usedZones.map(dst => {
                    const cellRules = matrixData(src, dst);
                    const hasAllow = cellRules.some(r => r.action === "allow" && r.enabled);
                    const hasDeny = cellRules.some(r => r.action === "deny" && r.enabled);
                    return (
                      <td key={dst} className="px-3 py-2 text-center">
                        {cellRules.length > 0 ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${
                            hasAllow && !hasDeny ? "bg-success/15 text-success" :
                            hasDeny && !hasAllow ? "bg-destructive/15 text-destructive" :
                            cellRules.length > 0 ? "bg-warning/15 text-warning" : ""
                          }`}>
                            {cellRules.length} {cellRules.length === 1 ? "regel" : "regler"}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* List view */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-3 py-3 font-medium w-8">#</th>
              <th className="px-3 py-3 font-medium w-6"></th>
              <th className="px-3 py-3 font-medium">Navn</th>
              <th className="px-3 py-3 font-medium">Handling</th>
              <th className="px-3 py-3 font-medium">Fra</th>
              <th className="px-3 py-3 font-medium">Til</th>
              <th className="px-3 py-3 font-medium">Tjeneste</th>
              <th className="px-3 py-3 font-medium">Kilde</th>
              <th className="px-3 py-3 font-medium">Dest.</th>
              <th className="px-3 py-3 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((r, i) => (
              <>
                <tr
                  key={r.id}
                  className={`border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors ${!r.enabled ? "opacity-40" : ""} ${expandedRule === r.id ? "bg-secondary/30" : ""}`}
                  onClick={() => setExpandedRule(prev => prev === r.id ? null : r.id)}
                >
                  <td className="px-3 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {expandedRule === r.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </td>
                  <td className="px-3 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded ${actionColors[r.action]}`}>{actionLabels[r.action]}</span></td>
                  <td className="px-3 py-3"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${zoneColors[r.sourceZone] || "bg-secondary border-border"}`}>{r.sourceZone}</span></td>
                  <td className="px-3 py-3"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${zoneColors[r.destinationZone] || "bg-secondary border-border"}`}>{r.destinationZone}</span></td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{r.service || `${r.protocol}/${r.port || "*"}`}</td>
                  <td className="px-3 py-3 text-muted-foreground font-mono text-xs">{r.source}</td>
                  <td className="px-3 py-3 text-muted-foreground font-mono text-xs">{r.destination}</td>
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => moveRule(r.id, -1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowUp className="h-3 w-3" /></button>
                      <button onClick={() => moveRule(r.id, 1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowDown className="h-3 w-3" /></button>
                      <button onClick={() => toggleEnabled(r.id)} className="p-1 text-muted-foreground hover:text-foreground">{r.enabled ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}</button>
                      <button onClick={() => handleDelete(r.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
                {expandedRule === r.id && (
                  <tr key={`${r.id}-flow`} className="border-b border-border bg-background/50">
                    <td colSpan={10}>
                      <RuleFlowDiagram rule={r} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filteredRules.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Ingen brannmurregler {zoneFilter ? `for sone ${zoneFilter}` : "definert"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
