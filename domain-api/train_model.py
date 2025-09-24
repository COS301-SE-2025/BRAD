import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load features CSV (from generate_features.py)
df = pd.read_csv("domain_features.csv")

# Drop any non-feature columns
X = df.drop(columns=["label"])  
y = df["label"]  # 0 = benign, 1 = suspicious

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

print("Training accuracy:", clf.score(X_test, y_test))

# Save model
joblib.dump(clf, "domain_model.pkl")
print("Model saved to domain_model.pkl")
