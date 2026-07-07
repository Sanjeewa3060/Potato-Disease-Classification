
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf

app = FastAPI(title="LeafGuard AI", description="Potato Leaf Disease Classification API")

# CORS
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
MODEL_PATH = BASE_DIR.parent / "potatoes.h5"

# Load model once at startup
MODEL = tf.keras.models.load_model(str(MODEL_PATH), compile=False)

# Class labels - order must match model output index
CLASS_NAMES = ["Early Blight", "Late Blight", "Healthy"]

# Mount static files (CSS, JS, images)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def serve_index():
    """Serve the LeafGuard AI frontend."""
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Frontend not found")
    return FileResponse(str(index_file))


@app.get("/ping")
async def ping():
    """Health check endpoint."""
    return {"status": "alive", "model": "loaded"}


def read_file_as_image(data: bytes) -> np.ndarray:
    """Decode uploaded bytes to a normalised float32 numpy array."""
    image = Image.open(BytesIO(data)).convert("RGB")
    image = image.resize((256, 256))
    return np.array(image, dtype=np.float32) / 255.0


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Classify a potato leaf image.
    Returns predicted class, confidence, and full probability distribution.
    """
    # Validate MIME type
    if file.content_type not in ("image/jpeg", "image/jpg", "image/png"):
        raise HTTPException(
            status_code=422,
            detail="Only JPEG and PNG images are supported."
        )

    image = read_file_as_image(await file.read())
    img_batch = np.expand_dims(image, 0)

    predictions = MODEL.predict(img_batch, verbose=0)
    raw_probs = predictions[0]          # shape (3,)

    predicted_idx = int(np.argmax(raw_probs))
    predicted_class = CLASS_NAMES[predicted_idx]
    confidence = float(raw_probs[predicted_idx])

    # Build a full probability dict for the frontend chart/bars
    probabilities = {name: float(prob) for name, prob in zip(CLASS_NAMES, raw_probs)}

    return {
        "class": predicted_class,
        "confidence": confidence,
        "probabilities": probabilities
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
