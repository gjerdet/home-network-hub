import { useState, useEffect } from "react";
import { getUsers, saveUsers, getCurrentUser, type User } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Save, Users } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "viewer" as "admin" | "viewer" });
  const currentUser = getCurrentUser();

  useEffect(() => { setUsers(getUsers()); }, []);

  const handleSave = () => {
    if (!form.username || !form.password) return;
    const updated = [...users, { id: crypto.randomUUID(), ...form }];
    saveUsers(updated);
    setUsers(updated);
    setShowForm(false);
    setForm({ username: "", password: "", role: "viewer" });
  };

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) return;
    const updated = users.filter(u => u.id !== id);
    saveUsers(updated);
    setUsers(updated);
  };

  if (currentUser?.role !== "admin") {
    return <div className="text-center py-16 text-muted-foreground"><p>Du har ikke tilgang til denne siden</p></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brukere</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} brukere</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Ny bruker</Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ny bruker</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Brukernavn</label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Passord</label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Rolle</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
                <option value="admin">Admin</option><option value="viewer">Leser</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button></div>
        </div>
      )}

      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">{u.username[0].toUpperCase()}</div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{u.username} {u.id === currentUser?.id && <span className="text-xs text-primary">(deg)</span>}</div>
              <div className="text-xs text-muted-foreground">{u.role === "admin" ? "Administrator" : "Leser"}</div>
            </div>
            {u.id !== currentUser?.id && (
              <button onClick={() => handleDelete(u.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
