const DONATIONS_KEY = "annadaan:donations";
const DELIVERIES_KEY = "annadaan:deliveries";
const DONATIONS_EVENT = "annadaan:donations-updated";
const DELIVERIES_EVENT = "annadaan:deliveries-updated";

export interface LocalDonation {
  id: string;
  donorId: string;
  donorName: string;
  foodType: string;
  quantity: string;
  unit: string;
  expiryDate: string;
  location: string;
  notes?: string;
  status: string;
  acceptedByNgoId?: string;
  acceptedByNgoName?: string;
  createdAtMillis: number;
  updatedAtMillis: number;
}

export interface LocalDelivery {
  id: string;
  donationId: string;
  donorId?: string;
  donorName?: string;
  ngoId?: string;
  ngoName?: string;
  pickupLocation: string;
  dropLocation: string;
  status: string;
  volunteerId?: string | null;
  volunteerName?: string | null;
  foodType?: string;
  quantity?: string;
  createdAtMillis: number;
  updatedAtMillis: number;
}

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T[] : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, eventName: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event(eventName));
}

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index === -1) return [item, ...items];
  const next = [...items];
  next[index] = { ...next[index], ...item };
  return next;
}

export function getLocalDonations() {
  return readList<LocalDonation>(DONATIONS_KEY);
}

export function upsertLocalDonation(donation: LocalDonation) {
  writeList(DONATIONS_KEY, DONATIONS_EVENT, upsert(getLocalDonations(), donation));
}

export function updateLocalDonation(id: string, patch: Partial<LocalDonation>) {
  const next = getLocalDonations().map((donation) =>
    donation.id === id ? { ...donation, ...patch, updatedAtMillis: Date.now() } : donation
  );
  writeList(DONATIONS_KEY, DONATIONS_EVENT, next);
}

export function subscribeLocalDonations(callback: (donations: LocalDonation[]) => void) {
  if (typeof window === "undefined") return () => {};
  const notify = () => callback(getLocalDonations());
  notify();
  window.addEventListener(DONATIONS_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(DONATIONS_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function getLocalDeliveries() {
  return readList<LocalDelivery>(DELIVERIES_KEY);
}

export function upsertLocalDelivery(delivery: LocalDelivery) {
  writeList(DELIVERIES_KEY, DELIVERIES_EVENT, upsert(getLocalDeliveries(), delivery));
}

export function updateLocalDelivery(id: string, patch: Partial<LocalDelivery>) {
  const next = getLocalDeliveries().map((delivery) =>
    delivery.id === id ? { ...delivery, ...patch, updatedAtMillis: Date.now() } : delivery
  );
  writeList(DELIVERIES_KEY, DELIVERIES_EVENT, next);
}

export function subscribeLocalDeliveries(callback: (deliveries: LocalDelivery[]) => void) {
  if (typeof window === "undefined") return () => {};
  const notify = () => callback(getLocalDeliveries());
  notify();
  window.addEventListener(DELIVERIES_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(DELIVERIES_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function mergeById<T extends { id: string }>(primary: T[], fallback: T[]) {
  const seen = new Set(primary.map((item) => item.id));
  return [...primary, ...fallback.filter((item) => !seen.has(item.id))];
}
