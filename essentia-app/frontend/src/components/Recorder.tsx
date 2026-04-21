"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioRecorder, MAX_DURATION_SEC, MIN_DURATION_SEC } from "@/lib/recorder";

interface Props {
  onComplete: (blob: Blob, durationSec: number) => void;
}

type RecordState = "idle" | "recording" | "stopping";

export function Recorder({ onComplete }: Props) {
  const [state, setState] = useState<RecordState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // MAX_DURATION_SEC に達したら自動停止
  useEffect(() => {
    if (elapsed >= MAX_DURATION_SEC && state === "recording") {
      handleStop();
    }
  }, [elapsed, state]);

  // 録音中：波形アニメーション
  useEffect(() => {
    if (state !== "recording") {
      cancelAnimationFrame(animFrameRef.current);
      // キャンバスをクリア
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const recorder = recorderRef.current;
    const canvas = canvasRef.current;
    if (!recorder || !canvas) return;

    const analyser = recorder.analyser;
    if (!analyser) return;

    const ctx2d = canvas.getContext("2d")!;
    const bufferLen = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLen);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const W = canvas.width;
      const H = canvas.height;

      ctx2d.fillStyle = "#1f1f1f"; // dark surface
      ctx2d.fillRect(0, 0, W, H);

      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = "#c4b5fd"; // Spotify green
      ctx2d.beginPath();

      const sliceW = W / bufferLen;
      let x = 0;
      for (let i = 0; i < bufferLen; i++) {
        const v = dataArray[i] / 128;
        const y = (v * H) / 2;
        if (i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
        x += sliceW;
      }
      ctx2d.lineTo(W, H / 2);
      ctx2d.stroke();
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state]);

  const handleStart = useCallback(async () => {
    setError(null);
    setElapsed(0);
    const recorder = new AudioRecorder();
    recorderRef.current = recorder;
    try {
      await recorder.start({ onTick: setElapsed });
      setState("recording");
    } catch {
      setError("マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。");
      recorderRef.current = null;
    }
  }, []);

  const handleStop = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setState("stopping");
    try {
      const duration = recorder.elapsed();
      const blob = await recorder.stop();
      onComplete(blob, duration);
    } catch {
      setError("録音の処理に失敗しました。もう一度お試しください。");
      setState("idle");
    } finally {
      recorderRef.current = null;
      setElapsed(0);
    }
  }, [onComplete]);

  const remaining = Math.max(0, MAX_DURATION_SEC - elapsed);
  const canStop = elapsed >= MIN_DURATION_SEC;
  const progress = Math.min((elapsed / MAX_DURATION_SEC) * 100, 100);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 text-center">
      {error && (
        <p className="text-[#f3727f] text-sm bg-[#1f1f1f] border border-[#f3727f]/30 rounded-lg px-3 py-2">{error}</p>
      )}

      {state === "idle" && (
        <button
          className="w-full py-4 bg-[#e6e6fa] text-black rounded-full font-bold text-lg hover:bg-[#d0d0f0] active:scale-95 transition-transform shadow-[rgba(0,0,0,0.5)_0px_8px_24px]"
          onClick={handleStart}
        >
          録音開始
        </button>
      )}

      {state === "recording" && (
        <div className="space-y-3">
          {/* 波形ビジュアライザ */}
          <canvas
            ref={canvasRef}
            width={320}
            height={72}
            className="w-full rounded-lg bg-[#1f1f1f]"
          />

          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-[#e11d48] rounded-full animate-pulse" />
            <span className="font-mono text-xl font-bold text-white">{elapsed.toFixed(1)}s</span>
            <span className="text-[#727272] text-sm">/ {MAX_DURATION_SEC}s</span>
          </div>

          <div className="w-full bg-[#282828] rounded-full h-1.5">
            <div
              className="bg-[#c4b5fd] h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            className="w-full py-4 bg-[#1f1f1f] text-white rounded-full font-bold text-lg disabled:opacity-40 active:scale-95 transition-transform shadow-[rgba(0,0,0,0.3)_0px_0px_0px_1px_inset]"
            onClick={handleStop}
            disabled={!canStop}
          >
            {canStop
              ? "録音停止・解析"
              : `あと ${Math.ceil(MIN_DURATION_SEC - elapsed)}s で停止可能`}
          </button>
        </div>
      )}

      {state === "stopping" && (
        <div className="space-y-2">
          <div className="w-6 h-6 border-2 border-[#c4b5fd] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#b3b3b3] text-sm">音声を変換中...</p>
        </div>
      )}
    </div>
  );
}
