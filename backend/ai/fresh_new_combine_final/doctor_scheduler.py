from datetime import datetime, timedelta
import json
import os

# -----------------------------
# Doctor Database
# -----------------------------
doctors = {
    "Cardiology": [
        {"name": "Dr. Priya Menon"},
        {"name": "Dr. Arjun Iyer"}
    ],
    "Orthopedics": [
        {"name": "Dr. Arjun Nair"},
        {"name": "Dr. Karthik Rao"}
    ],
    "Neurology": [
        {"name": "Dr. Vivek Patel"}
    ],
    "Dermatology": [
        {"name": "Dr. Neha Kapoor"}
    ],
    "General": [
        {"name": "Dr. Anita Rao"}
    ],
    "Dental": [
        {"name": "Dr. Rohan Mehta"}
    ]
}

# -----------------------------
# Appointment storage
# -----------------------------
APPOINTMENT_FILE = "data/appointments.json"


def load_booked_slots():

    if not os.path.exists(APPOINTMENT_FILE):
        return set()

    with open(APPOINTMENT_FILE, "r") as f:
        data = json.load(f)

    return set(data)


def save_booked_slots(slots):

    with open(APPOINTMENT_FILE, "w") as f:
        json.dump(list(slots), f)


booked_slots = load_booked_slots()

# -----------------------------
# Generate Slots
# -----------------------------
def generate_slots(doctor_name, specialty):

    slots = []

    today = datetime.today()

    for i in range(5):

        day = today + timedelta(days=i)

        date_str = day.strftime("%Y-%m-%d")

        for time in ["10:00 AM", "12:00 PM", "3:00 PM"]:

            slot_key = f"{doctor_name}-{date_str}-{time}"

            if slot_key in booked_slots:
                continue

            slots.append({
                "slot_id": f"{doctor_name.split()[1][:3]}-{i}-{time}",
                "doctor": doctor_name,
                "specialty": specialty,
                "date": date_str,
                "time": time,
                "slot_key": slot_key
            })

    return slots


# -----------------------------
# Find Available Doctor
# -----------------------------
def find_available_doctor(specialty):

    available_doctors = doctors.get(specialty)

    if not available_doctors:
        available_doctors = doctors["General"]

    today = datetime.today()

    slot_times = ["10:00 AM", "12:00 PM", "3:00 PM"]

    all_slots = []

    for i in range(5):

        day = today + timedelta(days=i)
        date_str = day.strftime("%Y-%m-%d")

        for time in slot_times:

            for doctor in available_doctors:

                doctor_name = doctor["name"]

                slot_key = f"{doctor_name}-{date_str}-{time}"

                if slot_key in booked_slots:
                    continue

                slot = {
                    "slot_id": f"{doctor_name.split()[1][:3]}-{i}-{time}",
                    "doctor": doctor_name,
                    "specialty": specialty,
                    "date": date_str,
                    "time": time,
                    "slot_key": slot_key
                }

                all_slots.append(slot)

    # ensure correct ordering: date → time → doctor
    all_slots.sort(key=lambda x: (x["date"], x["time"], x["doctor"]))

    return all_slots
# -----------------------------
# Book Slot
# -----------------------------
def book_slot(lead_id, slot):

    global booked_slots

    booked_slots.add(slot["slot_key"])

    save_booked_slots(booked_slots)

    confirmation = f"CONF-{lead_id}-{slot['slot_id']}"

    return {
        "confirmation_id": confirmation,
        "doctor": slot["doctor"],
        "date": slot["date"],
        "time": slot["time"],
        "specialty": slot["specialty"],
        "instructions": "Please arrive 15 minutes early."
    }