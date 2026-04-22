# TravelCreator — READ.md

Claude Codeのセッション開始時に必ずこのファイルを読み込むこと。

---

## このリポジトリの目的

旅行中（エジプト・ヨルダン）の知的体験を深めるための2フォルダ構成の知識管理システム。

---

## フォルダ構成

### 1. `CountryKnowledge/`

各国・カテゴリごとの知識を集積・整理するフォルダ。

```
CountryKnowledge/
  Egypt/
    overview.md       — 概要・基本情報
    history.md        — 歴史・遺跡・王朝
    religion.md       — 宗教・イスラム文化・コプト教
    culture.md        — 文化・習慣・社会
    food.md           — 食事・食文化
    practical.md      — 実用情報（治安・マナー・通貨・交通）
    geography.md      — 地理・気候・地域
    economy.md        — 経済・産業・観光
  Jordan/
    overview.md
    history.md
    religion.md
    culture.md
    food.md
    practical.md
    geography.md
    economy.md
```

**ルール：**
- 各ファイルは重複なく、カテゴリに沿った情報のみ記載
- 情報は箇条書きで簡潔に、出典・文脈も添える
- セッション中にCountryKnowledgeにない知識を使った場合、必ず該当ファイルに追記する

---

### 2. `Thought/`

旅行中に感じたこと・疑問をClaude Codeに入力すると、ここに出力されるフォルダ。

```
Thought/
  YYYY-MM-DD_topic.md
```

**各ファイルの構成：**
```
# [日付] トピックタイトル

## あなたの観察・疑問（要約）
ユーザーの入力を整理・要約したもの

## Claudeの考察
その疑問・観察に対するClaudeの分析・解釈

## 参照した知識（CountryKnowledge）
- CountryKnowledge/Egypt/history.md — 参照箇所の説明
- ...

## 関連知識（要点）
CountryKnowledgeから抽出した関連情報の要点
※CountryKnowledgeにない知識の場合はその旨を明記し、
  使用した知識はCountryKnowledgeの該当ファイルに追記済み
```

---

## 使い方（旅行中）

1. Claude Codeを開く（スマホアプリ or CLI）
2. 感じたこと・疑問をそのまま日本語で入力する
3. Claudeが自動で：
   - CountryKnowledgeの関連ファイルを読み込む
   - Thoughtフォルダに考察ファイルを出力する
   - 不足知識があればCountryKnowledgeに追記する
4. gitでコミット・同期しておくと旅行記録になる

**入力例：**
```
ペトラ遺跡のナバテア人って何者？ローマとどう関係してたんだろう
```
```
エジプトのモスクで礼拝中に観光客が入れないエリアがあったけど、どこまでOKなの？
```

---

## Claudeへの注意事項

- セッション開始時は必ずこのREAD.mdを読むこと
- ユーザーの観察・疑問入力に対しては必ずThoughtフォルダに出力すること
- CountryKnowledgeを読む際は国・カテゴリを絞って必要なファイルのみ読む
- CountryKnowledgeにない知識を使った場合は必ず追記すること
