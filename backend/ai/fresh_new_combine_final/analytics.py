import json
from datetime import datetime

LOG_FILE = "logs/conversations.json"


def get_conversion_analytics(date_range=None):

    with open(LOG_FILE, "r") as f:
        logs = json.load(f)

    total = len(logs)
    converted = 0
    lost = 0
    paths = {}

    for log in logs:

        status = log.get("outcome")

        if status == "converted":
            converted += 1
        elif status == "lost":
            lost += 1

        path = tuple(log.get("question_path", []))

        paths[path] = paths.get(path, 0) + 1

    conversion_rate = 0
    if total > 0:
        conversion_rate = converted / total

    top_paths = sorted(paths.items(), key=lambda x: x[1], reverse=True)[:3]

    return {
        "total_leads": total,
        "converted": converted,
        "lost": lost,
        "conversion_rate": conversion_rate,
        "top_paths": top_paths
    }