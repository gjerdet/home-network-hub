import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Monitor, Globe, Flame, FileText, Server, Shield, Wifi,
  HardDrive, Activity, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Network, Cable
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getDevices, getNetworks, getFirewalls, getFirewallRules,
  getDocs, getFiles, Device
} from "@/lib/store";

const typeIcons: Record<string, React.ElementType> = {
  router: Globe, switch: Network, server: Server, ap: Wifi,
  firewall: Shield, nas: HardDrive, camera: Monitor, vm: Server,
  container: Server, pdu: Cable, ups: Cable, other: Monitor,
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const devices = useMemo(() => getDevices(), []);
  const networks = useMemo(() => getNetworks(), []);
  const firewalls = useMemo(() => getFirewalls(), []);
  const rules = useMemo(() => getFirewallRules(), []);
  const docs = useMemo(() => getDocs(), []);
  const files = useMemo(() => getFiles(), []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Oversikt over infrastruktur, status og aktivitet</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(s => (
          <Card
            key={s.label}
            className="cursor-pointer hover:border-primary/40 transition-colors bg-card border-border"
            onClick={s.onClick}
          >
            <CardContent className="p-4 flex flex-col items-center gap-1">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Device types */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Enheter etter type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
          </CardContent>
        </Card>

        {/* Recent docs */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">Siste dokument</CardTitle>
            <button onClick={() => navigate("/docs")} className="text-xs text-primary hover:underline flex items-center gap-1">
              Vis alle <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-2">
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
          </CardContent>
        </Card>
      </div>

      {/* Recent devices */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">Sist oppdaterte enheter</CardTitle>
          <button onClick={() => navigate("/devices")} className="text-xs text-primary hover:underline flex items-center gap-1">
            Vis alle <ArrowRight className="h-3 w-3" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                    <tr
                      key={d.id}
                      className={`border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}
                      onClick={() => navigate("/devices")}
                    >
                      <td className="py-2 font-medium text-foreground flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" /> {d.name}
                      </td>
                      <td className="py-2 text-muted-foreground capitalize">{d.type}</td>
                      <td className="py-2 font-mono text-xs text-muted-foreground">{d.ip || "—"}</td>
                      <td className="py-2">
                        <Badge variant="outline" className={`text-xs ${statusColor(d.status)}`}>
                          {statusLabel(d.status)}
                        </Badge>
                      </td>
                      <td className="py-2 text-right text-xs text-muted-foreground">{timeAgo(d.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
