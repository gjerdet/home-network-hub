import { useState, useRef, useEffect } from "react";
import { Monitor, FileText, Flame, Globe, FolderOpen, Users, LogOut, Search, ChevronDown, Server, Network, Cable, MapPin, Building2, Shield, LayoutGrid, Tag, Download, Upload } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { logout, getCurrentUser, exportBackup, importBackup } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface NavGroup {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Organisasjon",
    items: [
      { title: "Nettverk", url: "/networks", icon: Globe },
      { title: "Brukere", url: "/users", icon: Users },
    ],
  },
  {
    label: "Enheter",
    items: [
      { title: "Enheter", url: "/devices", icon: Monitor },
    ],
  },
  {
    label: "IPAM",
    items: [
      { title: "IPAM", url: "/ipam", icon: Network },
    ],
  },
  {
    label: "Brannmur",
    items: [
      { title: "Regler", url: "/firewall", icon: Flame },
    ],
  },
  {
    label: "Annet",
    items: [
      { title: "Dokumentasjon", url: "/docs", icon: FileText },
      { title: "Filer", url: "/files", icon: FolderOpen },
    ],
  },
];

function NavDropdown({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isActive = group.items.some(item => location.pathname.startsWith(item.url));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Single item groups: just render a direct link
  if (group.items.length === 1) {
    const item = group.items[0];
    return (
      <NavLink
        to={item.url}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors text-[hsl(var(--navbar-foreground))] hover:text-foreground hover:bg-[hsl(var(--border)/0.5)]"
        activeClassName="!text-[hsl(var(--navbar-active))] bg-[hsl(var(--border)/0.4)]"
      >
        <item.icon className="h-3.5 w-3.5" />
        {group.label}
      </NavLink>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
          isActive
            ? "text-[hsl(var(--navbar-active))] bg-[hsl(var(--border)/0.4)]"
            : "text-[hsl(var(--navbar-foreground))] hover:text-foreground hover:bg-[hsl(var(--border)/0.5)]"
        }`}
      >
        {group.label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--popover))] border border-border rounded-md shadow-xl z-50 min-w-[180px] py-1">
          {group.items.map(item => (
            <NavLink
              key={item.url}
              to={item.url}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[hsl(var(--navbar-foreground))] hover:bg-[hsl(var(--border)/0.5)] hover:text-foreground transition-colors"
              activeClassName="!text-[hsl(var(--navbar-active))] bg-[hsl(var(--accent))]"
              onClick={() => setOpen(false)}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.title}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* NetBox-style navbar */}
      <header className="h-11 flex items-center border-b border-border px-4 gap-2 bg-[hsl(var(--navbar))] shrink-0">
        <div className="flex items-center gap-2 mr-3">
          <Monitor className="h-4.5 w-4.5 text-[hsl(var(--navbar-active))]" />
          <span className="text-sm font-bold text-[hsl(var(--navbar-active))]">NetDocs</span>
        </div>

        <nav className="flex items-center gap-0.5">
          {navGroups.map(group => (
            <NavDropdown key={group.label} group={group} />
          ))}
        </nav>

        <div className="flex-1" />

        <form onSubmit={handleSearch} className="max-w-xs">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk..."
              className="pl-8 h-7 text-xs bg-[hsl(var(--border)/0.5)] border-[hsl(var(--border))] text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </form>

        {user && (
          <span className="text-[10px] text-[hsl(var(--navbar-foreground))] ml-2">
            {user.displayName || user.username}
          </span>
        )}

        <button
          onClick={handleLogout}
          className="ml-1 p-1.5 rounded text-[hsl(var(--navbar-foreground))] hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Logg ut"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto scrollbar-thin">
        {children}
      </main>
    </div>
  );
}
