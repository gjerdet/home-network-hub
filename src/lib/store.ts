// Local storage based data store for all app data

export interface DeviceInterface {
  id: string;
  name: string; // eth0, ens18, etc
  type: "ethernet" | "wifi" | "vlan" | "bridge" | "bond" | "loopback" | "tunnel" | "lag" | "other";
  mode?: "access" | "trunk" | "hybrid" | "routed"; // switchport mode
  ip?: string;
  mac?: string;
  speed?: string; // 1G, 10G, etc
  enabled: boolean;
  description?: string;
  connectedTo?: string; // device ID
  connectedToInterface?: string; // interface name on connected device
  vlanId?: string; // access VLAN or native VLAN
  taggedVlans?: string[]; // trunk tagged VLANs
  isWan?: boolean;
  poe?: "none" | "poe" | "poe+" | "poe++"; // PoE capability
  lagGroup?: string;
  lagMembers?: string[];
}

export interface DeviceRoute {
  id: string;
  destination: string; // 0.0.0.0/0, 10.0.0.0/8
  gateway: string;
  metric?: number;
  interface?: string;
  description?: string;
}

export interface DeviceCable {
  id: string;
  label?: string;
  type: "cat5e" | "cat6" | "cat6a" | "cat7" | "fiber-sm" | "fiber-mm" | "dac" | "coax" | "other";
  localPort: string;
  remoteDevice?: string;
  remotePort?: string;
  length?: string;
  color?: string;
  status: "connected" | "planned" | "broken";
}

export interface DeviceSSID {
  id: string;
  name: string; // SSID name
  vlan?: string; // VLAN this SSID maps to
  band?: "2.4GHz" | "5GHz" | "6GHz" | "dual" | "tri";
  security?: string; // WPA2, WPA3, Open, etc
  enabled: boolean;
}

export interface Device {
  id: string;
  name: string;
  ip: string;
  mac?: string;
  type: DeviceType;
  role: string;
  status: "online" | "offline" | "maintenance" | "planned" | "decommissioned";
  location?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  os?: string;
  osVersion?: string;
  firmware?: string;
  cpuCores?: number;
  ramGb?: number;
  storageGb?: number;
  primaryInterface?: string;
  managementIp?: string;
  managementVlan?: string; // management VLAN (for all except router/firewall)
  site?: string;
  rack?: string;
  rackPosition?: string;
  rackHeight?: number;
  tenant?: string;
  assetTag?: string;
  purchaseDate?: string;
  warrantyEnd?: string;
  notes?: string;
  image?: string;
  tags?: string[];
  firewallId?: string;
  ssids?: DeviceSSID[]; // AP-specific: SSIDs broadcast
  interfaces?: DeviceInterface[];
  routes?: DeviceRoute[];
  cables?: DeviceCable[];
  createdAt: string;
  updatedAt: string;
}

export type DeviceType = "router" | "switch" | "server" | "ap" | "camera" | "nas" | "firewall" | "vm" | "container" | "pdu" | "ups" | "other";

export interface DocPage {
  id: string;
  title: string;
  content: string; // HTML from tiptap
  category: string;
  tags: string[];
  parentId?: string; // for wiki tree structure
  linkedDevices?: string[]; // device IDs
  linkedNetworks?: string[]; // network IDs
  icon?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Firewall {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  ip?: string;
  os?: string;
  description?: string;
  status: "online" | "offline" | "maintenance";
  createdAt: string;
  updatedAt: string;
}

export interface FirewallRule {
  id: string;
  firewallId: string; // which firewall this rule belongs to
  name: string;
  action: "allow" | "deny" | "reject";
  protocol: string;
  sourceZone: string;
  destinationZone: string;
  source: string;
  destination: string;
  port: string;
  service?: string;
  schedule?: string;
  logging: boolean;
  enabled: boolean;
  notes?: string;
  order: number;
  hitCount?: number;
}

export type FirewallZone = "WAN" | "LAN" | "DMZ" | "WLAN" | "VPN" | "MGMT" | "IOT" | "GUEST";

export interface NetworkZone {
  id: string;
  name: string;
}

export interface NetworkInfo {
  id: string;
  name: string;
  subnet: string;
  vlan?: string;
  zone?: string; // zone name
  gateway?: string;
  dhcpRange?: string;
  dns1?: string;
  dns2?: string;
  domain?: string;
  description?: string;
  firewallId?: string; // linked firewall
}

// updateNetwork and updateFirewallRule are defined below their respective save functions

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  displayName?: string;
  email?: string;
  role: "admin" | "editor" | "viewer";
}

export const updateUser = (id: string, updates: Partial<User>) => {
  const users = getUsers().map(u => u.id === id ? { ...u, ...updates } : u);
  saveUsers(users);
  const current = getCurrentUser();
  if (current?.id === id) {
    setCurrentUser({ ...current, ...updates });
  }
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const KEYS = {
  devices: "netdocs_devices",
  docs: "netdocs_docs",
  firewallRules: "netdocs_firewall",
  firewalls: "netdocs_firewalls",
  networks: "netdocs_networks",
  files: "netdocs_files",
  users: "netdocs_users",
  currentUser: "netdocs_current_user",
  zones: "netdocs_zones",
  services: "netdocs_services",
};

// Devices
export const getDevices = (): Device[] => getItem(KEYS.devices, []);
export const saveDevices = (d: Device[]) => setItem(KEYS.devices, d);
export const addDevice = (d: Omit<Device, "id" | "createdAt" | "updatedAt">) => {
  const devices = getDevices();
  const now = new Date().toISOString();
  const device: Device = { ...d, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  devices.push(device);
  saveDevices(devices);
  return device;
};
export const updateDevice = (id: string, updates: Partial<Device>) => {
  const devices = getDevices().map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d);
  saveDevices(devices);
};
export const deleteDevice = (id: string) => {
  saveDevices(getDevices().filter(d => d.id !== id));
};

// Docs
export const getDocs = (): DocPage[] => getItem(KEYS.docs, []);
export const saveDocs = (d: DocPage[]) => setItem(KEYS.docs, d);
export const addDoc = (d: Omit<DocPage, "id" | "createdAt" | "updatedAt">) => {
  const docs = getDocs();
  const now = new Date().toISOString();
  const doc: DocPage = { ...d, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  docs.push(doc);
  saveDocs(docs);
  return doc;
};
export const updateDoc = (id: string, updates: Partial<DocPage>) => {
  saveDocs(getDocs().map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d));
};
export const deleteDoc = (id: string) => {
  saveDocs(getDocs().filter(d => d.id !== id));
};

// Firewalls
export const getFirewalls = (): Firewall[] => getItem(KEYS.firewalls, []);
export const saveFirewalls = (f: Firewall[]) => setItem(KEYS.firewalls, f);
export const addFirewall = (f: Omit<Firewall, "id" | "createdAt" | "updatedAt">) => {
  const list = getFirewalls();
  const now = new Date().toISOString();
  const fw: Firewall = { ...f, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  list.push(fw);
  saveFirewalls(list);
  return fw;
};
export const updateFirewall = (id: string, u: Partial<Firewall>) => {
  saveFirewalls(getFirewalls().map(f => f.id === id ? { ...f, ...u, updatedAt: new Date().toISOString() } : f));
};
export const deleteFirewall = (id: string) => {
  saveFirewalls(getFirewalls().filter(f => f.id !== id));
  // Also delete all rules for this firewall
  saveFirewallRules(getFirewallRules().filter(r => r.firewallId !== id));
};

// Firewall Rules
export const getFirewallRules = (): FirewallRule[] => getItem(KEYS.firewallRules, []);
export const saveFirewallRules = (r: FirewallRule[]) => setItem(KEYS.firewallRules, r);
export const addFirewallRule = (r: Omit<FirewallRule, "id">) => {
  const rules = getFirewallRules();
  const rule: FirewallRule = { ...r, id: crypto.randomUUID() };
  rules.push(rule);
  saveFirewallRules(rules);
  return rule;
};
export const deleteFirewallRule = (id: string) => {
  saveFirewallRules(getFirewallRules().filter(r => r.id !== id));
};
export const updateFirewallRule = (id: string, updates: Partial<FirewallRule>) => {
  saveFirewallRules(getFirewallRules().map(r => r.id === id ? { ...r, ...updates } : r));
};

// Networks
export const getNetworks = (): NetworkInfo[] => getItem(KEYS.networks, []);
export const saveNetworks = (n: NetworkInfo[]) => setItem(KEYS.networks, n);
export const addNetwork = (n: Omit<NetworkInfo, "id">) => {
  const networks = getNetworks();
  const network: NetworkInfo = { ...n, id: crypto.randomUUID() };
  networks.push(network);
  saveNetworks(networks);
  return network;
};
export const deleteNetwork = (id: string) => {
  saveNetworks(getNetworks().filter(n => n.id !== id));
};
export const updateNetwork = (id: string, updates: Partial<NetworkInfo>) => {
  saveNetworks(getNetworks().map(n => n.id === id ? { ...n, ...updates } : n));
};

// Zones
export const getZones = (): NetworkZone[] => getItem(KEYS.zones, []);
export const saveZones = (z: NetworkZone[]) => setItem(KEYS.zones, z);
export const addZone = (name: string) => {
  const zones = getZones();
  const zone: NetworkZone = { id: crypto.randomUUID(), name };
  zones.push(zone);
  saveZones(zones);
  return zone;
};
export const deleteZone = (id: string) => {
  saveZones(getZones().filter(z => z.id !== id));
};


export const getFiles = (): UploadedFile[] => getItem(KEYS.files, []);
export const saveFiles = (f: UploadedFile[]) => setItem(KEYS.files, f);
export const addFile = (f: Omit<UploadedFile, "id" | "createdAt">) => {
  const files = getFiles();
  const file: UploadedFile = { ...f, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  files.push(file);
  saveFiles(files);
  return file;
};
export const deleteFile = (id: string) => {
  saveFiles(getFiles().filter(f => f.id !== id));
};

// Users
export const getUsers = (): User[] => {
  const users = getItem<User[]>(KEYS.users, []);
  if (users.length === 0) {
    const defaultAdmin: User = { id: crypto.randomUUID(), username: "admin", password: "admin", role: "admin" };
    setItem(KEYS.users, [defaultAdmin]);
    return [defaultAdmin];
  }
  return users;
};
export const saveUsers = (u: User[]) => setItem(KEYS.users, u);

export const getCurrentUser = (): User | null => getItem<User | null>(KEYS.currentUser, null);
export const setCurrentUser = (u: User | null) => setItem(KEYS.currentUser, u);

export const login = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    setCurrentUser(user);
    return user;
  }
  return null;
};

export const logout = () => setCurrentUser(null);

export const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

// Backup
export const exportBackup = (): string => {
  const data: Record<string, unknown> = {};
  for (const [key, storageKey] of Object.entries(KEYS)) {
    const raw = localStorage.getItem(storageKey);
    if (raw) data[key] = JSON.parse(raw);
  }
  return JSON.stringify(data, null, 2);
};

export const importBackup = (json: string) => {
  const data = JSON.parse(json) as Record<string, unknown>;
  for (const [key, storageKey] of Object.entries(KEYS)) {
    if (data[key] !== undefined) {
      localStorage.setItem(storageKey, JSON.stringify(data[key]));
    }
  }
};
