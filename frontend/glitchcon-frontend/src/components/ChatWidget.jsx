import { useState, useEffect, useRef } from "react";
import { sendChatMessage, captureLead, fetchAvailability, bookAppointment } from "../api/apiClient";

function detectService(text) {
  const t = text.toLowerCase();
  // Cardiology — heart/chest first
  if (t.includes("heart") || t.includes("chest") || t.includes("cardio") || t.includes("palpitation") || t.includes("bp") || t.includes("blood pressure")) return "Cardiology";
  // Neurology — headache/brain before generic pain
  if (t.includes("headache") || t.includes("migraine") || t.includes("brain") || t.includes("neuro") || t.includes("seizure") || t.includes("memory") || t.includes("dizziness") || t.includes("stroke") || t.includes("vertigo") || t.includes("numbness")) return "Neurology";
  // Orthopedics
  if (t.includes("bone") || t.includes("joint") || t.includes("ortho") || t.includes("knee") || t.includes("fracture") || t.includes("spine") || t.includes("shoulder") || t.includes("hip") || t.includes("back pain") || t.includes("neck pain")) return "Orthopedics";
  // Diagnostics
  if (t.includes("test") || t.includes("lab") || t.includes("scan") || t.includes("diagnos") || t.includes("blood test") || t.includes("xray") || t.includes("mri") || t.includes("ultrasound") || t.includes("report")) return "Diagnostics";
  // Pediatrics
  if (t.includes("child") || t.includes("baby") || t.includes("infant") || t.includes("pediatr") || t.includes("kid") || t.includes("toddler")) return "Pediatrics";
  // Oncology
  if (t.includes("cancer") || t.includes("onco") || t.includes("tumor") || t.includes("chemo") || t.includes("biopsy")) return "Oncology";
  // General Medicine — everything else
  return "General Medicine";
}

export default function ChatWidget() {
  const patientName = sessionStorage.getItem("patient_name") || null;
  const patientPhone = sessionStorage.getItem("patient_phone") || null;

  const INIT = {
    id: 0, sender: "bot",
    text: patientName
      ? "👋 Welcome back, " + patientName + "!\n\nI can help you book a new consultation or answer any questions. What brings you here today?"
      : "👋 Hello! I'm the Kathir Memorial Hospital assistant.\n\nI can help you book a consultation, check available services, or answer any questions. What brings you here today?",
  };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INIT]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [leadId, setLeadId] = useState(null);
  const [stage, setStage] = useState("greeting");
  const [detectedService, setDetectedService] = useState('General Medicine');
  const [slots, setSlots] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);
  useEffect(() => { if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); } }, [open]);

  const addBot = (text) => {
    setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text }]);
    if (!open) setUnread(u => u + 1);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      // Step 1 — First message: capture lead then start chat
      if (!leadId) {
        const svc = detectService(text) || "Other";
        setDetectedService(svc);

        const captured = await captureLead({
          name: patientName || "Unknown",
          contact: patientPhone || null,
          channel: "web",
          service: svc,
        });

        const id = captured?.lead_id || ("L" + String(Math.floor(Math.random() * 900) + 100));
        setLeadId(id);

        // Send to backend with stage="greeting" so it triggers Q1
        try {
          const data = await sendChatMessage(id, text, "web", "greeting");
          if (data?.reply) {
            addBot(data.reply);
            if (data.stage) setStage(data.stage);
            // Sync service detected by Gemini on the backend
            if (data.service && data.service !== "Other") setDetectedService(data.service);
          } else {
            addBot("Could you tell me more about your symptoms or what brings you to us today?");
            setStage("0");
          }
        } catch {
          addBot("Could you tell me more about your symptoms or what brings you to us today?");
          setStage("0");
        }

        setLoading(false);
        return;
      }

      // Step 2 — Booking confirmation (handle YES/NO locally)
      if (stage === "booking") {
        if (/yes|confirm|ok|sure|book/i.test(text) && slots.length > 0) {
          try {
            const confirmed = await bookAppointment(leadId, slots[0].slot_id, patientPhone, patientName);
            setStage("done");
            addBot(
              "Appointment Confirmed!\n\n" +
              "Booking ID: " + (confirmed.confirmation_id || "CONF-" + leadId) + "\n" +
              "Doctor: " + (confirmed.doctor || slots[0].doctor) + "\n" +
              "Date: " + (confirmed.date || slots[0].date) + "\n" +
              "Time: " + (confirmed.time || slots[0].time) + "\n\n" +
              "Instructions: " + (confirmed.instructions || "Please bring previous reports and arrive 15 minutes early.") + "\n\n" +
              "Your appointment will appear in your Patient Dashboard shortly."
            );
          } catch {
            addBot("Your booking request has been received. We will confirm via phone shortly.");
            setStage("done");
          }
        } else {
          addBot("No problem! Would you like to pick a different time, or is there anything else I can help with?");
          setStage("0");
        }
        setLoading(false);
        return;
      }

      // Step 3 — All qualifying stages: send message with current stage to backend
      if (stage !== "done") {
        try {
          const data = await sendChatMessage(leadId, text, "web", stage);

          if (data?.reply) {
            addBot(data.reply);
          }

          // Update stage from backend
          const newStage = data?.stage !== undefined ? String(data.stage) : stage;
          setStage(newStage);

          // If backend says booking stage, fetch slots and prompt
          if (newStage === "booking") {
            const svc = detectedService || "General Medicine";
            // Parse preferred date from user message BEFORE fetching
            let preferred = null;
            const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
            const wordMatch = text.match(/\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s*(\d{4})?\b/i)
              || text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s*(\d{1,2})\s*(\d{4})?\b/i);
            if (isoMatch) {
              preferred = isoMatch[0];
            } else if (wordMatch) {
              const months = {
                jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
                january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
              };
              const isMonthFirst = isNaN(parseInt(wordMatch[1]));
              const day = isMonthFirst ? parseInt(wordMatch[2]) : parseInt(wordMatch[1]);
              const monStr = isMonthFirst ? wordMatch[1] : wordMatch[2];
              const yr = wordMatch[3] ? parseInt(wordMatch[3]) : new Date().getFullYear();
              const mon = months[monStr.toLowerCase().slice(0, 3)];
              preferred = new Date(yr, mon, day).toISOString().slice(0, 10);
            }
            const available = await fetchAvailability(svc, preferred);
            setSlots(available);
            if (available.length > 0) {
              // Pick best matching slot
              const match = preferred
                ? available.find(s => s.date === preferred) || available[0]
                : available[0];
              setSlots([match, ...available.filter(s => s !== match)]);
              addBot(
                "I recommend seeing our " + svc + " specialist.\n\n" +
                "Next available slot:\n" +
                "Doctor: " + match.doctor + "\n" +
                "Date: " + match.date + "\n" +
                "Time: " + match.time + "\n\n" +
                "Reply YES to confirm this booking."
              );
            } else {
              addBot("Our team will call you at " + (patientPhone || "your registered number") + " to confirm your slot.");
              setStage("done");
            }
          }

        } catch {
          addBot("Sorry, I am having trouble connecting. Please try again.");
        }

        setLoading(false);
        return;
      }

      // Step 4 — Done stage: general replies
      try {
        const data = await sendChatMessage(leadId, text, "web", "done");
        addBot(data?.reply || "Is there anything else I can help you with? You can view your appointment in the Patient Dashboard.");
      } catch {
        addBot("Is there anything else I can help you with?");
      }

    } catch {
      addBot("Sorry, I am having trouble connecting right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="chat-btn-wrap">
        {!open && <div className="pulse-ring" />}
        <button className="chat-fab" onClick={() => setOpen(o => !o)}>
          <span className="fab-icon">{open ? "x" : "chat"}</span>
        </button>
        {unread > 0 && !open && <div className="unread-badge">{unread}</div>}
      </div>

      {open && (
        <div className="chat-window">
          <div className="chat-head">
            <div className="chat-head-left">
              <div className="chat-avatar">KH</div>
              <div>
                <div className="chat-head-name">Kathir Memorial Hospital</div>
                <div className="chat-head-status">
                  <span className="online-dot" />Online · replies instantly
                </div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>x</button>
          </div>

          <div className="chat-msgs">
            {messages.map(msg => (
              <div key={msg.id} className={"msg-row " + msg.sender}>
                {msg.sender === "bot" && <div className="msg-avatar">KH</div>}
                <div className={"bubble " + msg.sender}>
                  {msg.text.split("\n").map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="msg-row bot">
                <div className="msg-avatar">KH</div>
                <div className="bubble bot typing">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message..."
              disabled={loading}
            />
            <button className="chat-send" onClick={send} disabled={loading || !input.trim()}>send</button>
          </div>
        </div>
      )}
    </>
  );
}
