import type { FirewallRule } from "@/lib/store";
import { ArrowRight, Check, X, AlertTriangle, Monitor, Globe, Shield } from "lucide-react";

const actionConfig = {
  allow: { label: "TILLAT", color: "bg-success/20 border-success/40 text-success", icon: Check, lineColor: "bg-success" },
  deny: { label: "BLOKKER", color: "bg-destructive/20 border-destructive/40 text-destructive", icon: X, lineColor: "bg-destructive" },
  reject: { label: "AVVIS", color: "bg-warning/20 border-warning/40 text-warning", icon: AlertTriangle, lineColor: "bg-warning" },
};

export function RuleFlowDiagram({ rule }: { rule: FirewallRule }) {
  const action = actionConfig[rule.action];
  const ActionIcon = action.icon;
  const isAllowed = rule.action === "allow";

  return (
    <div className="py-4 px-2">
      <div className="flex items-center gap-0 justify-center flex-wrap">
        {/* Source */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-20 h-20 rounded-xl bg-info/10 border border-info/30 flex flex-col items-center justify-center">
            {rule.direction === "inbound" ? <Globe className="h-6 w-6 text-info" /> : <Monitor className="h-6 w-6 text-info" />}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase">Kilde</span>
          <span className="text-xs font-mono text-foreground">{rule.source}</span>
        </div>

        {/* Arrow 1 */}
        <div className="flex flex-col items-center mx-1">
          <div className="flex items-center gap-0">
            <div className={`h-0.5 w-8 ${action.lineColor}/60`} />
            <ArrowRight className={`h-4 w-4 -ml-1 ${rule.action === "allow" ? "text-success" : rule.action === "deny" ? "text-destructive" : "text-warning"}`} />
          </div>
          <span className="text-[9px] text-muted-foreground mt-1">{rule.protocol}</span>
        </div>

        {/* Firewall / Action */}
        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-24 h-20 rounded-xl border flex flex-col items-center justify-center ${action.color}`}>
            <Shield className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-bold">{action.label}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase">Brannmur</span>
          <span className="text-xs font-mono text-foreground">:{rule.port || "*"}</span>
        </div>

        {/* Arrow 2 */}
        <div className="flex flex-col items-center mx-1">
          {isAllowed ? (
            <>
              <div className="flex items-center gap-0">
                <div className={`h-0.5 w-8 ${action.lineColor}/60`} />
                <ArrowRight className="h-4 w-4 -ml-1 text-success" />
              </div>
              <span className="text-[9px] text-muted-foreground mt-1">trafikk</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-0">
                <div className="h-0.5 w-8 bg-destructive/30" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, hsl(var(--card)) 3px, hsl(var(--card)) 6px)" }} />
                <X className="h-4 w-4 -ml-1 text-destructive/50" />
              </div>
              <span className="text-[9px] text-destructive mt-1">blokkert</span>
            </>
          )}
        </div>

        {/* Destination */}
        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-20 h-20 rounded-xl border flex flex-col items-center justify-center ${isAllowed ? "bg-success/10 border-success/30" : "bg-muted border-border opacity-40"}`}>
            {rule.direction === "inbound" ? <Monitor className={`h-6 w-6 ${isAllowed ? "text-success" : "text-muted-foreground"}`} /> : <Globe className={`h-6 w-6 ${isAllowed ? "text-success" : "text-muted-foreground"}`} />}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase">Destinasjon</span>
          <span className="text-xs font-mono text-foreground">{rule.destination}</span>
        </div>
      </div>

      {/* Direction label */}
      <div className="text-center mt-4">
        <span className="text-[10px] bg-secondary text-muted-foreground px-3 py-1 rounded-full">
          {rule.direction === "inbound" ? "↓ Innkommende trafikk" : "↑ Utgående trafikk"}
        </span>
      </div>

      {/* Notes */}
      {rule.notes && (
        <p className="text-xs text-muted-foreground mt-3 text-center italic">{rule.notes}</p>
      )}
    </div>
  );
}
