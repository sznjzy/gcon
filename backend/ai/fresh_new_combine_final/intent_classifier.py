import joblib
import os

model_path = os.path.join(os.path.dirname(__file__), "models", "intent_model.pkl")
model, vectorizer = joblib.load(model_path)

def classify_intent(message):

    X = vectorizer.transform([message])

    service = model.predict(X)[0]

    return service