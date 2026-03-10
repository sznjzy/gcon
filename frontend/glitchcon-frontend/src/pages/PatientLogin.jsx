import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function PatientLogin() {
  const navigate = useNavigate();
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim())                   { setError("Please enter your name."); return; }
    if (!/^\d{10}$/.test(phone.trim())) { setError("Please enter a valid 10-digit phone number."); return; }

    setLoading(true);
    setError("");

    try {
      const res  = await fetch(`${BASE}/api/patient/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();

      if (data.status === "success") {
        // Store patient session
        sessionStorage.setItem("patient_name",  data.data.name);
        sessionStorage.setItem("patient_phone", data.data.phone);
        sessionStorage.setItem("patient_id",    data.data.patient_id);
        navigate("/patient/dashboard");
      } else {
        setError(data.message || "Name and phone number do not match our records.");
      }
    } catch {
      // Fallback: if backend is offline, check against hardcoded list
      const PATIENTS = [
        { patient_id: "P001", name: "Ravi Kumar",   phone: "9876543210" },
        { patient_id: "P002", name: "Sneha Iyer",   phone: "9845001234" },
        { patient_id: "P003", name: "Arjun Mehta",  phone: "9901122334" },
        { patient_id: "P004", name: "Priya Nair",   phone: "9988776655" },
        { patient_id: "P005", name: "Kiran Das",    phone: "9123456789" },
      ];
      const match = PATIENTS.find(
        p => p.name.toLowerCase() === name.trim().toLowerCase() &&
             p.phone === phone.trim()
      );
      if (match) {
        sessionStorage.setItem("patient_name",  match.name);
        sessionStorage.setItem("patient_phone", match.phone);
        sessionStorage.setItem("patient_id",    match.patient_id);
        navigate("/patient/dashboard");
      } else {
        setError("Name and phone number do not match our records.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="patient-login-wrap fade-in">
      <div className="patient-login-card">
        <div className="pl-logo">🏥</div>
        <h2 className="pl-login-title">Kathir Memorial Hospital</h2>
        <p className="pl-login-sub">Sign in to view your appointments</p>

        <div className="pl-field">
          <label className="pl-label">Full Name</label>
          <input
            className="pl-input"
            placeholder="e.g. Ravi Kumar"
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className="pl-field">
          <label className="pl-label">Phone Number</label>
          <input
            className="pl-input"
            placeholder="10-digit mobile number"
            value={phone}
            maxLength={10}
            onChange={e => { setPhone(e.target.value.replace(/\D/, "")); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {error && <div className="pl-error">⚠ {error}</div>}

        <button
          className="pl-login-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Verifying…" : "View My Appointments →"}
        </button>

        {/* Demo hint */}
        <div className="pl-demo-hint">
          <div className="pl-demo-title">Demo Accounts</div>
          {[
            ["Ravi Kumar",  "9876543210"],
            ["Sneha Iyer",  "9845001234"],
            ["Arjun Mehta", "9901122334"],
            ["Priya Nair",  "9988776655"],
            ["Kiran Das",   "9123456789"],
          ].map(([n, p]) => (
            <div
              key={p}
              className="pl-demo-row"
              onClick={() => { setName(n); setPhone(p); setError(""); }}
            >
              <span className="pl-demo-name">{n}</span>
              <span className="pl-demo-phone">{p}</span>
            </div>
          ))}
        </div>

        <p className="pl-login-note">
          Click any demo account above to auto-fill.
        </p>
      </div>
    </div>
  );
}
