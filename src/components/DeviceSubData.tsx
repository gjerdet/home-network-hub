import { useState } from "react";
import { type Device, type DeviceInterface, type DeviceRoute, type DeviceCable, updateDevice, getDevices, getNetworks } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, X, Network, Route, Cable, Layers, Edit2, ChevronDown, ChevronRight, Globe, Link2, Zap } from "lucide-react";

const ifaceTypes = ["ethernet", "wifi", "vlan", "bridge", "bond", "loopback", "tunnel", "lag", "other"] as const;
const ifaceModes = ["access", "trunk", "hybrid", "routed"] as const;
const ifaceModeLabels: Record<string, string> = { access: "Access", trunk: "Trunk", hybrid: "Hybrid", routed: "Routed" };
const ifaceSpeeds = ["10M", "100M", "1G", "2.5G", "5G", "10G", "25G", "40G", "100G"] as const;
const cableTypes = ["cat5e", "cat6", "cat6a", "cat7", "fiber-sm", "fiber-mm", "dac", "coax", "other"] as const;
const cableTypeLabels: Record<string, string> = { "cat5e": "Cat5e", "cat6": "Cat6", "cat6a": "Cat6a", "cat7": "Cat7", "fiber-sm": "Fiber SM", "fiber-mm": "Fiber MM", "dac": "DAC", "coax": "Coax", "other": "Annet" };
const cableStatusLabels: Record<string, string> = { connected: "Tilkoblet", planned: "Planlagt", broken: "Ødelagt" };

const selectClass = "w-full h-9 rounded-md bg-secondary border border-border px-3 text-sm text-foreground";

interface Props {
  device: Device;
  onUpdate: () => void;
  initialTab?: "interfaces" | "routes" | "cables";
}

export function DeviceSubData({ device, onUpdate, initialTab = "interfaces" }: Props) {
  const [tab, setTab] = useState<"interfaces" | "routes" | "cables">(initialTab);
  const allDevices = getDevices().filter(d => d.id !== device.id);
  const networks = getNetworks();
  const availableVlans = networks.filter(n => n.vlan).map(n => ({ vlan: n.vlan!, name: n.name }));
  // Interfaces
  const [showIfForm, setShowIfForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingIfaceId, setEditingIfaceId] = useState<string | null>(null);
  const [editIfForm, setEditIfForm] = useState<Partial<DeviceInterface>>({});
  const [ifForm, setIfForm] = useState({ name: "", type: "ethernet" as DeviceInterface["type"], ip: "", mac: "", speed: "", enabled: true, description: "", connectedTo: "", connectedToInterface: "", vlanId: "" });
  const [bulkForm, setBulkForm] = useState({ prefix: "eth", start: 0, count: 24, type: "ethernet" as DeviceInterface["type"], speed: "1G" });

  // Helper: get interfaces for a device by ID
  const getDeviceInterfaces = (deviceId: string) => {
    const d = allDevices.find(dev => dev.id === deviceId);
    return d?.interfaces || [];
  };

  // Helper: resolve device name from ID
  const resolveDeviceName = (ref?: string) => {
    if (!ref) return "";
    const found = allDevices.find(d => d.id === ref);
    return found ? found.name : ref;
  };

  const syncReverseInterfaceLink = ({
    previousInterface,
    nextInterface,
  }: {
    previousInterface?: DeviceInterface;
    nextInterface?: DeviceInterface;
  }) => {
    const clearRemoteLink = (remoteDeviceId?: string, remoteInterfaceName?: string, localInterfaceName?: string) => {
      if (!remoteDeviceId || !remoteInterfaceName || !localInterfaceName) return;
      const remoteDevice = getDevices().find(d => d.id === remoteDeviceId);
      if (!remoteDevice?.interfaces?.length) return;

      updateDevice(remoteDeviceId, {
        interfaces: remoteDevice.interfaces.map(iface =>
          iface.name === remoteInterfaceName &&
          iface.connectedTo === device.id &&
          iface.connectedToInterface === localInterfaceName
            ? { ...iface, connectedTo: "", connectedToInterface: "" }
            : iface
        ),
      });
    };

    const setRemoteLink = (remoteDeviceId?: string, remoteInterfaceName?: string, localInterfaceName?: string) => {
      if (!remoteDeviceId || !remoteInterfaceName || !localInterfaceName) return;
      const remoteDevice = getDevices().find(d => d.id === remoteDeviceId);
      if (!remoteDevice?.interfaces?.length) return;

      updateDevice(remoteDeviceId, {
        interfaces: remoteDevice.interfaces.map(iface =>
          iface.name === remoteInterfaceName
            ? { ...iface, connectedTo: device.id, connectedToInterface: localInterfaceName }
            : iface
        ),
      });
    };

    if (
      previousInterface?.connectedTo &&
      previousInterface.connectedToInterface &&
      (
        previousInterface.connectedTo !== nextInterface?.connectedTo ||
        previousInterface.connectedToInterface !== nextInterface?.connectedToInterface ||
        previousInterface.name !== nextInterface?.name
      )
    ) {
      clearRemoteLink(previousInterface.connectedTo, previousInterface.connectedToInterface, previousInterface.name);
    }

    if (nextInterface?.connectedTo && nextInterface.connectedToInterface) {
      setRemoteLink(nextInterface.connectedTo, nextInterface.connectedToInterface, nextInterface.name);
    }
  };

  const addInterface = () => {
    if (!ifForm.name) return;
    const newInterface: DeviceInterface = { id: crypto.randomUUID(), ...ifForm };
    updateDevice(device.id, { interfaces: [...(device.interfaces || []), newInterface] });
    syncReverseInterfaceLink({ nextInterface: newInterface });
    onUpdate();
    setShowIfForm(false);
    setIfForm({ name: "", type: "ethernet", ip: "", mac: "", speed: "", enabled: true, description: "", connectedTo: "", connectedToInterface: "", vlanId: "" });
  };

  const addBulkInterfaces = () => {
    if (!bulkForm.prefix || bulkForm.count < 1) return;
    const existing = device.interfaces || [];
    const newIfaces: DeviceInterface[] = [];
    // Use the actual start number from the form
    for (let i = 0; i < bulkForm.count; i++) {
      newIfaces.push({
        id: crypto.randomUUID(),
        name: `${bulkForm.prefix}${bulkForm.start + i}`,
        type: bulkForm.type,
        speed: bulkForm.speed,
        enabled: true,
        ip: "", mac: "", description: "", connectedTo: "", connectedToInterface: "", vlanId: "",
      });
    }
    updateDevice(device.id, { interfaces: [...existing, ...newIfaces] });
    onUpdate();
    setShowBulkForm(false);
  };

  // Calculate next available start number based on existing interfaces with same prefix
  const getNextStart = (prefix: string) => {
    const existing = device.interfaces || [];
    let maxNum = -1;
    existing.forEach(iface => {
      if (iface.name.startsWith(prefix)) {
        const numPart = iface.name.slice(prefix.length);
        const num = parseInt(numPart);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return maxNum + 1;
  };

  const openBulkForm = () => {
    const prefix = bulkForm.prefix || "eth";
    const nextStart = getNextStart(prefix);
    setBulkForm(f => ({ ...f, prefix, start: nextStart }));
    setShowBulkForm(true);
  };

  const removeInterface = (id: string) => {
    const interfaceToRemove = (device.interfaces || []).find(i => i.id === id);
    if (interfaceToRemove) {
      syncReverseInterfaceLink({ previousInterface: interfaceToRemove });
    }
    updateDevice(device.id, { interfaces: (device.interfaces || []).filter(i => i.id !== id) });
    onUpdate();
  };

  const startEditIface = (iface: DeviceInterface) => {
    setEditingIfaceId(iface.id);
    setEditIfForm({ ...iface });
  };

  const saveEditIface = () => {
    if (!editingIfaceId) return;
    const previousInterface = (device.interfaces || []).find(i => i.id === editingIfaceId);
    if (!previousInterface) return;

    const nextInterface: DeviceInterface = { ...previousInterface, ...editIfForm };
    const ifaces = (device.interfaces || []).map(i => i.id === editingIfaceId ? nextInterface : i);
    updateDevice(device.id, { interfaces: ifaces });
    syncReverseInterfaceLink({ previousInterface, nextInterface });
    onUpdate();
    setEditingIfaceId(null);
    setEditIfForm({});
  };

  // Routes
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeForm, setRouteForm] = useState({ destination: "", gateway: "", metric: undefined as number | undefined, interface: "", description: "" });

  const addRoute = () => {
    if (!routeForm.destination || !routeForm.gateway) return;
    const routes = [...(device.routes || []), { id: crypto.randomUUID(), ...routeForm }];
    updateDevice(device.id, { routes: routes });
    onUpdate();
    setShowRouteForm(false);
    setRouteForm({ destination: "", gateway: "", metric: undefined, interface: "", description: "" });
  };

  const removeRoute = (id: string) => {
    updateDevice(device.id, { routes: (device.routes || []).filter(r => r.id !== id) });
    onUpdate();
  };

  // Cables
  const [showCableForm, setShowCableForm] = useState(false);
  const [cableForm, setCableForm] = useState({ label: "", type: "cat6" as DeviceCable["type"], localPort: "", remoteDevice: "", remotePort: "", length: "", color: "", status: "connected" as DeviceCable["status"] });

  const addCable = () => {
    if (!cableForm.localPort || !cableForm.remoteDevice) return;
    // Add cable to this device
    const cableId = crypto.randomUUID();
    const cables = [...(device.cables || []), { id: cableId, ...cableForm }];
    updateDevice(device.id, { cables });

    // Auto-create reverse cable on remote device
    if (cableForm.remoteDevice && cableForm.remotePort) {
      const remoteDevice = getDevices().find(d => d.id === cableForm.remoteDevice);
      if (remoteDevice) {
        const reverseCable: DeviceCable = {
          id: crypto.randomUUID(),
          label: cableForm.label,
          type: cableForm.type,
          localPort: cableForm.remotePort,
          remoteDevice: device.id,
          remotePort: cableForm.localPort,
          length: cableForm.length,
          color: cableForm.color,
          status: cableForm.status,
        };
        // Only add if not already linked
        const alreadyLinked = (remoteDevice.cables || []).some(c =>
          c.localPort === reverseCable.localPort && c.remoteDevice === device.id && c.remotePort === cableForm.localPort
        );
        if (!alreadyLinked) {
          updateDevice(cableForm.remoteDevice, { cables: [...(remoteDevice.cables || []), reverseCable] });
        }
      }
    }

    onUpdate();
    setShowCableForm(false);
    setCableForm({ label: "", type: "cat6", localPort: "", remoteDevice: "", remotePort: "", length: "", color: "", status: "connected" });
  };

  const removeCable = (id: string) => {
    const cable = (device.cables || []).find(c => c.id === id);
    // Remove reverse cable on remote device
    if (cable?.remoteDevice && cable.remotePort) {
      const remoteDevice = getDevices().find(d => d.id === cable.remoteDevice);
      if (remoteDevice) {
        const updatedRemoteCables = (remoteDevice.cables || []).filter(c =>
          !(c.localPort === cable.remotePort && c.remoteDevice === device.id && c.remotePort === cable.localPort)
        );
        updateDevice(cable.remoteDevice, { cables: updatedRemoteCables });
      }
    }
    updateDevice(device.id, { cables: (device.cables || []).filter(c => c.id !== id) });
    onUpdate();
  };

  const getRemoteInterfaces = () => {
    const remote = allDevices.find(d => d.id === cableForm.remoteDevice);
    return remote?.interfaces || [];
  };

  const ifaces = device.interfaces || [];
  const routes = device.routes || [];
  const cables = device.cables || [];
  const localInterfaces = device.interfaces || [];

  return (
    <div className="border-t border-border">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { key: "interfaces" as const, label: "Grensesnitt", icon: Network, count: ifaces.length },
          { key: "routes" as const, label: "Ruter", icon: Route, count: routes.length },
          { key: "cables" as const, label: "Kabler", icon: Cable, count: cables.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.count > 0 && <span className="bg-secondary text-muted-foreground px-1.5 py-0.5 rounded text-[10px]">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* INTERFACES */}
        {tab === "interfaces" && (
          <div>
            {ifaces.length > 0 && (
              <div className="space-y-1 mb-3 max-h-[500px] overflow-y-auto">
                {ifaces.map(iface => (
                  <div key={iface.id}>
                    <div
                      className={`flex items-center gap-3 bg-background rounded-md border px-3 py-2 text-xs cursor-pointer hover:border-primary/40 transition-colors ${editingIfaceId === iface.id ? "border-primary/50 bg-primary/5" : "border-border"}`}
                      onClick={() => editingIfaceId === iface.id ? setEditingIfaceId(null) : startEditIface(iface)}
                    >
                      {editingIfaceId === iface.id ? <ChevronDown className="h-3 w-3 text-primary shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${iface.enabled ? "bg-success" : "bg-destructive"}`} />
                      <span className="font-mono font-medium text-foreground w-24 truncate">{iface.name}</span>
                      <span className="text-muted-foreground w-16">{iface.type}</span>
                      {iface.ip && <span className="font-mono text-foreground">{iface.ip}</span>}
                      {iface.mac && <span className="font-mono text-muted-foreground hidden lg:inline">{iface.mac}</span>}
                      {iface.speed && <span className="bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{iface.speed}</span>}
                      {iface.mode && <span className="bg-accent px-1.5 py-0.5 rounded text-accent-foreground text-[10px]">{ifaceModeLabels[iface.mode] || iface.mode}</span>}
                      {iface.isWan && <span className="bg-warning/20 text-warning px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" /> WAN</span>}
                      {iface.poe && iface.poe !== "none" && <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded text-[10px] font-semibold"><Zap className="h-2.5 w-2.5 inline mr-0.5" />{iface.poe.toUpperCase()}</span>}
                      {iface.type === "lag" && <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5"><Link2 className="h-2.5 w-2.5" /> LAG</span>}
                      {iface.lagGroup && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">→ {iface.lagGroup}</span>}
                      {iface.lagMembers && iface.lagMembers.length > 0 && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">{iface.lagMembers.length} medlemmer</span>}
                      {iface.vlanId && <span className="bg-info/15 text-info px-1.5 py-0.5 rounded">VLAN {iface.vlanId}</span>}
                      {iface.taggedVlans && iface.taggedVlans.length > 0 && <span className="bg-warning/15 text-warning px-1.5 py-0.5 rounded text-[10px]">Tagged: {iface.taggedVlans.join(",")}</span>}
                      {iface.connectedTo && (
                        <span className="text-muted-foreground">
                          → {resolveDeviceName(iface.connectedTo)}
                          {iface.connectedToInterface && <span className="font-mono ml-1">({iface.connectedToInterface})</span>}
                        </span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); removeInterface(iface.id); }} className="ml-auto text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    {/* Inline edit form */}
                    {editingIfaceId === iface.id && (
                      <div className="bg-primary/5 border border-primary/20 border-t-0 rounded-b-md p-3 space-y-3">
                        <div className="grid grid-cols-4 gap-3">
                          <div><label className="text-[10px] text-muted-foreground block mb-0.5">Navn</label><Input value={editIfForm.name || ""} onChange={e => setEditIfForm({ ...editIfForm, name: e.target.value })} className="bg-secondary border-border h-8 text-xs" /></div>
                          <div><label className="text-[10px] text-muted-foreground block mb-0.5">Type</label><select value={editIfForm.type || "ethernet"} onChange={e => setEditIfForm({ ...editIfForm, type: e.target.value as any })} className={selectClass}>{ifaceTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                          <div><label className="text-[10px] text-muted-foreground block mb-0.5">Status</label>
                            <select value={editIfForm.enabled ? "up" : "down"} onChange={e => setEditIfForm({ ...editIfForm, enabled: e.target.value === "up" })} className={selectClass}>
                              <option value="up">Oppe</option><option value="down">Nede</option>
                            </select>
                          </div>
                          <div><label className="text-[10px] text-muted-foreground block mb-0.5">Hastighet</label><select value={editIfForm.speed || ""} onChange={e => setEditIfForm({ ...editIfForm, speed: e.target.value })} className={selectClass}><option value="">—</option>{ifaceSpeeds.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                          <div><label className="text-[10px] text-muted-foreground block mb-0.5">IP-adresse</label><Input value={editIfForm.ip || ""} onChange={e => setEditIfForm({ ...editIfForm, ip: e.target.value })} className="bg-secondary border-border h-8 text-xs" /></div>
                          <div><label className="text-[10px] text-muted-foreground block mb-0.5">MAC-adresse</label><Input value={editIfForm.mac || ""} onChange={e => setEditIfForm({ ...editIfForm, mac: e.target.value })} className="bg-secondary border-border h-8 text-xs" /></div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-0.5">Modus</label>
                            <select value={editIfForm.mode || ""} onChange={e => setEditIfForm({ ...editIfForm, mode: e.target.value as any || undefined })} className={selectClass}>
                              <option value="">Ingen</option>
                              {ifaceModes.map(m => <option key={m} value={m}>{ifaceModeLabels[m]}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-0.5">Access VLAN</label>
                            {availableVlans.length > 0 ? (
                              <select value={editIfForm.vlanId || ""} onChange={e => setEditIfForm({ ...editIfForm, vlanId: e.target.value })} className={selectClass}>
                                <option value="">Ingen</option>
                                {availableVlans.map(v => <option key={v.vlan} value={v.vlan}>VLAN {v.vlan} – {v.name}</option>)}
                              </select>
                            ) : (
                              <Input value={editIfForm.vlanId || ""} onChange={e => setEditIfForm({ ...editIfForm, vlanId: e.target.value })} placeholder="VLAN ID" className="bg-secondary border-border h-8 text-xs" />
                            )}
                          </div>
                        </div>
                        {/* WAN + LAG */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer py-1">
                              <input type="checkbox" checked={editIfForm.isWan || false} onChange={e => setEditIfForm({ ...editIfForm, isWan: e.target.checked })} className="rounded border-border" />
                              <Globe className="h-3 w-3 text-warning" /> WAN-grensesnitt
                            </label>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-0.5">PoE</label>
                            <select value={editIfForm.poe || "none"} onChange={e => setEditIfForm({ ...editIfForm, poe: e.target.value as any })} className={selectClass}>
                              <option value="none">Ingen</option>
                              <option value="poe">PoE (15.4W)</option>
                              <option value="poe+">PoE+ (30W)</option>
                              <option value="poe++">PoE++ (60W+)</option>
                            </select>
                          </div>
                          </div>
                          {editIfForm.type !== "lag" && (
                            <div>
                              <label className="text-[10px] text-muted-foreground block mb-0.5">LAG-gruppe (medlem av)</label>
                              <select value={editIfForm.lagGroup || ""} onChange={e => setEditIfForm({ ...editIfForm, lagGroup: e.target.value })} className={selectClass}>
                                <option value="">Ingen</option>
                                {ifaces.filter(i => i.type === "lag" && i.id !== editingIfaceId).map(i => (
                                  <option key={i.id} value={i.name}>{i.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {editIfForm.type === "lag" && (
                            <div>
                              <label className="text-[10px] text-muted-foreground block mb-0.5">LAG-medlemmer</label>
                              <div className="bg-secondary border border-border rounded-md p-1.5 max-h-24 overflow-y-auto space-y-0.5">
                                {ifaces.filter(i => i.type === "ethernet" && i.id !== editingIfaceId).map(i => {
                                  const members = editIfForm.lagMembers || [];
                                  const isMember = members.includes(i.id);
                                  return (
                                    <label key={i.id} className="flex items-center gap-1.5 text-[10px] cursor-pointer hover:bg-background rounded px-1 py-0.5">
                                      <input type="checkbox" checked={isMember} onChange={e => {
                                        const next = e.target.checked ? [...members, i.id] : members.filter(m => m !== i.id);
                                        setEditIfForm({ ...editIfForm, lagMembers: next });
                                      }} className="rounded border-border" />
                                      <span className="font-mono text-foreground">{i.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Tagged VLANs for trunk/hybrid */}
                        {(editIfForm.mode === "trunk" || editIfForm.mode === "hybrid") && availableVlans.length > 0 && (
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Tagged VLANs</label>
                            <div className="flex flex-wrap gap-2">
                              {availableVlans.map(v => {
                                const tagged = editIfForm.taggedVlans || [];
                                const isTagged = tagged.includes(v.vlan);
                                return (
                                  <button
                                    key={v.vlan}
                                    type="button"
                                    onClick={() => {
                                      const newTagged = isTagged ? tagged.filter(t => t !== v.vlan) : [...tagged, v.vlan];
                                      setEditIfForm({ ...editIfForm, taggedVlans: newTagged });
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] border transition-colors ${isTagged ? "bg-primary/20 text-primary border-primary/40" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}
                                  >
                                    VLAN {v.vlan} – {v.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* Connected device + interface */}
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Tilkobling</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-0.5">Koblet til enhet</label>
                            <select
                              value={editIfForm.connectedTo || ""}
                              onChange={e => setEditIfForm({ ...editIfForm, connectedTo: e.target.value, connectedToInterface: "" })}
                              className={selectClass}
                            >
                              <option value="">Ingen</option>
                              {allDevices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.ip})</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-0.5">Grensesnitt på enhet</label>
                            {editIfForm.connectedTo && getDeviceInterfaces(editIfForm.connectedTo).length > 0 ? (
                              <select
                                value={editIfForm.connectedToInterface || ""}
                                onChange={e => setEditIfForm({ ...editIfForm, connectedToInterface: e.target.value })}
                                className={selectClass}
                              >
                                <option value="">Velg grensesnitt...</option>
                                {getDeviceInterfaces(editIfForm.connectedTo).map(i => (
                                  <option key={i.id} value={i.name}>{i.name} {i.ip ? `(${i.ip})` : ""}</option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                value={editIfForm.connectedToInterface || ""}
                                onChange={e => setEditIfForm({ ...editIfForm, connectedToInterface: e.target.value })}
                                placeholder={editIfForm.connectedTo ? "Skriv inn port..." : "Velg enhet først"}
                                disabled={!editIfForm.connectedTo}
                                className="bg-secondary border-border h-8 text-xs"
                              />
                            )}
                          </div>
                        </div>
                        <div><label className="text-[10px] text-muted-foreground block mb-0.5">Beskrivelse</label><Input value={editIfForm.description || ""} onChange={e => setEditIfForm({ ...editIfForm, description: e.target.value })} className="bg-secondary border-border h-8 text-xs" /></div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setEditingIfaceId(null)}>Avbryt</Button>
                          <Button size="sm" onClick={saveEditIface}><Save className="h-3 w-3 mr-1" /> Lagre</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {ifaces.length === 0 && !showIfForm && !showBulkForm && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Network className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Ingen grensesnitt konfigurert</p>
                <p className="text-xs text-muted-foreground/70 mb-4">Legg til enkeltvis eller generer flere porter på en gang.</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowIfForm(true)}><Plus className="h-3 w-3 mr-1" /> Enkelt</Button>
                  <Button size="sm" variant="outline" onClick={openBulkForm}><Layers className="h-3 w-3 mr-1" /> Generer flere</Button>
                </div>
              </div>
            )}

            {showBulkForm && (
              <div className="bg-background border border-primary/30 rounded-md p-4 space-y-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Generer grensesnitt</span>
                </div>
                <p className="text-xs text-muted-foreground">Opprett f.eks. 48 switchporter (GigabitEthernet0/1 – GigabitEthernet0/48)</p>
                <div className="grid grid-cols-5 gap-3">
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Prefiks</label><Input value={bulkForm.prefix} onChange={e => { const prefix = e.target.value; setBulkForm({ ...bulkForm, prefix, start: getNextStart(prefix) }); }} placeholder="GigabitEthernet0/" className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Start-nr</label><Input type="number" value={bulkForm.start} onChange={e => setBulkForm({ ...bulkForm, start: Number(e.target.value) })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Antall</label><Input type="number" value={bulkForm.count} onChange={e => setBulkForm({ ...bulkForm, count: Number(e.target.value) })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Type</label><select value={bulkForm.type} onChange={e => setBulkForm({ ...bulkForm, type: e.target.value as any })} className={selectClass}>{ifaceTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Hastighet</label><select value={bulkForm.speed} onChange={e => setBulkForm({ ...bulkForm, speed: e.target.value })} className={selectClass}><option value="">—</option>{ifaceSpeeds.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
                {bulkForm.prefix && bulkForm.count > 0 && (
                  <p className="text-[10px] text-muted-foreground bg-secondary/60 rounded px-2 py-1.5">
                    Forhåndsvisning: <span className="font-mono text-foreground">{bulkForm.prefix}{bulkForm.start}</span> → <span className="font-mono text-foreground">{bulkForm.prefix}{bulkForm.start + bulkForm.count - 1}</span> ({bulkForm.count} stk)
                  </p>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowBulkForm(false)}>Avbryt</Button>
                  <Button size="sm" onClick={addBulkInterfaces}><Save className="h-3 w-3 mr-1" /> Opprett {bulkForm.count} grensesnitt</Button>
                </div>
              </div>
            )}

            {showIfForm ? (
              <div className="bg-background border border-border rounded-md p-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Navn *</label><Input value={ifForm.name} onChange={e => setIfForm({ ...ifForm, name: e.target.value })} placeholder="eth0" className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Type</label><select value={ifForm.type} onChange={e => setIfForm({ ...ifForm, type: e.target.value as any })} className={selectClass}>{ifaceTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">IP</label><Input value={ifForm.ip} onChange={e => setIfForm({ ...ifForm, ip: e.target.value })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">MAC</label><Input value={ifForm.mac} onChange={e => setIfForm({ ...ifForm, mac: e.target.value })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Hastighet</label><select value={ifForm.speed} onChange={e => setIfForm({ ...ifForm, speed: e.target.value })} className={selectClass}><option value="">—</option>{ifaceSpeeds.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Modus</label>
                    <select value={(ifForm as any).mode || ""} onChange={e => setIfForm({ ...ifForm, mode: e.target.value as any } as any)} className={selectClass}>
                      <option value="">Ingen</option>
                      {ifaceModes.map(m => <option key={m} value={m}>{ifaceModeLabels[m]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Access VLAN</label>
                    {availableVlans.length > 0 ? (
                      <select value={ifForm.vlanId} onChange={e => setIfForm({ ...ifForm, vlanId: e.target.value })} className={selectClass}>
                        <option value="">Ingen</option>
                        {availableVlans.map(v => <option key={v.vlan} value={v.vlan}>VLAN {v.vlan} – {v.name}</option>)}
                      </select>
                    ) : (
                      <Input value={ifForm.vlanId} onChange={e => setIfForm({ ...ifForm, vlanId: e.target.value })} placeholder="VLAN ID" className="bg-secondary border-border h-9 text-xs" />
                    )}
                  </div>
                </div>
                {/* WAN + LAG */}
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer py-1">
                    <input type="checkbox" checked={(ifForm as any).isWan || false} onChange={e => setIfForm({ ...ifForm, isWan: e.target.checked } as any)} className="rounded border-border" />
                    <Globe className="h-3 w-3 text-warning" /> WAN-grensesnitt
                  </label>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">PoE</label>
                    <select value={(ifForm as any).poe || "none"} onChange={e => setIfForm({ ...ifForm, poe: e.target.value as any } as any)} className={selectClass}>
                      <option value="none">Ingen</option>
                      <option value="poe">PoE (15.4W)</option>
                      <option value="poe+">PoE+ (30W)</option>
                      <option value="poe++">PoE++ (60W+)</option>
                    </select>
                  </div>
                </div>
                {/* Connected device + interface */}
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Tilkobling</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Koblet til enhet</label>
                    <select value={ifForm.connectedTo} onChange={e => setIfForm({ ...ifForm, connectedTo: e.target.value, connectedToInterface: "" })} className={selectClass}>
                      <option value="">Ingen</option>
                      {allDevices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.ip})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Grensesnitt på enhet</label>
                    {ifForm.connectedTo && getDeviceInterfaces(ifForm.connectedTo).length > 0 ? (
                      <select value={ifForm.connectedToInterface} onChange={e => setIfForm({ ...ifForm, connectedToInterface: e.target.value })} className={selectClass}>
                        <option value="">Velg grensesnitt...</option>
                        {getDeviceInterfaces(ifForm.connectedTo).map(i => (
                          <option key={i.id} value={i.name}>{i.name} {i.ip ? `(${i.ip})` : ""}</option>
                        ))}
                      </select>
                    ) : (
                      <Input value={ifForm.connectedToInterface} onChange={e => setIfForm({ ...ifForm, connectedToInterface: e.target.value })} placeholder={ifForm.connectedTo ? "Skriv inn port..." : "Velg enhet først"} disabled={!ifForm.connectedTo} className="bg-secondary border-border h-9 text-xs" />
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowIfForm(false)}>Avbryt</Button>
                  <Button size="sm" onClick={addInterface}><Save className="h-3 w-3 mr-1" /> Lagre</Button>
                </div>
              </div>
            ) : ifaces.length > 0 && !showBulkForm && (
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowIfForm(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Plus className="h-3 w-3" /> Legg til enkelt</button>
                <button onClick={openBulkForm} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Layers className="h-3 w-3" /> Generer flere</button>
              </div>
            )}
          </div>
        )}

        {/* ROUTES */}
        {tab === "routes" && (
          <div>
            {routes.length > 0 && (
              <div className="space-y-2 mb-3">
                {routes.map(route => (
                  <div key={route.id} className="flex items-center gap-3 bg-background rounded-md border border-border p-3 text-xs">
                    <span className="font-mono font-medium text-foreground">{route.destination}</span>
                    <span className="text-muted-foreground">via</span>
                    <span className="font-mono text-foreground">{route.gateway}</span>
                    {route.metric !== undefined && <span className="text-muted-foreground">metric {route.metric}</span>}
                    {route.interface && <span className="bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">dev {route.interface}</span>}
                    {route.description && <span className="text-muted-foreground italic">{route.description}</span>}
                    <button onClick={() => removeRoute(route.id)} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
            {routes.length === 0 && !showRouteForm && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Route className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Ingen ruter konfigurert</p>
                <p className="text-xs text-muted-foreground/70 mb-4">Legg til statiske ruter, default gateway osv.</p>
                <Button size="sm" onClick={() => setShowRouteForm(true)}><Plus className="h-3 w-3 mr-1" /> Legg til rute</Button>
              </div>
            )}
            {showRouteForm ? (
              <div className="bg-background border border-border rounded-md p-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Destinasjon *</label><Input value={routeForm.destination} onChange={e => setRouteForm({ ...routeForm, destination: e.target.value })} placeholder="0.0.0.0/0" className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Gateway *</label><Input value={routeForm.gateway} onChange={e => setRouteForm({ ...routeForm, gateway: e.target.value })} placeholder="192.168.1.1" className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Metric</label><Input type="number" value={routeForm.metric ?? ""} onChange={e => setRouteForm({ ...routeForm, metric: e.target.value ? Number(e.target.value) : undefined })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Grensesnitt</label><Input value={routeForm.interface} onChange={e => setRouteForm({ ...routeForm, interface: e.target.value })} placeholder="eth0" className="bg-secondary border-border h-9 text-xs" /></div>
                  <div className="col-span-2"><label className="text-[10px] text-muted-foreground block mb-0.5">Beskrivelse</label><Input value={routeForm.description} onChange={e => setRouteForm({ ...routeForm, description: e.target.value })} className="bg-secondary border-border h-9 text-xs" /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowRouteForm(false)}>Avbryt</Button>
                  <Button size="sm" onClick={addRoute}><Save className="h-3 w-3 mr-1" /> Lagre</Button>
                </div>
              </div>
            ) : routes.length > 0 && (
              <button onClick={() => setShowRouteForm(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Plus className="h-3 w-3" /> Legg til rute</button>
            )}
          </div>
        )}

        {/* CABLES */}
        {tab === "cables" && (
          <div>
            {cables.length > 0 && (
              <div className="space-y-2 mb-3">
                {cables.map(cable => (
                  <div key={cable.id} className="flex items-center gap-3 bg-background rounded-md border border-border p-3 text-xs">
                    {cable.color && <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: cable.color }} />}
                    <span className={`w-2 h-2 rounded-full ${cable.status === "connected" ? "bg-success" : cable.status === "planned" ? "bg-info" : "bg-destructive"}`} />
                    <span className="font-medium text-foreground">{device.name}</span>
                    <span className="font-mono text-muted-foreground">{cable.localPort}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium text-foreground">{resolveDeviceName(cable.remoteDevice)}</span>
                    {cable.remotePort && <span className="font-mono text-muted-foreground">{cable.remotePort}</span>}
                    <span className="bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{cableTypeLabels[cable.type]}</span>
                    {cable.length && <span className="text-muted-foreground">{cable.length}</span>}
                    {cable.label && <span className="text-muted-foreground italic">{cable.label}</span>}
                    <span className="text-[10px] text-muted-foreground">{cableStatusLabels[cable.status]}</span>
                    <button onClick={() => removeCable(cable.id)} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
            {cables.length === 0 && !showCableForm && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Cable className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Ingen kabler registrert</p>
                <p className="text-xs text-muted-foreground/70 mb-4">Koble denne enheten til andre enheter med kabler.</p>
                <Button size="sm" onClick={() => setShowCableForm(true)}><Plus className="h-3 w-3 mr-1" /> Legg til kabel</Button>
              </div>
            )}
            {showCableForm ? (
              <div className="bg-background border border-border rounded-md p-3 space-y-3">
                <p className="text-xs font-medium text-foreground mb-2">
                  Fra: <span className="text-primary">{device.name}</span> → Til:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Lokal port *</label>
                    {localInterfaces.length > 0 ? (
                      <select value={cableForm.localPort} onChange={e => setCableForm({ ...cableForm, localPort: e.target.value })} className={selectClass}>
                        <option value="">Velg port...</option>
                        {localInterfaces.map(i => <option key={i.id} value={i.name}>{i.name} {i.ip ? `(${i.ip})` : ""}</option>)}
                      </select>
                    ) : (
                      <Input value={cableForm.localPort} onChange={e => setCableForm({ ...cableForm, localPort: e.target.value })} placeholder="eth0" className="bg-secondary border-border h-9 text-xs" />
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Til enhet *</label>
                    <select value={cableForm.remoteDevice} onChange={e => setCableForm({ ...cableForm, remoteDevice: e.target.value, remotePort: "" })} className={selectClass}>
                      <option value="">Velg enhet...</option>
                      {allDevices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.ip})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Ekstern port</label>
                    {getRemoteInterfaces().length > 0 ? (
                      <select value={cableForm.remotePort} onChange={e => setCableForm({ ...cableForm, remotePort: e.target.value })} className={selectClass}>
                        <option value="">Velg port...</option>
                        {getRemoteInterfaces().map(i => <option key={i.id} value={i.name}>{i.name} {i.ip ? `(${i.ip})` : ""}</option>)}
                      </select>
                    ) : (
                      <Input value={cableForm.remotePort} onChange={e => setCableForm({ ...cableForm, remotePort: e.target.value })} placeholder="eth0" className="bg-secondary border-border h-9 text-xs" />
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Kabeltype</label>
                    <select value={cableForm.type} onChange={e => setCableForm({ ...cableForm, type: e.target.value as any })} className={selectClass}>{cableTypes.map(t => <option key={t} value={t}>{cableTypeLabels[t]}</option>)}</select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Status</label>
                    <select value={cableForm.status} onChange={e => setCableForm({ ...cableForm, status: e.target.value as any })} className={selectClass}>{Object.entries(cableStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Lengde</label>
                    <Input value={cableForm.length} onChange={e => setCableForm({ ...cableForm, length: e.target.value })} placeholder="2m" className="bg-secondary border-border h-9 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Farge</label>
                    <Input type="color" value={cableForm.color || "#3b82f6"} onChange={e => setCableForm({ ...cableForm, color: e.target.value })} className="bg-secondary border-border h-9 p-1" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Merkelapp</label>
                    <Input value={cableForm.label} onChange={e => setCableForm({ ...cableForm, label: e.target.value })} className="bg-secondary border-border h-9 text-xs" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowCableForm(false)}>Avbryt</Button>
                  <Button size="sm" onClick={addCable} disabled={!cableForm.localPort || !cableForm.remoteDevice}><Save className="h-3 w-3 mr-1" /> Lagre</Button>
                </div>
              </div>
            ) : cables.length > 0 && (
              <button onClick={() => setShowCableForm(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Plus className="h-3 w-3" /> Legg til kabel</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
