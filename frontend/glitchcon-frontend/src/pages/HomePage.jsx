import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage fade-in">
      <div className="hp-hero">
        <div className="hp-logo">⚕</div>
        <h1 className="hp-title">Kathir Memorial Hospital</h1>
        <p className="hp-sub">AI-Powered Lead Conversion & Appointment Booking</p>
        <div className="hp-tag">GKM_13 · MedFlow AI</div>
      </div>

      <div className="hp-cards">

        {/* Hospital Staff */}
        <div className="hp-card hp-card-staff" onClick={() => navigate("/dashboard")}>
          <div className="hp-card-icon">🏥</div>
          <div className="hp-card-label">Hospital Staff</div>
          <div className="hp-card-desc">
            Access the lead pipeline dashboard, view analytics, manage appointments, and monitor AI agent performance.
          </div>
          <div className="hp-card-features">
            <span>📊 Lead Dashboard</span>
            <span>📈 Analytics</span>
            <span>💬 Chat Monitor</span>
          </div>
          <div className="hp-card-btn">Enter Staff Portal →</div>
        </div>

        {/* Patient */}
        <div className="hp-card hp-card-patient" onClick={() => navigate("/patient")}>
          <div className="hp-card-icon">🧑‍⚕️</div>
          <div className="hp-card-label">Patient</div>
          <div className="hp-card-desc">
            Book appointments instantly via AI chat, view upcoming consultations, and track your appointment history.
          </div>
          <div className="hp-card-features">
            <span>💬 AI Chat</span>
            <span>📅 My Appointments</span>
            <span>🗓 Calendar</span>
          </div>
          <div className="hp-card-btn">Enter Patient Portal →</div>
        </div>

      </div>

      <div className="hp-footer">
        Powered by Claude AI · React · Flask · SQLite
      </div>
    </div>
  );
}
