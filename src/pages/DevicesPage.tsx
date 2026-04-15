import { useState, useEffect } from "react";
import { getDevices, addDevice, deleteDevice, updateDevice, saveDevices, type Device, type DeviceType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Monitor, Wifi, Server, HardDrive, Shield, Radio, X, Save, Box, Cpu, Zap, Battery, ChevronDown, ChevronRight, ArrowLeft, ExternalLink, Copy, Network, Route, Cable, Share2, List } from "lucide-react";
import { DeviceSubData } from "@/components/DeviceSubData";
import { NetworkTopology } from "@/components/NetworkTopology";

const typeIcons: Record<DeviceType, React.ReactNode> = {
  router: <Wifi className="h-4 w-4" />, switch: <Monitor className="h-4 w-4" />, server: <Server className="h-4 w-4" />,
  ap: <Radio className="h-4 w-4" />, nas: <HardDrive className="h-4 w-4" />, firewall: <Shield className="h-4 w-4" />,
  vm: <Box className="h-4 w-4" />, container: <Cpu className="h-4 w-4" />, pdu: <Zap className="h-4 w-4" />,
  ups: <Battery className="h-4 w-4" />, other: <Monitor className="h-4 w-4" />,
};

const typeColors: Record<DeviceType, string> = {
  router: "bg-primary/20 text-primary", switch: "bg-info/20 text-info", server: "bg-warning/20 text-warning",
  ap: "bg-success/20 text-success", nas: "bg-accent text-accent-foreground", firewall: "bg-destructive/20 text-destructive",
  vm: "bg-info/15 text-info", container: "bg-primary/15 text-primary", pdu: "bg-warning/15 text-warning",
  ups: "bg-success/15 text-success", other: "bg-muted text-muted-foreground",
};

const statusBadge: Record<Device["status"], { bg: string; dot: string; label: string }> = {
  online: { bg: "bg-success/15 text-success border-success/30", dot: "bg-success", label: "Online" },
  offline: { bg: "bg-destructive/15 text-destructive border-destructive/30", dot: "bg-destructive", label: "Offline" },
  maintenance: { bg: "bg-warning/15 text-warning border-warning/30", dot: "bg-warning", label: "Vedlikehold" },
  planned: { bg: "bg-info/15 text-info border-info/30", dot: "bg-info", label: "Planlagt" },
  decommissioned: { bg: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground", label: "Avviklet" },
};

const typeLabels: Record<DeviceType, string> = {
  router: "Ruter", switch: "Switch", server: "Server", ap: "Aksesspunkt", nas: "NAS",
  firewall: "Brannmur", vm: "Virtuell maskin", container: "Container", pdu: "PDU", ups: "UPS", other: "Annet"
};

const commonOS = ["pfSense", "OPNsense", "Ubuntu Server", "Ubuntu Desktop", "Debian", "CentOS", "Rocky Linux", "AlmaLinux", "Fedora Server", "Arch Linux", "Alpine Linux", "FreeBSD", "OpenBSD", "Windows Server", "Windows 10", "Windows 11", "Proxmox VE", "ESXi", "Hyper-V", "TrueNAS CORE", "TrueNAS SCALE", "UniFi OS", "RouterOS (MikroTik)", "Cisco IOS", "Cisco IOS-XE", "Junos OS", "Aruba OS", "FortiOS", "SonicOS", "DD-WRT", "OpenWrt", "VyOS", "Synology DSM", "QNAP QTS", "Home Assistant OS", "Docker", "Kubernetes"];

const emptyDevice = {
  name: "", ip: "", mac: "", type: "router" as DeviceType, role: "", status: "online" as Device["status"],
  location: "", manufacturer: "", model: "", serialNumber: "", os: "", osVersion: "", firmware: "",
  cpuCores: undefined as number | undefined, ramGb: undefined as number | undefined, storageGb: undefined as number | undefined,
  primaryInterface: "", managementIp: "", site: "", rack: "", rackPosition: "", tenant: "",
  assetTag: "", purchaseDate: "", warrantyEnd: "", notes: "", tags: [] as string[],
};

// ── NetBox-style info row ──
function InfoRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex border-b border-border last:border-0">
      <span className="w-40 shrink-0 px-3 py-2 text-xs text-muted-foreground bg-secondary/50 font-medium">{label}</span>
      <span className={`flex-1 px-3 py-2 text-xs text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

// ── NetBox-style panel ──
function Panel({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 bg-secondary/80 text-xs font-semibold text-foreground uppercase tracking-wide hover:bg-secondary transition-colors">
        {title}
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════
// Device Detail View (NetBox-style)
// ═══════════════════════════════════════════
function DeviceDetail({ device, onBack, onEdit, onDelete, onUpdate }: {
  device: Device; onBack: () => void; onEdit: (d: Device) => void; onDelete: (id: string) => void; onUpdate: () => void;
}) {
  const [detailTab, setDetailTab] = useState<"info" | "interfaces" | "routes" | "cables">("info");
  const s = statusBadge[device.status];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <button onClick={onBack} className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Enheter</button>
        <span>/</span>
        <span className="text-foreground">{device.name}</span>
      </div>

      {/* Header bar */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeColors[device.type]}`}>
          {typeIcons[device.type]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{device.name}</h1>
            <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full border ${s.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{typeLabels[device.type]}</span>
            {device.role && <><span>·</span><span>{device.role}</span></>}
            {device.site && <><span>·</span><span>{device.site}</span></>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(device)}><Edit2 className="h-3 w-3 mr-1" /> Rediger</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(device.id)}><Trash2 className="h-3 w-3 mr-1" /> Slett</Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border mb-4">
        {[
          { key: "info" as const, label: "Enhet", icon: Monitor },
          { key: "interfaces" as const, label: "Grensesnitt", icon: Network, count: (device.interfaces || []).length },
          { key: "routes" as const, label: "Ruter", icon: Route, count: (device.routes || []).length },
          { key: "cables" as const, label: "Kabler", icon: Cable, count: (device.cables || []).length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setDetailTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              detailTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {"count" in t && t.count! > 0 && <span className="bg-secondary text-muted-foreground px-1.5 py-0.5 rounded text-[10px] ml-1">{t.count}</span>}
          </button>
        ))}
      </div>

      {detailTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            <Panel title="Enhet">
              <InfoRow label="Navn" value={device.name} />
              <InfoRow label="Type" value={typeLabels[device.type]} />
              <InfoRow label="Rolle" value={device.role} />
              <InfoRow label="Status" value={statusBadge[device.status].label} />
              <InfoRow label="Tenant" value={device.tenant} />
              {(device.tags || []).length > 0 && (
                <div className="flex border-b border-border last:border-0">
                  <span className="w-40 shrink-0 px-3 py-2 text-xs text-muted-foreground bg-secondary/50 font-medium">Tags</span>
                  <div className="flex-1 px-3 py-2 flex gap-1 flex-wrap">
                    {device.tags!.map(t => <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">{t}</span>)}
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Plassering">
              <InfoRow label="Site" value={device.site} />
              <InfoRow label="Lokasjon" value={device.location} />
              <InfoRow label="Rack" value={device.rack} />
              <InfoRow label="Rack-posisjon" value={device.rackPosition ? `U${device.rackPosition}` : undefined} />
            </Panel>

            <Panel title="Maskinvare">
              <InfoRow label="Produsent" value={device.manufacturer} />
              <InfoRow label="Modell" value={device.model} />
              <InfoRow label="Serienummer" value={device.serialNumber} mono />
              <InfoRow label="Asset tag" value={device.assetTag} mono />
              {(device.cpuCores || device.ramGb || device.storageGb) && (
                <div className="flex border-b border-border last:border-0">
                  <span className="w-40 shrink-0 px-3 py-2 text-xs text-muted-foreground bg-secondary/50 font-medium">Ressurser</span>
                  <div className="flex-1 px-3 py-2 flex gap-3">
                    {device.cpuCores && <span className="text-xs bg-secondary px-2 py-0.5 rounded text-foreground">{device.cpuCores} vCPU</span>}
                    {device.ramGb && <span className="text-xs bg-secondary px-2 py-0.5 rounded text-foreground">{device.ramGb} GB RAM</span>}
                    {device.storageGb && <span className="text-xs bg-secondary px-2 py-0.5 rounded text-foreground">{device.storageGb} GB Disk</span>}
                  </div>
                </div>
              )}
            </Panel>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Panel title="Nettverk">
              <InfoRow label="Primær IP" value={device.ip} mono />
              <InfoRow label="MAC-adresse" value={device.mac} mono />
              <InfoRow label="Management IP" value={device.managementIp} mono />
              <InfoRow label="Primært grensesnitt" value={device.primaryInterface} mono />
            </Panel>

            <Panel title="Programvare">
              <InfoRow label="Operativsystem" value={device.os} />
              <InfoRow label="OS-versjon" value={device.osVersion} />
              <InfoRow label="Firmware" value={device.firmware} />
            </Panel>

            <Panel title="Inventar">
              <InfoRow label="Kjøpsdato" value={device.purchaseDate} />
              <InfoRow label="Garanti utløper" value={device.warrantyEnd} />
            </Panel>

            {device.notes && (
              <Panel title="Notater">
                <div className="px-3 py-3 text-xs text-foreground whitespace-pre-wrap">{device.notes}</div>
              </Panel>
            )}

            <Panel title="Systeminfo" defaultOpen={false}>
              <InfoRow label="ID" value={device.id} mono />
              <InfoRow label="Opprettet" value={new Date(device.createdAt).toLocaleString("nb-NO")} />
              <InfoRow label="Sist oppdatert" value={new Date(device.updatedAt).toLocaleString("nb-NO")} />
            </Panel>
          </div>
        </div>
      )}

      {detailTab !== "info" && (
        <DeviceSubData device={device} onUpdate={onUpdate} initialTab={detailTab} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Device List View (NetBox-style table)
// ═══════════════════════════════════════════
export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [form, setForm] = useState(emptyDevice);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<DeviceType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Device["status"] | "all">("all");
  const [tagsInput, setTagsInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "topology">("list");
  useEffect(() => { setDevices(getDevices()); }, []);

  const refreshDevices = () => {
    const updated = getDevices();
    setDevices(updated);
    if (selectedDevice) {
      setSelectedDevice(updated.find(d => d.id === selectedDevice.id) || null);
    }
  };

  const filtered = devices.filter(d => {
    const matchText = d.name.toLowerCase().includes(filter.toLowerCase()) ||
      d.ip.includes(filter) || d.role.toLowerCase().includes(filter.toLowerCase()) ||
      (d.os || "").toLowerCase().includes(filter.toLowerCase()) ||
      (d.manufacturer || "").toLowerCase().includes(filter.toLowerCase());
    const matchType = typeFilter === "all" || d.type === typeFilter;
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchText && matchType && matchStatus;
  });

  const handleSave = () => {
    if (!form.name || !form.ip) return;
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const data = { ...form, tags };
    if (editId) {
      updateDevice(editId, data);
    } else {
      addDevice(data);
    }
    refreshDevices();
    setShowForm(false);
    setEditId(null);
    setForm(emptyDevice);
    setTagsInput("");
    setShowAdvanced(false);
  };

  const handleEdit = (d: Device) => {
    setForm({
      name: d.name, ip: d.ip, mac: d.mac || "", type: d.type, role: d.role, status: d.status,
      location: d.location || "", manufacturer: d.manufacturer || "", model: d.model || "",
      serialNumber: d.serialNumber || "", os: d.os || "", osVersion: d.osVersion || "",
      firmware: d.firmware || "", cpuCores: d.cpuCores, ramGb: d.ramGb, storageGb: d.storageGb,
      primaryInterface: d.primaryInterface || "", managementIp: d.managementIp || "",
      site: d.site || "", rack: d.rack || "", rackPosition: d.rackPosition || "",
      tenant: d.tenant || "", assetTag: d.assetTag || "", purchaseDate: d.purchaseDate || "",
      warrantyEnd: d.warrantyEnd || "", notes: d.notes || "", tags: d.tags || [],
    });
    setTagsInput((d.tags || []).join(", "));
    setEditId(d.id);
    setSelectedDevice(null);
    setShowForm(true);
    setShowAdvanced(true);
  };

  const handleDelete = (id: string) => {
    deleteDevice(id);
    setSelectedDevice(null);
    refreshDevices();
  };

  const selectClass = "w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground";

  // ── Detail view ──
  if (selectedDevice) {
    return (
      <DeviceDetail
        device={selectedDevice}
        onBack={() => setSelectedDevice(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdate={refreshDevices}
      />
    );
  }

  // ── List view ──
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enheter</h1>
          <p className="text-sm text-muted-foreground mt-1">{devices.length} enheter · {filtered.length} vises</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-secondary rounded-md border border-border">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs flex items-center gap-1 rounded-l-md transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><List className="h-3 w-3" /> Liste</button>
            <button onClick={() => setViewMode("topology")} className={`px-3 py-1.5 text-xs flex items-center gap-1 rounded-r-md transition-colors ${viewMode === "topology" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Share2 className="h-3 w-3" /> Topologi</button>
          </div>
          {devices.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => {
              if (confirm("Er du sikker på at du vil slette alle enheter?")) {
                saveDevices([]);
                refreshDevices();
              }
            }}>
              <Trash2 className="h-3 w-3 mr-1" /> Slett alle
            </Button>
          )}
          <Button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyDevice); setTagsInput(""); setShowAdvanced(false); }}>
            <Plus className="h-4 w-4 mr-1" /> Ny enhet
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Søk navn, IP, OS, produsent..." className="w-64 bg-secondary border-border" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
          <option value="all">Alle typer</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
          <option value="all">Alle statuser</option>
          {Object.entries(statusBadge).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {(filter || typeFilter !== "all" || statusFilter !== "all") && (
          <button onClick={() => { setFilter(""); setTypeFilter("all"); setStatusFilter("all"); }} className="text-xs text-primary hover:underline">Nullstill filter</button>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editId ? "Rediger enhet" : "Ny enhet"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>

          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">Grunnleggende</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Navn *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">IP-adresse *</label><Input value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">MAC-adresse</label><Input value={form.mac} onChange={e => setForm({ ...form, mac: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as DeviceType })} className={selectClass}>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Rolle</label><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="f.eks. Core Switch" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Device["status"] })} className={selectClass}>
                {Object.entries(statusBadge).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3 mt-6">Programvare</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Operativsystem</label>
              <Input list="os-list" value={form.os} onChange={e => setForm({ ...form, os: e.target.value })} placeholder="Skriv eller velg OS..." className="bg-secondary border-border" />
              <datalist id="os-list">{commonOS.map(os => <option key={os} value={os} />)}</datalist>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">OS-versjon</label><Input value={form.osVersion} onChange={e => setForm({ ...form, osVersion: e.target.value })} placeholder="f.eks. 22.04 LTS" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Firmware</label><Input value={form.firmware} onChange={e => setForm({ ...form, firmware: e.target.value })} className="bg-secondary border-border" /></div>
          </div>

          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3 mt-6">Maskinvare</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Produsent</label><Input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Modell</label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Serienummer</label><Input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">CPU-kjerner</label><Input type="number" value={form.cpuCores ?? ""} onChange={e => setForm({ ...form, cpuCores: e.target.value ? Number(e.target.value) : undefined })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">RAM (GB)</label><Input type="number" value={form.ramGb ?? ""} onChange={e => setForm({ ...form, ramGb: e.target.value ? Number(e.target.value) : undefined })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Lagring (GB)</label><Input type="number" value={form.storageGb ?? ""} onChange={e => setForm({ ...form, storageGb: e.target.value ? Number(e.target.value) : undefined })} className="bg-secondary border-border" /></div>
          </div>

          <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-6 mb-3">
            {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="uppercase tracking-wide font-semibold">Plassering & inventar</span>
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Site</label><Input value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Lokasjon</label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Rack</label><Input value={form.rack} onChange={e => setForm({ ...form, rack: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Rack-posisjon (U)</label><Input value={form.rackPosition} onChange={e => setForm({ ...form, rackPosition: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Management IP</label><Input value={form.managementIp} onChange={e => setForm({ ...form, managementIp: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Primært grensesnitt</label><Input value={form.primaryInterface} onChange={e => setForm({ ...form, primaryInterface: e.target.value })} placeholder="eth0" className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Tenant</label><Input value={form.tenant} onChange={e => setForm({ ...form, tenant: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Asset tag</label><Input value={form.assetTag} onChange={e => setForm({ ...form, assetTag: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Kjøpsdato</label><Input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Garanti utløper</label><Input type="date" value={form.warrantyEnd} onChange={e => setForm({ ...form, warrantyEnd: e.target.value })} className="bg-secondary border-border" /></div>
            </div>
          )}

          <div className="mt-4"><label className="text-xs text-muted-foreground mb-1 block">Tags (kommaseparert)</label><Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="produksjon, kritisk" className="bg-secondary border-border" /></div>
          <div className="mt-4"><label className="text-xs text-muted-foreground mb-1 block">Notater</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full h-20 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground resize-none" /></div>
          <div className="mt-4 flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button></div>
        </div>
      )}

      {/* Topology view */}
      {viewMode === "topology" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <NetworkTopology devices={devices} />
        </div>
      )}

      {/* Device table */}
      {viewMode === "list" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground bg-secondary/50">
                <th className="px-3 py-2.5 font-medium text-xs">Navn</th>
                <th className="px-3 py-2.5 font-medium text-xs">Status</th>
                <th className="px-3 py-2.5 font-medium text-xs">Type</th>
                <th className="px-3 py-2.5 font-medium text-xs">Rolle</th>
                <th className="px-3 py-2.5 font-medium text-xs">IP</th>
                <th className="px-3 py-2.5 font-medium text-xs">OS</th>
                <th className="px-3 py-2.5 font-medium text-xs">Site</th>
                <th className="px-3 py-2.5 font-medium text-xs w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const s = statusBadge[d.status];
                return (
                  <tr key={d.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <button onClick={() => setSelectedDevice(d)} className="text-primary hover:underline font-medium text-sm flex items-center gap-2">
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs ${typeColors[d.type]}`}>{typeIcons[d.type]}</span>
                        {d.name}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${s.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{typeLabels[d.type]}</td>
                    <td className="px-3 py-2.5 text-xs text-foreground">{d.role || "—"}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-foreground">{d.ip}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.os ? `${d.os}${d.osVersion ? ` ${d.osVersion}` : ""}` : "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.site || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(d)} className="p-1 text-muted-foreground hover:text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(d.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Ingen enheter funnet</p>
              {devices.length === 0 && <p className="text-sm mt-1">Klikk "Ny enhet" for å komme i gang</p>}
            </div>
          )}
        </div>
      )}

      {/* Stats bar */}
      {devices.length > 0 && (
        <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
          {Object.entries(statusBadge).map(([key, val]) => {
            const count = devices.filter(d => d.status === key).length;
            if (count === 0) return null;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${val.dot}`} />
                <span>{val.label}: {count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
