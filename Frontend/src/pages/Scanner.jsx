import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, X, Upload, Zap } from "lucide-react";
// 👇 IMPORT THE POLYFILL (required for iOS Safari – no native BarcodeDetector)
import { BarcodeDetectorPolyfill } from "@undecaf/barcode-detector-polyfill";

// Install polyfill on window when native API is missing (iPhone, Firefox, etc.)
if (typeof window !== "undefined" && !window.BarcodeDetector) {
  window.BarcodeDetector = BarcodeDetectorPolyfill;
}

import ScanModeToggle from "../components/scanner/ScanModeToggle";
import ScannerOverlay from "../components/scanner/ScannerOverlay";
import { useScanHistory } from "@/context/ScanHistoryContext";

// Backend base URL – use same as Login/Signup so barcode lookup hits the API in production
const API_BASE = import.meta.env.VITE_API_URL || "https://label-lens-backend.onrender.com";

const Scanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addScan } = useScanHistory();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const barcodeScanReqRef = useRef(null);
  const barcodeLastScanTimeRef = useRef(0);
  const DETECTION_INTERVAL_MS = 380; // Throttle so WASM can finish on slower devices (e.g. iPhone)

  const initialMode = location.state?.mode || "camera";
  const [mode, setMode] = useState(initialMode);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState(null);
  const [barcodeFromUpload, setBarcodeFromUpload] = useState(null);
  const [isDetectingBarcodeFromUpload, setIsDetectingBarcodeFromUpload] = useState(false);

  // 🔊 Play a low beep sound on successful scan
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
      // Audio not supported, ignore
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

      // iOS Safari handles constraints differently. 
      // We try high res, but if it fails, the browser usually falls back automatically.
      const constraints = {
        video: { 
          facingMode: "environment", // Essential for mobile rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 } 
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS requires 'playsInline' in the video tag (already added below)
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.error("Camera Error:", err);
      // Fallback for older devices/strict permissions
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
      } catch (retryErr) {
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

  // 🔍 BARCODE SCAN LOGIC (Cross-browser: native on Chrome/Android, polyfill on iOS/Firefox)
  const startBarcodeScan = async () => {
    if (!videoRef.current) return;

    const formats = [
      "ean_13", "ean_8",
      "upc_a", "upc_e",
      "code_128", "code_39",
      "qr_code"
    ];

    try {
      // window.BarcodeDetector is native where supported, or our polyfill (installed at top of file)
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

        // 1) Video must be playing with real dimensions (critical on iOS – often 0 until ready)
        const hasDimensions = video.videoWidth > 0 && video.videoHeight > 0;
        const isReady = video.readyState >= video.HAVE_ENOUGH_DATA;

        // 2) Throttle: run detection at most every DETECTION_INTERVAL_MS so WASM can finish on slower devices
        const shouldScan = hasDimensions && isReady && timeSinceLastScan >= DETECTION_INTERVAL_MS;

        if (shouldScan) {
          barcodeLastScanTimeRef.current = now;
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0) {
              const bestMatch = barcodes[0].rawValue;
              playBeep();
              setDetectedBarcode(bestMatch);
              stopBarcodeScan();
              return;
            }
          } catch {
            // Single frame failure (e.g. WASM busy) – keep scanning
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

  // Detect barcode from a static image (data URL or URL) – used for upload in barcode mode
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
      if (mode === "manual") navigate("/manual-entry");
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

  // ... (API Calls: handleUseBarcode, handleUploadClick, handleFileChange, handleUsePhoto remain the same) ...
  // Keep your existing API logic functions here exactly as they were in the previous file.
  
  const handleUseBarcode = async () => {
    if (!detectedBarcode) return;
    setIsAnalyzing(true);
    
    // CLEAN THE BARCODE BEFORE SENDING
    const barcodeToSend = String(detectedBarcode).trim();

    console.log("Sending barcode to backend:", barcodeToSend); // Check browser console

    try {
      const backendRes = await axios.post(`${API_BASE}/api/ocr/barcode-lookup`, 
        { barcode: barcodeToSend }, // Payload
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
          setBarcodeFromUpload(barcode);
          setIsDetectingBarcodeFromUpload(false);
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // In barcode mode with uploaded image: use detected barcode (or detect now) then lookup
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

  // In camera/photo mode: OCR + ingredient analysis
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

  // Use Photo: in barcode mode → detect barcode and lookup; in camera mode → OCR
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
      {(mode === "camera" || mode === "barcode") && !capturedImage && !detectedBarcode && (
        <video
          ref={videoRef}
          muted
          playsInline // ESSENTIAL FOR IPHONE
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* 🔍 OVERLAY */}
      {!capturedImage && !detectedBarcode && <ScannerOverlay isScanning={isScanning} mode={mode} />}

      {/* 🏷️ DETECTED BARCODE RESULT */}
      {mode === "barcode" && detectedBarcode && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 animate-in fade-in duration-200">
          <div className="bg-white/10 p-4 rounded-full mb-4 ring-1 ring-white/20">
            <Zap className="text-yellow-400 h-8 w-8 fill-yellow-400" />
          </div>
          <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-2">Barcode Found</p>
          <p className="text-3xl font-mono font-bold text-white text-center break-all bg-gradient-to-br from-white/20 to-white/5 px-8 py-4 rounded-2xl border border-white/20 mb-8 shadow-xl backdrop-blur-md">
            {detectedBarcode}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handleUseBarcode}
              disabled={isAnalyzing}
              className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : "View Product Details"}
            </button>
            <button
              onClick={handleScanAgain}
              disabled={isAnalyzing}
              className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}

      {/* 🔝 HEADER */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
        <button
          onClick={() => navigate('/home')}
          className="rounded-full bg-black/40 backdrop-blur-md p-3 text-white hover:bg-black/60 transition-colors"
          disabled={isAnalyzing}
        >
          <X size={24} />
        </button>
        <ScanModeToggle mode={mode} onModeChange={setMode} />
      </div>

      {/* 📤 UPLOAD BUTTON */}
      {(mode === "camera" || mode === "barcode") && !capturedImage && !detectedBarcode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={handleUploadClick}
            className="rounded-full bg-black/40 backdrop-blur-md px-5 py-2.5 text-white hover:bg-black/60 transition-all flex items-center gap-2 border border-white/10"
            disabled={isAnalyzing}
          >
            <Upload size={18} />
            <span className="text-sm font-medium">Upload</span>
          </button>
        </div>
      )}

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
          {/* Show detected barcode number in barcode mode */}
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