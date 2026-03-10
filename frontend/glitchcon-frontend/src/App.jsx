import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import HomePage         from "./pages/HomePage";
import Dashboard        from "./pages/Dashboard";
import ConfirmationPage from "./pages/ConfirmationPage";
import ChatPreview      from "./pages/ChatPreview";
import PatientLanding   from "./pages/PatientLanding";
import PatientLogin     from "./pages/PatientLogin";
import PatientDashboard from "./pages/PatientDashboard";
import ChatWidget       from "./components/ChatWidget";
import { clearPatientSession, clearHospitalSession } from "./api/apiClient";
import "./index.css";

function Nav() {
  const location    = useLocation();
  const navigate    = useNavigate();
  const isHome      = location.pathname === "/";
  const isPatient   = location.pathname.startsWith("/patient");
  const isStaff     = !isHome && !isPatient;
  const patientName = sessionStorage.getItem("patient_name");

  function logoutPatient() {
    clearPatientSession();
    navigate("/");
  }

  function logoutHospital() {
    clearHospitalSession();
    navigate("/");
  }

  return (
    <nav className="nav">
      <div className="nav-brand" onClick={() => navigate("/")} style={{ cursor:"pointer" }}>
        <span className="nav-icon">⚕</span>
        <span>Kathir Memorial</span>
        <span className="nav-tag">GKM_13</span>
      </div>

      <div className="nav-links">
        {isPatient && (
          <>
            <NavLink to="/patient" end className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              🏥 Home
            </NavLink>
            <NavLink to="/patient/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              📅 My Appointments
            </NavLink>
          </>
        )}
        {isStaff && (
          <>
            <NavLink to="/dashboard" end className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <span>◈</span> Dashboard
            </NavLink>
            <NavLink to="/chat" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <span>◉</span> Chat Widget
            </NavLink>
          </>
        )}
      </div>

      <div className="nav-right">
        {isPatient && (
          <>
            {patientName && (
              <span className="nav-user-label">👤 {patientName}</span>
            )}
            <button className="nav-portal-btn nav-logout-btn" onClick={logoutPatient}>
              Sign Out
            </button>
          </>
        )}
        {isStaff && (
          <>
            <div className="status-dot" />
            <span className="status-text">System Online</span>
            <button className="nav-portal-btn nav-portal-ghost" onClick={() => navigate("/patient")}>
              Patient Portal →
            </button>
            <button className="nav-portal-btn nav-logout-btn" onClick={logoutHospital}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Nav />
        <main className="main">
          <Routes>
            <Route path="/"                     element={<HomePage />} />
            <Route path="/dashboard"            element={<Dashboard />} />
            <Route path="/chat"                 element={<ChatPreview />} />
            <Route path="/confirmation/:leadId" element={<ConfirmationPage />} />
            <Route path="/patient"              element={<PatientLanding />} />
            <Route path="/patient/login"        element={<PatientLogin />} />
            <Route path="/patient/dashboard"    element={<PatientDashboard />} />
          </Routes>
        </main>
        <ChatWidget />
      </div>
    </BrowserRouter>
  );
}
