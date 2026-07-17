// Mock data — Supabase entegrasyonunda burası gerçek DB çağrısıyla değişir

export type AppointmentStatus = "pending" | "confirmed" | "done" | "cancelled";
export type ServiceType = "Dövme" | "Piercing" | "Dokunmatik" | "Kapak" | "Lazer" | "Fine-line, Botanik" | "Realism, Portrait";

export interface Artist {
  id: string;
  name: string;
  specialty: string;
  color: string; // takvimde kullanılır
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  artistId: string;
  artistName: string;
  service: ServiceType;
  date: string; // ISO date string
  time: string; // "HH:MM"
  duration: number; // dakika
  price: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export const ARTISTS: Artist[] = [
  { id: "a1", name: "Mert Kaya", specialty: "Blackwork, Geometric", color: "#C41E3A" },
  { id: "a2", name: "Selin Arslan", specialty: "Fine-line, Botanik", color: "#7c3aed" },
  { id: "a3", name: "Elif Çelik", specialty: "Realism, Portrait", color: "#0ea5e9" },
];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  done: "Tamamlandı",
  cancelled: "İptal",
};

const today = new Date().toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: "r1", customerId: "c1", customerName: "Ahmet Yılmaz", customerPhone: "0532 111 22 33", artistId: "a1", artistName: "Mert Kaya", service: "Dövme", date: today, time: "10:00", duration: 120, price: 1500, status: "confirmed", notes: "Blackwork sleeve, sol kol", createdAt: today },
  { id: "r2", customerId: "c2", customerName: "Zeynep Demir", customerPhone: "0542 222 33 44", artistId: "a2", artistName: "Selin Arslan", service: "Fine-line, Botanik" as ServiceType, date: today, time: "13:00", duration: 90, price: 900, status: "pending", notes: "Bilek, gül motifi", createdAt: today },
  { id: "r3", customerId: "c3", customerName: "Kerem Şahin", customerPhone: "0555 333 44 55", artistId: "a3", artistName: "Elif Çelik", service: "Realism, Portrait" as ServiceType, date: today, time: "15:30", duration: 180, price: 2800, status: "confirmed", notes: "Portre, sağ omuz", createdAt: today },
  { id: "r4", customerId: "c4", customerName: "Ayşe Koca", customerPhone: "0533 444 55 66", artistId: "a1", artistName: "Mert Kaya", service: "Piercing", date: today, time: "11:00", duration: 30, price: 350, status: "done", createdAt: today },
  { id: "r5", customerId: "c5", customerName: "Burak Erdoğan", customerPhone: "0544 555 66 77", artistId: "a2", artistName: "Selin Arslan", service: "Dövme", date: tomorrow, time: "11:00", duration: 150, price: 1800, status: "pending", notes: "Geometrik, göğüs", createdAt: today },
  { id: "r6", customerId: "c6", customerName: "Melis Çetin", customerPhone: "0561 666 77 88", artistId: "a3", artistName: "Elif Çelik", service: "Kapak", date: tomorrow, time: "14:00", duration: 240, price: 3500, status: "confirmed", notes: "Kapak dövme, eski yazı üstü", createdAt: today },
  { id: "r7", customerId: "c7", customerName: "Tolga Aydın", customerPhone: "0535 777 88 99", artistId: "a1", artistName: "Mert Kaya", service: "Dövme", date: yesterday, time: "10:00", duration: 120, price: 1400, status: "done", createdAt: yesterday },
  { id: "r8", customerId: "c8", customerName: "Derya Polat", customerPhone: "0546 888 99 00", artistId: "a2", artistName: "Selin Arslan", service: "Dövme", date: yesterday, time: "16:00", duration: 60, price: 700, status: "cancelled", notes: "Müşteri iptal etti", createdAt: yesterday },
];
