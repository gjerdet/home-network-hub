import type { FirewallRule } from "@/lib/store";
import { ArrowRight, Check, X, AlertTriangle, Shield } from "lucide-react";

const actionConfig = {
  allow: { label: "TILLAT", bg: "bg-success/15", border: "border-success/40", text: "text-success", icon: Check },
  deny: { label: "BLOKKER", bg: "bg-destructive/15", border: "border-destructive/40", text: "text-destructive", icon: X },
  reject: { label: "AVVIS", bg: "bg-warning/15", border: "border-warning/40", text: "text-warning", icon: AlertTriangle },
};

const zoneColors: Record<string, { bg: string; border: string; text: string }> = {
  WAN: { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive" },
  LAN: { bg: "bg-success/10", border: "border-success/30", text: "text-success" },
  DMZ: { bg: "bg-warning/10", border: "border-warning/30", text: "text-warning" },
  WLAN: { bg: "bg-info/10", border: "border-info/30", text: "text-info" },
  VPN: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
  MGMT: { bg: "bg-accent", border: "border-accent-foreground/30", text: "text-accent-foreground" },
  IOT: { bg: "bg-warning/10", border: "border-warning/30", text: "text-warning" },
  GUEST: { bg: "bg-muted", border: "border-border", text: "text-muted-foreground" },
};

const defaultZoneColor = { bg: "bg-secondary", border: "border-border", text: "text-foreground" };

export function RuleFlowDiagram({ rule }: { rule: FirewallRule }) {
  const action = actionConfig[rule.action];
  const ActionIcon = action.icon;
  const isAllowed = rule.action === "allow";
  const srcZone = zoneColors[rule.sourceZone] || defaultZoneColor;
  const dstZone = zoneColors[rule.destinationZone] || defaultZoneColor;

  return (
    <div className="py-5 px-4">
      {/* SonicWall-style horizontal flow */}
      <div className="flex items-stretch justify-center gap-0">
        {/* Source Zone */}
        <div className={`flex flex-col items-center justify-center px-5 py-4 rounded-l-xl border ${srcZone.bg} ${srcZone.border} min-w-[120px]`}>
          <span className={`text-[10px] uppercase tracking-wider font-bold ${srcZone.text}`}>{rule.sourceZone}</span>
          <div className="mt-2 space-y-0.5 text-center">
            <p className="text-[10px] text-muted-foreground">Kilde</p>
            <p className="text-xs font-mono text-foreground">{rule.source}</p>
          </div>
        </div>

        {/* Arrow from source */}
        <div className="flex items-center -mx-px">
          <div className={`h-[2px] w-6 ${isAllowed ? "bg-success/50" : "bg-destructive/50"}`} />
          <ArrowRight className={`h-4 w-4 -ml-1 ${isAllowed ? "text-success/70" : "text-destructive/70"}`} />
        </div>

        {/* Firewall decision box - SonicWall style */}
        <div className={`flex flex-col items-center justify-center px-6 py-4 border-y border-x-0 ${action.bg} ${action.border} min-w-[160px]`}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`h-4 w-4 ${action.text}`} />
            <span className={`text-xs font-bold uppercase tracking-wide ${action.text}`}>{action.label}</span>
          </div>
          <div className="space-y-1 text-center">
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-muted-foreground">Protokoll:</span>
              <span className="font-mono text-foreground">{rule.protocol}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-muted-foreground">Port:</span>
              <span className="font-mono text-foreground">{rule.port || "*"}</span>
            </div>
            {rule.service && (
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">Tjeneste:</span>
                <span className="text-foreground">{rule.service}</span>
              </div>
            )}
          </div>
          {rule.logging && <span className="text-[9px] text-muted-foreground mt-1">📋 Logges</span>}
        </div>

        {/* Arrow to destination */}
        <div className="flex items-center -mx-px">
          {isAllowed ? (
            <>
              <div className="h-[2px] w-6 bg-success/50" />
              <ArrowRight className="h-4 w-4 -ml-1 text-success/70" />
            </>
          ) : (
            <>
              <div className="h-[2px] w-6 bg-destructive/20" style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--destructive)/0.4), hsl(var(--destructive)/0.4) 3px, transparent 3px, transparent 6px)" }} />
              <X className="h-4 w-4 -ml-1 text-destructive/40" />
            </>
          )}
        </div>

        {/* Destination Zone */}
        <div className={`flex flex-col items-center justify-center px-5 py-4 rounded-r-xl border ${isAllowed ? dstZone.bg : "bg-muted/50"} ${isAllowed ? dstZone.border : "border-border"} min-w-[120px] ${!isAllowed ? "opacity-50" : ""}`}>
          <span className={`text-[10px] uppercase tracking-wider font-bold ${isAllowed ? dstZone.text : "text-muted-foreground"}`}>{rule.destinationZone}</span>
          <div className="mt-2 space-y-0.5 text-center">
            <p className="text-[10px] text-muted-foreground">Destinasjon</p>
            <p className="text-xs font-mono text-foreground">{rule.destination}</p>
          </div>
        </div>
      </div>

      {/* Rule metadata bar */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">{rule.sourceZone} → {rule.destinationZone}</span>
        {rule.hitCount !== undefined && <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">{rule.hitCount} treff</span>}
        {rule.schedule && <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">⏰ {rule.schedule}</span>}
      </div>

      {rule.notes && <p className="text-xs text-muted-foreground mt-3 text-center italic">{rule.notes}</p>}
    </div>
  );
}
