import { type Device } from "@/lib/store";

const typeColors: Record<string, string> = {
  router: "bg-primary/30 border-primary/50",
  switch: "bg-info/30 border-info/50",
  server: "bg-warning/30 border-warning/50",
  firewall: "bg-destructive/30 border-destructive/50",
  nas: "bg-accent border-accent-foreground/30",
  ups: "bg-success/30 border-success/50",
  pdu: "bg-warning/20 border-warning/40",
  ap: "bg-success/20 border-success/40",
  vm: "bg-info/20 border-info/40",
  container: "bg-primary/20 border-primary/40",
  other: "bg-muted border-border",
};

interface Props {
  devices: Device[];
}

export function RackView({ devices }: Props) {
  // Group devices by rack name
  const racks = new Map<string, Device[]>();
  devices.forEach(d => {
    if (d.rack && d.rackPosition) {
      const list = racks.get(d.rack) || [];
      list.push(d);
      racks.set(d.rack, list);
    }
  });

  const unracked = devices.filter(d => !d.rack || !d.rackPosition);
  const rackNames = [...racks.keys()].sort();
  const maxU = 48;

  if (rackNames.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm mb-1">Ingen enheter plassert i rack</p>
        <p className="text-xs text-muted-foreground/70">Rediger en enhet og fyll inn «Rack» og «Rack-posisjon» for å se den her.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {rackNames.map(rackName => {
        const rackDevices = racks.get(rackName) || [];
        // Build occupancy map: U position -> device
        const occupancy = new Map<number, Device>();
        rackDevices.forEach(d => {
          const startU = parseInt(d.rackPosition || "0");
          const height = d.rackHeight || 1;
          for (let u = startU; u < startU + height; u++) {
            occupancy.set(u, d);
          }
        });

        // Track which devices we've already rendered (for multi-U spans)
        const rendered = new Set<string>();

        return (
          <div key={rackName} className="shrink-0">
            <h3 className="text-sm font-semibold text-foreground mb-2 text-center">{rackName}</h3>
            <div className="border border-border rounded-lg bg-card overflow-hidden w-80">
              {/* Rack header */}
              <div className="bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground border-b border-border flex justify-between">
                <span>U</span>
                <span>{rackDevices.length} enheter</span>
              </div>
              {/* Rack units */}
              <div className="divide-y divide-border/50">
                {Array.from({ length: maxU }, (_, i) => {
                  const u = maxU - i; // top = highest U
                  const device = occupancy.get(u);

                  if (device && rendered.has(device.id)) {
                    return null; // Part of a multi-U device already rendered
                  }

                  if (device) {
                    rendered.add(device.id);
                    const height = device.rackHeight || 1;
                    const colorClass = typeColors[device.type] || typeColors.other;

                    return (
                      <div
                        key={u}
                        className={`flex items-center gap-2 px-2 border-l-4 ${colorClass} transition-colors hover:brightness-110`}
                        style={{ height: `${height * 28}px` }}
                      >
                        <span className="text-[10px] text-muted-foreground w-6 text-right shrink-0">{u}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-foreground truncate block">{device.name}</span>
                          {height > 1 && <span className="text-[10px] text-muted-foreground">{height}U</span>}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{device.ip}</span>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${device.status === "online" ? "bg-success" : device.status === "offline" ? "bg-destructive" : "bg-warning"}`} />
                      </div>
                    );
                  }

                  return (
                    <div key={u} className="flex items-center gap-2 px-2 h-7">
                      <span className="text-[10px] text-muted-foreground/40 w-6 text-right">{u}</span>
                      <div className="flex-1 border-b border-dashed border-border/30" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Unracked devices */}
      {unracked.length > 0 && (
        <div className="shrink-0 w-64">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 text-center">Ikke plassert</h3>
          <div className="space-y-1">
            {unracked.map(d => (
              <div key={d.id} className="flex items-center gap-2 bg-card border border-border rounded px-3 py-1.5 text-xs">
                <span className="text-foreground truncate flex-1">{d.name}</span>
                <span className="font-mono text-muted-foreground">{d.ip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
