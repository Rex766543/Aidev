# TravelCreator でできること

## 旅行中の知識整理

- 旅行中の疑問や観察を受け取り、`Thought/` に考察Markdownを作る
- `CountryKnowledge/` の国別・カテゴリ別メモを参照して、背景知識を補う
- 新しく使った知識が `CountryKnowledge/` にない場合、該当ファイルへ追記する

指示例:

```text
気付き ペトラ遺跡のナバテア人って何者？ローマとどう関係してたんだろう
```

```text
エジプトの交通事情について、CountryKnowledgeに追加して
```

## 字幕付き動画の作成

- 音声/動画から日本語文字起こしを作る
- Claudeで文字起こしを校正する
- 字幕チャンクを作る
- ASS字幕ファイルを作る
- `ffmpeg` で字幕を動画に焼き込む

指示例:

```text
/videocreator subtitle-pipeline/Petra/Video/example.MP4 の字幕を作って
```

```text
この動画から日本語字幕ASSを作って、焼き込みまでやって
```

既存のメイン手段:

- `subtitle-pipeline/scripts/01-transcribe.mjs`
  - OpenAI Whisper APIを使う
  - `OPENAI_API_KEY` が必要
  - word-level timestamps を含む `words.json` を作る
- `subtitle-pipeline/transcribe_local.py`
  - Python版 Whisper をローカルで使う
  - Python環境とモデルの準備が必要

## FFmpeg Whisper

このMacの `ffmpeg` は `--with-whisper-cpp` 付きで入っており、FFmpeg内蔵の `whisper` 音声フィルタを使える。

できること:

- APIキーなしでローカル文字起こし
- 動画/音声から直接 `text` / `srt` / `json` を出力
- `language=ja` で日本語指定
- `queue` で処理単位を調整

確認コマンド:

```bash
ffmpeg -h filter=whisper
```

SRTを作る例:

```bash
ffmpeg -i input.mp4 -vn \
  -af "whisper=model=subtitle-pipeline/models/ggml-base.bin:language=ja:destination=output.srt:format=srt" \
  -f null -
```

JSONを作る例:

```bash
ffmpeg -i input.mp4 -vn \
  -af "whisper=model=subtitle-pipeline/models/ggml-base.bin:language=ja:destination=output.json:format=json" \
  -f null -
```

使わせる時の指示例:

```text
ffmpeg whisperで subtitle-pipeline/Petra/Video/example.MP4 から日本語SRTを作って
```

```text
APIを使わずローカルWhisperでこの音声を文字起こしして、SRTとJSONを出して
```

注意:

- `ffmpeg` の Whisper機能には `whisper.cpp` 形式のモデルファイルが必要
- モデルは `subtitle-pipeline/models/` に置く
- 現在は `subtitle-pipeline/models/ggml-base.bin` を配置済み
- 精度は `tiny` < `base` < `small` < `medium` < `large` の順に上がるが、処理時間と容量も増える
- 日本語字幕用途では、軽さ優先なら `base`、精度優先なら `small` 以上が実用的
