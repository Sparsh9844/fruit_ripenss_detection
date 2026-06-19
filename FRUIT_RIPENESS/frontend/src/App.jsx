import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);

  const [preview, setPreview] = useState(null);

  const [detectedImage, setDetectedImage] = useState("");

  const [result, setResult] = useState("");

  const [confidence, setConfidence] = useState("");

  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);

  async function sendToBackend(formData) {
    try {
      setLoading(true);

      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setResult(data.fruit || "Unknown");

      setConfidence(data.confidence || 0);

      setDetectedImage(data.image || "");
    } catch (error) {
      console.log(error);

      alert("Prediction Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePredict() {
    if (!image) {
      alert("Please upload image");

      return;
    }

    const formData = new FormData();

    formData.append("file", image);

    sendToBackend(formData);
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 640,
        },
      });

      videoRef.current.srcObject = stream;

      setPreview(null);

      setImage(null);

      setDetectedImage("");

      setResult("");

      setConfidence("");
    } catch {
      alert("Camera permission denied");
    }
  }

  async function detectCamera() {
    if (!videoRef.current || !videoRef.current.videoWidth) {
      alert("Open camera first");

      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = 640;

    canvas.height = 640;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(videoRef.current, 0, 0, 640, 640);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve));

    const formData = new FormData();

    formData.append("file", blob, "camera.jpg");

    sendToBackend(formData);
  }

  function clearData() {
    setImage(null);

    setPreview(null);

    setDetectedImage("");

    setResult("");

    setConfidence("");

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());

      videoRef.current.srcObject = null;
    }
  }

  return (
    <div className="app">
      <h1 className="title">Fruit Ripeness Detector 🍎</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];

          if (!file) return;

          setImage(file);

          setPreview(URL.createObjectURL(file));

          setDetectedImage("");

          setResult("");

          setConfidence("");
        }}
      />

      <div className="preview-section">
        {preview && (
          <div>
            <h3>Original</h3>

            <img src={preview} alt="" className="preview" />
          </div>
        )}

        <div>
          <h3>Camera</h3>

          <video ref={videoRef} autoPlay className="camera" />
        </div>

        {detectedImage && (
          <div>
            <h3>YOLO Detection</h3>

            <img src={detectedImage} alt="" className="preview" />
          </div>
        )}
      </div>

      <div className="buttons">
        <button onClick={handlePredict}>
          {loading ? "Detecting..." : "Detect Image"}
        </button>

        <button onClick={openCamera}>Open Camera</button>

        <button onClick={detectCamera}>Detect Camera</button>

        <button onClick={clearData}>Clear</button>
      </div>

      {result && (
        <div className="card">
          <h2>Prediction</h2>

          <h1>{result}</h1>

          <h3>Confidence Score</h3>

          <p>{Number(confidence).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
}

export default App;
