import pandas as pd
from sklearn.ensemble import RandomForestClassifier

data = pd.read_csv("crime_data.csv")

X = data[['lat','lng','time']]
y = data['risk']

model = RandomForestClassifier()
model.fit(X, y)

print("Model trained")