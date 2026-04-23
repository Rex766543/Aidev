# ライセンスと展開の障壁調査

調査日: 2026-04-23

---

## 現在の実装構成

| コンポーネント | 具体的なもの |
|---|---|
| 推論エンジン | `essentia-tensorflow` (Python, Docker) |
| Embeddingモデル | `discogs-effnet-bs64-1.pb` |
| Classifierモデル | `genre_discogs400-discogs-effnet-1.pb` |
| 曲検索 | Spotify Web API |

---

## 1. ライセンス障壁

### Essentiaライブラリ本体

- ライセンス: **AGPL v3**（非商用のみ無償）
- 商用利用する場合は MTG（Music Technology Group, UPF）に**プロプライエタリライセンスを別途申請・契約**が必要
- AGPL はネットワーク越しにサービス提供する場合もソースコード開示義務が発生する

### Discogs-EffNet / genre_discogs400 モデル（`.pb` ファイル）

- ライセンス: **CC BY-NC-ND 4.0**
  - **NC** = 非商用のみ
  - **ND** = 改変禁止
- 個人利用・研究は OK、**収益を伴うアプリへの組み込みは不可**
- 商用利用したい場合は MTG へライセンス交渉が必要
- 参照: https://essentia.upf.edu/models.html

### Spotify Web API（2026年2月に大幅制限）

- Dev Mode では **Premium アカウント必須 / 認可ユーザー上限5人**
- 商用拡張アクセスには「登録法人 + MAU 25万以上 + 主要市場でのサービス提供済み」が必要
- **Spotify のデータを AI/ML モデルの学習に使うことは明示的に禁止**
- 参照: https://developer.spotify.com/policy

---

## 2. ブラウザ展開の技術的障壁

### 選択肢A: バックエンド API のまま（現在の設計）

- 技術障壁: 低い（既存の FastAPI + Docker をデプロイするだけ）
- 問題: モデルが重い（EfficientNet + TF）→ Cloud Run などの**コールドスタートが遅い**
- GPU なしだと推論が数秒かかる場合あり

### 選択肢B: Essentia.js（ブラウザ上で完全オンデバイス推論）

- MTG が公式提供する **Essentia.js（WebAssembly 版）** を使えばブラウザで動く
- TensorFlow.js と組み合わせて `.pb` モデルを JS 向けに変換すれば音楽スタイル判定がブラウザで完結
- ただし変換作業（TF frozen graph → TFJS 形式）が必要で手間がかかる
- **ライセンス問題は変わらない**（モデルは CC BY-NC-ND）
- 参照: https://mtg.github.io/essentia.js/

---

## 3. iPhone アプリの技術的障壁

### モデル変換が必須

現在の `.pb`（TensorFlow frozen graph）は iOS で直接は動かない。変換パスが必要:

```
.pb (TensorFlow)
  → TFLite (.tflite)  → iOS の TensorFlow Lite で実行
  または
  → CoreML (.mlmodel) → iOS ネイティブで実行（Neural Engine 最適化）
```

### Essentia ライブラリ自体を iOS に載せる

- Essentia C++ ライブラリを iOS 向けにクロスコンパイルする必要がある（公式サポートなし、自前ビルドが必要）
- 音声前処理（16kHz mono 変換、フレーム分割）を Swift/Objective-C で再実装するのが現実的

### 移植工数の目安

| 作業 | 難易度 |
|---|---|
| モデルの TFLite/CoreML 変換 | 中（変換スクリプト要） |
| 音声前処理の iOS 再実装 | 中 |
| Essentia 音声特徴抽出アルゴリズムの再実装 | 高 |

---

## まとめ

| 障壁 | ブラウザ | iPhone |
|---|---|---|
| **ライセンス（商用）** | 要 MTG 交渉 | 要 MTG 交渉 |
| **Spotify API** | Dev Mode は5ユーザー限定 | 同左 |
| **技術的移植** | 低（API そのままデプロイ）〜中（Essentia.js 化） | 高（モデル変換＋前処理再実装） |

個人・非商用での展開はライセンス的に問題なし。収益化を考えるなら、まず MTG へのライセンス問い合わせが最初のステップ。

---

## 参考リンク

- [Essentia Licensing](https://essentia.upf.edu/licensing_information.html)
- [Essentia Models (CC BY-NC-ND 4.0)](https://essentia.upf.edu/models.html)
- [Essentia.js](https://mtg.github.io/essentia.js/)
- [Spotify Developer Policy](https://developer.spotify.com/policy)
- [Spotify February 2026 Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
