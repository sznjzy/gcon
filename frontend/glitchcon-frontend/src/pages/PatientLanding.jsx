import { useNavigate } from "react-router-dom";

const SERVICES = [
  { icon:"🫀", name:"Cardiology",       desc:"Heart & cardiovascular care" },
  { icon:"🦴", name:"Orthopedics",      desc:"Bone, joint & muscle treatment" },
  { icon:"🧪", name:"Diagnostics",      desc:"Lab tests & imaging" },
  { icon:"🧠", name:"Neurology",        desc:"Brain & nervous system" },
  { icon:"👶", name:"Pediatrics",       desc:"Child & infant care" },
  { icon:"🩺", name:"General Medicine", desc:"Primary & preventive care" },
];

export default function PatientLanding() {
  const navigate = useNavigate();

  return (
    <div className="patient-landing fade-in">

      {/* Hero */}
      <div className="pl-hero">
        <div className="pl-hero-inner">
          <div className="pl-badge">🏥 Kathir Memorial Hospital</div>
          <h1 className="pl-title">Your Health,<br/>Our Priority</h1>
          <p className="pl-sub">
            Book appointments instantly, track your consultations, and chat with
            our AI assistant — all in one place.
          </p>
          <div className="pl-hero-btns">
            <button className="pl-btn-primary" onClick={() => navigate("/patient/login")}>
              View My Appointments →
            </button>
            <button className="pl-btn-secondary" onClick={() => navigate("/patient/login")}>
              Book a Consultation
            </button>
          </div>
        </div>
        <div className="pl-hero-stats">
          {[["24/7","AI Assistant"],["60s","Response Time"],["10+","Specialties"],["100%","Confidential"]].map(([val,label]) => (
            <div key={label} className="pl-stat">
              <div className="pl-stat-val">{val}</div>
              <div className="pl-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="pl-section">
        <h2 className="pl-section-title">Our Specialties</h2>
        <div className="pl-services-grid">
          {SERVICES.map(s => (
            <div key={s.name} className="pl-service-card" onClick={() => navigate("/patient/login")}>
              <div className="pl-service-icon">{s.icon}</div>
              <div className="pl-service-name">{s.name}</div>
              <div className="pl-service-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="pl-section">
        <h2 className="pl-section-title">How It Works</h2>
        <div className="pl-steps">
          {[
            ["01","Chat with AI","Tell our assistant your symptoms or the service you need"],
            ["02","Get Qualified","Answer a few quick questions to help us serve you better"],
            ["03","Book Instantly","High-priority cases get an appointment confirmed in seconds"],
            ["04","Track & Manage","View upcoming and past appointments in your personal dashboard"],
          ].map(([num, title, desc]) => (
            <div key={num} className="pl-step">
              <div className="pl-step-num">{num}</div>
              <div className="pl-step-title">{title}</div>
              <div className="pl-step-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="pl-cta">
        <h2 className="pl-cta-title">Ready to get started?</h2>
        <p className="pl-cta-sub">Use the chat widget below or sign in to view your appointments.</p>
        <button className="pl-btn-primary" onClick={() => navigate("/patient/login")}>
          Sign In →
        </button>
      </div>

    </div>
  );
}
