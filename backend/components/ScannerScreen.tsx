'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import jsQR from 'jsqr';
import type { Worker } from 'tesseract.js';
import { parseScan, type ParsedScan } from '@/lib/parseScan';

type Phase = 'starting' | 'scanning' | 'recognizing' | 'confirm' | 'camera-error';

const QR_SCAN_INTERVAL_MS = 300;

export default function ScannerScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ocrWorkerRef = useRef<Worker | null>(null);

  const [phase, setPhase] = useState<Phase>('starting');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const [rawText, setRawText] = useState('');
  const [scanType, setScanType] = useState('qr');
  const [brand, setBrand] = useState('');
  const [modelNo, setModelNo] = useState('');
  const [serialNo, setSerialNo] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const stopQrLoop = useCallback(() => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
  }, []);

  const applyParsed = useCallback((text: string, type: string) => {
    const parsed: ParsedScan = parseScan(text);
    setRawText(text);
    setScanType(type);
    setBrand(parsed.brand);
    setModelNo(parsed.modelNo);
    setSerialNo(parsed.serialNo);
    setSaved(false);
    setSaveError(null);
    setPhase('confirm');
  }, []);

  const startQrLoop = useCallback(() => {
    stopQrLoop();
    qrIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, width, height);
      if (code?.data) {
        stopQrLoop();
        applyParsed(code.data, 'qr');
      }
    }, QR_SCAN_INTERVAL_MS);
  }, [applyParsed, stopQrLoop]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setPhase('scanning');
        startQrLoop();
      } catch (err) {
        setCameraError(err instanceof Error ? err.message : 'Could not access the camera.');
        setPhase('camera-error');
      }
    }

    start();

    return () => {
      cancelled = true;
      stopQrLoop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      ocrWorkerRef.current?.terminate();
      ocrWorkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOcr = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    stopQrLoop();
    setOcrError(null);
    setPhase('recognizing');

    try {
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, width, height);

      if (!ocrWorkerRef.current) {
        const { createWorker } = await import('tesseract.js');
        ocrWorkerRef.current = await createWorker('eng');
      }
      const { data } = await ocrWorkerRef.current.recognize(canvas);
      const text = data.text.trim();
      if (!text) {
        throw new Error('No text recognized — try holding the label steadier and closer.');
      }
      applyParsed(text, 'ocr');
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'Text recognition failed.');
      setPhase('scanning');
      startQrLoop();
    }
  }, [applyParsed, startQrLoop, stopQrLoop]);

  const rescan = useCallback(() => {
    setSaved(false);
    setSaveError(null);
    setOcrError(null);
    setPhase('scanning');
    startQrLoop();
  }, [startQrLoop]);

  const onSave = useCallback(async () => {
    if (!modelNo.trim() || !serialNo.trim()) {
      setSaveError('Model no. and serial no. are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand.trim(),
          modelNo: modelNo.trim(),
          serialNo: serialNo.trim(),
          rawScan: rawText,
          scanType,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Save failed (${res.status}): ${body}`);
      }
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [brand, modelNo, serialNo, rawText, scanType]);

  return (
    <main className="scanner-page">
      <div className="header-row">
        <h1>Scan a Device</h1>
        <div className="header-actions">
          <Link className="button secondary" href="/install">
            Get the app
          </Link>
          <Link className="button secondary" href="/">
            Admin panel
          </Link>
        </div>
      </div>

      {phase !== 'confirm' && (
        <>
          <div className="camera-frame">
            <video ref={videoRef} autoPlay muted playsInline />
            {phase === 'scanning' && <p className="camera-hint">Point the camera at a QR code</p>}
            {phase === 'recognizing' && <p className="camera-hint">Reading text…</p>}
          </div>

          {phase === 'camera-error' && (
            <p className="status-text error">
              {cameraError ?? 'Could not access the camera.'} Camera access requires HTTPS (or
              localhost) and browser permission.
            </p>
          )}

          {(phase === 'scanning' || phase === 'recognizing') && (
            <div className="action-row">
              <button
                type="button"
                className="button"
                onClick={runOcr}
                disabled={phase === 'recognizing'}
              >
                {phase === 'recognizing' ? 'Reading…' : "Can't find a QR code? Scan the label"}
              </button>
            </div>
          )}

          {ocrError && <p className="status-text error">{ocrError}</p>}
        </>
      )}

      {phase === 'confirm' && (
        <div>
          <p className="status-text">
            Recognized via {scanType === 'qr' ? 'QR code' : 'text recognition'} — review before
            saving.
          </p>

          <div className="field">
            <label htmlFor="brand">Brand</label>
            <input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Acme"
            />
          </div>
          <div className="field">
            <label htmlFor="modelNo">Model No.</label>
            <input
              id="modelNo"
              value={modelNo}
              onChange={(e) => setModelNo(e.target.value)}
              placeholder="e.g. ABC-1234"
            />
          </div>
          <div className="field">
            <label htmlFor="serialNo">Serial No.</label>
            <input
              id="serialNo"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              placeholder="e.g. SN00012345"
            />
          </div>

          <div className="raw-box">Raw: {rawText}</div>

          {saveError && <p className="status-text error">{saveError}</p>}
          {saved && <p className="status-text">Saved to the admin panel.</p>}

          <div className="action-row">
            <button type="button" className="button" onClick={onSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save to admin panel'}
            </button>
            <button type="button" className="button secondary" onClick={rescan}>
              Scan another
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </main>
  );
}
