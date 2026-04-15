import { useState, useEffect } from "react";
import { getUsers, saveUsers, getCurrentUser, updateUser, type User } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Save, Users, Edit2 } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ username: "", password: "", displayName: "", email: "", role: "viewer" as User["role"] });
  const currentUser = getCurrentUser();

  useEffect(() => { setUsers(getUsers()); }, []);

  const handleSave = () => {
    if (!form.username) return;
    if (editId) {
      const updates: Partial<User> = { username: form.username, displayName: form.displayName, email: form.email, role: form.role };
      if (form.password) updates.password = form.password;
      updateUser(editId, updates);
    } else {
      if (!form.password) return;
      const updated = [...users, { id: crypto.randomUUID(), ...form }];
      saveUsers(updated);
    }
    setUsers(getUsers());
    setShowForm(false);
    setEditId(null);
    setForm({ username: "", password: "", displayName: "", email: "", role: "viewer" });
  };

  const handleEdit = (u: User) => {
    setForm({ username: u.username, password: "", displayName: u.displayName || "", email: u.email || "", role: u.role });
    setEditId(u.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) return;
    const updated = users.filter(u => u.id !== id);
    saveUsers(updated);
    setUsers(updated);
  };

  const isAdmin = currentUser?.role === "admin";
  const canEdit = (u: User) => isAdmin || u.id === currentUser?.id;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brukere</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} brukere</p>
        </div>
        {isAdmin && <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ username: "", password: "", displayName: "", email: "", role: "viewer" }); }}><Plus className="h-4 w-4 mr-1" /> Ny bruker</Button>}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editId ? "Rediger bruker" : "Ny bruker"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Brukernavn *</label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">{editId ? "Nytt passord (la tom for å beholde)" : "Passord *"}</label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Visningsnavn</label><Input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="bg-secondary border-border" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">E-post</label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-secondary border-border" /></div>
            {isAdmin && (
              <div><label className="text-xs text-muted-foreground mb-1 block">Rolle</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as User["role"] })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground">
                  <option value="admin">Administrator</option>
                  <option value="editor">Redaktør</option>
                  <option value="viewer">Leser</option>
                </select>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lagre</Button></div>
        </div>
      )}

      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
              {(u.displayName || u.username)[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">
                {u.displayName || u.username}
                {u.displayName && <span className="text-xs text-muted-foreground ml-2">@{u.username}</span>}
                {u.id === currentUser?.id && <span className="text-xs text-primary ml-2">(deg)</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {u.role === "admin" ? "Administrator" : u.role === "editor" ? "Redaktør" : "Leser"}
                {u.email && <span className="ml-2">· {u.email}</span>}
              </div>
            </div>
            {canEdit(u) && (
              <button onClick={() => handleEdit(u)} className="text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></button>
            )}
            {isAdmin && u.id !== currentUser?.id && (
              <button onClick={() => handleDelete(u.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
