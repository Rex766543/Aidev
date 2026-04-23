# セッションログ 2026-04-23

---

## 1. TravelCreator 確認・気付きスキル実行

- TravelCreatorプロジェクトの構成を確認（CountryKnowledge / Thought / kizukiスキル）
- 気付き入力：「ワディラムの自称ベドウィンと本物の見分け方」
- `Thought/2026-04-22_ワディラムの本物ベドウィン.md` を生成
- Jordan/culture.md・history.md にベドウィン関連知識を新規追記

---

## 2. Git管理・ブランチ運用

- `claude/check-travel-creator-sgyrz` ブランチでコミット・プッシュ
- mainへのマージ時にコンフリクト発生（culture.md / history.md）
- mainの詳細コンテンツを優先しつつ、フィーチャーブランチの情報を統合して解決
- origin/mainへのプッシュ完了

---

## 3. TravelCreator の独立リポジトリ化検討

### 議論の流れ
- 「Aidevの余分なファイルを読まれたくない」という要望から議論開始
- 選択肢を3つ提示：① git submodule ② リポジトリを分けずClaude Codeの見せ方を変える ③ 完全分離
- **② を推奨**：TravelCreator/CLAUDE.mdでスコープを制御、Aidevのまま使える

### ⭐ 重要：スマホアプリでのフォルダ指定
- Claude Codeスマホアプリはサブフォルダ指定UIがない
- **現実的な回避策**：毎セッション開始時に以下をコピペ
  ```
  TravelCreator/CLAUDE.md とTravelCreator/READ.mdを読んで、TravelCreator内だけで作業して。
  ```

---

## 4. GitHubでのファイル閲覧問題

### ⭐ 重要：Obsidian Sync は有料
- Obsidianをインストールしたが、Syncが有料と判明
- 無料代替：Working Copy（iOS）＋ Obsidian Git プラグインの組み合わせ
- **結論：GitHubアプリで十分、ただしAidevリポジトリだと階層が深くThoughtまで遠い**
- → **TravelCreatorを独立リポジトリにすれば即解決**（GitHubアプリで開いた瞬間Thoughtが見える）

---

## 5. Essentia ライセンス問題

### ⭐ 重要：出典明記では商用利用できない
- Essentiaライブラリ：AGPL v3 → ネット越しサービスはソース全開示義務。出典では不十分。
- モデル（discogs-effnet / genre_discogs400）：CC BY-NC-ND 4.0 → NC＝非商用のみ。出典関係なく商用禁止。
- MTGに申請すれば商用ライセンス取得の可能性はあるが、条件・費用非公開・通るとは限らない

### ⭐ 重要：現状のパフォーマンス限界
- CPU環境（2vCPU）で30秒音声の推論：**3〜8秒/リクエスト**
- 同時リクエスト対応なし（現実装）→ 同時5人で直列処理・最大40秒待ち
- Cloud Runのコールドスタート：モデルロードで**追加30〜60秒**
- GPU環境（T4等）なら0.5〜1秒に改善、同時5〜10人でも対応可

---

## 6. ACRCloud 調査結果

### 基本情報
- **短い音源対応**：3〜5秒から認識可能。SDKは10秒ウィンドウで処理。
- **フィンガープリント精度**：98%以上（自社）、MIREX 2015・2016で1位

### ⭐ 重要：ジャンルデータの構造
| 層 | 内容 | 備考 |
|----|------|------|
| デフォルト（自社DB） | `genres: [{ name: "Pop" }]` | マイナー曲は空になりがち |
| Spotify/Deezer連携 | ID返却のみ、詳細は各API別途コール必要 | デフォルト有効 |
| Music Story（有料アドオン） | 800種類以上、一次・二次ジャンル | 精度・網羅性が最高 |

### ⭐ 重要：ジャンル精度の実態
- 独立したジャンル精度ベンチマークは存在しない
- 開発者の不満は「間違っている」ではなく「**空で返ってくる**」
- メジャー曲：問題なし。マイナー・地域特有の楽曲：カバレッジ弱い

### 実績（主要ユーザー）
Deezer（SongCatcher）、Huawei、Xiaomi、Alibaba、Baidu、Musixmatch、Genius、JASRAC

### 料金
| プラン | リクエスト数 | 価格 |
|--------|------------|------|
| 無料 | 100回/日 | 無料 |
| スターター | 10,000回/年 | 約$44 |
| スタンダード | 100,000回/年 | 約$440 |
| ラージ | 1,000,000回/年 | 約$4,100 |

### Essentiaとの比較優位
- ライセンス問題ゼロ
- スケール問題ゼロ（ACRCloud側が処理）
- 実装はAPIコールだけ
- 個人開発スタートなら$44/年で十分

---

## 次のアクション候補

- [ ] TravelCreatorを独立リポジトリとしてGitHub作成
- [ ] Essentia → ACRCloud切り替えの技術的検討
- [ ] ACRCLoud 14日間無料トライアルで実際のジャンルデータを検証
- [ ] Music Storyアドオンの費用確認
