import { useState, useEffect } from "react";
import {
  getPrefixes, addPrefix, deletePrefix, updatePrefix, type Prefix,
  getIPAddresses, addIPAddress, deleteIPAddress, updateIPAddress, type IPAddress,
  getVLANs, addVLAN, deleteVLAN, updateVLAN, type VLAN,
} from "@/lib/ipam";
import { type Device } from "@/lib/store";
import { getDevicesAsync } from "@/lib/data-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubNav } from "@/components/SubNav";
import { Plus, Trash2, Edit2, Save, X, Network, Globe, Tag, Server } from "lucide-react";

const prefixStatusBadge: Record<Prefix["status"], { bg: string; label: string }> = {
  active: { bg: "bg-success/15 text-success", label: "Aktiv" },
  reserved: { bg: "bg-info/15 text-info", label: "Reservert" },
  deprecated: { bg: "bg-destructive/15 text-destructive", label: "Avviklet" },
  container: { bg: "bg-warning/15 text-warning", label: "Container" },
};

const ipStatusBadge: Record<IPAddress["status"], { bg: string; label: string }> = {
  active: { bg: "bg-success/15 text-success", label: "Aktiv" },
  reserved: { bg: "bg-info/15 text-info", label: "Reservert" },
  deprecated: { bg: "bg-destructive/15 text-destructive", label: "Avviklet" },
  dhcp: { bg: "bg-primary/15 text-primary", label: "DHCP" },
  slaac: { bg: "bg-warning/15 text-warning", label: "SLAAC" },
};

const vlanStatusBadge: Record<VLAN["status"], { bg: string; label: string }> = {
  active: { bg: "bg-success/15 text-success", label: "Aktiv" },
  reserved: { bg: "bg-info/15 text-info", label: "Reservert" },
  deprecated: { bg: "bg-destructive/15 text-destructive", label: "Avviklet" },
};

const selectClass = "w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground";

export default function IPAMPage() {
  const [tab, setTab] = useState<"prefixes" | "ips" | "vlans">("prefixes");
  const [prefixes, setPrefixes] = useState<Prefix[]>([]);
  const [ips, setIPs] = useState<IPAddress[]>([]);
  const [vlans, setVLANs] = useState<VLAN[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const reload = async () => { setPrefixes(getPrefixes()); setIPs(getIPAddresses()); setVLANs(getVLANs()); setDevices(await getDevicesAsync()); };
  useEffect(() => { reload(); }, []);

  // Prefix form
  const emptyPrefix = { prefix: "", description: "", site: "", vlan: "", status: "active" as Prefix["status"], isPool: false, tenant: "", tags: "" };
  const [pForm, setPForm] = useState(emptyPrefix);

  // IP form
  const emptyIP = { address: "", description: "", status: "active" as IPAddress["status"], dnsName: "", assignedDevice: "", assignedInterface: "", tenant: "", nat: "", tags: "" };
  const [ipForm, setIPForm] = useState(emptyIP);

  // VLAN form
  const emptyVLAN = { vid: 0, name: "", description: "", site: "", status: "active" as VLAN["status"], tenant: "", tags: "" };
  const [vForm, setVForm] = useState(emptyVLAN);

  const openNew = () => { setShowForm(true); setEditId(null); setPForm(emptyPrefix); setIPForm(emptyIP); setVForm(emptyVLAN); };

  const handleSavePrefix = () => {
    if (!pForm.prefix) return;
    const tags = pForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    const data = { ...pForm, tags };
    if (editId) updatePrefix(editId, data); else addPrefix(data);
    reload(); setShowForm(false); setEditId(null);
  };

  const handleSaveIP = () => {
    if (!ipForm.address) return;
    const tags = ipForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    const data = { ...ipForm, tags };
    if (editId) updateIPAddress(editId, data); else addIPAddress(data);
    reload(); setShowForm(false); setEditId(null);
  };

  const handleSaveVLAN = () => {
    if (!vForm.name || !vForm.vid) return;
    const tags = vForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    const data = { ...vForm, tags };
    if (editId) updateVLAN(editId, data); else addVLAN(data);
    reload(); setShowForm(false); setEditId(null);
  };

  return (
    <div>
      <SubNav
        tabs={[
          { key: "prefixes", label: `Prefikser (${prefixes.length})`, icon: Network },
          { key: "ips", label: `IP-adresser (${ips.length})`, icon: Globe },
          { key: "vlans", label: `VLANs (${vlans.length})`, icon: Tag },
        ]}
        active={tab}
        onChange={k => { setTab(k as any); setShowForm(false); }}
        right={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Ny {tab === "prefixes" ? "prefiks" : tab === "ips" ? "IP-adresse" : "VLAN"}</Button>}
      />

      {/* ── Prefix Tab ── */}
      {tab === "prefixes" && (
        <>
          {showForm && (
            <div className="bg-card border border-border rounded p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">{editId ? "Rediger prefiks" : "Ny prefiks"}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">Prefiks *</label><Input value={pForm.prefix} onChange={e => setPForm({ ...pForm, prefix: e.target.value })} placeholder="10.0.0.0/8" className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <select value={pForm.status} onChange={e => setPForm({ ...pForm, status: e.target.value as any })} className={selectClass}>
                    {Object.entries(prefixStatusBadge).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">VLAN</label>
                  <select value={pForm.vlan} onChange={e => setPForm({ ...pForm, vlan: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    {vlans.map(v => <option key={v.id} value={v.id}>{v.vid} - {v.name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Site</label><Input value={pForm.site} onChange={e => setPForm({ ...pForm, site: e.target.value })} className="bg-secondary border-border" /></div>
                <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Beskrivelse</label><Input value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Tenant</label><Input value={pForm.tenant} onChange={e => setPForm({ ...pForm, tenant: e.target.value })} className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Tags</label><Input value={pForm.tags} onChange={e => setPForm({ ...pForm, tags: e.target.value })} placeholder="prod, intern" className="bg-secondary border-border" /></div>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" checked={pForm.isPool} onChange={e => setPForm({ ...pForm, isPool: e.target.checked })} className="rounded" /> Er IP-pool</label>
                <div className="flex-1" />
                <Button size="sm" onClick={handleSavePrefix}><Save className="h-3.5 w-3.5 mr-1" /> Lagre</Button>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-sm table-striped">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground bg-secondary/50">
                  <th className="px-3 py-2.5 font-medium text-xs">Prefiks</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Status</th>
                  <th className="px-3 py-2.5 font-medium text-xs">VLAN</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Site</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Beskrivelse</th>
                  <th className="px-3 py-2.5 font-medium text-xs w-20"></th>
                </tr>
              </thead>
              <tbody>
                {prefixes.map(p => {
                  const vlan = vlans.find(v => v.id === p.vlan);
                  return (
                    <tr key={p.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-primary text-sm">{p.prefix}</td>
                      <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded ${prefixStatusBadge[p.status].bg}`}>{prefixStatusBadge[p.status].label}</span></td>
                      <td className="px-3 py-2.5 text-xs">{vlan ? `${vlan.vid} - ${vlan.name}` : "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.site || "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.description || "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => { setPForm({ ...p, vlan: p.vlan || "", tags: (p.tags || []).join(", "), site: p.site || "", tenant: p.tenant || "", description: p.description || "" }); setEditId(p.id); setShowForm(true); }} className="p-1 text-muted-foreground hover:text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { deletePrefix(p.id); reload(); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {prefixes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Network className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Ingen prefikser definert</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── IP Addresses Tab ── */}
      {tab === "ips" && (
        <>
          {showForm && (
            <div className="bg-card border border-border rounded p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">{editId ? "Rediger IP-adresse" : "Ny IP-adresse"}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">Adresse *</label><Input value={ipForm.address} onChange={e => setIPForm({ ...ipForm, address: e.target.value })} placeholder="10.0.1.5/24" className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <select value={ipForm.status} onChange={e => setIPForm({ ...ipForm, status: e.target.value as any })} className={selectClass}>
                    {Object.entries(ipStatusBadge).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">DNS-navn</label><Input value={ipForm.dnsName} onChange={e => setIPForm({ ...ipForm, dnsName: e.target.value })} placeholder="host.example.com" className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">NAT (utsiden)</label><Input value={ipForm.nat} onChange={e => setIPForm({ ...ipForm, nat: e.target.value })} placeholder="84.215.x.x" className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Tilordnet enhet</label>
                  <select value={ipForm.assignedDevice} onChange={e => setIPForm({ ...ipForm, assignedDevice: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.ip})</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Grensesnitt</label><Input value={ipForm.assignedInterface} onChange={e => setIPForm({ ...ipForm, assignedInterface: e.target.value })} placeholder="eth0" className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Beskrivelse</label><Input value={ipForm.description} onChange={e => setIPForm({ ...ipForm, description: e.target.value })} className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Tags</label><Input value={ipForm.tags} onChange={e => setIPForm({ ...ipForm, tags: e.target.value })} className="bg-secondary border-border" /></div>
              </div>
              <div className="flex justify-end mt-3"><Button size="sm" onClick={handleSaveIP}><Save className="h-3.5 w-3.5 mr-1" /> Lagre</Button></div>
            </div>
          )}

          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-sm table-striped">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground bg-secondary/50">
                  <th className="px-3 py-2.5 font-medium text-xs">Adresse</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Status</th>
                  <th className="px-3 py-2.5 font-medium text-xs">DNS</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Enhet</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Beskrivelse</th>
                  <th className="px-3 py-2.5 font-medium text-xs w-20"></th>
                </tr>
              </thead>
              <tbody>
                {ips.map(ip => {
                  const dev = devices.find(d => d.id === ip.assignedDevice);
                  return (
                    <tr key={ip.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-primary text-sm">{ip.address}</td>
                      <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded ${ipStatusBadge[ip.status].bg}`}>{ipStatusBadge[ip.status].label}</span></td>
                      <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{ip.dnsName || "—"}</td>
                      <td className="px-3 py-2.5 text-xs">{dev ? <span className="text-primary">{dev.name}</span> : "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{ip.description || "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => { setIPForm({ ...ip, tags: (ip.tags || []).join(", "), assignedDevice: ip.assignedDevice || "", assignedInterface: ip.assignedInterface || "", dnsName: ip.dnsName || "", nat: ip.nat || "", description: ip.description || "", tenant: ip.tenant || "" }); setEditId(ip.id); setShowForm(true); }} className="p-1 text-muted-foreground hover:text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { deleteIPAddress(ip.id); reload(); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ips.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Ingen IP-adresser registrert</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── VLANs Tab ── */}
      {tab === "vlans" && (
        <>
          {showForm && (
            <div className="bg-card border border-border rounded p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">{editId ? "Rediger VLAN" : "Ny VLAN"}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">VLAN ID *</label><Input type="number" value={vForm.vid || ""} onChange={e => setVForm({ ...vForm, vid: Number(e.target.value) })} placeholder="100" className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Navn *</label><Input value={vForm.name} onChange={e => setVForm({ ...vForm, name: e.target.value })} placeholder="MGMT" className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <select value={vForm.status} onChange={e => setVForm({ ...vForm, status: e.target.value as any })} className={selectClass}>
                    {Object.entries(vlanStatusBadge).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Site</label><Input value={vForm.site} onChange={e => setVForm({ ...vForm, site: e.target.value })} className="bg-secondary border-border" /></div>
                <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Beskrivelse</label><Input value={vForm.description} onChange={e => setVForm({ ...vForm, description: e.target.value })} className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Tenant</label><Input value={vForm.tenant} onChange={e => setVForm({ ...vForm, tenant: e.target.value })} className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Tags</label><Input value={vForm.tags} onChange={e => setVForm({ ...vForm, tags: e.target.value })} className="bg-secondary border-border" /></div>
              </div>
              <div className="flex justify-end mt-3"><Button size="sm" onClick={handleSaveVLAN}><Save className="h-3.5 w-3.5 mr-1" /> Lagre</Button></div>
            </div>
          )}

          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-sm table-striped">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground bg-secondary/50">
                  <th className="px-3 py-2.5 font-medium text-xs">ID</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Navn</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Status</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Site</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Beskrivelse</th>
                  <th className="px-3 py-2.5 font-medium text-xs">Prefikser</th>
                  <th className="px-3 py-2.5 font-medium text-xs w-20"></th>
                </tr>
              </thead>
              <tbody>
                {vlans.map(v => {
                  const linkedPrefixes = prefixes.filter(p => p.vlan === v.id);
                  return (
                    <tr key={v.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-primary font-medium">{v.vid}</td>
                      <td className="px-3 py-2.5 text-sm font-medium text-foreground">{v.name}</td>
                      <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded ${vlanStatusBadge[v.status].bg}`}>{vlanStatusBadge[v.status].label}</span></td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{v.site || "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{v.description || "—"}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {linkedPrefixes.length > 0
                          ? linkedPrefixes.map(p => <span key={p.id} className="font-mono text-primary mr-2">{p.prefix}</span>)
                          : <span className="text-muted-foreground">—</span>
                        }
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => { setVForm({ ...v, tags: (v.tags || []).join(", "), site: v.site || "", tenant: v.tenant || "", description: v.description || "" }); setEditId(v.id); setShowForm(true); }} className="p-1 text-muted-foreground hover:text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { deleteVLAN(v.id); reload(); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {vlans.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Ingen VLANs definert</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
