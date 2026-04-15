// Unified data store - uses API when available (Docker production), falls back to localStorage
import { isApiAvailable, apiGet, apiPost, apiPut, apiDelete } from "./api-client";
import * as local from "./store";

export type { Device, DeviceType, DeviceInterface, DeviceRoute, DeviceCable, DeviceSSID, DocPage, Firewall, FirewallRule, FirewallZone, NetworkZone, NetworkInfo, UploadedFile, User } from "./store";

// ── Devices ──

export async function getDevicesAsync() {
  if (await isApiAvailable()) return apiGet<local.Device[]>("/devices");
  return local.getDevices();
}

export async function addDeviceAsync(d: Omit<local.Device, "id" | "createdAt" | "updatedAt">) {
  if (await isApiAvailable()) return apiPost<local.Device>("/devices", d);
  return local.addDevice(d);
}

export async function updateDeviceAsync(id: string, updates: Partial<local.Device>) {
  if (await isApiAvailable()) return apiPut(`/devices/${id}`, { id, ...updates });
  local.updateDevice(id, updates);
}

export async function deleteDeviceAsync(id: string) {
  if (await isApiAvailable()) return apiDelete(`/devices/${id}`);
  local.deleteDevice(id);
}

// ── Docs ──

export async function getDocsAsync() {
  if (await isApiAvailable()) return apiGet<local.DocPage[]>("/docs");
  return local.getDocs();
}

export async function addDocAsync(d: Omit<local.DocPage, "id" | "createdAt" | "updatedAt">) {
  if (await isApiAvailable()) return apiPost<local.DocPage>("/docs", d);
  return local.addDoc(d);
}

export async function updateDocAsync(id: string, updates: Partial<local.DocPage>) {
  if (await isApiAvailable()) return apiPut(`/docs/${id}`, { id, ...updates });
  local.updateDoc(id, updates);
}

export async function deleteDocAsync(id: string) {
  if (await isApiAvailable()) return apiDelete(`/docs/${id}`);
  local.deleteDoc(id);
}

// ── Firewalls ──

export async function getFirewallsAsync() {
  if (await isApiAvailable()) return apiGet<local.Firewall[]>("/firewalls");
  return local.getFirewalls();
}

export async function addFirewallAsync(f: Omit<local.Firewall, "id" | "createdAt" | "updatedAt">) {
  if (await isApiAvailable()) return apiPost<local.Firewall>("/firewalls", f);
  return local.addFirewall(f);
}

export async function updateFirewallAsync(id: string, u: Partial<local.Firewall>) {
  if (await isApiAvailable()) return apiPut(`/firewalls/${id}`, { id, ...u });
  local.updateFirewall(id, u);
}

export async function deleteFirewallAsync(id: string) {
  if (await isApiAvailable()) return apiDelete(`/firewalls/${id}`);
  local.deleteFirewall(id);
}

// ── Firewall Rules ──

export async function getFirewallRulesAsync(firewallId?: string) {
  if (await isApiAvailable()) {
    if (firewallId) return apiGet<local.FirewallRule[]>(`/firewalls/${firewallId}/rules`);
    // Get all rules from all firewalls
    const firewalls = await getFirewallsAsync();
    const allRules: local.FirewallRule[] = [];
    for (const fw of firewalls) {
      const rules = await apiGet<local.FirewallRule[]>(`/firewalls/${fw.id}/rules`);
      allRules.push(...rules);
    }
    return allRules;
  }
  const rules = local.getFirewallRules();
  return firewallId ? rules.filter(r => r.firewallId === firewallId) : rules;
}

export async function addFirewallRuleAsync(r: Omit<local.FirewallRule, "id">) {
  if (await isApiAvailable()) return apiPost<local.FirewallRule>(`/firewalls/${r.firewallId}/rules`, r);
  return local.addFirewallRule(r);
}

export async function updateFirewallRuleAsync(id: string, updates: Partial<local.FirewallRule>) {
  if (await isApiAvailable()) {
    const firewallId = updates.firewallId;
    if (firewallId) return apiPut(`/firewalls/${firewallId}/rules/${id}`, { id, ...updates });
  }
  local.updateFirewallRule(id, updates);
}

export async function deleteFirewallRuleAsync(id: string, firewallId?: string) {
  if (await isApiAvailable() && firewallId) return apiDelete(`/firewalls/${firewallId}/rules/${id}`);
  local.deleteFirewallRule(id);
}

// ── Networks ──

export async function getNetworksAsync() {
  if (await isApiAvailable()) return apiGet<local.NetworkInfo[]>("/networks");
  return local.getNetworks();
}

export async function addNetworkAsync(n: Omit<local.NetworkInfo, "id">) {
  if (await isApiAvailable()) return apiPost<local.NetworkInfo>("/networks", n);
  return local.addNetwork(n);
}

export async function updateNetworkAsync(id: string, updates: Partial<local.NetworkInfo>) {
  if (await isApiAvailable()) return apiPut(`/networks/${id}`, { id, ...updates });
  local.updateNetwork(id, updates);
}

export async function deleteNetworkAsync(id: string) {
  if (await isApiAvailable()) return apiDelete(`/networks/${id}`);
  local.deleteNetwork(id);
}

// ── Zones ──

export async function getZonesAsync() {
  if (await isApiAvailable()) return apiGet<local.NetworkZone[]>("/networks/zones");
  return local.getZones();
}

export async function addZoneAsync(name: string) {
  if (await isApiAvailable()) return apiPost<local.NetworkZone>("/networks/zones", { name });
  return local.addZone(name);
}

export async function deleteZoneAsync(id: string) {
  if (await isApiAvailable()) return apiDelete(`/networks/zones/${id}`);
  local.deleteZone(id);
}

// ── Files ──

export async function getFilesAsync() {
  if (await isApiAvailable()) return apiGet<local.UploadedFile[]>("/files");
  return local.getFiles();
}

export async function addFileAsync(f: Omit<local.UploadedFile, "id" | "createdAt">) {
  if (await isApiAvailable()) return apiPost<local.UploadedFile>("/files", f);
  return local.addFile(f);
}

export async function deleteFileAsync(id: string) {
  if (await isApiAvailable()) return apiDelete(`/files/${id}`);
  local.deleteFile(id);
}

// ── Users ──

export async function getUsersAsync() {
  if (await isApiAvailable()) return apiGet<local.User[]>("/users");
  return local.getUsers();
}

export async function addUserAsync(u: Omit<local.User, "id">) {
  if (await isApiAvailable()) return apiPost<local.User>("/users", u);
  const users = local.getUsers();
  const user: local.User = { ...u, id: crypto.randomUUID() };
  users.push(user);
  local.saveUsers(users);
  return user;
}

export async function updateUserAsync(id: string, updates: Partial<local.User>) {
  if (await isApiAvailable()) return apiPut(`/users/${id}`, updates);
  local.updateUser(id, updates);
}

export async function deleteUserAsync(id: string) {
  if (await isApiAvailable()) return apiDelete(`/users/${id}`);
  local.saveUsers(local.getUsers().filter(u => u.id !== id));
}

export async function loginAsync(username: string, password: string): Promise<local.User | null> {
  if (await isApiAvailable()) {
    try {
      const user = await apiPost<local.User>("/users/login", { username, password });
      local.setCurrentUser(user);
      return user;
    } catch {
      return null;
    }
  }
  return local.login(username, password);
}

// ── Sync exports (still used for getCurrentUser/logout/backup in some places) ──
export { getCurrentUser, setCurrentUser, logout } from "./store";

// ── Backup ──

export async function exportBackupAsync(): Promise<string> {
  if (await isApiAvailable()) {
    const data = await apiGet("/backup/export");
    return JSON.stringify(data, null, 2);
  }
  return local.exportBackup();
}

export async function importBackupAsync(json: string): Promise<void> {
  if (await isApiAvailable()) {
    const data = JSON.parse(json);
    await apiPost("/backup/import", data);
    return;
  }
  local.importBackup(json);
}
