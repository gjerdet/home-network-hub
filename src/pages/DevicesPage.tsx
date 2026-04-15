import { useState, useEffect } from "react";
import { getDevices, addDevice, deleteDevice, updateDevice, type Device, type DeviceType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Monitor, Wifi, Server, HardDrive, Shield, Radio, X, Save } from "lucide-react";

const typeIcons: Record<DeviceType, React.ReactNode> = {
  router: <Wifi className="h-5 w-5" />,
  switch: <Monitor className="h-5 w-5" />,
  server: <Server className="h-5 w-5" />,
  ap: <Radio className="h-5 w-5" />,
  nas: <HardDrive className="h-5 w-5" />,
  firewall: <Shield className="h-5 w-5" />,
  other: <Monitor className="h-5 w-5" />,
};

const typeColors: Record<DeviceType, string> = {
  router: "bg-primary/20 text-primary",
  switch: "bg-info/20 text-info",
  server: "bg-warning/20 text-warning",
  ap: "bg-success/20 text-success",
  nas: "bg-accent text-accent-foreground",
  firewall: "bg-destructive/20 text-destructive",
  other: "bg-muted text-muted-foreground",
};

const statusColors = {
  online: "bg-success",
  offline: "bg-destructive",
  maintenance: "bg-warning",
};

const typeLabels: Record<DeviceType, string> = {
  router: "Ruter", switch: "Switch", server: "Server", ap: "Aksesspunkt", nas: "NAS", firewall: "Brannmur", other: "Annet"
};

const emptyDevice = { name: "", ip: "", mac: "", type: "router" as DeviceType, role: "", status: "online" as const, location: "", manufacturer: "", model: "", notes: "" };

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDevice);
  const [filter, setFilter] = useState("");

  useEffect(() => { setDevices(getDevices()); }, []);

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(filter.toLowerCase()) ||
    d.ip.includes(filter) ||
    d.role.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSave = () => {
    if (!form.name || !form.ip) return;
    if (editId) {
      updateDevice(editId, form);
    } else {
      addDevice(form);
    }
    setDevices(getDevices());
    setShowForm(false);
    setEditId(null);
    setForm(emptyDevice);
  };

  const handleEdit = (d: Device) => {
    setForm({ name: d.name, ip: d.ip, mac: d.mac || "", type: d.type, role: d.role, status: d.status, location: d.location || "", manufacturer: d.manufacturer || "", model: d.model || "", notes: d.notes || "" });
    setEditId(d.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteDevice(id);
    setDevices(getDevices());
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enheter</h1>
          <p className="text-sm text-muted-foreground mt-1">{devices.length} enheter registrert</p>
        </div>
        <div className="flex gap-3">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer enheter..."
            className="w-56 bg-secondary border-border"
          />
          <Button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyDevice); }}>
            <Plus className="h-4 w-4 mr-1" /> Ny enhet
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editId ? "Rediger enhet" : "Ny enhet"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Navn *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">IP-adresse *</label>
              <Input value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">MAC-adresse</label>
              <Input value={form.mac} onChange={e => setForm({ ...form, mac: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as DeviceType })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rolle</label>
              <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="f.eks. Gateway" className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Device["status"] })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Vedlikehold</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Plassering</label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Produsent</label>
              <Input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Modell</label>
              <Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs text-muted-foreground mb-1 block">Notater</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full h-20 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground resize-none" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <div key={d.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[d.type]}`}>
                {typeIcons[d.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{d.ip}</div>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${statusColors[d.status]}`} title={d.status} />
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Rolle: <span className="text-secondary-foreground">{d.role || "—"}</span></div>
              <div>Type: <span className="text-secondary-foreground">{typeLabels[d.type]}</span></div>
              {d.location && <div>Plassering: <span className="text-secondary-foreground">{d.location}</span></div>}
              {d.manufacturer && <div>Produsent: <span className="text-secondary-foreground">{d.manufacturer} {d.model}</span></div>}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <button onClick={() => handleEdit(d)} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1"><Edit2 className="h-3 w-3" /> Rediger</button>
              <button onClick={() => handleDelete(d.id)} className="text-muted-foreground hover:text-destructive text-xs flex items-center gap-1 ml-auto"><Trash2 className="h-3 w-3" /> Slett</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !showForm && (
        <div className="text-center py-16 text-muted-foreground">
          <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Ingen enheter registrert ennå</p>
          <p className="text-sm mt-1">Klikk "Ny enhet" for å legge til din første enhet</p>
        </div>
      )}
    </div>
  );
}
