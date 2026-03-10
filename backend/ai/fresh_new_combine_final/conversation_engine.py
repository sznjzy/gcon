import random
import json
import os

# -----------------------------
# OPENING MESSAGES
# -----------------------------

openings = {

    "Cardiology":[
        "I understand you're experiencing heart-related symptoms. Let me ask a few quick questions.",
        "Thanks for reaching out about this. I'll ask a few quick questions so we can guide you properly."
    ],

    "Orthopedics":[
        "Sorry to hear about the injury. Let me ask a few quick questions to understand the situation."
    ],

    "Dermatology":[
        "Skin issues can be frustrating. I'll ask a couple quick questions to help you."
    ],

    "Neurology":[
        "Thanks for sharing that. Neurological symptoms are important to understand carefully."
    ]
}


def opening_message(service):

    return random.choice(
        openings.get(service,
        ["Thanks for reaching out. Let me ask a few quick questions."])
    )


# -----------------------------
# QUESTION BANK
# -----------------------------

question_bank = {

    "severity":[
        "How severe would you say the symptom is? (mild / moderate / severe)"
    ],

    "duration":[
        "How long have you had this issue? (hours / days / weeks)"
    ],

    "pain":[
        "How painful is it right now? (low / medium / high)"
    ],

    "impact":[
        "Is this affecting your daily activities? (no / somewhat / cannot)"
    ],

    "worsening":[
        "Are the symptoms getting worse? (yes / no)"
    ],

    "red_flag":[
        "Are you experiencing chest pain, breathing difficulty, or fainting? (yes / no)"
    ],

    "prior_history":[
        "Have you had this condition before? (yes / no)"
    ],

    "current_treatment":[
        "Are you currently taking medication for this issue? (yes / no)"
    ],

    "insurance":[
        "Will you be using insurance for this visit? (yes / no)"
    ],

    "appointment_intent":[
        "Are you looking to consult a doctor today? (yes / maybe / no)"
    ],

    "consultation_type":[
        "Do you prefer an in-person visit or online consultation? (in-person / online / either)"
    ],

    "time_urgency":[
        "When would you like the appointment? (today / within 24 hours / this week)"
    ],

    "booking_readiness":[
        "If a doctor is available now, should I book it for you? (yes / maybe / no)"
    ],
    
    "intent": [
    "Would you like help scheduling an appointment? (yes / maybe / no)",
    "Are you planning to book a consultation soon? (yes / maybe / no)",
    "Should I help arrange an appointment for you? (yes / maybe / no)"
    ]
}


# -----------------------------
# CONVERSATION FLOW
# -----------------------------

BEST_FLOW_FILE = os.path.join(os.path.dirname(__file__), "logs", "best_flows.json")
def get_conversation_flow(service):

    # try adaptive learning flow
    if os.path.exists(BEST_FLOW_FILE):

        with open(BEST_FLOW_FILE, "r") as f:
            flows = json.load(f)

        if flows:

            best_flow = flows[0]

    # ignore outdated flows
            if len(best_flow) >= 12:
                return best_flow

    # fallback default flow
    core_flow = [
        "name",
        "phone",
        "symptom_detail",

        "severity",
        "duration",
        "pain",
        "impact",

        "worsening",
        "red_flag",
        "prior_history",
        "current_treatment",

        "insurance",
        "appointment_intent",
        "consultation_type",
        "time_urgency",
        "booking_readiness"
    ]

    return core_flow


# -----------------------------
# QUESTION GENERATOR
# -----------------------------

def generate_question(feature, service):

    if feature == "name":
        return "May I know your name?"

    if feature == "phone":
        return "Could you share your phone number so we can contact you?"

    if feature == "symptom_detail":
        return "Can you describe the symptoms in a bit more detail?"

    if feature in question_bank:
        return random.choice(question_bank[feature])


    return f"Could you provide more details about {feature}?"
    