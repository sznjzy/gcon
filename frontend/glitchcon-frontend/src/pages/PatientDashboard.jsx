import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPatientAppointments, getPatientSession } from "../api/apiClient";

function CalendarView({ appointments }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear,  setViewYear]  = useState(today.getFullYear());

  const monthNames = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const apptDates   = appointments.filter(a => a.status === "upcoming").map(a => a.date);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="pd-calendar">
      <div className="pd-cal-header">
        <button className="pd-cal-nav" onClick={() => { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); }}>‹</button>
        <span className="pd-cal-month">{monthNames[viewMonth]} {viewYear}</span>
        <button className="pd-cal-nav" onClick={() => { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); }}>›</button>
      </div>
      <div className="pd-cal-grid">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="pd-cal-day-label">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="pd-cal-cell empty" />;
          const dateStr  = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const hasAppt  = apptDates.includes(dateStr);
          const isToday  = day===today.getDate() && viewMonth===today.getMonth() && viewYear===today.getFullYear();
          return (
            <div key={day} className={`pd-cal-cell ${isToday?"today":""} ${hasAppt?"has-appt":""}`}>
              {day}
              {hasAppt && <div className="pd-cal-dot" />}
            </div>
          );
        })}
      </div>
      <div className="pd-cal-legend"><span className="pd-cal-dot" /> Appointment scheduled</div>
    </div>
  );
}

function AppointmentCard({ appt }) {
  const isUpcoming = appt.status === "upcoming";
  const dateObj    = new Date(appt.date + "T00:00:00");
  const formatted  = dateObj.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"long", year:"numeric" });

  return (
    <div className={`pd-appt-card ${isUpcoming ? "upcoming" : "completed"}`}>
      <div className="pd-appt-top">
        <div className="pd-appt-service">{appt.service || appt.specialty}</div>
        <div className={`pd-appt-badge ${isUpcoming ? "badge-upcoming" : "badge-done"}`}>
          {isUpcoming ? "⏰ Upcoming" : "✅ Completed"}
        </div>
      </div>
      <div className="pd-appt-doctor">👨‍⚕️ {appt.doctor || "Doctor TBC"}</div>
      <div className="pd-appt-datetime">📅 {formatted} &nbsp;·&nbsp; 🕐 {appt.time}</div>
      {appt.instructions && (
        <div className="pd-appt-instructions">
          <span className="pd-instr-label">Instructions: </span>{appt.instructions}
        </div>
      )}
      <div className="pd-appt-id">Ref: {appt.appointment_id || appt.confirmation_id}</div>
    </div>
  );
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { name, phone } = getPatientSession();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState("upcoming");

  const load = () => {
    if (!name || !phone) { navigate("/patient/login"); return; }
    fetchPatientAppointments(phone).then(data => {
      setAppointments(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  // Poll every 15s so booking via chat appears live
  useEffect(() => {
    const interval = setInterval(() => {
      if (phone) fetchPatientAppointments(phone).then(data => setAppointments(data || []));
    }, 15000);
    return () => clearInterval(interval);
  }, [phone]);

  const upcoming  = appointments.filter(a => a.status === "upcoming");
  const completed = appointments.filter(a => a.status === "completed" || a.status === "Converted");

  return (
    <div className="patient-dashboard fade-in">

      <div className="pd-header">
        <div>
          <h2 className="pd-title">Welcome, {name} 👋</h2>
          <p className="pd-sub">📱 {phone} · Your appointment overview</p>
        </div>
        <button className="pd-refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      <div className="pd-stats">
        <div className="pd-stat-card">
          <div className="pd-stat-num">{appointments.length}</div>
          <div className="pd-stat-label">Total</div>
        </div>
        <div className="pd-stat-card accent-green">
          <div className="pd-stat-num">{upcoming.length}</div>
          <div className="pd-stat-label">Upcoming</div>
        </div>
        <div className="pd-stat-card accent-muted">
          <div className="pd-stat-num">{completed.length}</div>
          <div className="pd-stat-label">Completed</div>
        </div>
      </div>

      <div className="pd-body">
        <div className="pd-left">
          <div className="pd-section-title">📅 Calendar</div>
          <CalendarView appointments={appointments} />
          <div className="pd-book-cta">
            <p>Need a new appointment?</p>
            <p className="pd-book-hint">Use the chat widget ↘ — our AI agent books it instantly.</p>
          </div>
        </div>

        <div className="pd-right">
          <div className="pd-tabs">
            <button className={`pd-tab ${tab==="upcoming"?"active":""}`} onClick={() => setTab("upcoming")}>
              Upcoming ({upcoming.length})
            </button>
            <button className={`pd-tab ${tab==="completed"?"active":""}`} onClick={() => setTab("completed")}>
              Past ({completed.length})
            </button>
          </div>

          {loading ? (
            <div className="pd-loading">Loading appointments…</div>
          ) : tab === "upcoming" ? (
            upcoming.length === 0 ? (
              <div className="pd-empty">
                <div className="pd-empty-icon">📭</div>
                <div>No upcoming appointments.</div>
                <div className="pd-empty-hint">Chat with our AI agent to book one!</div>
              </div>
            ) : upcoming.map(a => <AppointmentCard key={a.appointment_id||a.confirmation_id} appt={a} />)
          ) : (
            completed.length === 0 ? (
              <div className="pd-empty">
                <div className="pd-empty-icon">📋</div>
                <div>No past appointments found.</div>
              </div>
            ) : completed.map(a => <AppointmentCard key={a.appointment_id||a.confirmation_id} appt={a} />)
          )}
        </div>
      </div>
    </div>
  );
}