// IPAM data types and storage

export interface Prefix {
  id: string;
  prefix: string; // e.g. "10.0.0.0/8"
  description?: string;
  site?: string;
  vlan?: string; // VLAN ID reference
  status: "active" | "reserved" | "deprecated" | "container";
  isPool: boolean;
  tenant?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IPAddress {
  id: string;
  address: string; // e.g. "10.0.1.5/24"
  description?: string;
  status: "active" | "reserved" | "deprecated" | "dhcp" | "slaac";
  dnsName?: string;
  assignedDevice?: string; // device ID
  assignedInterface?: string;
  tenant?: string;
  nat?: string; // NAT outside IP
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VLAN {
  id: string;
  vid: number; // VLAN ID number
  name: string;
  description?: string;
  site?: string;
  status: "active" | "reserved" | "deprecated";
  tenant?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}
function setItem<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }

const KEYS = { prefixes: "netdocs_prefixes", ips: "netdocs_ips", vlans: "netdocs_vlans" };

// Prefixes
export const getPrefixes = (): Prefix[] => getItem(KEYS.prefixes, []);
export const savePrefixes = (p: Prefix[]) => setItem(KEYS.prefixes, p);
export const addPrefix = (p: Omit<Prefix, "id" | "createdAt" | "updatedAt">) => {
  const list = getPrefixes();
  const now = new Date().toISOString();
  const item: Prefix = { ...p, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  list.push(item);
  savePrefixes(list);
  return item;
};
export const updatePrefix = (id: string, u: Partial<Prefix>) => {
  savePrefixes(getPrefixes().map(p => p.id === id ? { ...p, ...u, updatedAt: new Date().toISOString() } : p));
};
export const deletePrefix = (id: string) => savePrefixes(getPrefixes().filter(p => p.id !== id));

// IP Addresses
export const getIPAddresses = (): IPAddress[] => getItem(KEYS.ips, []);
export const saveIPAddresses = (a: IPAddress[]) => setItem(KEYS.ips, a);
export const addIPAddress = (a: Omit<IPAddress, "id" | "createdAt" | "updatedAt">) => {
  const list = getIPAddresses();
  const now = new Date().toISOString();
  const item: IPAddress = { ...a, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  list.push(item);
  saveIPAddresses(list);
  return item;
};
export const updateIPAddress = (id: string, u: Partial<IPAddress>) => {
  saveIPAddresses(getIPAddresses().map(a => a.id === id ? { ...a, ...u, updatedAt: new Date().toISOString() } : a));
};
export const deleteIPAddress = (id: string) => saveIPAddresses(getIPAddresses().filter(a => a.id !== id));

// VLANs
export const getVLANs = (): VLAN[] => getItem(KEYS.vlans, []);
export const saveVLANs = (v: VLAN[]) => setItem(KEYS.vlans, v);
export const addVLAN = (v: Omit<VLAN, "id" | "createdAt" | "updatedAt">) => {
  const list = getVLANs();
  const now = new Date().toISOString();
  const item: VLAN = { ...v, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  list.push(item);
  saveVLANs(list);
  return item;
};
export const updateVLAN = (id: string, u: Partial<VLAN>) => {
  saveVLANs(getVLANs().map(v => v.id === id ? { ...v, ...u, updatedAt: new Date().toISOString() } : v));
};
export const deleteVLAN = (id: string) => saveVLANs(getVLANs().filter(v => v.id !== id));
