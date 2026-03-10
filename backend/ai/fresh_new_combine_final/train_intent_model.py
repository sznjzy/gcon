import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

data = pd.read_csv("data/intent_dataset.csv")

X = data["text"]
y = data["service"]

vectorizer = TfidfVectorizer()

X_vec = vectorizer.fit_transform(X)

model = LogisticRegression()

model.fit(X_vec, y)

joblib.dump((model, vectorizer), "models/intent_model.pkl")

print("Intent model trained")