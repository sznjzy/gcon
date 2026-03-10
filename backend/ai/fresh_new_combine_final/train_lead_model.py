import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
from xgboost import XGBClassifier
import joblib


# -----------------------------
# LOAD DATASET
# -----------------------------

data = pd.read_csv("data/augmented_dataset.csv")

print("Dataset shape:", data.shape)


# -----------------------------
# FEATURES / TARGET
# -----------------------------

X = data.drop("lead_score", axis=1)
y = data["lead_score"]


# -----------------------------
# ENCODE TARGET LABELS
# -----------------------------

encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)

print("Label mapping:")
for i, label in enumerate(encoder.classes_):
    print(label, "->", i)


# -----------------------------
# TRAIN TEST SPLIT
# -----------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42
)


# -----------------------------
# TRAIN MODEL
# -----------------------------

model = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.9
)

model.fit(X_train, y_train)


# -----------------------------
# MODEL EVALUATION
# -----------------------------

preds = model.predict(X_test)

print("\nModel Performance:\n")
print(classification_report(y_test, preds))


# -----------------------------
# SAVE MODEL
# -----------------------------

joblib.dump(model, "models/lead_model.pkl")

print("\nModel saved to models/lead_model.pkl")