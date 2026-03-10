# -----------------------------
# LEAD SCORING WEIGHTS
# -----------------------------

SEVERITY_WEIGHT = 2.0
DURATION_WEIGHT = 1.4
PAIN_WEIGHT = 1.8
IMPACT_WEIGHT = 1.6
INSURANCE_WEIGHT = 1.0
INTENT_WEIGHT = 1.3


# -----------------------------
# SCORING FUNCTIONS
# -----------------------------

def map_severity(answer):

    answer = answer.lower()

    if "severe" in answer:
        score = 3
    elif "moderate" in answer:
        score = 2
    else:
        score = 1

    return score * SEVERITY_WEIGHT


def map_duration(answer):

    answer = answer.lower()

    if "today" in answer or "hours" in answer:
        score = 1
    elif "days" in answer:
        score = 2
    else:
        score = 3

    return score * DURATION_WEIGHT


def map_pain(answer):

    answer = answer.lower()

    if "high" in answer:
        score = 3
    elif "medium" in answer:
        score = 2
    else:
        score = 1

    return score * PAIN_WEIGHT


def map_impact(answer):

    answer = answer.lower()

    if "cannot" in answer:
        score = 3
    elif "some" in answer or "somewhat" in answer:
        score = 2
    else:
        score = 1

    return score * IMPACT_WEIGHT


def map_insurance(answer):

    score = 1 if "yes" in answer.lower() else 0

    return score * INSURANCE_WEIGHT


def map_intent(answer):

    answer = answer.lower()

    if "yes" in answer:
        score = 3
    elif "maybe" in answer:
        score = 2
    else:
        score = 1

    return score * INTENT_WEIGHT


# -----------------------------
# SCORING ROUTER
# -----------------------------

def score_answer(feature, answer):

    if feature == "severity":
        return map_severity(answer)

    if feature == "duration":
        return map_duration(answer)

    if feature == "pain":
        return map_pain(answer)

    if feature == "impact":
        return map_impact(answer)

    if feature == "insurance":
        return map_insurance(answer)

    if feature == "intent":
        return map_intent(answer)

    return 0

# -----------------------------
# ADDITIONAL SCORING FUNCTIONS
# -----------------------------

def map_worsening(answer):

    return 2 if "yes" in answer.lower() else 0


def map_red_flag(answer):

    return 3 if "yes" in answer.lower() else 0


def map_prior_history(answer):

    return 1 if "yes" in answer.lower() else 0


def map_current_treatment(answer):

    return 1 if "yes" in answer.lower() else 0


def map_consultation_type(answer):

    if "in-person" in answer.lower():
        return 2
    elif "either" in answer.lower():
        return 1
    return 0


def map_time_urgency(answer):

    answer = answer.lower()

    if "today" in answer:
        return 3
    elif "24" in answer:
        return 2
    else:
        return 1


def map_booking_readiness(answer):

    answer = answer.lower()

    if "yes" in answer:
        return 3
    elif "maybe" in answer:
        return 2
    else:
        return 1