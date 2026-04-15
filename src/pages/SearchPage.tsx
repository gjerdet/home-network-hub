import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getDevicesAsync, getDocsAsync, getFirewallRulesAsync, getNetworksAsync } from "@/lib/data-service";
import { Monitor, FileText, Flame, Globe } from "lucide-react";
import type { Device, DocPage, FirewallRule, NetworkInfo } from "@/lib/store";

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").toLowerCase();
  const navigate = useNavigate();

  const [devices, setDevices] = useState<Device[]>([]);
  const [docs, setDocs] = useState<DocPage[]>([]);
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);

  useEffect(() => {
    if (!q) return;
    Promise.all([getDevicesAsync(), getDocsAsync(), getFirewallRulesAsync(), getNetworksAsync()]).then(([d, doc, r, n]) => {
      setDevices(d.filter(d => d.name.toLowerCase().includes(q) || d.ip.includes(q) || d.role.toLowerCase().includes(q)));
      setDocs(doc.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)));
      setRules(r.filter(r => r.name.toLowerCase().includes(q)));
      setNetworks(n.filter(n => n.name.toLowerCase().includes(q) || n.subnet.includes(q)));
    });
  }, [q]);

  const total = devices.length + docs.length + rules.length + networks.length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Søkeresultater</h1>
      <p className="text-sm text-muted-foreground mb-6">{total} treff for "{params.get("q")}"</p>

      {devices.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Enheter</h2>
          {devices.map(d => (
            <div key={d.id} onClick={() => navigate("/devices")} className="bg-card border border-border rounded-lg p-3 mb-2 flex items-center gap-3 cursor-pointer hover:border-primary/30">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="text-foreground">{d.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{d.ip}</span>
            </div>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Dokumenter</h2>
          {docs.map(d => (
            <div key={d.id} onClick={() => navigate("/docs")} className="bg-card border border-border rounded-lg p-3 mb-2 flex items-center gap-3 cursor-pointer hover:border-primary/30">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-foreground">{d.title}</span>
              <span className="text-xs text-muted-foreground">{d.category}</span>
            </div>
          ))}
        </div>
      )}

      {rules.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Brannmurregler</h2>
          {rules.map(r => (
            <div key={r.id} onClick={() => navigate("/firewall")} className="bg-card border border-border rounded-lg p-3 mb-2 flex items-center gap-3 cursor-pointer hover:border-primary/30">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-foreground">{r.name}</span>
            </div>
          ))}
        </div>
      )}

      {networks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Nettverk</h2>
          {networks.map(n => (
            <div key={n.id} onClick={() => navigate("/networks")} className="bg-card border border-border rounded-lg p-3 mb-2 flex items-center gap-3 cursor-pointer hover:border-primary/30">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-foreground">{n.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{n.subnet}</span>
            </div>
          ))}
        </div>
      )}

      {total === 0 && <p className="text-center py-16 text-muted-foreground">Ingen treff</p>}
    </div>
  );
}
