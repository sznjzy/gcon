from intent_classifier import classify_intent
from conversation_engine import opening_message, get_conversation_flow, generate_question
from mock_data import mock_leads
from feature_mapper import *
from logger import save_conversation_log
from doctor_scheduler import find_available_doctor, book_slot

from datetime import datetime
import joblib
import os
import joblib
import pandas as pd
import json


# Load ML Model
model_dir = os.path.dirname(__file__)
lead_model = joblib.load(os.path.join(model_dir, "models", "lead_model.pkl"))

LOG_FILE = os.path.join(model_dir, "logs", "conversations.json")

# ----------------------------------------
# FUNCTION 1 — Capture Lead
# ----------------------------------------
def capture_lead(channel, raw_message):

    service = classify_intent(raw_message)

    return {
        "name": "Unknown",
        "contact": None,
        "intent": service,
        "urgency_score": 6,
        "channel": channel
    }


# ----------------------------------------
# FUNCTION 2 — Intent Classification Wrapper
# ----------------------------------------
def classify_intent_wrapper(message_text):

    service = classify_intent(message_text)

    return {
        "service_category": service,
        "urgency_score": 6,
        "keywords_detected": []
    }


# ----------------------------------------
# FUNCTION 3 — Ask Qualification Question
# ----------------------------------------
def ask_qualification_question(lead_id, question_number, context):

    service = context["service"]

    features = get_conversation_flow(service)

    feature = features[question_number - 1]

    question = generate_question(feature, service)

    return {
        "question": question,
        "question_type": feature
    }


# ----------------------------------------
# FUNCTION 4 — Detect Service
# ----------------------------------------
def detect_service(message):
    return classify_intent(message)


# ----------------------------------------
# FUNCTION 5 — Lead Scoring (ML Model)
# ----------------------------------------
def score_lead(answers):
    if answers.get("red_flag") == "yes" and answers.get("severity") == "severe":
        return "Hot"
    if answers.get("pain") == "high" and answers.get("impact") == "cannot":
        return "Hot"
    severity = map_severity(answers.get("severity", "mild"))
    duration = map_duration(answers.get("duration", "days"))
    pain = map_pain(answers.get("pain", "low"))
    impact = map_impact(answers.get("impact", "no"))

    worsening = map_worsening(answers.get("worsening", "no"))
    red_flag = map_red_flag(answers.get("red_flag", "no"))
    prior_history = map_prior_history(answers.get("prior_history", "no"))
    treatment = map_current_treatment(answers.get("current_treatment", "no"))

    insurance = map_insurance(answers.get("insurance", "no"))
    intent = map_intent(answers.get("appointment_intent", "maybe"))

    consultation = map_consultation_type(answers.get("consultation_type", "either"))
    urgency = map_time_urgency(answers.get("time_urgency", "week"))
    booking = map_booking_readiness(answers.get("booking_readiness", "maybe"))

    features = [[
        severity,
        duration,
        pain,
        impact,
        worsening,
        red_flag,
        prior_history,
        treatment,
        insurance,
        intent,
        consultation,
        urgency,
        booking
    ]]

    feature_df = pd.DataFrame(features, columns=[
        "symptom_severity",
        "symptom_duration",
        "pain_level",
        "functional_impact",
        "worsening",
        "red_flag",
        "prior_history",
        "current_treatment",
        "insurance",
        "appointment_intent",
        "consultation_type",
        "time_urgency",
        "booking_readiness"
    ])

    prediction = lead_model.predict(feature_df)[0]

    label_map = {
        0: "Cold",
        1: "Warm",
        2: "Hot"
    }

    return label_map[prediction]
# ----------------------------------------
# FUNCTION 7 — Book Appointment
# ----------------------------------------
# ----------------------------------------
# FUNCTION 6 — Doctor Availability
# ----------------------------------------
def check_doctor_availability(specialty, date_range):

    slots = find_available_doctor(specialty)

    return {"slots": slots}

def book_appointment(lead_id, slot):

    booking = book_slot(lead_id, slot)

    return booking


# ----------------------------------------
# FUNCTION 8 — Add to Nurture Sequence
# ----------------------------------------
def add_to_nurture_sequence(lead_id, sequence_type):

    return {
        "status": "enrolled",
        "sequence_type": sequence_type,
        "next_message_in_days": 2,
        "message_preview": "Just checking in regarding your consultation."
    }


# ----------------------------------------
# FUNCTION 9 — Lead Action Handler
# ----------------------------------------
def handle_lead_action(lead_id, score, service, patient_name, contact):

    # HOT LEAD
    if score == "Hot":

        availability = check_doctor_availability(service, 5)

        slots = availability["slots"]

        if slots:

            slot = slots[0]

            booking = book_appointment(lead_id, slot)

            if not booking:
                return {
                    "status": "booking_failed",
                    "message": "Unable to book appointment."
                }

            log_entry = {
                "booking_id": booking["confirmation_id"],
                "patient_name": patient_name,
                "contact": contact,
                "doctor_name": booking["doctor"],
                "service_provided": service,
                "date": booking["date"],
                "time": booking["time"],
                "status": "upcoming"
            }

            save_conversation_log(log_entry)

            return {
                "status": "appointment_booked",
                "details": booking
            }

        else:
            return {
                "status": "no_slots",
                "message": "No immediate slots available."
            }

    # WARM LEAD
    elif score == "Warm":

        follow_up_info = {
            "patient_name": patient_name,
            "contact": contact,
            "service": service,
            "action": "information_pack_sent",
            "follow_up_call_in_days": 2,
            "status": "follow_up_scheduled"
        }

        save_conversation_log(follow_up_info)

        return {
            "status": "follow_up",
            "message": "Information pack sent. Follow-up scheduled in 2 days."
        }

    # COLD LEAD
    elif score == "Cold":

        nurture = add_to_nurture_sequence(lead_id, "cold")

        nurture_log = {
            "patient_name": patient_name,
            "contact": contact,
            "service": service,
            "action": "nurture_sequence",
            "next_message_in_days": nurture["next_message_in_days"],
            "status": "nurture_active"
        }

        save_conversation_log(nurture_log)

        return {
            "status": "nurture_sequence",
            "details": nurture
        }


# ----------------------------------------
# FUNCTION 10 — Conversion Analytics
# ----------------------------------------
def get_conversion_analytics(date_range=None):

    try:
        with open(LOG_FILE, "r") as f:
            logs = json.load(f)
    except:
        logs = []

    total = len(logs)

    converted = sum(1 for l in logs if l.get("status") == "upcoming")
    lost = total - converted

    conversion_rate = (converted / total) * 100 if total else 0

    return {
        "total_leads": total,
        "converted": converted,
        "lost": lost,
        "conversion_rate": conversion_rate
    }