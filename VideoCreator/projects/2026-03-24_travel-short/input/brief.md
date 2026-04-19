theme: イランの国民性
input_mode: text
asset_mode: images-only
image_research: auto
language: ja
tts_voice: rachel
duration_goal: 20-45 seconds
bgm_mood: 中東の歴史が感じられる

notes:
- scene は `。` 区切りの 1〜3 文で block 化される
- `prepare:session` 実行後に `work/meaning-blocks.json` ができる
- 動画を使う場合は `input/video-assignments.json` で file -> block を指定する
- 1つの動画を複数 block に割り当ててよい
- 画像探索が不要なら `image_research: skip` と書く
- 必ず入れたい情報
- 動画の雰囲気
- 音声が text の場合は、必要なら翻訳指示
