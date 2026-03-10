import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAvailability, bookAppointment, MOCK_LEADS } from "../api/apiClient";

export default function ConfirmationPage() {
  const { leadId } = useParams();
  const navigate   = useNavigate();
  const [slots, setSlots]           = useState([]);
  const [selected, setSelected]     = useState(null);
  const [confirmed, setConfirmed]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [loadingSlots, setLS]       = useState(true);

  const lead = MOCK_LEADS.find(l => l.lead_id === leadId) || { name:"Patient", service:"Cardiology", lead_id: leadId };

  useEffect(() => {
    fetchAvailability(lead.service).then(s => { setSlots(s); setLS(false); });
  }, [lead.service]);

  const confirm = async () => {
    if (!selected) return;
    setLoading(true);
    const result = await bookAppointment(leadId, selected.slot_id);
    setConfirmed(result);
    setLoading(false);
  };

  if (confirmed) return (
    <div className="conf-wrap fade-in">
      <div className="conf-card">
        <div className="conf-check">✓</div>
        <h2 className="conf-title">Appointment Confirmed!</h2>
        <p className="conf-sub">Booking ID: <span className="conf-id">{confirmed.confirmation_id}</span></p>

        <div className="conf-details">
          {[
            ["👨‍⚕️ Doctor",    confirmed.doctor],
            ["🏥 Specialty",  confirmed.specialty || lead.service],
            ["📅 Date",       confirmed.date],
            ["🕐 Time",       confirmed.time],
          ].map(([k,v]) => (
            <div key={k} className="conf-row">
              <span className="conf-key">{k}</span>
              <span className="conf-val">{v}</span>
            </div>
          ))}
        </div>

        <div className="conf-instructions">
          <div className="conf-instructions-title">📋 Preparation Instructions</div>
          <p>{confirmed.instructions}</p>
        </div>

        <div className="conf-actions">
          <button className="conf-print-btn" onClick={() => window.print()}>🖨 Print / Download</button>
          <button className="conf-back-btn" onClick={() => navigate("/")}>← Back to Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="conf-wrap fade-in">
      <div className="conf-card">
        <button className="back-link" onClick={() => navigate("/")}>← Dashboard</button>
        <h2 className="conf-title" style={{ marginTop:16 }}>Book Appointment</h2>
        <p className="conf-sub">Patient: <strong>{lead.name}</strong> · Service: <strong>{lead.service}</strong></p>

        {loadingSlots ? (
          <div style={{ textAlign:"center", padding:40 }}><div className="spinner" /></div>
        ) : (
          <>
            <p className="slots-label">Select an available slot:</p>
            <div className="slots-grid">
              {slots.map(slot => (
                <div key={slot.slot_id}
                  className={`slot-card ${selected?.slot_id === slot.slot_id ? "slot-selected" : ""}`}
                  onClick={() => setSelected(slot)}>
                  <div className="slot-doctor">{slot.doctor}</div>
                  <div className="slot-date">{slot.date}</div>
                  <div className="slot-time">{slot.time}</div>
                  {selected?.slot_id === slot.slot_id && <div className="slot-check">✓</div>}
                </div>
              ))}
            </div>

            <button className="book-btn" disabled={!selected || loading} onClick={confirm}
              style={{ width:"100%", marginTop:24 }}>
              {loading ? "Booking…" : "✓ Confirm Appointment"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
