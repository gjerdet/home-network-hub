import { Monitor, FileText, Flame, Globe, FolderOpen, Users, LogOut, Search } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { logout } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const navItems = [
  { title: "Enheter", url: "/devices", icon: Monitor },
  { title: "Dokumentasjon", url: "/docs", icon: FileText },
  { title: "Brannmur", url: "/firewall", icon: Flame },
  { title: "Nettverk", url: "/networks", icon: Globe },
  { title: "Filer", url: "/files", icon: FolderOpen },
  { title: "Brukere", url: "/users", icon: Users },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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
      {/* Top navbar */}
      <header className="h-12 flex items-center border-b border-border px-4 gap-1 bg-card shrink-0">
        <div className="flex items-center gap-2 mr-4">
          <Monitor className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-bold text-primary">NetDocs</span>
        </div>

        <nav className="flex items-center gap-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.url}
              to={item.url}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              activeClassName="bg-primary/10 text-primary"
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.title}</span>
            </NavLink>
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
              className="pl-8 h-8 text-xs bg-secondary border-border"
            />
          </div>
        </form>

        <button
          onClick={handleLogout}
          className="ml-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Logg ut"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto scrollbar-thin">
        {children}
      </main>
    </div>
  );
}
