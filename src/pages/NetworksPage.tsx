import { useState, useEffect, useMemo } from "react";
import { getNetworks, addNetwork, deleteNetwork, updateNetwork, getFirewalls, getZones, addZone, deleteZone, type NetworkInfo, type Firewall, type NetworkZone } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Save, Globe, Edit2, Server, Shield, Info } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// ── Subnet calculator helpers ──
const commonSubnets = [
  { cidr: "/30", mask: "255.255.255.252", hosts: 2 },
  { cidr: "/29", mask: "255.255.255.248", hosts: 6 },
  { cidr: "/28", mask: "255.255.255.240", hosts: 14 },
  { cidr: "/27", mask: "255.255.255.224", hosts: 30 },
  { cidr: "/26", mask: "255.255.255.192", hosts: 62 },
  { cidr: "/25", mask: "255.255.255.128", hosts: 126 },
  { cidr: "/24", mask: "255.255.255.0", hosts: 254 },
  { cidr: "/23", mask: "255.255.254.0", hosts: 510 },
  { cidr: "/22", mask: "255.255.252.0", hosts: 1022 },
  { cidr: "/21", mask: "255.255.248.0", hosts: 2046 },
  { cidr: "/20", mask: "255.255.240.0", hosts: 4094 },
  { cidr: "/16", mask: "255.255.0.0", hosts: 65534 },
];

function parseIp(ip: string): number[] | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
  return parts;
}

function ipToNum(parts: number[]): number {
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function numToIp(num: number): string {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join(".");
}

function calcSubnetInfo(subnetStr: string) {
  const match = subnetStr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if (!match) return null;
  const ip = parseIp(match[1]);
  const prefix = parseInt(match[2]);
  if (!ip || prefix < 8 || prefix > 30) return null;

  const ipNum = ipToNum(ip);
  const mask = (~0 << (32 - prefix)) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const firstHost = network + 1;
  const lastHost = broadcast - 1;
  const totalHosts = lastHost - firstHost + 1;

  return {
    network: numToIp(network),
    broadcast: numToIp(broadcast),
    firstHost: numToIp(firstHost),
    lastHost: numToIp(lastHost),
    gateway: numToIp(firstHost), // default gateway = first usable
    totalHosts,
    prefix,
    mask: numToIp(mask),
  };
}



const emptyForm = { name: "", networkAddress: "", prefix: "/24", vlan: "", zone: "" as string, gateway: "", dhcpStart: "", dhcpEnd: "", dns1: "", dns2: "", domain: "", description: "", firewallId: "" };

export default function NetworksPage() {
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [firewalls, setFirewalls] = useState<Firewall[]>([]);
  const [zones, setZones] = useState<NetworkZone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newZoneName, setNewZoneName] = useState("");
  const [showZoneManager, setShowZoneManager] = useState(false);

  useEffect(() => { setNetworks(getNetworks()); setFirewalls(getFirewalls()); setZones(getZones()); }, []);

  // Calculate subnet info from networkAddress + prefix
  const subnetInfo = useMemo(() => {
    if (!form.networkAddress) return null;
    return calcSubnetInfo(form.networkAddress + form.prefix);
  }, [form.networkAddress, form.prefix]);

  // Auto-set gateway when subnet changes
  const handleSubnetChange = (networkAddress: string, prefix: string) => {
    const info = calcSubnetInfo(networkAddress + prefix);
    const updates: typeof form = { ...form, networkAddress, prefix };
    if (info) {
      updates.gateway = info.gateway;
      // Auto-suggest DHCP range: from .100 to last usable
      const netParts = parseIp(info.network);
      if (netParts) {
        const firstDhcp = ipToNum(netParts) + 100;
        const lastUsable = ipToNum(parseIp(info.lastHost)!);
        if (firstDhcp <= lastUsable) {
          updates.dhcpStart = numToIp(firstDhcp);
          updates.dhcpEnd = info.lastHost;
        }
      }
    }
    setForm(updates);
  };

  const handleSave = () => {
    if (!form.name || !form.networkAddress) return;
    const subnet = form.networkAddress + form.prefix;
    const dhcpRange = form.dhcpStart && form.dhcpEnd ? `${form.dhcpStart}-${form.dhcpEnd}` : "";
    const payload: Omit<NetworkInfo, "id"> = {
      name: form.name,
      subnet,
      vlan: form.vlan || undefined,
      zone: form.zone || undefined,
      gateway: form.gateway || undefined,
      dhcpRange: dhcpRange || undefined,
      dns1: form.dns1 || undefined,
      dns2: form.dns2 || undefined,
      domain: form.domain || undefined,
      description: form.description || undefined,
      firewallId: form.firewallId || undefined,
    };
    if (editId) {
      updateNetwork(editId, payload);
    } else {
      addNetwork(payload);
    }
    setNetworks(getNetworks());
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const handleEdit = (n: NetworkInfo) => {
    // Parse existing subnet into networkAddress + prefix
    const match = n.subnet.match(/^(.+)\/(\d+)$/);
    const networkAddress = match ? match[1] : n.subnet;
    const prefix = match ? `/${match[2]}` : "/24";
    // Parse DHCP range
    const dhcpParts = (n.dhcpRange || "").split("-");
    const dhcpStart = dhcpParts[0] || "";
    const dhcpEnd = dhcpParts[1] || "";
    setForm({
      name: n.name, networkAddress, prefix, vlan: n.vlan || "",
      zone: n.zone || "",
      gateway: n.gateway || "", dhcpStart, dhcpEnd,
      dns1: n.dns1 || "", dns2: n.dns2 || "",
      domain: n.domain || "", description: n.description || "",
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Navn *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" placeholder="LAN" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Nettverksadresse *</label><Input value={form.networkAddress} onChange={e => handleSubnetChange(e.target.value, form.prefix)} className="bg-secondary border-border" placeholder="192.168.1.0" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Subnettmaske</label>
              <select value={form.prefix} onChange={e => handleSubnetChange(form.networkAddress, e.target.value)} className={selectClass}>
                {commonSubnets.map(s => (
                  <option key={s.cidr} value={s.cidr}>{s.cidr} ({s.mask}) – {s.hosts} hoster</option>
                ))}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">VLAN</label><Input value={form.vlan} onChange={e => setForm({ ...form, vlan: e.target.value })} className="bg-secondary border-border" placeholder="10" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Sone</label>
              <div className="flex gap-1">
                <select value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} className={selectClass + " flex-1"}>
                  <option value="">Ingen</option>
                  {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowZoneManager(!showZoneManager)} className="px-2 rounded-md border border-border bg-secondary text-muted-foreground hover:text-foreground text-xs" title="Administrer soner">⚙</button>
              </div>
            </div>
          </div>

          {/* Calculated subnet info */}
          {subnetInfo && (
            <div className="bg-secondary/50 border border-border rounded-lg p-3 mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs text-primary font-semibold uppercase tracking-wide">Beregnet subnettinfo</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><span className="text-muted-foreground block">Nettverk</span><span className="font-mono text-foreground">{subnetInfo.network}/{subnetInfo.prefix}</span></div>
                <div><span className="text-muted-foreground block">Subnettmaske</span><span className="font-mono text-foreground">{subnetInfo.mask}</span></div>
                <div><span className="text-muted-foreground block">Brukbart område</span><span className="font-mono text-foreground">{subnetInfo.firstHost} – {subnetInfo.lastHost}</span></div>
                <div><span className="text-muted-foreground block">Broadcast</span><span className="font-mono text-foreground">{subnetInfo.broadcast}</span></div>
                <div><span className="text-muted-foreground block">Antall hoster</span><span className="text-foreground font-semibold">{subnetInfo.totalHosts.toLocaleString()}</span></div>
              </div>
            </div>
          )}

          {/* Gateway + DHCP */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
            <div><label className="text-xs text-muted-foreground mb-1 block">Gateway</label><Input value={form.gateway} onChange={e => setForm({ ...form, gateway: e.target.value })} className="bg-secondary border-border" placeholder={subnetInfo?.gateway || "192.168.1.1"} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">DHCP start</label><Input value={form.dhcpStart} onChange={e => setForm({ ...form, dhcpStart: e.target.value })} className="bg-secondary border-border" placeholder={subnetInfo ? numToIp(ipToNum(parseIp(subnetInfo.network)!) + 100) : ""} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">DHCP slutt</label><Input value={form.dhcpEnd} onChange={e => setForm({ ...form, dhcpEnd: e.target.value })} className="bg-secondary border-border" placeholder={subnetInfo?.lastHost || ""} /></div>
          </div>

          {/* DNS + domain + firewall */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div><label className="text-xs text-muted-foreground mb-1 block">Primær DNS</label><Input value={form.dns1} onChange={e => setForm({ ...form, dns1: e.target.value })} className="bg-secondary border-border" placeholder="1.1.1.1" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Sekundær DNS</label><Input value={form.dns2} onChange={e => setForm({ ...form, dns2: e.target.value })} className="bg-secondary border-border" placeholder="8.8.8.8" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Domene</label><Input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} className="bg-secondary border-border" placeholder="local.lan" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Brannmur</label>
              <select value={form.firewallId} onChange={e => setForm({ ...form, firewallId: e.target.value })} className={selectClass}>
                <option value="">Ingen</option>
                {firewalls.map(fw => <option key={fw.id} value={fw.id}>{fw.name}{fw.ip ? ` (${fw.ip})` : ""}</option>)}
              </select>
            </div>
          </div>

          <div><label className="text-xs text-muted-foreground mb-1 block">Beskrivelse</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-16 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground resize-none" /></div>
          <div className="mt-4 flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {networks.map(n => {
          const info = calcSubnetInfo(n.subnet);
          return (
            <div key={n.id} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-lg">{n.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(n)} className="text-muted-foreground hover:text-primary p-1"><Edit2 className="h-4 w-4" /></button>
                  <ConfirmDialog
                    trigger={<button className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>}
                    title="Slett nettverk"
                    description={`Er du sikker på at du vil slette «${n.name}»?`}
                    onConfirm={() => { deleteNetwork(n.id); setNetworks(getNetworks()); }}
                  />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subnett</span><span className="font-mono text-foreground">{n.subnet}</span></div>
                {info && <div className="flex justify-between"><span className="text-muted-foreground">Maske</span><span className="font-mono text-foreground">{info.mask}</span></div>}
                {info && <div className="flex justify-between"><span className="text-muted-foreground">Brukbart</span><span className="font-mono text-foreground text-xs">{info.firstHost} – {info.lastHost} ({info.totalHosts})</span></div>}
                {n.vlan && <div className="flex justify-between"><span className="text-muted-foreground">VLAN</span><span className="font-mono text-foreground">{n.vlan}</span></div>}
                {n.zone && <div className="flex justify-between"><span className="text-muted-foreground">Sone</span><span className="text-foreground font-semibold">{n.zone}</span></div>}
                {n.gateway && <div className="flex justify-between"><span className="text-muted-foreground">Gateway</span><span className="font-mono text-foreground">{n.gateway}</span></div>}
                {n.dhcpRange && <div className="flex justify-between"><span className="text-muted-foreground">DHCP</span><span className="font-mono text-foreground">{n.dhcpRange}</span></div>}
                {n.domain && <div className="flex justify-between"><span className="text-muted-foreground">Domene</span><span className="font-mono text-foreground">{n.domain}</span></div>}
                {n.firewallId && (() => { const fw = firewalls.find(f => f.id === n.firewallId); return fw ? (
                  <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Brannmur</span><span className="text-foreground">{fw.name}</span></div>
                ) : null; })()}

                {(n.dns1 || n.dns2) && (
                  <div className="pt-2 mt-2 border-t border-border space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Server className="h-3 w-3" /> DNS</p>
                    {n.dns1 && <div className="flex justify-between"><span className="text-muted-foreground">Primær</span><span className="font-mono text-foreground">{n.dns1}</span></div>}
                    {n.dns2 && <div className="flex justify-between"><span className="text-muted-foreground">Sekundær</span><span className="font-mono text-foreground">{n.dns2}</span></div>}
                  </div>
                )}
                {n.description && <p className="text-muted-foreground mt-2 pt-2 border-t border-border">{n.description}</p>}
              </div>
            </div>
          );
        })}
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
