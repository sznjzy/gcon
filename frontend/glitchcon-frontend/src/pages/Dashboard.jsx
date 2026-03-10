import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLeads, fetchAnalytics, fetchAllAppointments, fetchModelRecord } from "../api/apiClient";

const SCORE_CFG = {
  Hot: { glow: "#FDA4AF", dim: "rgba(253,164,175,0.1)", label: "🔴 Hot" },
  Warm: { glow: "#FCD34D", dim: "rgba(252,211,77,0.1)", label: "🟡 Warm" },
  Cold: { glow: "#93C5FD", dim: "rgba(147,197,253,0.1)", label: "🔵 Cold" },
  Unscored: { glow: "#94A3B8", dim: "rgba(148,163,184,0.1)", label: "⚪ —" },
};

const STATUS_CFG = {
  Converted: { color: "#86EFAC", bg: "rgba(134,239,172,0.1)" },
  Qualified: { color: "#FCD34D", bg: "rgba(252,211,77,0.1)" },
  Captured: { color: "#93C5FD", bg: "rgba(147,197,253,0.1)" },
  Lost: { color: "#FDA4AF", bg: "rgba(253,164,175,0.1)" },
};

function StatCard({ label, value, color, sub, delay }) {
  return (
    <div className="stat-card" style={{ "--glow": color, animationDelay: delay }}>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      <div className="stat-glow" style={{ background: color }} />
    </div>
  );
}

function MiniBar({ label, pct, color }) {
  return (
    <div className="mini-bar-row">
      <span className="mini-bar-label">{label}</span>
      <div className="mini-bar-track">
        <div className="mini-bar-fill" style={{ width: pct + "%", background: color }} />
      </div>
      <span className="mini-bar-pct">{pct}%</span>
    </div>
  );
}

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoreFilter, setScore] = useState("All");
  const [chanFilter, setChan] = useState("All");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const [l, a, appts] = await Promise.all([fetchLeads(), fetchAnalytics(), fetchAllAppointments()]);
    setLeads(Array.isArray(l) ? l : []);
    setAnalytics(a ?? null);
    setAppointments(Array.isArray(appts) ? appts : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selected) {
      setSelectedRecord(null);
      fetchModelRecord(selected).then(res => {
        if (res) setSelectedRecord(res);
      });
    }
  }, [selected]);


  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = leads
    .filter(l => scoreFilter === "All" || l.score === scoreFilter)
    .filter(l => chanFilter === "All" || l.channel === chanFilter)
    .filter(l => {
      const q = search.toLowerCase();
      return !q || l.name.toLowerCase().includes(q) || l.service.toLowerCase().includes(q) || l.lead_id.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let va = a[sortCol] ?? "", vb = b[sortCol] ?? "";
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const fmt = iso => iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—";
  const SortIcon = ({ col }) => sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header fade-in">
        <div>
          <h1 className="dash-title">Lead Pipeline</h1>
          <p className="dash-sub">Real-time overview · {leads.length} total leads</p>
        </div>
        <button className="refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      {/* Stat cards */}
      {analytics && (
        <div className="stat-grid fade-in-delay">
          <StatCard label="Total Leads" value={analytics.total_leads} color="#A5B4FC" sub="all channels" delay="0s" />
          <StatCard label="Converted" value={analytics.converted} color="#86EFAC" sub="appointments booked" delay="0.05s" />
          <StatCard label="Lost" value={analytics.lost} color="#FDA4AF" sub="no response" delay="0.1s" />
          <StatCard label="Conversion Rate" value={analytics.conversion_rate + "%"} color="#FCD34D" sub="this period" delay="0.15s" />
          <StatCard label="🌐 Web" value={(analytics.by_channel?.web || 0) + "%"} color="#C4B5FD" sub="of all leads" delay="0.2s" />
          <StatCard label="📱 WhatsApp" value={(analytics.by_channel?.whatsapp || 0) + "%"} color="#6EE7B7" sub="of all leads" delay="0.25s" />
        </div>
      )}

      {/* Charts row */}
      {analytics && (
        <div className="charts-row fade-in-delay2">
          <div className="chart-card">
            <div className="chart-title">Leads by Service</div>
            {Object.entries(analytics.by_service || {}).map(([svc, pct]) => (
              <MiniBar key={svc} label={svc} pct={pct} color="#A5B4FC" />
            ))}
          </div>
          <div className="chart-card">
            <div className="chart-title">Score Breakdown</div>
            {["Hot", "Warm", "Cold"].map(s => {
              const count = leads.filter(l => l.score === s).length;
              const pct = leads.length ? Math.round(count / leads.length * 100) : 0;
              return <MiniBar key={s} label={s} pct={pct} color={SCORE_CFG[s].glow} />;
            })}
          </div>
          <div className="chart-card">
            <div className="chart-title">Status Funnel</div>
            {["Captured", "Qualified", "Converted", "Lost"].map(s => {
              const count = leads.filter(l => l.status === s).length;
              const pct = leads.length ? Math.round(count / leads.length * 100) : 0;
              return <MiniBar key={s} label={s} pct={pct} color={STATUS_CFG[s].color} />;
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar fade-in-delay2">
        <input className="search-input" placeholder="🔍  Search name, service, ID…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="filter-group">
          {["All", "Hot", "Warm", "Cold"].map(f => (
            <button key={f} className={`filter-pill ${scoreFilter === f ? "active" : ""}`} onClick={() => setScore(f)}
              style={scoreFilter === f && f !== "All" ? { borderColor: SCORE_CFG[f]?.glow, color: SCORE_CFG[f]?.glow } : {}}>
              {f}
            </button>
          ))}
        </div>
        <div className="filter-group">
          {["All", "web", "whatsapp", "telegram"].map(c => (
            <button key={c} className={`filter-pill ${chanFilter === c ? "active" : ""}`} onClick={() => setChan(c)}>
              {c === "web" ? "🌐" : c === "whatsapp" ? "📱" : c === "telegram" ? "✈️" : "◎"} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap fade-in-delay2">
        {loading ? (
          <div className="table-empty">
            <div className="spinner" /><p>Loading leads…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-empty"><p>No leads match your filters.</p></div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                {[["lead_id", "ID"], ["name", "Name"], ["contact", "Contact"], ["service", "Service"], ["channel", "Channel"], ["score", "Score"], ["status", "Status"], ["created_at", "Date"]].map(([col, label]) => (
                  <th key={col} onClick={() => toggleSort(col)} className="th-sortable">
                    {label}<SortIcon col={col} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const sc = SCORE_CFG[lead.score] || SCORE_CFG.Unscored;
                const st = STATUS_CFG[lead.status] || {};
                const isSelected = selected === lead.lead_id;
                return (
                  <tr key={lead.lead_id} className={`tr ${isSelected ? "tr-selected" : ""}`}
                    onClick={() => setSelected(isSelected ? null : lead.lead_id)}>
                    <td><span className="id-badge">{lead.lead_id}</span></td>
                    <td><span className="name-cell">{lead.name}</span></td>
                    <td className="dim">{lead.contact || "—"}</td>
                    <td>{lead.service}</td>
                    <td>
                      <span className={`chan-badge ${lead.channel || "web"}`}>
                        {lead.channel === "whatsapp" ? "📱 WhatsApp" : lead.channel === "telegram" ? "✈️ Telegram" : "🌐 Web"}
                      </span>
                    </td>
                    <td>
                      <span className="score-badge" style={{ color: sc.glow, background: sc.dim, border: `1px solid ${sc.glow}44` }}>
                        {sc.label}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ color: st.color, background: st.bg }}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="dim date-cell">{fmt(lead.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Expanded lead detail */}
      {selected && (() => {
        const lead = leads.find(l => l.lead_id === selected);
        if (!lead) return null;
        const sc = SCORE_CFG[lead.score] || SCORE_CFG.Unscored;
        return (
          <div className="lead-detail fade-in">
            <div className="detail-header">
              <div>
                <span className="id-badge">{lead.lead_id}</span>
                <strong style={{ marginLeft: 10 }}>{lead.name}</strong>
              </div>
              <button className="close-detail" onClick={() => setSelected(null)}>✕ Close</button>
            </div>
            <div className="detail-grid">
              {[["Service", lead.service], ["Contact", lead.contact || "—"], ["Channel", lead.channel], ["Score", sc.label], ["Status", lead.status], ["Captured", new Date(lead.created_at).toLocaleString("en-IN")]].map(([k, v]) => (
                <div key={k} className="detail-item">
                  <span className="detail-key">{k}</span>
                  <span className="detail-val">{v}</span>
                </div>
              ))}
            </div>

            {selectedRecord && selectedRecord.answers && (
              <div className="detail-qa-section" style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>AI Qualification Q&A</h3>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {Object.entries(selectedRecord.answers).map(([q, a]) => (
                    <div key={q} style={{ background: "rgba(255,255,255,0.05)", padding: "0.5rem", borderRadius: "4px" }}>
                      <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginBottom: "0.2rem", textTransform: "capitalize" }}>{q.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: "0.9rem" }}>{a}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lead.score === "Hot" && lead.status !== "Converted" && (
              <button className="book-btn" onClick={() => navigate(`/confirmation/${lead.lead_id}`)} style={{ marginTop: "1rem" }}>
                📅 Book Appointment →
              </button>
            )}
          </div>
        );
      })()}

      {/* Booked Appointments Panel */}
      <div className="fade-in-delay2" style={{ marginTop: "2rem" }}>
        <div className="dash-header" style={{ marginBottom: "1rem" }}>
          <div>
            <h2 className="dash-title" style={{ fontSize: "1.2rem" }}>Booked Appointments</h2>
            <p className="dash-sub">All confirmed patient appointments</p>
          </div>
        </div>
        <div className="table-wrap">
          {appointments.length === 0 ? (
            <div className="table-empty"><p>No appointments booked yet.</p></div>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Doctor</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt.appointment_id} className="tr">
                    <td><span className="id-badge">{appt.appointment_id}</span></td>
                    <td><span className="name-cell">{appt.name || "—"}</span></td>
                    <td className="dim">{appt.contact || "—"}</td>
                    <td>{appt.doctor || "—"}</td>
                    <td>{appt.service || appt.specialty || "—"}</td>
                    <td className="dim">{appt.date || "—"}</td>
                    <td className="dim">{appt.time || "—"}</td>
                    <td>
                      <span className="status-badge" style={{
                        color: appt.status === "upcoming" ? "#86EFAC" : "#8A90B8",
                        background: appt.status === "upcoming" ? "rgba(134,239,172,0.1)" : "rgba(138,144,184,0.1)"
                      }}>
                        {appt.status || "upcoming"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="table-footer">Showing {filtered.length} of {leads.length} leads</div>
    </div>
  );
}
