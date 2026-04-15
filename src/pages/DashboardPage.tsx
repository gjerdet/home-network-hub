import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as RGL from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type { LayoutItem } from "react-grid-layout";

const DashboardGrid = (RGL as any).ResponsiveGridLayout;

import {
  Monitor, Globe, Flame, FileText, Server, Shield, Wifi,
  HardDrive, Activity, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Network, Cable, ExternalLink, AppWindow,
  GripVertical, Lock, Unlock, RotateCcw, Eye, EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NetworkTopology } from "@/components/NetworkTopology";
import {
  getDevicesAsync, getNetworksAsync, getFirewallsAsync, getFirewallRulesAsync,
  getDocsAsync, getFilesAsync,
} from "@/lib/data-service";
import type { ServiceLink } from "@/pages/ServicesPage";



const LAYOUT_KEY = "netdocs_dashboard_layout";
const HIDDEN_KEY = "netdocs_dashboard_hidden";

const getServices = (): ServiceLink[] => {
  try {
    const raw = localStorage.getItem("netdocs_services");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const typeIcons: Record<string, React.ElementType> = {
  router: Globe, switch: Network, server: Server, ap: Wifi,
  firewall: Shield, nas: HardDrive, camera: Monitor, vm: Server,
  container: Server, pdu: Cable, ups: Cable, other: Monitor,
};

// Widget definitions
const WIDGET_DEFS: { id: string; title: string; defaultLayout: { w: number; h: number; minW?: number; minH?: number } }[] = [
  { id: "stats", title: "Statistikk", defaultLayout: { w: 12, h: 3, minW: 6, minH: 3 } },
  { id: "status", title: "Enhetsstatus", defaultLayout: { w: 12, h: 4, minW: 6, minH: 3 } },
  { id: "types", title: "Enheter etter type", defaultLayout: { w: 6, h: 6, minW: 4, minH: 4 } },
  { id: "docs", title: "Siste dokument", defaultLayout: { w: 6, h: 6, minW: 4, minH: 4 } },
  { id: "devices", title: "Sist oppdaterte enheter", defaultLayout: { w: 12, h: 7, minW: 6, minH: 5 } },
  { id: "services", title: "Tenester", defaultLayout: { w: 12, h: 5, minW: 4, minH: 3 } },
  { id: "topology", title: "Nettverkstopologi", defaultLayout: { w: 12, h: 10, minW: 6, minH: 6 } },
];

const buildDefaultLayouts = (): { lg: LayoutItem[] } => {
  let y = 0;
  const lg: LayoutItem[] = WIDGET_DEFS.map(def => {
    const item: LayoutItem = {
      i: def.id,
      x: 0, y,
      w: def.defaultLayout.w,
      h: def.defaultLayout.h,
      minW: def.defaultLayout.minW,
      minH: def.defaultLayout.minH,
    };
    y += def.defaultLayout.h;
    return item;
  });
  // Place types and docs side by side
  const typesIdx = lg.findIndex(l => l.i === "types");
  const docsIdx = lg.findIndex(l => l.i === "docs");
  if (typesIdx >= 0 && docsIdx >= 0) {
    lg[docsIdx].x = 6;
    lg[docsIdx].y = lg[typesIdx].y;
  }
  return { lg };
};

const loadLayouts = () => {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return buildDefaultLayouts();
};

const loadHidden = (): string[] => {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [layouts, setLayouts] = useState(loadLayouts);
  const [locked, setLocked] = useState(true);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(loadHidden);

  const [devices, setDevices] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [firewalls, setFirewalls] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const services = useMemo(() => getServices(), []);

  useEffect(() => {
    Promise.all([
      getDevicesAsync(), getNetworksAsync(), getFirewallsAsync(),
      getFirewallRulesAsync(), getDocsAsync(), getFilesAsync(),
    ]).then(([d, n, fw, r, doc, f]) => {
      setDevices(d); setNetworks(n); setFirewalls(fw);
      setRules(r); setDocs(doc); setFiles(f);
    });
  }, []);

  const online = devices.filter(d => d.status === "online").length;
  const offline = devices.filter(d => d.status === "offline").length;
  const maintenance = devices.filter(d => d.status === "maintenance").length;

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    devices.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [devices]);

  const recentDevices = useMemo(() =>
    [...devices].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8),
    [devices]
  );

  const recentDocs = useMemo(() =>
    [...docs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5),
    [docs]
  );

  const statCards = [
    { label: "Enheter", value: devices.length, icon: Monitor, color: "text-primary", onClick: () => navigate("/devices") },
    { label: "Nettverk", value: networks.length, icon: Globe, color: "text-emerald-400", onClick: () => navigate("/networks") },
    { label: "Brannmurar", value: firewalls.length, icon: Flame, color: "text-orange-400", onClick: () => navigate("/firewall") },
    { label: "Reglar", value: rules.length, icon: Shield, color: "text-yellow-400", onClick: () => navigate("/firewall") },
    { label: "Dokument", value: docs.length, icon: FileText, color: "text-blue-400", onClick: () => navigate("/docs") },
    { label: "Filer", value: files.length, icon: HardDrive, color: "text-purple-400", onClick: () => navigate("/files") },
  ];

  const statusColor = (s: string) => {
    if (s === "online") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "offline") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (s === "maintenance") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-muted text-muted-foreground";
  };

  const statusLabel = (s: string) => {
    if (s === "online") return "Aktiv";
    if (s === "offline") return "Nede";
    if (s === "maintenance") return "Vedlikehald";
    if (s === "planned") return "Planlagt";
    if (s === "decommissioned") return "Avvikla";
    return s;
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m sidan`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}t sidan`;
    const days = Math.floor(hrs / 24);
    return `${days}d sidan`;
  };

  const getFavicon = (url: string) => {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
    catch { return null; }
  };

  const onLayoutChange = useCallback((_current: LayoutItem[], allLayouts: Record<string, LayoutItem[]>) => {
    setLayouts(allLayouts);
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(allLayouts));
  }, []);

  const resetLayout = () => {
    const def = buildDefaultLayouts();
    setLayouts(def);
    setHiddenWidgets([]);
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(def));
    localStorage.removeItem(HIDDEN_KEY);
  };

  const toggleWidget = (id: string) => {
    const next = hiddenWidgets.includes(id)
      ? hiddenWidgets.filter(w => w !== id)
      : [...hiddenWidgets, id];
    setHiddenWidgets(next);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
  };

  const visibleWidgets = WIDGET_DEFS.filter(w => !hiddenWidgets.includes(w.id));

  const renderWidget = (id: string) => {
    switch (id) {
      case "stats":
        return (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 flex-1">
              {statCards.map(s => (
                <Card key={s.label} className="cursor-pointer hover:border-primary/40 transition-colors bg-card border-border" onClick={s.onClick}>
                  <CardContent className="p-4 flex flex-col items-center gap-1">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                    <span className="text-2xl font-bold text-foreground">{s.value}</span>
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case "status":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full">
            <Card className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{online}</p>
                  <p className="text-xs text-muted-foreground">Aktive enheter</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{offline}</p>
                  <p className="text-xs text-muted-foreground">Nede</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{maintenance}</p>
                  <p className="text-xs text-muted-foreground">Vedlikehald</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "types":
        return (
          <div className="space-y-2 overflow-y-auto h-full">
            {typeCounts.length === 0 && <p className="text-sm text-muted-foreground">Ingen enheter registrert</p>}
            {typeCounts.map(([type, count]) => {
              const Icon = typeIcons[type] || Monitor;
              const pct = devices.length ? Math.round((count / devices.length) * 100) : 0;
              return (
                <div key={type} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground capitalize w-24">{type}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        );
      case "docs":
        return (
          <div className="space-y-2 overflow-y-auto h-full">
            {recentDocs.length === 0 && <p className="text-sm text-muted-foreground">Ingen dokument</p>}
            {recentDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-foreground truncate max-w-[200px]">{doc.title}</span>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {timeAgo(doc.updatedAt)}
                </span>
              </div>
            ))}
          </div>
        );
      case "devices":
        return (
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Namn</th>
                  <th className="text-left py-2 font-medium">Type</th>
                  <th className="text-left py-2 font-medium">IP</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-right py-2 font-medium">Oppdatert</th>
                </tr>
              </thead>
              <tbody>
                {recentDevices.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Ingen enheter</td></tr>
                )}
                {recentDevices.map((d, i) => {
                  const Icon = typeIcons[d.type] || Monitor;
                  return (
                    <tr key={d.id} className={`border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`} onClick={() => navigate("/devices")}>
                      <td className="py-2 font-medium text-foreground flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" /> {d.name}
                      </td>
                      <td className="py-2 text-muted-foreground capitalize">{d.type}</td>
                      <td className="py-2 font-mono text-xs text-muted-foreground">{d.ip || "—"}</td>
                      <td className="py-2">
                        <Badge variant="outline" className={`text-xs ${statusColor(d.status)}`}>{statusLabel(d.status)}</Badge>
                      </td>
                      <td className="py-2 text-right text-xs text-muted-foreground">{timeAgo(d.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      case "services":
        return (
          <div className="overflow-y-auto h-full">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen tenester lagt til</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {services.map(s => {
                  const favicon = getFavicon(s.url);
                  return (
                    <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-md border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group">
                      {favicon ? (
                        <img src={favicon} alt="" className="h-5 w-5 shrink-0 rounded" onError={e => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <AppWindow className="h-5 w-5 text-primary shrink-0" />
                      )}
                      <span className="text-xs text-foreground truncate">{s.name}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      case "topology":
        return (
          <div className="h-full">
            {devices.length > 0 ? (
              <NetworkTopology devices={devices} />
            ) : (
              <p className="text-sm text-muted-foreground">Ingen enheter å vise</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const widgetTitle = (id: string) => WIDGET_DEFS.find(w => w.id === id)?.title || id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Oversikt over infrastruktur, status og aktivitet</p>
        </div>
        <div className="flex items-center gap-2">
          {!locked && (
            <>
              <div className="flex items-center gap-1 flex-wrap">
                {WIDGET_DEFS.map(w => (
                  <Button
                    key={w.id}
                    variant={hiddenWidgets.includes(w.id) ? "outline" : "secondary"}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => toggleWidget(w.id)}
                  >
                    {hiddenWidgets.includes(w.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {w.title}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={resetLayout}>
                <RotateCcw className="h-3 w-3" /> Nullstill
              </Button>
            </>
          )}
          <Button
            variant={locked ? "outline" : "default"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setLocked(!locked)}
          >
            {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            {locked ? "Lås opp" : "Lås"}
          </Button>
        </div>
      </div>

      <DashboardGrid
        className="dashboard-grid"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        width={1200}
        isDraggable={!locked}
        isResizable={!locked}
        onLayoutChange={onLayoutChange}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        margin={[12, 12]}
      >
        {visibleWidgets.map(widget => (
          <div key={widget.id}>
            <Card className={`bg-card border-border h-full flex flex-col ${!locked ? "ring-1 ring-primary/20" : ""}`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {!locked && (
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing widget-drag-handle" />
                  )}
                  <CardTitle className="text-sm font-semibold text-foreground">{widgetTitle(widget.id)}</CardTitle>
                </div>
                {(widget.id === "docs" || widget.id === "devices" || widget.id === "services") && (
                  <button
                    onClick={() => navigate(widget.id === "docs" ? "/docs" : widget.id === "devices" ? "/devices" : "/services")}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Vis alle <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                {renderWidget(widget.id)}
              </CardContent>
            </Card>
          </div>
        ))}
      </DashboardGrid>
    </div>
  );
}
