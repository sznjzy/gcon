import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
BACKEND_URL    = os.getenv("BACKEND_URL", "http://127.0.0.1:5001")
TELEGRAM_API   = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"

# Predefined patients — same as backend
PREDEFINED_PATIENTS = [
    { "patient_id": "P001", "name": "Ravi Kumar",   "phone": "9876543210" },
    { "patient_id": "P002", "name": "Sneha Iyer",   "phone": "9845001234" },
    { "patient_id": "P003", "name": "Arjun Mehta",  "phone": "9901122334" },
    { "patient_id": "P004", "name": "Priya Nair",   "phone": "9988776655" },
    { "patient_id": "P005", "name": "Kiran Das",    "phone": "9123456789" },
]

# In-memory session store per Telegram chat_id
# session = { chat_id: { patient, stage, lead_id, slots, answers } }
sessions = {}

# ── TELEGRAM HELPERS ─────────────────────────────────────────────

def send(chat_id, text, reply_markup=None):
    payload = {
        "chat_id":    chat_id,
        "text":       text,
        "parse_mode": "HTML",
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    requests.post(f"{TELEGRAM_API}/sendMessage", json=payload)


def send_buttons(chat_id, text, buttons):
    """Send message with inline keyboard buttons."""
    keyboard = {"inline_keyboard": [[{"text": b, "callback_data": b} for b in row] for row in buttons]}
    send(chat_id, text, reply_markup=keyboard)


def answer_callback(callback_query_id):
    requests.post(f"{TELEGRAM_API}/answerCallbackQuery", json={"callback_query_id": callback_query_id})


# ── BACKEND HELPERS ──────────────────────────────────────────────

def backend_post(path, data):
    try:
        res = requests.post(BACKEND_URL + path, json=data, timeout=10)
        return res.json()
    except Exception as e:
        print("Backend POST error: " + str(e))
        return None


def backend_get(path):
    try:
        res = requests.get(BACKEND_URL + path, timeout=10)
        return res.json()
    except Exception as e:
        print("Backend GET error: " + str(e))
        return None


# ── SESSION ──────────────────────────────────────────────────────

def get_session(chat_id):
    if chat_id not in sessions:
        sessions[chat_id] = {
            "patient":  None,
            "stage":    "auth",
            "lead_id":  None,
            "slots":    [],
            "answers":  [],
            "service":  "General Medicine",
        }
    return sessions[chat_id]


def reset_session(chat_id):
    sessions[chat_id] = {
        "patient":  sessions.get(chat_id, {}).get("patient"),  # keep patient logged in
        "stage":    "menu",
        "lead_id":  None,
        "slots":    [],
        "answers":  [],
        "service":  "General Medicine",
    }


# ── FLOW HANDLERS ────────────────────────────────────────────────

def handle_auth(chat_id, text, session):
    """Step 1 — ask for phone to identify patient."""
    if session["stage"] == "auth":
        send(chat_id,
            "👋 <b>Welcome to Kathir Memorial Hospital</b>\n\n"
            "I can help you:\n"
            "  Book a consultation\n"
            "  View your appointments\n\n"
            "Please enter your <b>registered phone number</b> to continue:"
        )
        session["stage"] = "auth_phone"
        return

    if session["stage"] == "auth_phone":
        phone = text.strip().replace(" ", "").replace("+91", "")[-10:]
        if not phone.isdigit() or len(phone) < 10:
            send(chat_id, "Please enter a valid 10-digit phone number.")
            return
            
        match = next((p for p in PREDEFINED_PATIENTS if p["phone"] == phone), None)
        if not match:
            # Accept unregistered users instead of blocking them
            match = {
                "patient_id": f"P{phone[-4:]}",
                "name": "New Patient",
                "phone": phone
            }

        session["patient"] = match
        session["stage"]   = "menu"

        # Log login to backend
        backend_post("/api/patient/login", {"name": match["name"], "phone": match["phone"]})

        send(chat_id,
            f"Welcome back, <b>{match['name']}</b>!\n\n"
            "What would you like to do?"
        )
        show_menu(chat_id)


def show_menu(chat_id):
    send_buttons(chat_id,
        "Choose an option:",
        [
            ["Book Appointment"],
            ["View My Appointments"],
            ["Logout"],
        ]
    )


def handle_menu(chat_id, text, session):
    t = text.strip().lower()

    if "book" in t:
        session["stage"]   = "chat_start"
        session["lead_id"] = None
        session["answers"] = []

        # Capture lead
        res = backend_post("/api/leads/capture", {
            "name":    session["patient"]["name"],
            "contact": session["patient"]["phone"],
            "channel": "telegram",
            "service": "General Medicine",
        })
        if res and res.get("status") == "success":
            session["lead_id"] = res["data"]["lead_id"]

        # Start qualifying via backend chat
        chat_res = backend_post("/api/chat", {
            "lead_id": session["lead_id"] or "TG001",
            "message": "I need a consultation",
            "channel": "telegram",
            "stage":   "greeting",
        })
        reply     = chat_res["data"]["reply"]   if chat_res else "Could you describe your symptoms?"
        new_stage = chat_res["data"]["stage"]   if chat_res else "qualifying_1"
        service   = chat_res["data"].get("service") if chat_res else None
        # Sync lead_id if backend returned one
        backend_lead_id = chat_res["data"].get("lead_id") if chat_res else None
        if backend_lead_id:
            session["lead_id"] = backend_lead_id
            print(f"[TG] lead_id synced from greeting: {backend_lead_id}")

        if service:
            session["service"] = service
        session["stage"] = "chat_" + new_stage

        send(chat_id, reply)

    elif "view" in t or "appointment" in t:
        show_appointments(chat_id, session)

    elif "logout" in t:
        session["patient"] = None
        session["stage"]   = "auth"
        send(chat_id, "You have been logged out. See you soon!")
        handle_auth(chat_id, "", session)


def handle_chat(chat_id, text, session):
    """Handle qualifying conversation stages."""
    stage    = session["stage"].replace("chat_", "")
    lead_id  = session["lead_id"] or "TG001"

    session["answers"].append(text)

    chat_res  = backend_post("/api/chat", {
        "lead_id": lead_id,
        "message": text,
        "channel": "telegram",
        "stage":   stage,
    })

    if not chat_res:
        send(chat_id, "Sorry, having trouble connecting. Please try again.")
        return

    reply     = chat_res["data"]["reply"]
    new_stage = chat_res["data"]["stage"]
    service   = chat_res["data"].get("service")
    # Sync lead_id if backend returned one
    backend_lead_id = chat_res["data"].get("lead_id")
    if backend_lead_id and backend_lead_id != "TG001":
        session["lead_id"] = backend_lead_id

    if service and service != "Other":
        session["service"] = service

    send(chat_id, reply)

    if new_stage == "booking":
        # Fetch available slots for detected specialty
        svc   = session.get("service", "General Medicine")
        print(f"[TG] Fetching slots for specialty='{svc}'")
        avail = backend_get(f"/api/appointments/availability?specialty={svc}")
        slots = avail["data"]["slots"][:5] if avail else []
        session["slots"] = slots

        if slots:
            specialty_emoji = {
                "Neurology": "🧠", "Cardiology": "❤️", "Orthopedics": "🦴",
                "Pediatrics": "👶", "Oncology": "🏥", "Diagnostics": "🔬",
                "General Medicine": "⚕️"
            }.get(svc, "⚕️")
            lines = [f"{specialty_emoji} <b>Available {svc} slots:</b>\n"]
            for i, s in enumerate(slots, 1):
                lines.append(
                    f"<b>{i}.</b> {s['doctor']}\n"
                    f"   📅 {s['date']}  🕒 {s['time']}"
                )
            lines.append("\nReply with the <b>slot number</b> to confirm booking (e.g. <b>1</b>):")
            send(chat_id, "\n".join(lines))
            session["stage"] = "chat_slot_select"
        else:
            send(chat_id, "No slots available right now. Our team will call you to confirm.")
            reset_session(chat_id)
            show_menu(chat_id)
    elif new_stage == "nurture":
        reset_session(chat_id)
        show_menu(chat_id)
    else:
        session["stage"] = "chat_" + new_stage


def handle_slot_select(chat_id, text, session):
    """Patient picks a slot number."""
    try:
        idx  = int(text.strip()) - 1
        slot = session["slots"][idx]
    except (ValueError, IndexError):
        send(chat_id, "Please reply with a valid slot number (e.g. 1, 2, 3...)")
        return

    lead_id = session["lead_id"] or "TG001"

    # Book appointment
    book_res = backend_post("/api/appointment/book", {
        "lead_id": lead_id,
        "slot_id": slot["slot_id"],
    })

    if book_res and book_res.get("status") == "success":
        d = book_res["data"]
        # Save to patient_appointments
        backend_post("/api/patient/appointments/save", {
            "appointment_id": d["confirmation_id"],
            "lead_id":        lead_id,
            "contact":        session["patient"]["phone"],
            "name":           session["patient"]["name"],
            "doctor":         d["doctor"],
            "specialty":      d["specialty"],
            "service":        d["specialty"],
            "date":           d["date"],
            "time":           d["time"],
            "instructions":   d["instructions"],
            "status":         "upcoming",
            "booked_at":      datetime.now().isoformat(),
        })

        send(chat_id,
            f"Appointment Confirmed!\n\n"
            f"Booking ID: <code>{d['confirmation_id']}</code>\n"
            f"Doctor: <b>{d['doctor']}</b>\n"
            f"Date: {d['date']}\n"
            f"Time: {d['time']}\n\n"
            f"Instructions: {d['instructions']}"
        )
    else:
        send(chat_id, "Booking failed. Please try again.")

    reset_session(chat_id)
    show_menu(chat_id)


def show_appointments(chat_id, session):
    """Show patient's appointments."""
    phone = session["patient"]["phone"]
    res   = backend_get(f"/api/patient/appointments?contact={phone}")

    if not res or res.get("status") != "success":
        send(chat_id, "Could not fetch appointments. Please try again.")
        show_menu(chat_id)
        return

    appts = res["data"]["appointments"]
    if not appts:
        send(chat_id, "You have no appointments booked yet.")
        show_menu(chat_id)
        return

    upcoming  = [a for a in appts if a["status"] == "upcoming"]
    completed = [a for a in appts if a["status"] != "upcoming"]

    lines = [f"<b>Appointments for {session['patient']['name']}</b>\n"]

    if upcoming:
        lines.append("<b>Upcoming:</b>")
        for a in upcoming:
            lines.append(
                f"  {a['date']} {a['time']}\n"
                f"  {a['doctor']} — {a['service']}\n"
                f"  ID: <code>{a['appointment_id']}</code>"
            )

    if completed:
        lines.append("\n<b>Past:</b>")
        for a in completed[:3]:
            lines.append(
                f"  {a['date']} — {a['doctor']} ({a['service']})"
            )

    send(chat_id, "\n".join(lines))
    show_menu(chat_id)


# ── MAIN DISPATCHER ──────────────────────────────────────────────

def handle_update(update):
    # Handle inline button callbacks
    if "callback_query" in update:
        cq      = update["callback_query"]
        chat_id = cq["message"]["chat"]["id"]
        text    = cq["data"]
        answer_callback(cq["id"])
        process_message(chat_id, text)
        return

    # Handle regular messages
    if "message" not in update:
        return
    msg     = update["message"]
    chat_id = msg["chat"]["id"]
    text    = msg.get("text", "").strip()
    if not text:
        return

    process_message(chat_id, text)


def process_message(chat_id, text):
    session = get_session(chat_id)
    stage   = session["stage"]

    # Handle /start command
    if text.startswith("/start"):
        session["stage"]   = "auth"
        session["patient"] = None
        handle_auth(chat_id, text, session)
        return

    # Handle /menu command
    if text.startswith("/menu") and session["patient"]:
        reset_session(chat_id)
        show_menu(chat_id)
        return

    # Route based on stage
    if stage in ("auth", "auth_phone"):
        handle_auth(chat_id, text, session)
    elif stage == "menu":
        handle_menu(chat_id, text, session)
    elif stage == "chat_slot_select":
        handle_slot_select(chat_id, text, session)
    elif stage.startswith("chat_"):
        handle_chat(chat_id, text, session)
    else:
        session["stage"] = "auth"
        handle_auth(chat_id, text, session)


# ── POLLING LOOP ─────────────────────────────────────────────────

def run():
    print("MedFlow Telegram Bot starting...")
    print("Backend: " + BACKEND_URL)

    offset = 0
    while True:
        try:
            res  = requests.get(
                f"{TELEGRAM_API}/getUpdates",
                params={"offset": offset, "timeout": 30},
                timeout=35
            )
            data = res.json()

            if not data.get("ok"):
                print("Telegram error: " + str(data))
                continue

            for update in data.get("result", []):
                offset = update["update_id"] + 1
                try:
                    handle_update(update)
                except Exception as e:
                    print("Update error: " + str(e))

        except Exception as e:
            print("Polling error: " + str(e))
            import time
            time.sleep(3)


if __name__ == "__main__":
    run()
