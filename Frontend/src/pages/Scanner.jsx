import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, X, Upload } from "lucide-react";
import ScanModeToggle from "../components/scanner/ScanModeToggle";
import ScannerOverlay from "../components/scanner/ScannerOverlay";
import { useScanHistory } from "@/context/ScanHistoryContext";

const Scanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addScan } = useScanHistory();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const initialMode = location.state?.mode || "camera";
  const [mode, setMode] = useState(initialMode);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState(null);
  const barcodeScanIntervalRef = useRef(null);
  const BARCODE_DETECTOR_SUPPORTED = typeof window !== "undefined" && "BarcodeDetector" in window;

  // 🔊 Play a low beep sound on successful scan
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Low-ish beep
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Soft volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
      // Audio not supported, ignore silently
    }
  };

  // 🎥 START CAMERA
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Camera not supported");
        return;
      }

      // Stop existing stream first if any
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error(err);
      alert("Camera permission denied. Please allow access.");
      setCameraActive(false);
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

  // 🏷️ BARCODE AUTO-SCAN: run detection loop when in barcode mode with active camera
  const stopBarcodeScan = () => {
    if (barcodeScanIntervalRef.current) {
      clearInterval(barcodeScanIntervalRef.current);
      barcodeScanIntervalRef.current = null;
    }
  };

  const startBarcodeScan = () => {
    if (!BARCODE_DETECTOR_SUPPORTED || mode !== "barcode" || !videoRef.current || !streamRef.current) return;

    stopBarcodeScan();
    const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"] });

    barcodeScanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current?.srcObject) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const barcode = barcodes[0];
          playBeep(); // 🔊 Beep on successful scan
          setDetectedBarcode(barcode.rawValue || "Unknown");
          stopCamera();
          stopBarcodeScan();
        }
      } catch {
        // ignore single-frame detection errors
      }
    }, 300);
  };

  useEffect(() => {
    if (mode === "camera" || mode === "barcode") {
      startCamera();
      setIsScanning(true);
    } else {
      stopCamera();
      stopBarcodeScan();
      setIsScanning(false);
      if (mode === "manual") navigate("/manual-entry");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mode-only: start/stop camera on scan mode change
  }, [mode]);

  // Reset detected barcode when switching to barcode mode (so we can scan again)
  useEffect(() => {
    if (mode === "barcode") queueMicrotask(() => setDetectedBarcode(null));
  }, [mode]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopBarcodeScan();
    };
  }, []);

  useEffect(() => {
    if (mode === "barcode" && cameraActive && !capturedImage && !detectedBarcode && BARCODE_DETECTOR_SUPPORTED) {
      const t = setTimeout(() => startBarcodeScan(), 500);
      return () => {
        clearTimeout(t);
        stopBarcodeScan();
      };
    }
    stopBarcodeScan();
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startBarcodeScan reads refs; deps are sufficient
  }, [mode, cameraActive, capturedImage, detectedBarcode, BARCODE_DETECTOR_SUPPORTED]);

  // 📸 CAPTURE IMAGE
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const frameSize = mode === "camera" 
      ? { width: 300, height: 300 } 
      : { width: 320, height: 160 };

    canvas.width = frameSize.width;
    canvas.height = frameSize.height;
    const ctx = canvas.getContext("2d");

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const sx = (videoWidth - frameSize.width) / 2;
    const sy = (videoHeight - frameSize.height) / 2;

    ctx.drawImage(video, sx, sy, frameSize.width, frameSize.height, 0, 0, frameSize.width, frameSize.height);

    const imgData = canvas.toDataURL("image/png");
    setCapturedImage(imgData);
    stopCamera(); // Stop camera when image is captured
  };

  // 🟢 RETAKE IMAGE
  const handleRetake = async () => {
    setCapturedImage(null);
    setDetectedBarcode(null);
    // Restart camera after small delay to ensure clean state
    if (mode === "camera" || mode === "barcode") {
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  // 🔄 SCAN AGAIN (after barcode detected)
  const handleScanAgain = () => {
    setDetectedBarcode(null);
    if (mode === "barcode") {
      setTimeout(() => startCamera(), 100);
    }
  };

  // 🏷️ USE BARCODE - lookup product via OpenFoodFacts
  const handleUseBarcode = async () => {
    if (!detectedBarcode) return;
    
    setIsAnalyzing(true);

    try {
      const backendRes = await axios.post('/api/ocr/barcode-lookup', 
        { barcode: detectedBarcode },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (backendRes.data.success) {
        const data = backendRes.data.data;

        const verdictMap = {
          'Safe': 'safe',
          'Moderate': 'caution',
          'Risky': 'danger',
          'Hazardous': 'danger'
        };

        const historyItem = {
          id: Date.now(),
          productName: data.productName,
          brand: data.brand || "Unknown",
          score: data.riskScore,
          verdict: verdictMap[data.verdict] || 'caution',
          timestamp: new Date().toISOString(),
          image: data.imageUrl,
          analysisSummary: data.analysisSummary,
          flaggedIngredients: data.flaggedIngredients,
          alternatives: data.alternatives
        };

        addScan(historyItem);
        navigate("/results", { state: { result: historyItem } });
      } else {
        alert(backendRes.data.message || "Product not found in database.");
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Barcode lookup failed:", error);
      alert(error.response?.data?.message || "Failed to lookup barcode. Please try again.");
      setIsAnalyzing(false);
    }
  };

  // 📤 UPLOAD IMAGE FROM GALLERY
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert to base64 and display
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target.result);
      stopCamera(); // Stop camera when file is uploaded
    };
    reader.readAsDataURL(file);
  };

  // ✅ USE PHOTO (The New Logic)
  const handleUsePhoto = async () => {
    if (!capturedImage) return;
    
    setIsAnalyzing(true);

    try {
      // 1. Convert Base64 to Blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob, 'scan.png');

      // 2. Call Backend API
      const backendRes = await axios.post('/api/ocr/process-scan', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (backendRes.data.success) {
        const data = backendRes.data.data;

        // 3. Format Data for History
        const verdictMap = {
          'Safe': 'safe',
          'Moderate': 'caution',
          'Risky': 'danger',
          'Hazardous': 'danger'
        };

        const historyItem = {
          id: Date.now(),
          productName: data.productName || "Unknown Product",
          brand: data.brand || "Generic",
          score: data.riskScore,
          verdict: verdictMap[data.verdict] || 'caution',
          timestamp: new Date().toISOString(),
          image: data.imageUrl || capturedImage, // Prefer Cloudinary URL
          analysisSummary: data.analysisSummary,
          flaggedIngredients: data.flaggedIngredients,
          alternatives: data.alternatives
        };

        // 4. Save to Context & Navigate
        addScan(historyItem);
        navigate("/results", { state: { result: historyItem } });
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze image. Please try again.");
      setIsAnalyzing(false); // Only stop loading on error (on success we navigate away)
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Hidden file input for image upload */}
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
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* 🔍 OVERLAY */}
      {!capturedImage && !detectedBarcode && <ScannerOverlay isScanning={isScanning} mode={mode} />}

      {/* 🏷️ DETECTED BARCODE RESULT (barcode mode only) */}
      {mode === "barcode" && detectedBarcode && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 p-6">
          <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-2">Barcode detected</p>
          <p className="text-2xl md:text-3xl font-mono font-bold text-white text-center break-all bg-white/10 px-6 py-4 rounded-2xl border border-white/20 mb-8">
            {detectedBarcode}
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleScanAgain}
              disabled={isAnalyzing}
              className="px-8 py-3 rounded-full bg-gray-700 text-white font-semibold hover:bg-gray-600 transition disabled:opacity-50"
            >
              Scan Again
            </button>
            <button
              onClick={handleUseBarcode}
              disabled={isAnalyzing}
              className="px-8 py-3 rounded-full bg-green-600 text-white font-semibold hover:bg-green-500 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Looking up...
                </>
              ) : (
                "Use Barcode"
              )}
            </button>
          </div>
        </div>
      )}

      {/* 🔝 HEADER */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
        <button
          onClick={() => navigate('/home')}
          className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          disabled={isAnalyzing}
        >
          <X size={24} />
        </button>
        <ScanModeToggle mode={mode} onModeChange={setMode} />
      </div>

      {/* 📤 UPLOAD BUTTON */}
      {(mode === "camera" || mode === "barcode") && !capturedImage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={handleUploadClick}
            className="rounded-full bg-black/50 backdrop-blur-sm p-3 text-white hover:bg-black/70 transition-all flex items-center gap-2 px-4"
            disabled={isAnalyzing}
          >
            <Upload size={20} />
            <span className="text-sm font-medium">Upload</span>
          </button>
        </div>
      )}

      {/* 📸 CAPTURE BUTTON */}
      {(mode === "camera" || mode === "barcode") && !capturedImage && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20">
          <button
            onClick={handleCapture}
            disabled={!cameraActive}
            className="h-20 w-20 rounded-full border-4 border-white/50 bg-white/20 flex items-center justify-center backdrop-blur-sm disabled:opacity-50"
          >
            <div className="h-16 w-16 rounded-full bg-white shadow-lg active:scale-90 transition-transform" />
          </button>
        </div>
      )}

      {/* 🖼 CAPTURED IMAGE PREVIEW UI */}
      {capturedImage && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-4">
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="max-w-full max-h-[60%] rounded-xl shadow-2xl border border-gray-700" 
          />
          
          <div className="flex gap-6 mt-8">
            <button
              onClick={handleRetake}
              disabled={isAnalyzing}
              className="px-8 py-3 rounded-full bg-gray-700 text-white font-semibold hover:bg-gray-600 transition disabled:opacity-50"
            >
              Retake
            </button>
            <button
              onClick={handleUsePhoto}
              disabled={isAnalyzing}
              className="px-8 py-3 rounded-full bg-green-600 text-white font-semibold hover:bg-green-500 shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Analyzing...
                </>
              ) : (
                "Use Photo"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;