import os
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

SERVICES = ["Cardiology", "Oncology", "Orthopedics", "Diagnostics",
            "General Medicine", "Neurology", "Pediatrics", "Other"]

# In-memory store for conversation context per lead
lead_context = {}


def call_gemini(prompt, system=None):
    """Call Gemini API and return text response."""
    if not GEMINI_API_KEY:
        return None

    full_prompt = ""
    if system:
        full_prompt = system + "\n\n"
    full_prompt += prompt

    payload = {
        "contents": [
            {
                "parts": [{ "text": full_prompt }]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 500,
        }
    }

    try:
        res = requests.post(
            GEMINI_URL + "?key=" + GEMINI_API_KEY,
            json=payload,
            timeout=10
        )
        data = res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print("Gemini error: " + str(e))
        return None


def classify_intent(message_text):
    """Classify the intent and service category from a user message."""
    prompt = """You are a hospital intake assistant. Classify this patient message.

Patient message: "{msg}"

Respond ONLY with valid JSON in this exact format, nothing else:
{{
  "service_category": "<one of: Cardiology, Oncology, Orthopedics, Diagnostics, General Medicine, Neurology, Pediatrics, Other>",
  "urgency_score": <number 1-10>,
  "keywords": "<brief description of symptoms>"
}}""".format(msg=message_text)

    result = call_gemini(prompt)

    if result:
        try:
            # Strip markdown code fences if present
            clean = result.replace("```json", "").replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    # Fallback: keyword-based classification
    msg = message_text.lower()
    if any(w in msg for w in ["heart", "chest", "cardiac", "bp", "blood pressure"]):
        service = "Cardiology"
    elif any(w in msg for w in ["bone", "knee", "joint", "fracture", "back pain"]):
        service = "Orthopedics"
    elif any(w in msg for w in ["brain", "headache", "migraine", "seizure", "neuro"]):
        service = "Neurology"
    elif any(w in msg for w in ["child", "baby", "infant", "kid", "pediatric"]):
        service = "Pediatrics"
    elif any(w in msg for w in ["test", "scan", "xray", "blood test", "report"]):
        service = "Diagnostics"
    elif any(w in msg for w in ["cancer", "tumor", "chemo", "oncology"]):
        service = "Oncology"
    else:
        service = "General Medicine"

    return { "service_category": service, "urgency_score": 5, "keywords": message_text[:50] }


def ask_qualification_question(lead_id, question_number, context):
    """Generate the next qualifying question for the patient."""

    # Store context
    if lead_id not in lead_context:
        lead_context[lead_id] = []
    lead_context[lead_id].append({ "q": question_number, "context": context })

    system = """You are a warm, professional hospital intake assistant for Kathir Memorial Hospital.
Your job is to ask short, empathetic qualifying questions to understand the patient's needs.
Ask ONE question at a time. Be concise. Sound human, not robotic."""

    if question_number == 1:
        prompt = """Patient's first message: "{context}"

This is the FIRST qualifying question. Ask them to describe their symptoms or what kind of help they need.
Keep it short, warm and natural. One sentence only.""".format(context=context)

    elif question_number == 2:
        prompt = """Patient context so far: "{context}"

This is the SECOND qualifying question. Ask about how long they have been experiencing this, or severity.
One sentence only.""".format(context=context)

    else:
        prompt = """Patient context so far: "{context}"

This is the THIRD qualifying question. Ask if they have a preferred date/time for an appointment, or if this is urgent.
One sentence only.""".format(context=context)

    result = call_gemini(prompt, system)

    if result:
        return { "question": result }

    # Fallbacks
    fallbacks = {
        1: "Could you tell me more about your symptoms or what brings you to us today?",
        2: "How long have you been experiencing this, and how would you rate the severity?",
        3: "Would you prefer an appointment as soon as possible, or do you have a specific date in mind?"
    }
    return { "question": fallbacks.get(question_number, fallbacks[1]) }


def score_lead(lead_id, qualification_answers):
    """Score a lead as Hot, Warm, or Cold based on their answers."""

    answers_text = " ".join(qualification_answers) if isinstance(qualification_answers, list) else str(qualification_answers)

    prompt = """You are a hospital lead scoring system.

Based on these patient responses, score them as a potential appointment booking lead.
Patient responses: "{answers}"

Respond ONLY with valid JSON, nothing else:
{{
  "score": "<Hot or Warm or Cold>",
  "reasoning": "<one sentence explanation>"
}}

Scoring rules:
- Hot: urgent symptoms, ready to book, specific need
- Warm: clear need but not urgent, considering options
- Cold: vague, just browsing, no clear need""".format(answers=answers_text)

    result = call_gemini(prompt)

    if result:
        try:
            clean = result.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean)
            if parsed.get("score") not in ["Hot", "Warm", "Cold"]:
                parsed["score"] = "Warm"
            return parsed
        except Exception:
            pass

    return { "score": "Warm", "reasoning": "Unable to determine score, defaulting to Warm." }


def generate_chat_reply(lead_id, message, stage, context=None):
    """Generate a full conversational reply for the chat widget."""

    system = """You are a helpful, warm hospital intake assistant for Kathir Memorial Hospital.
You help patients book appointments and understand their medical needs.
Keep replies SHORT (1-2 sentences max). Be empathetic and professional.
Never give medical diagnoses. Always encourage them to see a doctor."""

    history = ""
    if lead_id in lead_context and lead_context[lead_id]:
        history = "Previous context: " + str(lead_context[lead_id][-3:]) + "\n"

    prompt = """{history}Patient message: "{message}"
Stage: {stage}

Reply naturally and helpfully. If they seem to need urgent care, express concern and offer to book immediately.""".format(
        history=history,
        message=message,
        stage=stage
    )

    result = call_gemini(prompt, system)
    return result or "Thank you for reaching out! Could you tell me more about your symptoms?"


def check_doctor_availability(specialty, date_range=5):
    """Return available doctor slots for a specialty."""
    base = datetime.now()
    doctor_map = {
        "Cardiology":       [("Dr. Priya Menon", "10:00 AM"), ("Dr. Arjun Rao", "02:00 PM")],
        "Orthopedics":      [("Dr. Meena Krishnan", "11:30 AM"), ("Dr. Suresh Kumar", "04:00 PM")],
        "Diagnostics":      [("Dr. Suresh Iyer", "09:00 AM"), ("Dr. Lakshmi Rao", "01:00 PM")],
        "Neurology":        [("Dr. Ananya Seth", "03:00 PM"), ("Dr. Vinod Nair", "10:30 AM")],
        "General Medicine": [("Dr. Ramesh Pillai", "08:30 AM"), ("Dr. Deepa Menon", "05:00 PM")],
        "Pediatrics":       [("Dr. Kavya Nair", "10:00 AM"), ("Dr. Ritu Sharma", "02:30 PM")],
        "Oncology":         [("Dr. Vikram Shah", "01:00 PM"), ("Dr. Anjali Roy", "11:00 AM")],
        "Other":            [("Dr. Ramesh Pillai", "08:30 AM"), ("Dr. Deepa Menon", "05:00 PM")],
    }

    doctors = doctor_map.get(specialty, doctor_map["Other"])
    slots = []
    slot_num = 1

    for i in range(1, date_range + 1):
        date_str = (base + timedelta(days=i)).strftime("%Y-%m-%d")
        for doctor, time in doctors:
            slots.append({
                "slot_id":   "S" + str(slot_num).zfill(3),
                "doctor":    doctor,
                "specialty": specialty,
                "date":      date_str,
                "time":      time
            })
            slot_num += 1

    return { "slots": slots[:6] }


def add_to_nurture_sequence(lead_id, seq_type):
    """Enroll a lead in a nurture sequence."""
    sequences = {
        "warm":    "3-day follow-up sequence with health tips",
        "cold":    "7-day educational content sequence",
        "general": "Weekly hospital newsletter sequence"
    }
    return {
        "status":        "enrolled",
        "lead_id":       lead_id,
        "sequence_type": seq_type,
        "description":   sequences.get(seq_type, sequences["general"]),
        "enrolled_at":   datetime.now().isoformat()
    }
