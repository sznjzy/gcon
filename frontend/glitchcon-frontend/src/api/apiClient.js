import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";
const api = axios.create({ baseURL: BASE, timeout: 10000 });

// ── MOCK DATA ────────────────────────────────────────────────────
export const MOCK_LEADS = [
  { lead_id: "L001", name: "Ravi Kumar", contact: "9876543210", service: "Cardiology", channel: "web", score: "Hot", status: "Converted", created_at: "2025-03-09T08:10:00Z" },
  { lead_id: "L002", name: "Sneha Iyer", contact: "9845001234", service: "Diagnostics", channel: "whatsapp", score: "Warm", status: "Qualified", created_at: "2025-03-09T09:15:00Z" },
  { lead_id: "L003", name: "Arjun Mehta", contact: "9901122334", service: "Orthopedics", channel: "web", score: "Cold", status: "Captured", created_at: "2025-03-09T10:00:00Z" },
  { lead_id: "L004", name: "Priya Nair", contact: "9988776655", service: "Neurology", channel: "whatsapp", score: "Hot", status: "Converted", created_at: "2025-03-09T10:30:00Z" },
  { lead_id: "L005", name: "Kiran Das", contact: "9123456789", service: "General Medicine", channel: "web", score: "Warm", status: "Qualified", created_at: "2025-03-09T11:00:00Z" },
  { lead_id: "L006", name: "Unknown", contact: null, service: "Cardiology", channel: "web", score: "Hot", status: "Converted", created_at: "2025-03-09T11:20:00Z" },
  { lead_id: "L007", name: "Divya Sharma", contact: "9765432100", service: "Pediatrics", channel: "whatsapp", score: "Cold", status: "Lost", created_at: "2025-03-09T12:00:00Z" },
  { lead_id: "L008", name: "Manoj Pillai", contact: "9654321098", service: "Oncology", channel: "web", score: "Warm", status: "Qualified", created_at: "2025-03-09T12:45:00Z" },
  { lead_id: "L009", name: "Asha Thomas", contact: "9543210987", service: "Diagnostics", channel: "whatsapp", score: "Hot", status: "Converted", created_at: "2025-03-09T13:30:00Z" },
  { lead_id: "L010", name: "Rohit Verma", contact: "9432109876", service: "Orthopedics", channel: "web", score: "Cold", status: "Lost", created_at: "2025-03-09T14:00:00Z" },
];

export const MOCK_ANALYTICS = {
  total_leads: 10, converted: 4, lost: 2, conversion_rate: 40.0,
  by_channel: { web: 60, whatsapp: 40 },
  by_service: { Cardiology: 30, Diagnostics: 20, Orthopedics: 20, Neurology: 10, "General Medicine": 10, Pediatrics: 5, Oncology: 5 },
};

export const MOCK_SLOTS = [
  { slot_id: "S001", doctor: "Dr. Priya Menon", specialty: "Cardiology", date: "2026-03-20", time: "10:00 AM" },
  { slot_id: "S002", doctor: "Dr. Arjun Rao", specialty: "Cardiology", date: "2026-03-21", time: "02:00 PM" },
  { slot_id: "S003", doctor: "Dr. Meena Krishnan", specialty: "Orthopedics", date: "2026-03-20", time: "11:30 AM" },
  { slot_id: "S004", doctor: "Dr. Suresh Iyer", specialty: "Diagnostics", date: "2026-03-22", time: "09:00 AM" },
  { slot_id: "S005", doctor: "Dr. Ananya Seth", specialty: "Neurology", date: "2026-03-23", time: "03:00 PM" },
  { slot_id: "S006", doctor: "Dr. Ramesh Pillai", specialty: "General Medicine", date: "2026-03-20", time: "08:30 AM" },
  { slot_id: "S007", doctor: "Dr. Kavya Nair", specialty: "Pediatrics", date: "2026-03-21", time: "10:00 AM" },
  { slot_id: "S008", doctor: "Dr. Vikram Shah", specialty: "Oncology", date: "2026-03-24", time: "01:00 PM" },
];

// ── LOCAL STORAGE — per-patient appointments ─────────────────────
// Key: "appts_<phone>"  Value: JSON array of appointment objects

export function getLocalAppointments(phone) {
  if (!phone) return [];
  try {
    return JSON.parse(localStorage.getItem(`appts_${phone}`) || "[]");
  } catch { return []; }
}

export function saveLocalAppointment(phone, appt) {
  if (!phone) return;
  const existing = getLocalAppointments(phone);
  // Avoid duplicates by appointment_id
  const filtered = existing.filter(a => a.appointment_id !== appt.appointment_id);
  localStorage.setItem(`appts_${phone}`, JSON.stringify([appt, ...filtered]));
}

// ── SESSION HELPERS ──────────────────────────────────────────────
export function getPatientSession() {
  return {
    name: sessionStorage.getItem("patient_name"),
    phone: sessionStorage.getItem("patient_phone"),
  };
}

export function setPatientSession(name, phone) {
  sessionStorage.setItem("patient_name", name);
  sessionStorage.setItem("patient_phone", phone);
}

export function clearPatientSession() {
  sessionStorage.removeItem("patient_name");
  sessionStorage.removeItem("patient_phone");
}

export function getHospitalSession() {
  return sessionStorage.getItem("hospital_auth") === "true";
}

export function setHospitalSession() {
  sessionStorage.setItem("hospital_auth", "true");
}

export function clearHospitalSession() {
  sessionStorage.removeItem("hospital_auth");
}

// ── API CALLS ────────────────────────────────────────────────────
export async function fetchLeads() {
  try {
    const res = await api.get("/api/leads");
    const leads = res.data?.data?.leads ?? res.data?.leads ?? res.data;
    return Array.isArray(leads) ? leads : MOCK_LEADS;
  } catch { return MOCK_LEADS; }
}

export async function fetchAnalytics() {
  try {
    const res = await api.get("/api/analytics");
    const raw = res.data?.data ?? res.data ?? {};

    // Normalise field names — handles whatever the backend returns
    return {
      total_leads: raw.total_leads ?? raw.total ?? raw.count ?? MOCK_ANALYTICS.total_leads,
      converted: raw.converted ?? raw.total_converted ?? raw.conversions ?? MOCK_ANALYTICS.converted,
      lost: raw.lost ?? raw.total_lost ?? MOCK_ANALYTICS.lost,
      conversion_rate: raw.conversion_rate ?? raw.rate ?? raw.conv_rate ?? MOCK_ANALYTICS.conversion_rate,
      by_channel: raw.by_channel ?? raw.channels ?? MOCK_ANALYTICS.by_channel,
      by_service: raw.by_service ?? raw.services ?? MOCK_ANALYTICS.by_service,
    };
  } catch { return MOCK_ANALYTICS; }
}

export async function sendChatMessage(lead_id, message, channel = "web", stage = "greeting") {
  const res = await api.post("/api/chat", { lead_id, message, channel, stage });
  return res.data.data;
}

export async function fetchModelRecord(lead_id) {
  try {
    const res = await api.get(`/api/model_records/${lead_id}`);
    return res.data?.data?.record || null;
  } catch {
    return null;
  }
}

export async function captureLead(payload) {
  try {
    const res = await api.post("/api/leads/capture", payload);
    return res.data.data;
  } catch { return { lead_id: "L" + String(Math.floor(Math.random() * 900) + 100) }; }
}

export async function fetchAvailability(specialty, date) {
  try {
    let url = `/api/appointments/availability?specialty=${specialty}`;
    if (date) url += `&date=${date}`;
    const res = await api.get(url);
    return res.data?.data?.slots || [];
  } catch { return MOCK_SLOTS.filter(s => !specialty || s.specialty === specialty); }
}

export async function fetchPatientAppointments(phone) {
  // Always merge backend + localStorage so bookings made via chat are always shown
  const local = getLocalAppointments(phone);
  try {
    const res = await api.get(`/api/patient/appointments?contact=${phone}`);
    const remote = res.data.data.appointments || [];
    // Merge: remote first, then any local-only ones not in remote
    const remoteIds = new Set(remote.map(a => a.appointment_id));
    const localOnly = local.filter(a => !remoteIds.has(a.appointment_id));
    return [...remote, ...localOnly];
  } catch {
    return local;
  }
}

export async function bookAppointment(lead_id, slot_id, patientPhone, patientName) {
  const slot = MOCK_SLOTS.find(s => s.slot_id === slot_id) || MOCK_SLOTS[0];
  let appt = {
    appointment_id: `CONF-${lead_id}-${slot_id}`,
    confirmation_id: `CONF-${lead_id}-${slot_id}`,
    lead_id,
    contact: patientPhone || null,
    name: patientName || "Unknown",
    doctor: slot.doctor,
    specialty: slot.specialty,
    service: slot.specialty,
    date: slot.date,
    time: slot.time,
    instructions: "Please bring previous reports and arrive 15 minutes early. Fast for 4 hours if bloodwork is needed.",
    status: "upcoming",
    booked_at: new Date().toISOString(),
  };

  // Step 1: Try main booking endpoint
  try {
    const res = await api.post("/api/appointment/book", { lead_id, slot_id });
    appt = { ...appt, ...res.data.data };
  } catch { /* backend offline, use mock */ }

  // Step 2: Save to patient_appointments so BOTH dashboards show it
  try {
    await api.post("/api/patient/appointments/save", {
      ...appt,
      contact: patientPhone || null,
      name: patientName || "Unknown",
    });
  } catch {
    console.warn("Could not save to backend — backend may be offline.");
  }

  return appt;
}

// Fetch ALL booked appointments (for hospital dashboard)
export async function fetchAllAppointments() {
  try {
    const res = await api.get("/api/patient/appointments/all");
    return res.data.data.appointments || [];
  } catch {
    // Fallback mock
    return [
      { appointment_id: "CONF-L001-S001", name: "Ravi Kumar", contact: "9876543210", doctor: "Dr. Priya Menon", service: "Cardiology", date: "2026-03-20", time: "10:00 AM", status: "upcoming" },
      { appointment_id: "CONF-L004-S005", name: "Priya Nair", contact: "9988776655", doctor: "Dr. Ananya Seth", service: "Neurology", date: "2026-03-23", time: "03:00 PM", status: "upcoming" },
      { appointment_id: "CONF-L009-S004", name: "Asha Thomas", contact: "9543210987", doctor: "Dr. Suresh Iyer", service: "Diagnostics", date: "2026-03-22", time: "09:00 AM", status: "upcoming" },
    ];
  }
}
