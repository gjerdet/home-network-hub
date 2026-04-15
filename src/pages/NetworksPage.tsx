import { useState, useEffect } from "react";
import { getNetworks, addNetwork, deleteNetwork, updateNetwork, getFirewalls, type NetworkInfo, type Firewall } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Save, Globe, Edit2, Wifi, Server, Shield } from "lucide-react";

const emptyForm = { name: "", subnet: "", vlan: "", gateway: "", dhcpRange: "", dns1: "", dns2: "", wanAddress: "", wanGateway: "", wanType: "dhcp" as NetworkInfo["wanType"], domain: "", description: "", firewallId: "" };

export default function NetworksPage() {
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [firewalls, setFirewalls] = useState<Firewall[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { setNetworks(getNetworks()); setFirewalls(getFirewalls()); }, []);

  const handleSave = () => {
    if (!form.name || !form.subnet) return;
    if (editId) {
      updateNetwork(editId, form);
    } else {
      addNetwork(form);
    }
    setNetworks(getNetworks());
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const handleEdit = (n: NetworkInfo) => {
    setForm({
      name: n.name, subnet: n.subnet, vlan: n.vlan || "", gateway: n.gateway || "",
      dhcpRange: n.dhcpRange || "", dns1: n.dns1 || "", dns2: n.dns2 || "",
      wanAddress: n.wanAddress || "", wanGateway: n.wanGateway || "",
      wanType: n.wanType || "dhcp", domain: n.domain || "", description: n.description || "",
      firewallId: n.firewallId || "",
    });
    setEditId(n.id);
    setShowForm(true);
  };

  const selectClass = "w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nettverk</h1>
          <p className="text-sm text-muted-foreground mt-1">{networks.length} nettverk</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}><Plus className="h-4 w-4 mr-1" /> Nytt nettverk</Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editId ? "Rediger nettverk" : "Nytt nettverk"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>

          {/* Basic info */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Grunnleggende</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
            <div><label className="text-xs text-muted-foreground mb-1 block">Navn *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" placeholder="LAN" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Subnett *</label><Input value={form.subnet} onChange={e => setForm({ ...form, subnet: e.target.value })} className="bg-secondary border-border" placeholder="192.168.1.0/24" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">VLAN</label><Input value={form.vlan} onChange={e => setForm({ ...form, vlan: e.target.value })} className="bg-secondary border-border" placeholder="10" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Gateway</label><Input value={form.gateway} onChange={e => setForm({ ...form, gateway: e.target.value })} className="bg-secondary border-border" placeholder="192.168.1.1" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">DHCP-område</label><Input value={form.dhcpRange} onChange={e => setForm({ ...form, dhcpRange: e.target.value })} className="bg-secondary border-border" placeholder="192.168.1.100-200" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Domene</label><Input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} className="bg-secondary border-border" placeholder="local.lan" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Brannmur</label>
              <select value={form.firewallId} onChange={e => setForm({ ...form, firewallId: e.target.value })} className={selectClass}>
                <option value="">Ingen</option>
                {firewalls.map(fw => <option key={fw.id} value={fw.id}>{fw.name}{fw.ip ? ` (${fw.ip})` : ""}</option>)}
              </select>
            </div>
          </div>


          <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="h-4 w-4 text-primary" />
              <p className="text-xs text-primary uppercase tracking-wide font-semibold">WAN / Internett</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">WAN-type</label>
                <select value={form.wanType} onChange={e => setForm({ ...form, wanType: e.target.value as any })} className={selectClass}>
                  <option value="dhcp">DHCP</option><option value="static">Statisk</option><option value="pppoe">PPPoE</option>
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">WAN-adresse</label><Input value={form.wanAddress} onChange={e => setForm({ ...form, wanAddress: e.target.value })} className="bg-secondary border-border" placeholder="84.215.x.x" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">WAN Gateway</label><Input value={form.wanGateway} onChange={e => setForm({ ...form, wanGateway: e.target.value })} className="bg-secondary border-border" placeholder="84.215.x.1" /></div>
            </div>
          </div>

          {/* DNS - prominent section */}
          <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Server className="h-4 w-4 text-primary" />
              <p className="text-xs text-primary uppercase tracking-wide font-semibold">DNS</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Primær DNS</label><Input value={form.dns1} onChange={e => setForm({ ...form, dns1: e.target.value })} className="bg-secondary border-border" placeholder="1.1.1.1" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Sekundær DNS</label><Input value={form.dns2} onChange={e => setForm({ ...form, dns2: e.target.value })} className="bg-secondary border-border" placeholder="8.8.8.8" /></div>
            </div>
          </div>

          <div><label className="text-xs text-muted-foreground mb-1 block">Beskrivelse</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-16 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground resize-none" /></div>
          <div className="mt-4 flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {networks.map(n => (
          <div key={n.id} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground text-lg">{n.name}</h3>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(n)} className="text-muted-foreground hover:text-primary p-1"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => { deleteNetwork(n.id); setNetworks(getNetworks()); }} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subnett</span><span className="font-mono text-foreground">{n.subnet}</span></div>
              {n.vlan && <div className="flex justify-between"><span className="text-muted-foreground">VLAN</span><span className="font-mono text-foreground">{n.vlan}</span></div>}
              {n.gateway && <div className="flex justify-between"><span className="text-muted-foreground">Gateway</span><span className="font-mono text-foreground">{n.gateway}</span></div>}
              {n.dhcpRange && <div className="flex justify-between"><span className="text-muted-foreground">DHCP</span><span className="font-mono text-foreground">{n.dhcpRange}</span></div>}
              {n.domain && <div className="flex justify-between"><span className="text-muted-foreground">Domene</span><span className="font-mono text-foreground">{n.domain}</span></div>}
              {n.firewallId && (() => { const fw = firewalls.find(f => f.id === n.firewallId); return fw ? (
                <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Brannmur</span><span className="text-foreground">{fw.name}</span></div>
              ) : null; })()}

              {/* DNS section - always show if set */}
              {(n.dns1 || n.dns2) && (
                <div className="pt-2 mt-2 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Server className="h-3 w-3" /> DNS</p>
                  {n.dns1 && <div className="flex justify-between"><span className="text-muted-foreground">Primær</span><span className="font-mono text-foreground">{n.dns1}</span></div>}
                  {n.dns2 && <div className="flex justify-between"><span className="text-muted-foreground">Sekundær</span><span className="font-mono text-foreground">{n.dns2}</span></div>}
                </div>
              )}

              {/* WAN section - always show if set */}
              {(n.wanAddress || n.wanGateway || n.wanType) && (
                <div className="pt-2 mt-2 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Wifi className="h-3 w-3" /> WAN</p>
                  {n.wanAddress && <div className="flex justify-between"><span className="text-muted-foreground">Adresse</span><span className="font-mono text-foreground">{n.wanAddress}</span></div>}
                  {n.wanGateway && <div className="flex justify-between"><span className="text-muted-foreground">Gateway</span><span className="font-mono text-foreground">{n.wanGateway}</span></div>}
                  {n.wanType && <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-foreground uppercase text-xs">{n.wanType}</span></div>}
                </div>
              )}
              {n.description && <p className="text-muted-foreground mt-2 pt-2 border-t border-border">{n.description}</p>}
            </div>
          </div>
        ))}
      </div>

      {networks.length === 0 && !showForm && (
        <div className="text-center py-16 text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Ingen nettverk definert</p>
        </div>
      )}
    </div>
  );
}
