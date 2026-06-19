from ultralytics import YOLO

model = YOLO("best.pt")

results = model.predict(
    source="test1.jpg",
    conf=0.25,
    save=True
)

print("Prediction Complete!")