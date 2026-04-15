import { useState, useEffect } from "react";
import { getNetworks, addNetwork, deleteNetwork, type NetworkInfo } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Save, Globe } from "lucide-react";

export default function NetworksPage() {
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", subnet: "", vlan: "", gateway: "", dhcpRange: "", description: "" });

  useEffect(() => { setNetworks(getNetworks()); }, []);

  const handleSave = () => {
    if (!form.name || !form.subnet) return;
    addNetwork(form);
    setNetworks(getNetworks());
    setShowForm(false);
    setForm({ name: "", subnet: "", vlan: "", gateway: "", dhcpRange: "", description: "" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nettverk</h1>
          <p className="text-sm text-muted-foreground mt-1">{networks.length} nettverk</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Nytt nettverk</Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Nytt nettverk</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Navn *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" placeholder="LAN" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Subnett *</label><Input value={form.subnet} onChange={e => setForm({ ...form, subnet: e.target.value })} className="bg-secondary border-border" placeholder="192.168.1.0/24" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">VLAN</label><Input value={form.vlan} onChange={e => setForm({ ...form, vlan: e.target.value })} className="bg-secondary border-border" placeholder="10" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Gateway</label><Input value={form.gateway} onChange={e => setForm({ ...form, gateway: e.target.value })} className="bg-secondary border-border" placeholder="192.168.1.1" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">DHCP-område</label><Input value={form.dhcpRange} onChange={e => setForm({ ...form, dhcpRange: e.target.value })} className="bg-secondary border-border" placeholder="192.168.1.100-200" /></div>
          </div>
          <div className="mt-4"><label className="text-xs text-muted-foreground mb-1 block">Beskrivelse</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-16 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground resize-none" /></div>
          <div className="mt-4 flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {networks.map(n => (
          <div key={n.id} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground text-lg">{n.name}</h3>
              <button onClick={() => { deleteNetwork(n.id); setNetworks(getNetworks()); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subnett</span><span className="font-mono text-foreground">{n.subnet}</span></div>
              {n.vlan && <div className="flex justify-between"><span className="text-muted-foreground">VLAN</span><span className="font-mono text-foreground">{n.vlan}</span></div>}
              {n.gateway && <div className="flex justify-between"><span className="text-muted-foreground">Gateway</span><span className="font-mono text-foreground">{n.gateway}</span></div>}
              {n.dhcpRange && <div className="flex justify-between"><span className="text-muted-foreground">DHCP</span><span className="font-mono text-foreground">{n.dhcpRange}</span></div>}
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
