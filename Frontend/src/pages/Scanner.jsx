import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, X, Upload, Zap } from "lucide-react";
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
  const barcodeScanReqRef = useRef(null); // Changed to requestAnimationFrame ID

  const initialMode = location.state?.mode || "camera";
  const [mode, setMode] = useState(initialMode);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState(null);
  
  // Check support safely
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
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
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

      if (streamRef.current) {
        stopCamera();
      }

      // ✅ IMPROVEMENT: Request higher resolution (1080p ideal)
      // This helps significantly with scanning barcodes "away from the camera"
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
        // Wait for video to actually load data to prevent black screen flashes
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.error("Camera Error:", err);
      // Fallback to basic constraints if high-res fails
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

  // 🔍 BARCODE SCAN LOGIC (The missing piece)
  const startBarcodeScan = async () => {
    if (!BARCODE_DETECTOR_SUPPORTED || !videoRef.current) return;

    // ✅ IMPROVEMENT: Define formats explicitly to speed up detection
    // Removing rarely used formats makes the detector run faster per frame
    const formats = [
      "ean_13", "ean_8", 
      "upc_a", "upc_e", 
      "code_128", "code_39", 
      "qr_code"
    ];

    try {
      const barcodeDetector = new window.BarcodeDetector({ formats });

      const renderLoop = async () => {
        // Stop if we found something, or mode changed, or camera stopped
        if (detectedBarcode || mode !== "barcode" || !videoRef.current) return;

        try {
          // ✅ IMPROVEMENT: Pass the full video element
          // This scans the ENTIRE visible feed, not just a cutout
          const barcodes = await barcodeDetector.detect(videoRef.current);

          if (barcodes.length > 0) {
            const bestMatch = barcodes[0].rawValue;
            playBeep();
            setDetectedBarcode(bestMatch);
            stopBarcodeScan(); // Stop scanning loop immediately
          } else {
            // ✅ IMPROVEMENT: Use requestAnimationFrame for max speed (smooth 60fps)
            barcodeScanReqRef.current = requestAnimationFrame(renderLoop);
          }
        } catch (err) {
          // If detection fails (e.g. video not ready), retry next frame
          barcodeScanReqRef.current = requestAnimationFrame(renderLoop);
        }
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
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopBarcodeScan();
    };
  }, []);

  useEffect(() => {
    // Only start scanning if mode is barcode, camera is ready, and we haven't found one yet
    if (mode === "barcode" && cameraActive && !capturedImage && !detectedBarcode) {
      // Small delay to ensure video frame has valid data
      const t = setTimeout(() => startBarcodeScan(), 500);
      return () => {
        clearTimeout(t);
        stopBarcodeScan();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cameraActive, capturedImage, detectedBarcode]); // Removed BARCODE_DETECTOR_SUPPORTED from deps to avoid re-trigger issues

  // 📸 CAPTURE IMAGE
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    
    // Capture at full video resolution for best OCR results
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
    if (mode === "camera" || mode === "barcode") {
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  const handleScanAgain = () => {
    setDetectedBarcode(null);
    if (mode === "barcode") {
        // Immediate restart for snappy UX
        setTimeout(() => startCamera(), 100);
    }
  };

  // ... (Keep handleUseBarcode, handleUploadClick, handleFileChange, handleUsePhoto as is) ...
  // Added back purely for context so the component is complete, assuming logic is same as previous
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
        const verdictMap = { 'Safe': 'safe', 'Moderate': 'caution', 'Risky': 'danger', 'Hazardous': 'danger' };
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
        alert(backendRes.data.message || "Product not found.");
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Barcode lookup failed:", error);
      alert("Failed to lookup barcode.");
      setIsAnalyzing(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target.result);
      stopCamera();
    };
    reader.readAsDataURL(file);
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
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* 🔍 OVERLAY - Pass flag to hide cutout UI if in barcode mode since we scan everywhere now? 
          Optional: You might want to keep the overlay for UI guidance only. */}
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

      {/* 📸 CAPTURE BUTTON (Hidden in Barcode mode to reduce confusion, or keep if you want manual capture) */}
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
          <div className="flex gap-4 mt-8 w-full max-w-sm justify-center">
            <button
              onClick={handleRetake}
              disabled={isAnalyzing}
              className="flex-1 py-3.5 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 transition"
            >
              Retake
            </button>
            <button
              onClick={handleUsePhoto}
              disabled={isAnalyzing}
              className="flex-1 py-3.5 rounded-xl bg-green-500 text-black font-bold hover:bg-green-400 transition flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : "Use Photo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;