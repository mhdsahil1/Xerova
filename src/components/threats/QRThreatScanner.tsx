"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsQR from "jsqr";
import {
  QrCode,
  Camera,
  UploadCloud,
  RefreshCw,
  Play,
  Pause,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Wifi,
  FileText,
  Eye,
  EyeOff,
  Download,
  Search,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Zap,
  Lock,
  Unlock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { classifyPayload, parseWifiPayload, analyzePlainTextPayload } from "@/lib/qr-classifier";
import type { WifiConfigResult, TextAnalysisResult } from "@/lib/qr-classifier";
import type { URLAnalysisResult } from "@/lib/url-analyzer";
import type { ResolutionResult } from "@/lib/url-resolver";

interface QRScanResponse {
  success: boolean;
  type: "url" | "wifi" | "text";
  rawPayload: string;
  verdict?: "SAFE" | "SUSPICIOUS" | "MALICIOUS" | "INFO";
  resolution?: ResolutionResult;
  data?: URLAnalysisResult;
  wifiData?: WifiConfigResult;
  textData?: TextAnalysisResult;
  error?: string;
}

interface QRThreatScannerProps {
  onInvestigateUrl?: (url: string) => void;
  onNavigateToURLAnalyzer?: (url: string) => void;
}

// Subtle audio alert synthesis via Web Audio API on successful decode
function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.08); // A6
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.13);
  } catch {
    // Audio synthesis not allowed or supported
  }
}

export function QRThreatScanner({ onInvestigateUrl, onNavigateToURLAnalyzer }: QRThreatScannerProps) {
  // Mode: "camera" or "upload"
  const [activeMode, setActiveMode] = useState<"camera" | "upload">("camera");

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // Scan & Result state
  const [isScanning, setIsScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [scanResult, setScanResult] = useState<QRScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Copy helper
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Enumerate cameras
  const getCameraDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn("Could not enumerate camera devices:", err);
    }
  }, [selectedDeviceId]);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsScanning(false);
  }, []);

  // Submit decoded payload to backend threat analysis
  const processDecodedPayload = useCallback(async (payloadText: string) => {
    if (!payloadText.trim()) return;

    playBeep();
    setAnalyzing(true);
    setError(null);
    setCurrentStep("Classifying QR code payload...");

    try {
      const type = classifyPayload(payloadText);

      if (type === "wifi") {
        setCurrentStep("Parsing Wi-Fi configuration parameters...");
        const res = await fetch("/api/threats/qr-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: payloadText }),
        });
        const data: QRScanResponse = await res.json();
        if (!res.ok) throw new Error(data.error || "Wi-Fi scan failed");
        setScanResult(data);
      } else if (type === "text") {
        setCurrentStep("Evaluating text entropy and injection markers...");
        const res = await fetch("/api/threats/qr-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: payloadText }),
        });
        const data: QRScanResponse = await res.json();
        if (!res.ok) throw new Error(data.error || "Text scan failed");
        setScanResult(data);
      } else {
        // URL Path
        setCurrentStep("Validating SSRF boundaries & resolving redirect chain...");
        const res = await fetch("/api/threats/qr-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: payloadText }),
        });
        const data: QRScanResponse = await res.json();
        if (!res.ok) throw new Error(data.error || "URL threat lookup failed");
        setScanResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze QR payload.");
    } finally {
      setAnalyzing(false);
      setCurrentStep("");
    }
  }, []);

  // Scan video frame loop
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      // Successfully detected QR code in frame
      stopCamera();
      processDecodedPayload(code.data);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [stopCamera, processDecodedPayload]);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported by your browser or connection is insecure (requires HTTPS).");
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setIsScanning(true);
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }

      await getCameraDevices();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to access camera.";
      setCameraError(msg);
      setCameraActive(false);
      setIsScanning(false);
    }
  }, [selectedDeviceId, facingMode, scanFrame, getCameraDevices]);

  // Handle mode switches
  useEffect(() => {
    if (activeMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode]);

  // Switch cameras
  const toggleCameraFacing = () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    setSelectedDeviceId("");
    if (cameraActive) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  };

  // Decode from file/image
  const decodeFromImage = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Try BarcodeDetector if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof window !== "undefined" && "BarcodeDetector" in window) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
            const barcodes = await detector.detect(canvas);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              processDecodedPayload(barcodes[0].rawValue);
              return;
            }
          } catch {
            // Fall through to jsQR
          }
        }

        // Fallback to jsQR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data) {
          processDecodedPayload(code.data);
        } else {
          setError("No QR code detected in the uploaded image. Please ensure the QR code is clear, well-lit, and uncropped.");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // File upload input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      decodeFromImage(file);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      decodeFromImage(file);
    } else {
      setError("Please drop a valid image file (PNG, JPG, WEBP, or SVG).");
    }
  };

  // Global paste handler for screenshots (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            decodeFromImage(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processDecodedPayload]);

  // Quick-test sample presets
  const runPreset = (payloadText: string) => {
    stopCamera();
    processDecodedPayload(payloadText);
  };

  // Export scan result as JSON
  const handleExportJson = () => {
    if (!scanResult) return;
    const jsonStr = JSON.stringify(scanResult, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xerova-qr-scan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset / Scan another
  const handleReset = () => {
    setScanResult(null);
    setError(null);
    if (activeMode === "camera") {
      startCamera();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Anti-Quishing Threat Scanner
                <Badge variant="outline" className="border-primary/40 text-primary text-[10px] font-mono uppercase">
                  Zero-Waste Intel
                </Badge>
              </h2>
              <p className="text-xs md:text-sm text-[#8a8f9d]">
                Hardware-accelerated QR code decoding, SSRF-safe URL unshortening, and unified threat evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* Input Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#12141a] border border-white/[0.08] shrink-0 self-start md:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveMode("camera")}
            className={`text-xs flex items-center gap-1.5 h-8 px-3 rounded-lg font-medium transition-all ${
              activeMode === "camera"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-[#8a8f9d] hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveMode("upload")}
            className={`text-xs flex items-center gap-1.5 h-8 px-3 rounded-lg font-medium transition-all ${
              activeMode === "upload"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-[#8a8f9d] hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload / Drop / Paste
          </Button>
        </div>
      </div>

      {/* Main View Area */}
      {!scanResult && !analyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Viewfinder / Dropzone Card (8 cols) */}
          <div className="lg:col-span-8">
            <Card className="bg-[#0e1017] border-white/[0.08] overflow-hidden relative shadow-2xl">
              <CardContent className="p-0 relative">
                {activeMode === "camera" ? (
                  /* ========================================================
                     CAMERA VIEWFINDER
                     ======================================================== */
                  <div className="relative aspect-video sm:aspect-[16/10] bg-black/95 flex items-center justify-center overflow-hidden">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        cameraActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Cyber Targeting HUD Overlay */}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        {/* Target Box with Glowing Corners */}
                        <div className="relative w-64 h-64 sm:w-72 sm:h-72 border border-primary/30 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(0,255,200,0.08)]">
                          {/* Corner Brackets */}
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />

                          {/* Animated Vertical Sweeping Laser Line */}
                          <motion.div
                            className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_#00ffcc]"
                            animate={{ y: [-130, 130, -130] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                          />

                          {/* Center Crosshair */}
                          <div className="w-2.5 h-2.5 border-t border-l border-primary/40" />
                        </div>

                        {/* Scanner Status Pill */}
                        <div className="absolute bottom-4 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-xs text-white/90 font-mono flex items-center gap-2 shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Align QR code inside target box
                        </div>
                      </div>
                    )}

                    {/* Camera Inactive / Permission Prompt */}
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#0a0c12]">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#8a8f9d]">
                          <Camera className="w-8 h-8" />
                        </div>
                        <div className="max-w-md space-y-1">
                          <h3 className="text-base font-semibold text-white">Camera Access Required</h3>
                          <p className="text-xs text-[#8a8f9d]">
                            {cameraError ||
                              "Allow camera access to continuously detect and inspect QR payloads in real-time."}
                          </p>
                        </div>
                        <Button
                          onClick={startCamera}
                          className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl text-xs h-10 px-5"
                        >
                          <Play className="w-3.5 h-3.5 mr-2" />
                          Start Live Camera
                        </Button>
                      </div>
                    )}

                    {/* Camera Controls Bar */}
                    {cameraActive && (
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {videoDevices.length > 1 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={toggleCameraFacing}
                            className="bg-black/70 hover:bg-black/90 text-white border border-white/15 rounded-lg text-xs h-8 px-2.5 backdrop-blur-md"
                            title="Switch Front/Back Camera"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={stopCamera}
                          className="bg-black/70 hover:bg-black/90 text-white border border-white/15 rounded-lg text-xs h-8 px-2.5 backdrop-blur-md"
                          title="Pause Scanner"
                        >
                          <Pause className="w-3.5 h-3.5 mr-1" />
                          Pause
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ========================================================
                     UPLOAD / DRAG & DROP / PASTE ZONE
                     ======================================================== */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-video sm:aspect-[16/10] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all border-2 border-dashed ${
                      dragOver
                        ? "border-primary bg-primary/[0.04]"
                        : "border-white/10 hover:border-white/20 bg-white/[0.01]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-primary mb-4 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <h3 className="text-base font-semibold text-white">Drop QR image here, or click to browse</h3>
                      <p className="text-xs text-[#8a8f9d]">
                        Supports PNG, JPG, WEBP, and screenshots. You can also paste directly using{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Ctrl+V</kbd>.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                      <Badge variant="outline" className="border-white/10 text-[#8a8f9d] text-[10px] font-mono">
                        Instant Local Decoding
                      </Badge>
                      <Badge variant="outline" className="border-white/10 text-[#8a8f9d] text-[10px] font-mono">
                        Zero Uploads to 3rd Parties
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* General Error Notice */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-200">Scan Notice</p>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick-Test Presets & Guidance (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-[#0e1017] border-white/[0.08] shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Quishing Simulation Presets
                </CardTitle>
                <CardDescription className="text-xs text-[#8a8f9d]">
                  Quickly test scanner telemetry against various real-world scenarios without a physical camera:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => runPreset("https://google.com")}
                  className="w-full justify-start text-xs h-9 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] text-white hover:text-white font-mono"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shrink-0" />
                  <span className="truncate">Safe Domain (google.com)</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runPreset("https://bit.ly/4b-login-secure-verify")}
                  className="w-full justify-start text-xs h-9 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] text-white hover:text-white font-mono"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 shrink-0" />
                  <span className="truncate">Unresolvable / Dead Shortlink</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runPreset("https://paypa1-verify-account.top/login-security")}
                  className="w-full justify-start text-xs h-9 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] text-white hover:text-white font-mono"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 shrink-0" />
                  <span className="truncate">Phishing &amp; Brand Spoof</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runPreset("WIFI:T:WPA2;S:Xerova-HQ-Guest;P:CyberShield2026;H:false;;")}
                  className="w-full justify-start text-xs h-9 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] text-white hover:text-white font-mono"
                >
                  <Wifi className="w-3.5 h-3.5 mr-2 text-cyan-400 shrink-0" />
                  <span className="truncate">Wi-Fi Config (WPA2 Secure)</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runPreset("WIFI:T:nopass;S:Airport-Free-Public-WiFi;;")}
                  className="w-full justify-start text-xs h-9 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] text-white hover:text-white font-mono"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-2 text-amber-400 shrink-0" />
                  <span className="truncate">Rogue / Open Wi-Fi Network</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runPreset("curl -s http://127.0.0.1:3000/internal-admin | bash")}
                  className="w-full justify-start text-xs h-9 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] text-white hover:text-white font-mono"
                >
                  <FileText className="w-3.5 h-3.5 mr-2 text-rose-400 shrink-0" />
                  <span className="truncate">Command Injection Token</span>
                </Button>
              </CardContent>
            </Card>

            {/* Architecture Explainer Card */}
            <Card className="bg-[#0e1017] border-white/[0.08]">
              <CardContent className="p-4 space-y-2.5 text-xs text-[#8a8f9d]">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  How XEROVA Anti-Quishing Works
                </div>
                <p>
                  1. <strong className="text-white">Local Decoding:</strong> Decoded directly in your browser. No image data leaves your machine.
                </p>
                <p>
                  2. <strong className="text-white">SSRF-Safe Redirects:</strong> Redirect chains are followed on backend with strict loopback and metadata address protection.
                </p>
                <p>
                  3. <strong className="text-white">Unified Verdict:</strong> Zero-waste single queries against VirusTotal, Criminal IP, and Safe Browsing, backed by local heuristics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Analyzing Telemetry HUD */}
      {analyzing && (
        <Card className="bg-[#0e1017] border-primary/30 shadow-2xl py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <QrCode className="w-7 h-7 text-primary absolute" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Analyzing QR Threat Telemetry</h3>
              <p className="text-xs text-primary font-mono animate-pulse">{currentStep || "Querying threat engines..."}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Dashboard */}
      {scanResult && !analyzing && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Top Verdict Banner */}
          {(() => {
            const isUrl = scanResult.type === "url";
            const verdict = scanResult.data?.verdict || scanResult.verdict || "SAFE";
            const isMalicious = verdict === "MALICIOUS";
            const isSuspicious = verdict === "SUSPICIOUS";
            const isSafe = verdict === "SAFE";
            const riskScore = scanResult.data?.riskScore ?? (isMalicious ? 90 : isSuspicious ? 60 : 10);

            const bannerBg = isMalicious
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : isSuspicious
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : isSafe
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300";

            return (
              <Card className={`border shadow-2xl overflow-hidden ${bannerBg}`}>
                <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/10 shrink-0">
                      {isMalicious ? (
                        <ShieldAlert className="w-8 h-8 text-rose-500" />
                      ) : isSuspicious ? (
                        <AlertTriangle className="w-8 h-8 text-amber-400" />
                      ) : (
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-2xl font-black tracking-wider uppercase font-mono">
                          {verdict}
                        </span>
                        <Badge
                          variant="outline"
                          className="uppercase font-mono text-[10px] tracking-wider bg-black/40 border-white/20 text-white"
                        >
                          Payload Type: {scanResult.type}
                        </Badge>
                        {scanResult.resolution && scanResult.resolution.hopCount > 0 && (
                          <Badge variant="outline" className="border-amber-400/40 text-amber-300 text-[10px] font-mono">
                            {scanResult.resolution.hopCount} Redirect Hops
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/80 max-w-2xl">
                        {isMalicious
                          ? "Critical threat detected. High consensus across threat intelligence vendors or dangerous credential-harvesting indicators."
                          : isSuspicious
                          ? "Potential risk indicators observed (e.g. unresolvable shortlink, brand lookalike, or dynamic DNS)."
                          : isUrl
                          ? "Target URL resolved cleanly with 0 threat flags across multi-vendor intelligence engines."
                          : "Payload successfully decoded and evaluated."}
                      </p>
                    </div>
                  </div>

                  {/* Risk Score Dial */}
                  {isUrl && (
                    <div className="flex items-center gap-4 bg-black/40 px-5 py-3 rounded-2xl border border-white/10 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Risk Score</div>
                        <div className="text-2xl font-black font-mono text-white leading-none mt-0.5">
                          {riskScore}
                          <span className="text-xs text-[#8a8f9d] font-normal">/100</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center">
                        <div
                          className={`w-3.5 h-3.5 rounded-full ${
                            isMalicious ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]" : isSuspicious ? "bg-amber-400 shadow-[0_0_10px_#fbbf24]" : "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })()}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e1017] p-3.5 rounded-xl border border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs text-[#8a8f9d] font-mono truncate max-w-xl">
              <span className="text-white font-semibold">Raw QR:</span>
              <span className="truncate text-slate-300">{scanResult.rawPayload}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(scanResult.rawPayload, "rawPayload")}
                className="text-xs h-8 bg-white/[0.04] border-white/10 hover:bg-white/10 text-white font-medium"
              >
                {copiedField === "rawPayload" ? (
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1" />
                )}
                Copy Payload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                className="text-xs h-8 bg-white/[0.04] border-white/10 hover:bg-white/10 text-white font-medium"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export JSON
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleReset}
                className="text-xs h-8 bg-white text-black hover:bg-white/90 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Scan Another
              </Button>
            </div>
          </div>

          {/* URL Specific Detailed Results */}
          {scanResult.type === "url" && scanResult.data && (
            <div className="space-y-6">
              {/* Redirect Chain Map (if shortener or redirects occurred) */}
              {scanResult.resolution && scanResult.resolution.redirectionChain.length > 1 && (
                <Card className="bg-[#0e1017] border-white/[0.08]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-primary" />
                      Unshortening &amp; Redirection Chain
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {scanResult.resolution.redirectionChain.map((hop, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs font-mono"
                      >
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 text-[10px] font-mono border-white/10 text-primary"
                        >
                          Hop {idx}
                        </Badge>
                        <span className="truncate flex-1 text-slate-300">{hop}</span>
                        {idx === scanResult.resolution!.redirectionChain.length - 1 && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">
                            Final Destination
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Multi-Vendor Intel Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Google Safe Browsing */}
                <Card className="bg-[#0e1017] border-white/[0.08] p-4 space-y-1.5">
                  <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Google Safe Browsing</div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    {scanResult.data.threatIntelligence.googleSafeBrowsing?.isThreat ? (
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" /> Malicious
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Clean
                      </span>
                    )}
                  </div>
                </Card>

                {/* VirusTotal */}
                <Card className="bg-[#0e1017] border-white/[0.08] p-4 space-y-1.5">
                  <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">VirusTotal v3</div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    {scanResult.data.threatIntelligence.virusTotal ? (
                      scanResult.data.threatIntelligence.virusTotal.maliciousEngines > 0 ? (
                        <span className="text-rose-400 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4" />{" "}
                          {scanResult.data.threatIntelligence.virusTotal.maliciousEngines} Flagged
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Clean (0 hits)
                        </span>
                      )
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" /> Unindexed (404)
                      </span>
                    )}
                  </div>
                </Card>

                {/* Criminal IP */}
                <Card className="bg-[#0e1017] border-white/[0.08] p-4 space-y-1.5">
                  <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Criminal IP</div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    {scanResult.data.threatIntelligence.criminalIP?.phishingScore ? (
                      <span className="text-amber-400">
                        Phishing {scanResult.data.threatIntelligence.criminalIP.phishingScore}%
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Clean
                      </span>
                    )}
                  </div>
                </Card>

                {/* Local Pre-Flight Heuristics */}
                <Card className="bg-[#0e1017] border-white/[0.08] p-4 space-y-1.5">
                  <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Local Heuristics</div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    {scanResult.data.domainCharacteristics?.brandImpersonationDetected ? (
                      <span className="text-rose-400">Brand Spoof</span>
                    ) : scanResult.data.domainCharacteristics?.hasSuspiciousTLD ? (
                      <span className="text-amber-400">Risky TLD</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Pass
                      </span>
                    )}
                  </div>
                </Card>
              </div>

              {/* Threat Indicators & Findings List */}
              {scanResult.data.findings && scanResult.data.findings.length > 0 && (
                <Card className="bg-[#0e1017] border-white/[0.08]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Security Findings &amp; Threat Indicators ({scanResult.data.findings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {scanResult.data.findings.map((f, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white">{f.category}</span>
                          <p className="text-[#8a8f9d]">{f.description}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono shrink-0 uppercase ${
                            f.severity === "CRITICAL"
                              ? "border-rose-500 text-rose-400 bg-rose-500/10"
                              : f.severity === "HIGH"
                              ? "border-amber-500 text-amber-400 bg-amber-500/10"
                              : "border-blue-500 text-blue-400 bg-blue-500/10"
                          }`}
                        >
                          {f.severity}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Deep Analysis Redirect Buttons */}
              <div className="flex flex-wrap gap-3">
                {onNavigateToURLAnalyzer && (
                  <Button
                    onClick={() => onNavigateToURLAnalyzer(scanResult.data?.url || scanResult.rawPayload)}
                    className="bg-primary text-black font-semibold text-xs h-9 px-4 rounded-xl"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-2" />
                    Open Deep URL Dossier
                  </Button>
                )}
                {onInvestigateUrl && (
                  <Button
                    variant="outline"
                    onClick={() => onInvestigateUrl(scanResult.data?.url || scanResult.rawPayload)}
                    className="bg-white/[0.04] border-white/10 hover:bg-white/10 text-white font-medium text-xs h-9 px-4 rounded-xl"
                  >
                    <Search className="w-3.5 h-3.5 mr-2" />
                    Query in Threat Lookup
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Wi-Fi Configuration View */}
          {scanResult.type === "wifi" && scanResult.wifiData && (
            <Card className="bg-[#0e1017] border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  Wi-Fi Network Configuration
                </CardTitle>
                <CardDescription className="text-xs text-[#8a8f9d]">
                  Analyzed Wi-Fi access configuration with protocol security advisory.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Network Name (SSID)</div>
                    <div className="text-sm font-bold text-white font-mono truncate">
                      {scanResult.wifiData.ssid}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Authentication Type</div>
                    <div className="text-sm font-bold text-white font-mono">
                      {scanResult.wifiData.authType}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Security Protocol</div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-mono ${
                        scanResult.wifiData.securityRating === "insecure"
                          ? "border-rose-500 text-rose-400 bg-rose-500/10"
                          : scanResult.wifiData.securityRating === "weak"
                          ? "border-amber-500 text-amber-400 bg-amber-500/10"
                          : "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                      }`}
                    >
                      {scanResult.wifiData.securityRating}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Hidden Network</div>
                    <div className="text-sm font-bold text-white font-mono">
                      {scanResult.wifiData.hidden ? "Yes" : "No"}
                    </div>
                  </div>
                </div>

                {/* Password field */}
                {scanResult.wifiData.password && (
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Wi-Fi Network Key / Password</div>
                      <div className="font-mono text-sm text-white">
                        {showWifiPassword ? scanResult.wifiData.password : "••••••••••••••••"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowWifiPassword(!showWifiPassword)}
                        className="text-xs h-8 text-[#8a8f9d] hover:text-white"
                      >
                        {showWifiPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(scanResult.wifiData?.password || "", "wifiPass")}
                        className="text-xs h-8 bg-white/5 border-white/10 text-white"
                      >
                        {copiedField === "wifiPass" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Security Advisory */}
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    scanResult.wifiData.securityRating === "insecure"
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                      : scanResult.wifiData.securityRating === "weak"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {scanResult.wifiData.securityRating === "insecure" ? (
                    <Unlock className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">Security Advisory: </span>
                    {scanResult.wifiData.advisory}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plain Text View */}
          {scanResult.type === "text" && scanResult.textData && (
            <Card className="bg-[#0e1017] border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Plain Text Payload Inspection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Length</div>
                    <div className="text-sm font-bold text-white font-mono">
                      {scanResult.textData.length} chars
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Word Count</div>
                    <div className="text-sm font-bold text-white font-mono">
                      {scanResult.textData.wordCount} words
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <div className="text-[10px] uppercase font-mono text-[#8a8f9d]">Shannon Entropy</div>
                    <div className="text-sm font-bold text-white font-mono">
                      {scanResult.textData.entropy}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-slate-200 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                  {scanResult.textData.rawText}
                </div>

                {scanResult.textData.suspiciousFlags.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-rose-400">Suspicious Signatures Detected:</div>
                    {scanResult.textData.suspiciousFlags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between"
                      >
                        <span>{flag.name}</span>
                        <Badge variant="outline" className="border-rose-500/40 text-rose-300 uppercase text-[10px]">
                          {flag.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
