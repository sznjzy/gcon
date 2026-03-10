import json

LOG_FILE = "logs/conversations.json"
BEST_FLOW_FILE = "logs/best_flows.json"


def update_best_flows():

    with open(LOG_FILE, "r") as f:
        logs = json.load(f)

    # Only consider real conversations
    conversations = [log for log in logs if "question_path" in log]

    if len(conversations) < 20:
        print("Not enough conversations for learning")
        return None

    path_stats = {}

    for log in conversations:

        path = tuple(log.get("question_path", []))
        outcome = log.get("outcome", "unknown")

        if path not in path_stats:
            path_stats[path] = {"total": 0, "converted": 0}

        path_stats[path]["total"] += 1

        if outcome in ["converted", "appointment_booked"]:
            path_stats[path]["converted"] += 1

    scores = []

    for path, data in path_stats.items():

        rate = data["converted"] / data["total"]

        scores.append((path, rate))

    best = sorted(scores, key=lambda x: x[1], reverse=True)[:2]

    best_flows = [list(flow[0]) for flow in best]

    with open(BEST_FLOW_FILE, "w") as f:
        json.dump(best_flows, f, indent=4)

    print("Best flows learned:", best_flows)

    return best_flows