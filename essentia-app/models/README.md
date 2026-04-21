# models/

Essentia 学習済みモデルファイルの置き場。

## 取得方法

```bash
# プロジェクトルートで実行
bash scripts/download_models.sh
```

スクリプトが `model_manifest.json` を読み、対応する `.pb` と `.json` を
Essentia 公式サーバから `models/` にダウンロードします。

## ファイル構成

```
models/
├── model_manifest.json          # バージョン・ファイル名の正本（Git 管理対象）
├── README.md                    # このファイル（Git 管理対象）
├── discogs-effnet-bs64-1.pb     # ← download_models.sh で取得（.gitignore 対象）
└── discogs-effnet-bs64-1.json   # ← download_models.sh で取得（.gitignore 対象）
```

## 設計方針

- **録音音声は永続保存しない**: FastAPI は推論完了後に一時ファイルを即削除する。
  DB には推論結果（top_styles）のみ保存する。
- モデルバイナリ（`.pb`, `.json`）は Git に含めない。`model_manifest.json` だけ管理する。
- モデルを差し替える場合は `model_manifest.json` を更新し `download_models.sh` を再実行する。
