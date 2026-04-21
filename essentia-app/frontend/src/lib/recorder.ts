/**
 * MediaRecorder ラッパ。
 * 5〜20 秒の録音を管理し、完了時に WAV Blob を返す。
 * webm/opus → WAV(16kHz mono PCM) 変換をブラウザ内で行うことで
 * バックエンドの Essentia MonoLoader のコーデック問題を回避する。
 */

export const MIN_DURATION_SEC = 5;
export const MAX_DURATION_SEC = 20;

export interface RecorderOptions {
  onTick?: (elapsed: number) => void;
}

// ---- WAV エンコーダ ----

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numSamples = samples.length;
  const dataSize = numSamples * 2; // 16bit = 2 bytes
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);          // fmt chunk size
  view.setUint16(20, 1, true);           // PCM
  view.setUint16(22, 1, true);           // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byteRate
  view.setUint16(32, 2, true);           // blockAlign
  view.setUint16(34, 16, true);          // bitsPerSample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const int16 = new Int16Array(buffer, 44, numSamples);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    int16[i] = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
  }

  return buffer;
}

/**
 * 任意の音声 Blob を 16kHz mono WAV に変換する。
 * OfflineAudioContext でブラウザ内リサンプリングを行う。
 */
export async function blobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();

  // Step1: native sample rate でデコード
  const tempCtx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await tempCtx.decodeAudioData(arrayBuffer);
  } finally {
    await tempCtx.close();
  }

  // Step2: OfflineAudioContext で 16kHz mono にリサンプリング
  const targetRate = 16000;
  const outSamples = Math.ceil(decoded.duration * targetRate);
  const offlineCtx = new OfflineAudioContext(1, outSamples, targetRate);
  const src = offlineCtx.createBufferSource();
  src.buffer = decoded;
  src.connect(offlineCtx.destination);
  src.start();
  const resampled = await offlineCtx.startRendering();

  const mono = resampled.getChannelData(0);
  const wavBuffer = encodeWav(mono, targetRate);
  return new Blob([wavBuffer], { type: "audio/wav" });
}

// ---- AudioRecorder ----

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private stream: MediaStream | null = null;
  private startTime = 0;
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  // 波形描画用
  private vizCtx: AudioContext | null = null;
  private _analyser: AnalyserNode | null = null;

  async start(options: RecorderOptions = {}): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.startTime = Date.now();

    // 波形ビジュアライザ用 AudioContext
    this.vizCtx = new AudioContext();
    const source = this.vizCtx.createMediaStreamSource(this.stream);
    this._analyser = this.vizCtx.createAnalyser();
    this._analyser.fftSize = 512;
    source.connect(this._analyser);

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start(100);

    if (options.onTick) {
      this.tickInterval = setInterval(() => {
        options.onTick!(this.elapsed());
      }, 200);
    }
  }

  elapsed(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /** 波形描画用 AnalyserNode */
  get analyser(): AnalyserNode | null {
    return this._analyser;
  }

  /**
   * 録音を停止し、WAV Blob を返す。
   * 内部で webm → WAV 変換を行う。変換失敗時は元の Blob を返す。
   */
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("録音が開始されていません"));
        return;
      }
      if (this.tickInterval) {
        clearInterval(this.tickInterval);
        this.tickInterval = null;
      }
      this.mediaRecorder.onstop = async () => {
        const rawBlob = new Blob(this.chunks, {
          type: this.mediaRecorder?.mimeType ?? "audio/webm",
        });
        this.releaseStream();

        // webm → WAV 変換
        try {
          const wavBlob = await blobToWav(rawBlob);
          resolve(wavBlob);
        } catch {
          // 変換失敗時は元の Blob にフォールバック
          resolve(rawBlob);
        }
      };
      this.mediaRecorder.onerror = (e) => {
        this.releaseStream();
        reject(e);
      };
      this.mediaRecorder.stop();
    });
  }

  private releaseStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.vizCtx?.close();
    this.vizCtx = null;
    this._analyser = null;
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}
