import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAsync } from "@/lib/data-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Monitor } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await loginAsync(username, password);
    if (user) {
      navigate("/devices");
    } else {
      setError("Feil brukernavn eller passord");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 bg-card rounded-lg border border-border">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Monitor className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">NetDocs</span>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Brukernavn</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-secondary border-border"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Passord</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border"
              placeholder="••••••"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full">Logg inn</Button>
        </form>
        <p className="text-xs text-muted-foreground mt-4 text-center">Standard: admin / admin</p>
      </div>
    </div>
  );
}
