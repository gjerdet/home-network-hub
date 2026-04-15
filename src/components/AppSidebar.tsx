import { useState, useRef } from "react";
import { Monitor, FileText, Flame, Globe, FolderOpen, Users, LogOut, Download, Upload, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "@/lib/store";
import { exportBackupAsync, importBackupAsync } from "@/lib/data-service";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Enheter", url: "/devices", icon: Monitor },
  { title: "Dokumentasjon", url: "/docs", icon: FileText },
  { title: "Brannmur", url: "/firewall", icon: Flame },
  { title: "Nettverk", url: "/networks", icon: Globe },
  { title: "Filer", url: "/files", icon: FolderOpen },
  { title: "Brukere", url: "/users", icon: Users },
  { title: "Innstillingar", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleExport = async () => {
    const data = await exportBackupAsync();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `netdocs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup eksportert");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await importBackupAsync(reader.result as string);
        toast.success("Backup importert – laster på nytt...");
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        toast.error("Ugyldig backup-fil");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarContent>
        <div className={`p-4 ${collapsed ? "px-2" : ""}`}>
          <div className="flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary shrink-0" />
            {!collapsed && <span className="text-lg font-bold text-primary">NetDocs</span>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-secondary transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-2 space-y-1">
          <input type="file" ref={fileInputRef} accept=".json" onChange={handleImport} className="hidden" />
          <button
            onClick={handleExport}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-secondary transition-colors w-full"
          >
            <Download className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Eksporter backup</span>}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-secondary transition-colors w-full"
          >
            <Upload className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Importer backup</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logg ut</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
