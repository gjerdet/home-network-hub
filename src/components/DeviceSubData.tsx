import { useState } from "react";
import { type Device, type DeviceInterface, type DeviceRoute, type DeviceCable, updateDevice } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, X, Network, Route, Cable, Layers } from "lucide-react";

const ifaceTypes = ["ethernet", "wifi", "vlan", "bridge", "bond", "loopback", "tunnel", "other"] as const;
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

  // Interfaces
  const [showIfForm, setShowIfForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [ifForm, setIfForm] = useState({ name: "", type: "ethernet" as DeviceInterface["type"], ip: "", mac: "", speed: "", enabled: true, description: "", connectedTo: "", vlanId: "" });
  const [bulkForm, setBulkForm] = useState({ prefix: "eth", start: 0, count: 24, type: "ethernet" as DeviceInterface["type"], speed: "1G" });

  const addInterface = () => {
    if (!ifForm.name) return;
    const ifaces = [...(device.interfaces || []), { id: crypto.randomUUID(), ...ifForm }];
    updateDevice(device.id, { interfaces: ifaces });
    onUpdate();
    setShowIfForm(false);
    setIfForm({ name: "", type: "ethernet", ip: "", mac: "", speed: "", enabled: true, description: "", connectedTo: "", vlanId: "" });
  };

  const addBulkInterfaces = () => {
    if (!bulkForm.prefix || bulkForm.count < 1) return;
    const existing = device.interfaces || [];
    const newIfaces: DeviceInterface[] = [];
    for (let i = 0; i < bulkForm.count; i++) {
      newIfaces.push({
        id: crypto.randomUUID(),
        name: `${bulkForm.prefix}${bulkForm.start + i}`,
        type: bulkForm.type,
        speed: bulkForm.speed,
        enabled: true,
        ip: "", mac: "", description: "", connectedTo: "", vlanId: "",
      });
    }
    updateDevice(device.id, { interfaces: [...existing, ...newIfaces] });
    onUpdate();
    setShowBulkForm(false);
    setBulkForm({ prefix: "eth", start: 0, count: 24, type: "ethernet", speed: "1G" });
  };

  const removeInterface = (id: string) => {
    updateDevice(device.id, { interfaces: (device.interfaces || []).filter(i => i.id !== id) });
    onUpdate();
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
    if (!cableForm.localPort) return;
    const cables = [...(device.cables || []), { id: crypto.randomUUID(), ...cableForm }];
    updateDevice(device.id, { cables: cables });
    onUpdate();
    setShowCableForm(false);
    setCableForm({ label: "", type: "cat6", localPort: "", remoteDevice: "", remotePort: "", length: "", color: "", status: "connected" });
  };

  const removeCable = (id: string) => {
    updateDevice(device.id, { cables: (device.cables || []).filter(c => c.id !== id) });
    onUpdate();
  };

  const ifaces = device.interfaces || [];
  const routes = device.routes || [];
  const cables = device.cables || [];

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
              <div className="space-y-1 mb-3 max-h-[400px] overflow-y-auto">
                {ifaces.map(iface => (
                  <div key={iface.id} className="flex items-center gap-3 bg-background rounded-md border border-border px-3 py-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${iface.enabled ? "bg-success" : "bg-destructive"}`} />
                    <span className="font-mono font-medium text-foreground w-20 truncate">{iface.name}</span>
                    <span className="text-muted-foreground w-16">{iface.type}</span>
                    {iface.ip && <span className="font-mono text-foreground">{iface.ip}</span>}
                    {iface.mac && <span className="font-mono text-muted-foreground">{iface.mac}</span>}
                    {iface.speed && <span className="bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{iface.speed}</span>}
                    {iface.vlanId && <span className="bg-info/15 text-info px-1.5 py-0.5 rounded">VLAN {iface.vlanId}</span>}
                    {iface.connectedTo && <span className="text-muted-foreground">→ {iface.connectedTo}</span>}
                    <button onClick={() => removeInterface(iface.id)} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {ifaces.length === 0 && !showIfForm && !showBulkForm && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Network className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Ingen grensesnitt konfigurert</p>
                <p className="text-xs text-muted-foreground/70 mb-4">Legg til enkeltvis eller generer flere porter på en gang.</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowIfForm(true)}><Plus className="h-3 w-3 mr-1" /> Enkelt</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowBulkForm(true)}><Layers className="h-3 w-3 mr-1" /> Generer flere</Button>
                </div>
              </div>
            )}

            {/* Bulk generate form */}
            {showBulkForm && (
              <div className="bg-background border border-primary/30 rounded-md p-4 space-y-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Generer grensesnitt</span>
                </div>
                <p className="text-xs text-muted-foreground">Opprett f.eks. 48 switchporter (GigabitEthernet0/1 – GigabitEthernet0/48)</p>
                <div className="grid grid-cols-5 gap-3">
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Prefiks</label><Input value={bulkForm.prefix} onChange={e => setBulkForm({ ...bulkForm, prefix: e.target.value })} placeholder="GigabitEthernet0/" className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Start-nr</label><Input type="number" value={bulkForm.start} onChange={e => setBulkForm({ ...bulkForm, start: Number(e.target.value) })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Antall</label><Input type="number" value={bulkForm.count} onChange={e => setBulkForm({ ...bulkForm, count: Number(e.target.value) })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Type</label><select value={bulkForm.type} onChange={e => setBulkForm({ ...bulkForm, type: e.target.value as any })} className={selectClass}>{ifaceTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Hastighet</label><Input value={bulkForm.speed} onChange={e => setBulkForm({ ...bulkForm, speed: e.target.value })} placeholder="1G" className="bg-secondary border-border h-9 text-xs" /></div>
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

            {/* Single add form */}
            {showIfForm ? (
              <div className="bg-background border border-border rounded-md p-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Navn *</label><Input value={ifForm.name} onChange={e => setIfForm({ ...ifForm, name: e.target.value })} placeholder="eth0" className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Type</label><select value={ifForm.type} onChange={e => setIfForm({ ...ifForm, type: e.target.value as any })} className={selectClass}>{ifaceTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">IP</label><Input value={ifForm.ip} onChange={e => setIfForm({ ...ifForm, ip: e.target.value })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">MAC</label><Input value={ifForm.mac} onChange={e => setIfForm({ ...ifForm, mac: e.target.value })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Hastighet</label><Input value={ifForm.speed} onChange={e => setIfForm({ ...ifForm, speed: e.target.value })} placeholder="1G" className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">VLAN ID</label><Input value={ifForm.vlanId} onChange={e => setIfForm({ ...ifForm, vlanId: e.target.value })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Koblet til</label><Input value={ifForm.connectedTo} onChange={e => setIfForm({ ...ifForm, connectedTo: e.target.value })} className="bg-secondary border-border h-9 text-xs" /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowIfForm(false)}>Avbryt</Button>
                  <Button size="sm" onClick={addInterface}><Save className="h-3 w-3 mr-1" /> Lagre</Button>
                </div>
              </div>
            ) : ifaces.length > 0 && !showBulkForm && (
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowIfForm(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Plus className="h-3 w-3" /> Legg til enkelt</button>
                <button onClick={() => setShowBulkForm(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Layers className="h-3 w-3" /> Generer flere</button>
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
                    <span className="font-mono font-medium text-foreground">{cable.localPort}</span>
                    {(cable.remoteDevice || cable.remotePort) && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-foreground">{cable.remoteDevice}{cable.remotePort ? `:${cable.remotePort}` : ""}</span>
                      </>
                    )}
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
                <p className="text-xs text-muted-foreground/70 mb-4">Dokumenter fysiske kabelkoblinger mellom enheter.</p>
                <Button size="sm" onClick={() => setShowCableForm(true)}><Plus className="h-3 w-3 mr-1" /> Legg til kabel</Button>
              </div>
            )}
            {showCableForm ? (
              <div className="bg-background border border-border rounded-md p-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Lokal port *</label><Input value={cableForm.localPort} onChange={e => setCableForm({ ...cableForm, localPort: e.target.value })} placeholder="eth0, port 1" className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Type</label><select value={cableForm.type} onChange={e => setCableForm({ ...cableForm, type: e.target.value as any })} className={selectClass}>{cableTypes.map(t => <option key={t} value={t}>{cableTypeLabels[t]}</option>)}</select></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Status</label><select value={cableForm.status} onChange={e => setCableForm({ ...cableForm, status: e.target.value as any })} className={selectClass}>{Object.entries(cableStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Ekstern enhet</label><Input value={cableForm.remoteDevice} onChange={e => setCableForm({ ...cableForm, remoteDevice: e.target.value })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Ekstern port</label><Input value={cableForm.remotePort} onChange={e => setCableForm({ ...cableForm, remotePort: e.target.value })} className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Lengde</label><Input value={cableForm.length} onChange={e => setCableForm({ ...cableForm, length: e.target.value })} placeholder="2m" className="bg-secondary border-border h-9 text-xs" /></div>
                  <div><label className="text-[10px] text-muted-foreground block mb-0.5">Farge</label><Input type="color" value={cableForm.color || "#3b82f6"} onChange={e => setCableForm({ ...cableForm, color: e.target.value })} className="bg-secondary border-border h-9 p-1" /></div>
                  <div className="col-span-2"><label className="text-[10px] text-muted-foreground block mb-0.5">Merkelapp</label><Input value={cableForm.label} onChange={e => setCableForm({ ...cableForm, label: e.target.value })} className="bg-secondary border-border h-9 text-xs" /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowCableForm(false)}>Avbryt</Button>
                  <Button size="sm" onClick={addCable}><Save className="h-3 w-3 mr-1" /> Lagre</Button>
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
