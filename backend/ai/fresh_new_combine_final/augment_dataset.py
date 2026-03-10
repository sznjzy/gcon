import pandas as pd
import numpy as np

# Load your existing dataset
df = pd.read_csv("data/lead_dataset.csv")

rows = len(df)

# Add new realistic columns

df["worsening"] = np.random.choice([0,1], rows, p=[0.65,0.35])

df["red_flag"] = np.random.choice([0,1], rows, p=[0.9,0.1])

df["prior_history"] = np.random.choice([0,1], rows, p=[0.5,0.5])

df["current_treatment"] = np.random.choice([0,1], rows, p=[0.6,0.4])

df["consultation_type"] = np.random.choice(
    [0,1,2], rows, p=[0.3,0.4,0.3]
)

df["time_urgency"] = np.random.choice(
    [1,2,3], rows, p=[0.35,0.4,0.25]
)

df["booking_readiness"] = np.random.choice(
    [1,2,3], rows, p=[0.35,0.4,0.25]
)

# Reorder columns properly
df = df[
[
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
"booking_readiness",
"lead_score"
]
]

# Save new dataset
df.to_csv("augmented_dataset.csv", index=False)

print("New dataset created: augmented_dataset.csv")