from flask import Flask, request, jsonify
from ultralytics import YOLO
from supabase import create_client, Client
import os
import tempfile
from PIL import Image

# --- CONFIG ---
SUPABASE_URL = "https://kdjwrgcyhtrxfjvhonfh.supabase.co"
SUPABASE_KEY = "sb_publishable_SqTmlMsLjOXafXiv1vwxcg_--j67cTK"
MODEL_PATH = "model/yolov8.pt"

# --- INIT ---
app = Flask(__name__)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
model = YOLO(MODEL_PATH)

@app.route("/")
def home():
    return "AI Server running successfully 🚀"

@app.route("/analyze", methods=["POST"])
def analyze_image():
    """Analyze an uploaded image for potholes or garbage"""
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    filename = tempfile.mktemp(suffix=".jpg")
    image.save(filename)

    try:
        # Run YOLO detection
        results = model.predict(source=filename, conf=0.4)
        detections = results[0].boxes.data.tolist()

        pothole_sizes = []
        garbage_sizes = []

        for d in detections:
            x1, y1, x2, y2, conf, cls = d
            width = x2 - x1
            height = y2 - y1
            area = round((width * height) / 10000, 2)  # approximate size in m²

            label = model.names[int(cls)].lower()
            if "pothole" in label:
                pothole_sizes.append(area)
            elif "garbage" in label:
                garbage_sizes.append(area)

        avg_pothole = round(sum(pothole_sizes) / len(pothole_sizes), 2) if pothole_sizes else 0
        avg_garbage = round(sum(garbage_sizes) / len(garbage_sizes), 2) if garbage_sizes else 0
        max_pothole = max(pothole_sizes, default=0)
        max_garbage = max(garbage_sizes, default=0)

        # Optionally: insert results into Supabase
        supabase.table("report").insert({
            "pothole_size": avg_pothole,
            "garbage_size": avg_garbage,
            "status": "Pending"
        }).execute()

        return jsonify({
            "avg_pothole_size": avg_pothole,
            "max_pothole_size": max_pothole,
            "avg_garbage_size": avg_garbage,
            "max_garbage_size": max_garbage,
            "potholes_detected": len(pothole_sizes),
            "garbage_detected": len(garbage_sizes)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.remove(filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
