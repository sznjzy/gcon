import json
import os

LOG_FILE = "logs/conversations.json"


def save_conversation_log(log_entry):

    # create logs folder if missing
    os.makedirs("logs", exist_ok=True)

    # if file doesn't exist, create it
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w") as f:
            json.dump([], f)

    # load existing logs safely
    try:
        with open(LOG_FILE, "r") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        data = []

    # append new entry
    data.append(log_entry)

    # save back
    with open(LOG_FILE, "w") as f:
        json.dump(data, f, indent=4)