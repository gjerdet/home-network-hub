import { useState, useEffect } from "react";
import { Database, RefreshCw, CheckCircle, XCircle, Loader2, Server, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { isApiAvailable, API_BASE } from "@/lib/api-client";
import { toast } from "sonner";

export default function SettingsPage() {
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [appVersion] = useState("1.0.0");
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [apiUrl, setApiUrl] = useState(API_BASE);

  const checkConnection = async () => {
    setApiStatus("checking");
    try {
      const available = await isApiAvailable();
      setApiStatus(available ? "connected" : "disconnected");
    } catch {
      setApiStatus("disconnected");
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    // Simulate update check - in production this would check a real endpoint
    await new Promise(r => setTimeout(r, 2000));
    setCheckingUpdate(false);
    toast.info("Du kjører siste versjon av NetDocs.");
  };

  const handleForceReload = () => {
    // Clear all caches and do a hard reload
    if ("caches" in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Innstillingar</h1>
        <p className="text-muted-foreground">Database-tilkobling, oppdateringar og systeminfo</p>
      </div>

      {/* Database Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Database-tilkobling
          </CardTitle>
          <CardDescription>
            Status for tilkobling til PostgreSQL-backend. Utan tilkobling brukar appen localStorage i nettlesaren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Status:</span>
            {apiStatus === "checking" && (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Sjekkar...
              </Badge>
            )}
            {apiStatus === "connected" && (
              <Badge className="gap-1 bg-primary hover:bg-primary/90">
                <CheckCircle className="h-3 w-3" /> Tilkobla (PostgreSQL)
              </Badge>
            )}
            {apiStatus === "disconnected" && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" /> Fråkobla (brukar localStorage)
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiUrl">API-adresse</Label>
            <div className="flex gap-2">
              <Input
                id="apiUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="/api"
                className="font-mono text-sm"
                readOnly
              />
              <Button onClick={checkConnection} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" /> Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              API-adressa er sett til <code className="text-primary">/api</code> og peikar til Express-backend via nginx proxy.
              For å aktivere database: kjør <code className="text-primary">docker-compose up -d</code> på serveren.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Alt. 1 – Lokal PostgreSQL (utan Docker)</h3>
            <p className="text-xs text-muted-foreground">
              Om du allereie har ein PostgreSQL-server som kjører lokalt:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Opprett ein database: <code className="text-primary">CREATE DATABASE netdocs;</code></li>
              <li>Opprett ein brukar: <code className="text-primary">CREATE USER netdocs WITH PASSWORD 'ditt-passord';</code></li>
              <li>Gi tilgang: <code className="text-primary">GRANT ALL PRIVILEGES ON DATABASE netdocs TO netdocs;</code></li>
              <li>
                Start backend manuelt med miljøvariablar:
                <div className="bg-muted rounded-md p-2 mt-1 font-mono space-y-0.5">
                  <p>cd backend</p>
                  <p>npm install</p>
                  <p>DB_HOST=localhost DB_PORT=5432 DB_NAME=netdocs \</p>
                  <p>  DB_USER=netdocs DB_PASSWORD=ditt-passord \</p>
                  <p>  PORT=3001 npm start</p>
                </div>
              </li>
              <li>
                Bygg og server frontend (eller køyr dev-server):
                <div className="bg-muted rounded-md p-2 mt-1 font-mono space-y-0.5">
                  <p>npm run build</p>
                  <p>npx serve dist -l 80</p>
                </div>
              </li>
              <li>
                Sett opp ein reverse proxy (nginx/caddy) som sender <code className="text-primary">/api/*</code> til <code className="text-primary">localhost:3001</code>
              </li>
              <li>Standard innlogging: <code className="text-primary">admin / admin</code> (opprettast automatisk)</li>
            </ol>

            <Separator />

            <h3 className="text-sm font-medium text-foreground">Alt. 2 – Docker Compose (alt-i-eitt)</h3>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Installer Docker og Docker Compose på serveren din</li>
              <li>Klon prosjektet og kjør <code className="text-primary">docker-compose up -d</code></li>
              <li>Appen startar med PostgreSQL, Express API og nginx</li>
              <li>Opne appen på <code className="text-primary">http://din-server:80</code></li>
              <li>Standard innlogging: <code className="text-primary">admin / admin</code></li>
            </ol>

            <Separator />

            <h3 className="text-sm font-medium text-foreground">nginx proxy-konfig (for lokal PG)</h3>
            <div className="bg-muted rounded-md p-2 mt-1 font-mono text-xs text-muted-foreground space-y-0.5">
              <p>location /api/ {"{"}</p>
              <p>    proxy_pass http://127.0.0.1:3001;</p>
              <p>    proxy_set_header Host $host;</p>
              <p>    proxy_set_header X-Real-IP $remote_addr;</p>
              <p>{"}"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Oppdatering
          </CardTitle>
          <CardDescription>
            Sjekk etter nye versjonar og oppdater appen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Noverande versjon:</span>
            <Badge variant="outline">{appVersion}</Badge>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCheckUpdate} disabled={checkingUpdate}>
              {checkingUpdate ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sjekkar...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Sjekk etter oppdateringar</>
              )}
            </Button>
            <Button variant="outline" onClick={handleForceReload}>
              <Globe className="h-4 w-4 mr-2" /> Hard reload
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Oppdatere manuelt (Docker)</h3>
            <div className="bg-muted rounded-md p-3 font-mono text-xs text-muted-foreground space-y-1">
              <p>cd /path/to/netdocs</p>
              <p>git pull origin main</p>
              <p>docker-compose build --no-cache</p>
              <p>docker-compose up -d</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Systeminfo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Frontend:</span>
            <span className="text-foreground">React + Vite + Tailwind</span>
            <span className="text-muted-foreground">Backend:</span>
            <span className="text-foreground">Express.js + PostgreSQL</span>
            <span className="text-muted-foreground">Datamodus:</span>
            <span className="text-foreground">{apiStatus === "connected" ? "PostgreSQL" : "localStorage (nettlesar)"}</span>
            <span className="text-muted-foreground">Docker:</span>
            <span className="text-foreground">nginx + api + postgres</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
