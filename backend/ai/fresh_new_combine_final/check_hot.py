import pandas as pd

df = pd.read_csv("data/augmented_dataset.csv")

print(df["lead_score"].value_counts())