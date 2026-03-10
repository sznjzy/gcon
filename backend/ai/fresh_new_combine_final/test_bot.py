from ai_module import detect_service, score_lead,handle_lead_action
from conversation_engine import opening_message, get_conversation_flow, generate_question
from logger import save_conversation_log
from adaptive_learning import update_best_flows
from datetime import datetime

# user first message
message = input("User: ")

# detect department
service = detect_service(message)

# opening message
print("\nBot:", opening_message(service))

# get conversation flow for that service
features = get_conversation_flow(service)

answers = {}
question_path = []

# ask questions dynamically
for feature in features:

    question = generate_question(feature, service)

    answer = input("Bot: " + question + "\nUser: ")

    answers[feature] = answer

    # track conversation flow
    question_path.append(feature)

# score lead
patient_name = answers.get("name")
contact = answers.get("phone")
result = score_lead(answers)

print("\nLead Score:", result)
# trigger action based on prediction
action = handle_lead_action("L001", result, service, patient_name, contact)

print("\nNext Action:", action)

# determine outcome
outcome = "lost"
if action["status"] == "appointment_booked":
    outcome = "converted"

# save conversation log
log_entry = {
    "lead_id": "L001",
    "service": service,
    "question_path": question_path,
    "answers": answers,
    "score": result,
    "outcome": outcome,
    "timestamp": str(datetime.now())
}

save_conversation_log(log_entry)

# run adaptive learning
update_best_flows()
