import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, X, Upload, Barcode } from "lucide-react";
// 👇 IMPORT THE POLYFILL (required for iOS Safari – no native BarcodeDetector)
import { BarcodeDetectorPolyfill } from "@undecaf/barcode-detector-polyfill";

// Install polyfill on window when native API is missing (iPhone, Firefox, etc.)
if (typeof window !== "undefined" && !window.BarcodeDetector) {
  window.BarcodeDetector = BarcodeDetectorPolyfill;
}

import ScanModeToggle from "../components/scanner/ScanModeToggle";
import ScannerOverlay from "../components/scanner/ScannerOverlay";
import { useScanHistory } from "@/context/ScanHistoryContext";

// Backend base URL
const API_BASE = import.meta.env.VITE_API_URL || "https://label-lens-backend.onrender.com";

// 🔊 SOUND URL: You can replace this string with a local import like: 
// import beepSrc from "../assets/beep.mp3"; 
const SCAN_SOUND_URL = "https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3"; // Simple crisp beep

const Scanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addScan } = useScanHistory();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const barcodeScanReqRef = useRef(null);
  const barcodeLastScanTimeRef = useRef(0);
  
  // 🔊 Audio Ref
  const audioRef = useRef(new Audio(SCAN_SOUND_URL));

  const DETECTION_INTERVAL_MS = 380; 

  const initialMode = location.state?.mode || "barcode";
  const [mode, setMode] = useState(initialMode);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState(null);
  const [barcodeFromUpload, setBarcodeFromUpload] = useState(null);
  const [isDetectingBarcodeFromUpload, setIsDetectingBarcodeFromUpload] = useState(false);

  // 🔊 Unlock audio on first user interaction (Critically needed for iOS/Chrome)
  useEffect(() => {
    const unlockAudio = () => {
      const audio = audioRef.current;
      // Play mute briefly to unlock the audio engine for this element
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false; // Unmute for future actual plays
      }).catch(err => console.warn("Audio unlock failed", err));

      ["touchstart", "touchend", "mousedown", "click"].forEach((e) =>
        document.body.removeEventListener(e, unlockAudio)
      );
    };

    ["touchstart", "touchend", "mousedown", "click"].forEach((e) =>
      document.body.addEventListener(e, unlockAudio, { once: true, passive: true })
    );
  }, []);

  // 🔊 Play beep + vibrate on successful scan
  const onScanSuccess = () => {
    // 1. Vibrate
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    // 2. Play Sound
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0; // Reset to start (allows rapid fire scanning)
      audio.volume = 1.0;    // Ensure max volume
      audio.play().catch((e) => console.error("Sound play failed:", e));
    }
  };

  // 🎥 START CAMERA
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Camera not supported");
        return;
      }

      if (streamRef.current) stopCamera();

      const constraints = {
        video: { 
          facingMode: "environment", 
          width: { ideal: 1920 },
          height: { ideal: 1080 } 
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.error("Camera Error:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setCameraActive(true);
        }
      } catch {
        alert("Camera permission denied or not supported.");
        setCameraActive(false);
      }
    }
  };

  // 🛑 STOP CAMERA
  const stopCamera = () => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // 🔍 BARCODE SCAN LOGIC
  const startBarcodeScan = async () => {
    if (!videoRef.current) return;

    const formats = [
      "ean_13", "ean_8",
      "upc_a", "upc_e",
      "code_128", "code_39",
      "qr_code"
    ];

    try {
      const DetectorClass = window.BarcodeDetector;
      if (!DetectorClass) {
        console.error("BarcodeDetector not available");
        return;
      }

      const barcodeDetector = new DetectorClass({ formats });
      barcodeLastScanTimeRef.current = 0;

      const renderLoop = async () => {
        if (detectedBarcode || mode !== "barcode" || !videoRef.current) return;

        const video = videoRef.current;
        const now = Date.now();
        const timeSinceLastScan = now - barcodeLastScanTimeRef.current;

        const hasDimensions = video.videoWidth > 0 && video.videoHeight > 0;
        const isReady = video.readyState >= video.HAVE_ENOUGH_DATA;
        const shouldScan = hasDimensions && isReady && timeSinceLastScan >= DETECTION_INTERVAL_MS;

        if (shouldScan) {
          barcodeLastScanTimeRef.current = now;
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0) {
              const bestMatch = barcodes[0].rawValue;
              // 🔊 TRIGGER SOUND HERE
              onScanSuccess(); 
              setDetectedBarcode(bestMatch);
              stopBarcodeScan();
              return;
            }
          } catch {
            // Single frame failure – keep scanning
          }
        }

        barcodeScanReqRef.current = requestAnimationFrame(renderLoop);
      };

      renderLoop();
    } catch (err) {
      console.error("Barcode Detector initialization failed:", err);
    }
  };

  const stopBarcodeScan = () => {
    if (barcodeScanReqRef.current) {
      cancelAnimationFrame(barcodeScanReqRef.current);
      barcodeScanReqRef.current = null;
    }
  };

  const detectBarcodeFromImage = (imageSrc) => {
    const formats = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"];
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const DetectorClass = window.BarcodeDetector;
          if (!DetectorClass) {
            resolve(null);
            return;
          }
          const detector = new DetectorClass({ formats });
          const barcodes = await detector.detect(img);
          resolve(barcodes.length > 0 ? barcodes[0].rawValue : null);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageSrc;
    });
  };

  useEffect(() => {
    if (mode === "camera" || mode === "barcode") {
      startCamera();
      setIsScanning(true);
    } else {
      stopCamera();
      setIsScanning(false);
      stopBarcodeScan();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "barcode") {
      setDetectedBarcode(null);
    } else {
      setBarcodeFromUpload(null);
      setIsDetectingBarcodeFromUpload(false);
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopBarcodeScan();
    };
  }, []);

  useEffect(() => {
    if (mode === "barcode" && cameraActive && !capturedImage && !detectedBarcode) {
      const t = setTimeout(() => startBarcodeScan(), 500);
      return () => {
        clearTimeout(t);
        stopBarcodeScan();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cameraActive, capturedImage, detectedBarcode]); 

  // 📸 CAPTURE IMAGE
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = canvas.toDataURL("image/png");
    setCapturedImage(imgData);
    stopCamera();
    stopBarcodeScan();
  };

  const handleRetake = async () => {
    setCapturedImage(null);
    setDetectedBarcode(null);
    setBarcodeFromUpload(null);
    setIsDetectingBarcodeFromUpload(false);
    if (mode === "camera" || mode === "barcode") {
      setTimeout(() => startCamera(), 100);
    }
  };

  const handleScanAgain = () => {
    setDetectedBarcode(null);
    if (mode === "barcode") {
        setTimeout(() => startCamera(), 100);
    }
  };

  const handleUseBarcode = async () => {
    if (!detectedBarcode) return;
    setIsAnalyzing(true);
    
    const barcodeToSend = String(detectedBarcode).trim();
    console.log("Sending barcode to backend:", barcodeToSend);

    try {
      const backendRes = await axios.post(`${API_BASE}/api/ocr/barcode-lookup`, 
        { barcode: barcodeToSend }, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, 
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Backend Response:", backendRes.data);

      if (backendRes.data.success) {
        const data = backendRes.data.data;
        const historyItem = {
          id: Date.now(),
          code: barcodeToSend,
          productName: data.productName,
          ingredients: data.ingredients,
          image: data.image || data.imageUrl,
          brand: data.brand || "—",
          score: data.riskScore ?? 0,
          verdict: (data.verdict || "safe").toLowerCase(),
          analysisSummary: data.analysisSummary || "Product info from Open Food Facts.",
          flaggedIngredients: data.flaggedIngredients || [],
          alternatives: data.alternatives || [],
          timestamp: new Date().toISOString()
        };
        addScan(historyItem);
        navigate("/results", { state: { result: historyItem } });
      } else {
        alert(backendRes.data.message || "Product not found.");
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Barcode lookup failed:", error);
      alert("Failed to lookup barcode. Check console for details.");
      setIsAnalyzing(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedImage(dataUrl);
      stopCamera();
      if (mode === "barcode") {
        setBarcodeFromUpload(null);
        setIsDetectingBarcodeFromUpload(true);
        detectBarcodeFromImage(dataUrl).then((barcode) => {
          if (barcode) {
            onScanSuccess(); // 🔊 PLAY SOUND + VIBRATE
          }
          setBarcodeFromUpload(barcode);
          setIsDetectingBarcodeFromUpload(false);
        });

      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUsePhotoAsBarcode = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    try {
      const barcode = barcodeFromUpload ?? (await detectBarcodeFromImage(capturedImage));
      if (!barcode) {
        alert("No barcode found in this image. Try a clearer photo of the barcode.");
        setIsAnalyzing(false);
        return;
      }
      const barcodeToSend = String(barcode).replace(/\D/g, "").trim() || barcode;
      const backendRes = await axios.post(`${API_BASE}/api/ocr/barcode-lookup`, { barcode: barcodeToSend }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      if (backendRes.data.success) {
        const data = backendRes.data.data;
        const historyItem = {
          id: Date.now(),
          code: barcodeToSend,
          productName: data.productName,
          ingredients: data.ingredients,
          image: data.image || data.imageUrl,
          brand: data.brand || "—",
          score: data.riskScore ?? 0,
          verdict: (data.verdict || "safe").toLowerCase(),
          analysisSummary: data.analysisSummary || "Product info from Open Food Facts.",
          flaggedIngredients: data.flaggedIngredients || [],
          alternatives: data.alternatives || [],
          timestamp: new Date().toISOString()
        };
        addScan(historyItem);
        navigate("/results", { state: { result: historyItem } });
      } else {
        alert(backendRes.data.message || "Product not found.");
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Barcode lookup failed:", error);
      const msg = error.response?.data?.message || error.response?.data?.error ||
        (error.code === "ECONNREFUSED" ? "Cannot reach server. Is the backend running?" : "Failed to lookup barcode.");
      alert(msg);
      setIsAnalyzing(false);
    }
  };

  const handleUsePhoto = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob, 'scan.png');
      const backendRes = await axios.post('/api/ocr/process-scan', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (backendRes.data.success) {
        const data = backendRes.data.data;
        const verdictMap = { 'Safe': 'safe', 'Moderate': 'caution', 'Risky': 'danger', 'Hazardous': 'danger' };
        const historyItem = {
          id: Date.now(),
          productName: data.productName || "Unknown Product",
          brand: data.brand || "Generic",
          score: data.riskScore,
          verdict: verdictMap[data.verdict] || 'caution',
          timestamp: new Date().toISOString(),
          image: data.imageUrl || capturedImage,
          analysisSummary: data.analysisSummary,
          flaggedIngredients: data.flaggedIngredients,
          alternatives: data.alternatives
        };
        addScan(historyItem);
        navigate("/results", { state: { result: historyItem } });
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze image.");
      setIsAnalyzing(false);
    }
  };

  const handleUsePhotoOrBarcode = () => {
    if (mode === "barcode") handleUsePhotoAsBarcode();
    else handleUsePhoto();
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 🎥 CAMERA STREAM */}
      {(mode === "camera" || mode === "barcode") && !capturedImage && (
        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* 🔍 OVERLAY */}
      {!capturedImage && !detectedBarcode && <ScannerOverlay isScanning={isScanning} mode={mode} />}

      {/* 🏷️ DETECTED BARCODE RESULT */}
      {mode === "barcode" && detectedBarcode && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[28px] bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl p-6 flex flex-col items-center">
            <div className="bg-white/10 p-3 rounded-full mb-3 ring-1 ring-white/20">
              <Barcode className="text-white h-7 w-7" />
            </div>
            <p className="text-white/90 text-sm font-medium uppercase tracking-wider mb-3">Barcode Found</p>
            <p className="text-2xl font-mono font-bold text-white text-center break-all bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 mb-6 w-full">
              {detectedBarcode}
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleUseBarcode}
                disabled={isAnalyzing}
                className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" /> : "View Product Details"}
              </button>
              <button
                onClick={handleScanAgain}
                disabled={isAnalyzing}
                className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/10"
              >
                Scan Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔝 HEADER */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/home')}
            className="rounded-full bg-black/40 backdrop-blur-md p-3 text-white hover:bg-black/60 transition-colors"
            disabled={isAnalyzing}
          >
            <X size={24} />
          </button>
          <ScanModeToggle mode={mode} onModeChange={setMode} />
        </div>
        {(mode === "camera" || mode === "barcode") && !capturedImage && !detectedBarcode && (
          <div className="flex justify-center">
            <button
              onClick={handleUploadClick}
              className="rounded-full bg-black/40 backdrop-blur-md px-6 py-3 text-white hover:bg-black/60 transition-all flex items-center gap-2 border border-white/10"
              disabled={isAnalyzing}
            >
              <Upload size={18} />
              <span className="text-sm font-medium">Upload</span>
            </button>
          </div>
        )}
      </div>

      {/* 📸 CAPTURE BUTTON */}
      {mode === "camera" && !capturedImage && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20">
          <button
            onClick={handleCapture}
            disabled={!cameraActive}
            className="h-20 w-20 rounded-full border-4 border-white/50 bg-white/20 flex items-center justify-center backdrop-blur-sm disabled:opacity-50"
          >
            <div className="h-16 w-16 rounded-full bg-white shadow-lg active:scale-95 transition-transform" />
          </button>
        </div>
      )}
      
      {/* 🏷️ BARCODE HINT TEXT */}
      {mode === "barcode" && !detectedBarcode && (
        <div className="absolute bottom-12 left-0 right-0 text-center z-20 pointer-events-none">
          <p className="text-white/80 bg-black/40 inline-block px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium">
             Point camera at any barcode
          </p>
        </div>
      )}

      {/* 🖼 CAPTURED IMAGE PREVIEW */}
      {capturedImage && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300">
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="max-w-full max-h-[60%] rounded-xl shadow-2xl border border-gray-700 object-contain" 
          />
          {mode === "barcode" && (
            <div className="mt-4 w-full max-w-sm text-center">
              {isDetectingBarcodeFromUpload ? (
                <p className="text-white/70 text-sm font-medium flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Detecting barcode...
                </p>
              ) : barcodeFromUpload ? (
                <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/20">
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Detected barcode</p>
                  <p className="text-xl font-mono font-bold text-white break-all">{barcodeFromUpload}</p>
                </div>
              ) : (
                <p className="text-white/50 text-sm">No barcode detected in this image.</p>
              )}
            </div>
          )}
          <div className="flex gap-4 mt-8 w-full max-w-sm justify-center">
            <button
              onClick={handleRetake}
              disabled={isAnalyzing}
              className="flex-1 py-3.5 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 transition"
            >
              Retake
            </button>
            <button
              onClick={handleUsePhotoOrBarcode}
              disabled={isAnalyzing}
              className="flex-1 py-3.5 rounded-xl bg-green-500 text-black font-bold hover:bg-green-400 transition flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : (mode === "barcode" ? "Look up barcode" : "Use Photo")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;