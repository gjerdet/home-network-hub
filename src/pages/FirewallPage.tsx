import { useState, useEffect } from "react";
import { getFirewallRules, addFirewallRule, deleteFirewallRule, saveFirewallRules, type FirewallRule } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Save, Flame, ArrowUp, ArrowDown, Shield, ShieldOff } from "lucide-react";

const actionColors = { allow: "bg-success/20 text-success", deny: "bg-destructive/20 text-destructive", reject: "bg-warning/20 text-warning" };

export default function FirewallPage() {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", action: "allow" as const, protocol: "TCP", source: "any", destination: "any", port: "", direction: "inbound" as const, enabled: true, notes: "" });

  useEffect(() => { setRules(getFirewallRules()); }, []);

  const handleSave = () => {
    if (!form.name) return;
    addFirewallRule({ ...form, order: rules.length });
    setRules(getFirewallRules());
    setShowForm(false);
    setForm({ name: "", action: "allow", protocol: "TCP", source: "any", destination: "any", port: "", direction: "inbound", enabled: true, notes: "" });
  };

  const handleDelete = (id: string) => { deleteFirewallRule(id); setRules(getFirewallRules()); };

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brannmurregler</h1>
          <p className="text-sm text-muted-foreground mt-1">{rules.length} regler</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Ny regel</Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ny brannmurregel</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Navn *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Handling</label>
              <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value as any })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
                <option value="allow">Tillat</option><option value="deny">Blokker</option><option value="reject">Avvis</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Protokoll</label>
              <select value={form.protocol} onChange={e => setForm({ ...form, protocol: e.target.value })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
                <option>TCP</option><option>UDP</option><option>ICMP</option><option>TCP/UDP</option><option>Any</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Retning</label>
              <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value as any })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
                <option value="inbound">Innkommende</option><option value="outbound">Utgående</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Kilde</label>
              <Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Destinasjon</label>
              <Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Port</label>
              <Input value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} placeholder="80, 443" className="bg-secondary border-border" />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs text-muted-foreground mb-1 block">Notater</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full h-16 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground resize-none" />
          </div>
          <div className="mt-4 flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button></div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium w-8">#</th>
              <th className="px-4 py-3 font-medium">Navn</th>
              <th className="px-4 py-3 font-medium">Handling</th>
              <th className="px-4 py-3 font-medium">Protokoll</th>
              <th className="px-4 py-3 font-medium">Kilde</th>
              <th className="px-4 py-3 font-medium">Destinasjon</th>
              <th className="px-4 py-3 font-medium">Port</th>
              <th className="px-4 py-3 font-medium">Retning</th>
              <th className="px-4 py-3 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <tr key={r.id} className={`border-b border-border ${!r.enabled ? "opacity-40" : ""}`}>
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${actionColors[r.action]}`}>{r.action === "allow" ? "Tillat" : r.action === "deny" ? "Blokker" : "Avvis"}</span></td>
                <td className="px-4 py-3 text-muted-foreground font-mono">{r.protocol}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono">{r.source}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono">{r.destination}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono">{r.port || "*"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.direction === "inbound" ? "↓ Inn" : "↑ Ut"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => moveRule(r.id, -1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowUp className="h-3 w-3" /></button>
                    <button onClick={() => moveRule(r.id, 1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowDown className="h-3 w-3" /></button>
                    <button onClick={() => toggleEnabled(r.id)} className="p-1 text-muted-foreground hover:text-foreground">{r.enabled ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}</button>
                    <button onClick={() => handleDelete(r.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rules.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Ingen brannmurregler definert</p>
          </div>
        )}
      </div>
    </div>
  );
}
