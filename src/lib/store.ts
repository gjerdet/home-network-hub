// Local storage based data store for all app data

export interface DeviceInterface {
  id: string;
  name: string; // eth0, ens18, etc
  type: "ethernet" | "wifi" | "vlan" | "bridge" | "bond" | "loopback" | "tunnel" | "other";
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
  site?: string;
  rack?: string;
  rackPosition?: string;
  tenant?: string;
  assetTag?: string;
  purchaseDate?: string;
  warrantyEnd?: string;
  notes?: string;
  image?: string;
  tags?: string[];
  interfaces?: DeviceInterface[];
  routes?: DeviceRoute[];
  cables?: DeviceCable[];
  createdAt: string;
  updatedAt: string;
}

export type DeviceType = "router" | "switch" | "server" | "ap" | "nas" | "firewall" | "vm" | "container" | "pdu" | "ups" | "other";

export interface DocPage {
  id: string;
  title: string;
  content: string; // markdown-like content
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FirewallRule {
  id: string;
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

export interface NetworkInfo {
  id: string;
  name: string;
  subnet: string;
  vlan?: string;
  gateway?: string;
  dhcpRange?: string;
  dns1?: string;
  dns2?: string;
  wanAddress?: string;
  wanGateway?: string;
  wanType?: "static" | "dhcp" | "pppoe";
  domain?: string;
  description?: string;
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
  networks: "netdocs_networks",
  files: "netdocs_files",
  users: "netdocs_users",
  currentUser: "netdocs_current_user",
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

// Files
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

export const generateId = () => crypto.randomUUID();
