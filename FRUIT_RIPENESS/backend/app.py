from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from ultralytics import YOLO

import shutil
import os
import uuid
import cv2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

model = YOLO("best.pt")

os.makedirs("uploads", exist_ok=True)
os.makedirs("results", exist_ok=True)

app.mount(
    "/results",
    StaticFiles(directory="results"),
    name="results"
)


@app.get("/")
def home():
    return {
        "message": "Fruit Ripeness API Running 🚀"
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    filename = f"{uuid.uuid4()}.jpg"

    path = f"uploads/{filename}"

    with open(path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    results = model.predict(
        source=path,
        conf=0.35,
        imgsz=640
    )

    result = results[0]

    if len(result.boxes) == 0:
        return {
            "fruit": "No Fruit Detected",
            "confidence": 0,
            "image": None
        }

    best_index = result.boxes.conf.argmax()

    cls = int(
        result.boxes.cls[
            best_index
        ]
    )

    confidence = float(
        result.boxes.conf[
            best_index
        ]
    )

    # Draw YOLO rectangles
    boxed_image = result.plot()

    output_path = f"results/{filename}"

    cv2.imwrite(
        output_path,
        boxed_image
    )

    return {

        "fruit":
        result.names[cls],

        "confidence":
        round(
            confidence * 100,
            2
        ),

        "image":
        f"http://127.0.0.1:8000/results/{filename}"
    }