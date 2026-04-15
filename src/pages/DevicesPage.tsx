import { useState, useEffect } from "react";
import { getDevices, addDevice, deleteDevice, updateDevice, type Device, type DeviceType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Monitor, Wifi, Server, HardDrive, Shield, Radio, X, Save, Box, Cpu, Zap, Battery, ChevronDown, ChevronRight } from "lucide-react";
import { DeviceSubData } from "@/components/DeviceSubData";

const typeIcons: Record<DeviceType, React.ReactNode> = {
  router: <Wifi className="h-5 w-5" />,
  switch: <Monitor className="h-5 w-5" />,
  server: <Server className="h-5 w-5" />,
  ap: <Radio className="h-5 w-5" />,
  nas: <HardDrive className="h-5 w-5" />,
  firewall: <Shield className="h-5 w-5" />,
  vm: <Box className="h-5 w-5" />,
  container: <Cpu className="h-5 w-5" />,
  pdu: <Zap className="h-5 w-5" />,
  ups: <Battery className="h-5 w-5" />,
  other: <Monitor className="h-5 w-5" />,
};

const typeColors: Record<DeviceType, string> = {
  router: "bg-primary/20 text-primary",
  switch: "bg-info/20 text-info",
  server: "bg-warning/20 text-warning",
  ap: "bg-success/20 text-success",
  nas: "bg-accent text-accent-foreground",
  firewall: "bg-destructive/20 text-destructive",
  vm: "bg-info/15 text-info",
  container: "bg-primary/15 text-primary",
  pdu: "bg-warning/15 text-warning",
  ups: "bg-success/15 text-success",
  other: "bg-muted text-muted-foreground",
};

const statusColors: Record<Device["status"], string> = {
  online: "bg-success",
  offline: "bg-destructive",
  maintenance: "bg-warning",
  planned: "bg-info",
  decommissioned: "bg-muted-foreground",
};

const statusLabels: Record<Device["status"], string> = {
  online: "Online", offline: "Offline", maintenance: "Vedlikehold", planned: "Planlagt", decommissioned: "Avviklet"
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

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDevice);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => { setDevices(getDevices()); }, []);

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(filter.toLowerCase()) ||
    d.ip.includes(filter) ||
    d.role.toLowerCase().includes(filter.toLowerCase()) ||
    (d.os || "").toLowerCase().includes(filter.toLowerCase())
  );

  const handleSave = () => {
    if (!form.name || !form.ip) return;
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const data = { ...form, tags };
    if (editId) {
      updateDevice(editId, data);
    } else {
      addDevice(data);
    }
    setDevices(getDevices());
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
    setShowForm(true);
    setShowAdvanced(true);
  };

  const handleDelete = (id: string) => {
    deleteDevice(id);
    setDevices(getDevices());
  };

  const selectClass = "w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enheter</h1>
          <p className="text-sm text-muted-foreground mt-1">{devices.length} enheter registrert</p>
        </div>
        <div className="flex gap-3">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer enheter..." className="w-56 bg-secondary border-border" />
          <Button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyDevice); setTagsInput(""); setShowAdvanced(false); }}>
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

          {/* Basic info */}
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
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* OS & Software */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3 mt-6">Programvare</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Operativsystem</label>
              <select value={commonOS.includes(form.os) ? form.os : form.os ? "Annet" : ""} onChange={e => setForm({ ...form, os: e.target.value === "Annet" ? form.os : e.target.value })} className={selectClass}>
                <option value="">Velg OS...</option>
                {commonOS.map(os => <option key={os} value={os}>{os}</option>)}
              </select>
              {!commonOS.includes(form.os) && form.os !== "" && (
                <Input value={form.os} onChange={e => setForm({ ...form, os: e.target.value })} placeholder="Egendefinert OS" className="bg-secondary border-border mt-2" />
              )}
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">OS-versjon</label><Input value={form.osVersion} onChange={e => setForm({ ...form, osVersion: e.target.value })} placeholder="f.eks. 22.04 LTS" className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Firmware</label><Input value={form.firmware} onChange={e => setForm({ ...form, firmware: e.target.value })} className="bg-secondary border-border" /></div>
          </div>

          {/* Hardware */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3 mt-6">Maskinvare</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Produsent</label><Input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Modell</label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Serienummer</label><Input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">CPU-kjerner</label><Input type="number" value={form.cpuCores ?? ""} onChange={e => setForm({ ...form, cpuCores: e.target.value ? Number(e.target.value) : undefined })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">RAM (GB)</label><Input type="number" value={form.ramGb ?? ""} onChange={e => setForm({ ...form, ramGb: e.target.value ? Number(e.target.value) : undefined })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Lagring (GB)</label><Input type="number" value={form.storageGb ?? ""} onChange={e => setForm({ ...form, storageGb: e.target.value ? Number(e.target.value) : undefined })} className="bg-secondary border-border" /></div>
          </div>

          {/* Advanced - collapsible */}
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-6 mb-3">
            {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="uppercase tracking-wide font-semibold">Plassering & inventar</span>
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Site / Lokasjon</label><Input value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Rack</label><Input value={form.rack} onChange={e => setForm({ ...form, rack: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Rack-posisjon (U)</label><Input value={form.rackPosition} onChange={e => setForm({ ...form, rackPosition: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Management IP</label><Input value={form.managementIp} onChange={e => setForm({ ...form, managementIp: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Primært grensesnitt</label><Input value={form.primaryInterface} onChange={e => setForm({ ...form, primaryInterface: e.target.value })} placeholder="eth0, ens18" className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Tenant</label><Input value={form.tenant} onChange={e => setForm({ ...form, tenant: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Asset tag</label><Input value={form.assetTag} onChange={e => setForm({ ...form, assetTag: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Kjøpsdato</label><Input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} className="bg-secondary border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Garanti utløper</label><Input type="date" value={form.warrantyEnd} onChange={e => setForm({ ...form, warrantyEnd: e.target.value })} className="bg-secondary border-border" /></div>
            </div>
          )}

          <div className="mt-4">
            <label className="text-xs text-muted-foreground mb-1 block">Tags (kommaseparert)</label>
            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="produksjon, kritisk, rack-1" className="bg-secondary border-border" />
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
          <div key={d.id} className="bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
            {/* Card header */}
            <div className="p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[d.type]}`}>
                  {typeIcons[d.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{d.ip}</div>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${statusColors[d.status]}`} title={statusLabels[d.status]} />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Type: <span className="text-secondary-foreground">{typeLabels[d.type]}</span>{d.role && <> · Rolle: <span className="text-secondary-foreground">{d.role}</span></>}</div>
                {d.os && <div>OS: <span className="text-secondary-foreground">{d.os}{d.osVersion ? ` ${d.osVersion}` : ""}</span></div>}
                {d.manufacturer && <div>HW: <span className="text-secondary-foreground">{d.manufacturer} {d.model}</span></div>}
              </div>
              {(d.tags || []).length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {d.tags!.map(t => <span key={t} className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{t}</span>)}
                </div>
              )}
            </div>

            {/* Expanded details */}
            {expandedId === d.id && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-2 text-xs">
                {d.mac && <div className="flex justify-between"><span className="text-muted-foreground">MAC</span><span className="font-mono text-foreground">{d.mac}</span></div>}
                {d.serialNumber && <div className="flex justify-between"><span className="text-muted-foreground">Serienummer</span><span className="font-mono text-foreground">{d.serialNumber}</span></div>}
                {d.firmware && <div className="flex justify-between"><span className="text-muted-foreground">Firmware</span><span className="text-foreground">{d.firmware}</span></div>}
                {(d.cpuCores || d.ramGb || d.storageGb) && (
                  <div className="flex gap-3 py-1">
                    {d.cpuCores && <span className="bg-secondary px-2 py-0.5 rounded text-muted-foreground">{d.cpuCores} CPU</span>}
                    {d.ramGb && <span className="bg-secondary px-2 py-0.5 rounded text-muted-foreground">{d.ramGb} GB RAM</span>}
                    {d.storageGb && <span className="bg-secondary px-2 py-0.5 rounded text-muted-foreground">{d.storageGb} GB disk</span>}
                  </div>
                )}
                {d.managementIp && <div className="flex justify-between"><span className="text-muted-foreground">Mgmt IP</span><span className="font-mono text-foreground">{d.managementIp}</span></div>}
                {d.primaryInterface && <div className="flex justify-between"><span className="text-muted-foreground">Grensesnitt</span><span className="font-mono text-foreground">{d.primaryInterface}</span></div>}
                {d.site && <div className="flex justify-between"><span className="text-muted-foreground">Site</span><span className="text-foreground">{d.site}</span></div>}
                {d.rack && <div className="flex justify-between"><span className="text-muted-foreground">Rack</span><span className="text-foreground">{d.rack}{d.rackPosition ? ` U${d.rackPosition}` : ""}</span></div>}
                {d.tenant && <div className="flex justify-between"><span className="text-muted-foreground">Tenant</span><span className="text-foreground">{d.tenant}</span></div>}
                {d.assetTag && <div className="flex justify-between"><span className="text-muted-foreground">Asset tag</span><span className="font-mono text-foreground">{d.assetTag}</span></div>}
                {d.purchaseDate && <div className="flex justify-between"><span className="text-muted-foreground">Kjøpt</span><span className="text-foreground">{d.purchaseDate}</span></div>}
                {d.warrantyEnd && <div className="flex justify-between"><span className="text-muted-foreground">Garanti</span><span className="text-foreground">{d.warrantyEnd}</span></div>}
                {d.notes && <p className="text-muted-foreground pt-1 border-t border-border mt-2">{d.notes}</p>}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 px-4 pb-3 pt-1 border-t border-border">
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
