import { useEffect, useRef, useState, useCallback } from "react";
import { type Device, type DeviceType } from "@/lib/store";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopologyNode {
  id: string;
  name: string;
  ip: string;
  type: DeviceType;
  x: number;
  y: number;
}

interface TopologyLink {
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
  cableType: string;
  color: string;
  status: string;
}

const typeColors: Record<DeviceType, string> = {
  router: "#3b82f6", switch: "#06b6d4", server: "#f59e0b",
  ap: "#22c55e", nas: "#8b5cf6", firewall: "#ef4444",
  vm: "#6366f1", container: "#14b8a6", pdu: "#eab308",
  ups: "#84cc16", other: "#6b7280",
};

const typeIcons: Record<DeviceType, string> = {
  router: "R", switch: "SW", server: "SRV",
  ap: "AP", nas: "NAS", firewall: "FW",
  vm: "VM", container: "CT", pdu: "PDU",
  ups: "UPS", other: "?",
};

interface Props {
  devices: Device[];
}

export function NetworkTopology({ devices }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [nodes, setNodes] = useState<TopologyNode[]>([]);
  const [links, setLinks] = useState<TopologyLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Build topology data from devices
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 500;

    // Position nodes in a circle layout
    const newNodes: TopologyNode[] = devices.map((d, i) => {
      const angle = (2 * Math.PI * i) / devices.length - Math.PI / 2;
      const radius = Math.min(width, height) * 0.3;
      const cx = width / 2;
      const cy = height / 2;
      return {
        id: d.id,
        name: d.name,
        ip: d.ip,
        type: d.type,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });

    // Build links from explicit cables and interface-to-interface connections
    const newLinks: TopologyLink[] = [];
    const addLink = ({
      fromId,
      remoteRef,
      fromPort,
      toPort,
      cableType,
      color,
      status,
    }: {
      fromId: string;
      remoteRef?: string;
      fromPort?: string;
      toPort?: string;
      cableType: string;
      color: string;
      status: string;
    }) => {
      if (!remoteRef) return;
      const remoteId = devices.find(rd => rd.id === remoteRef || rd.name === remoteRef)?.id;
      if (!remoteId || remoteId === fromId) return;

      const duplicate = newLinks.some(link =>
        (link.from === fromId && link.to === remoteId && link.fromPort === (fromPort || "") && link.toPort === (toPort || "")) ||
        (link.from === remoteId && link.to === fromId && link.fromPort === (toPort || "") && link.toPort === (fromPort || ""))
      );

      if (duplicate) return;

      newLinks.push({
        from: fromId,
        to: remoteId,
        fromPort: fromPort || "",
        toPort: toPort || "",
        cableType,
        color,
        status,
      });
    };

    devices.forEach(device => {
      (device.cables || []).forEach(cable => {
        addLink({
          fromId: device.id,
          remoteRef: cable.remoteDevice,
          fromPort: cable.localPort,
          toPort: cable.remotePort,
          cableType: cable.type,
          color: cable.color || "#6b7280",
          status: cable.status,
        });
      });

      (device.interfaces || []).forEach(iface => {
        addLink({
          fromId: device.id,
          remoteRef: iface.connectedTo,
          fromPort: iface.name,
          toPort: iface.connectedToInterface,
          cableType: "other",
          color: "#64748b",
          status: "connected",
        });
      });
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, [devices]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw links
    links.forEach(link => {
      const from = nodes.find(n => n.id === link.from);
      const to = nodes.find(n => n.id === link.to);
      if (!from || !to) return;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = link.status === "broken" ? "#ef4444" : link.status === "planned" ? "#6366f1" : (link.color || "#94a3b8");
      ctx.lineWidth = link.status === "broken" ? 1 : 2;
      if (link.status === "planned") {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Port labels on the line
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      if (link.fromPort || link.toPort) {
        ctx.font = "9px monospace";
        ctx.fillStyle = "#9ca3af";
        ctx.textAlign = "center";
        const label = [link.fromPort, link.toPort].filter(Boolean).join(" ↔ ");
        // Background for readability
        const tw = ctx.measureText(label).width + 6;
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(midX - tw / 2, midY - 7, tw, 14);
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(label, midX, midY + 3);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      const color = typeColors[node.type];
      const size = isHovered ? 32 : 28;

      // Shadow
      ctx.shadowColor = color;
      ctx.shadowBlur = isHovered ? 16 : 8;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Type icon
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typeIcons[node.type], node.x, node.y);

      // Name label
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.textAlign = "center";
      ctx.fillText(node.name, node.x, node.y + size + 14);

      // IP label
      ctx.font = "9px monospace";
      ctx.fillStyle = "#64748b";
      ctx.fillText(node.ip, node.x, node.y + size + 26);
    });

    ctx.restore();
  }, [nodes, links, zoom, pan, hoveredNode]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Resize
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  // Mouse interaction
  const getMousePos = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  };

  const findNode = (pos: { x: number; y: number }) => {
    return nodes.find(n => {
      const dx = n.x - pos.x;
      const dy = n.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy) < 32;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const node = findNode(pos);
    if (node) {
      setDragging(node.id);
      setDragStart({ x: pos.x - node.x, y: pos.y - node.y });
    } else {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (dragging) {
      setNodes(prev => prev.map(n =>
        n.id === dragging ? { ...n, x: pos.x - dragStart.x, y: pos.y - dragStart.y } : n
      ));
    } else if (isPanning) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else {
      const node = findNode(pos);
      setHoveredNode(node?.id || null);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Legg til enheter og kabler for å se nettverkstopologien</p>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-1">
        <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3, z * 1.2))} className="h-8 w-8 p-0"><ZoomIn className="h-3.5 w-3.5" /></Button>
        <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.3, z * 0.8))} className="h-8 w-8 p-0"><ZoomOut className="h-3.5 w-3.5" /></Button>
        <Button variant="outline" size="sm" onClick={resetView} className="h-8 w-8 p-0"><Maximize2 className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-card/90 border border-border rounded-md px-3 py-2">
        <div className="flex gap-3 flex-wrap">
          {[...new Set(devices.map(d => d.type))].map(type => (
            <div key={type} className="flex items-center gap-1.5 text-[10px]">
              <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: typeColors[type], backgroundColor: "transparent" }} />
              <span className="text-muted-foreground">{typeIcons[type]}</span>
            </div>
          ))}
          {links.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>{links.length} kabel{links.length !== 1 ? "r" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="absolute top-3 left-3 z-10 text-[10px] text-muted-foreground">
        Dra noder for å flytte · Scroll for å zoome
      </div>

      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border border-border bg-background cursor-grab active:cursor-grabbing"
        style={{ height: "500px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}
