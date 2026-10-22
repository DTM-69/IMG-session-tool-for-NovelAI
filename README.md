# セッション管理ツール for NovelAI

NovelAI（novelai.net）の**画像生成セッション**を、複製・ZIP保存・取り込み・一覧表示できる Chrome 拡張機能と、保存したセッションから**生成台帳（サムネイル付きHTML / CSV）**を作るオフラインツールです。

> **非公式ツールです。** NovelAI運営とは無関係です。外部と通信せず、ブラウザ内のIndexedDBに保存されたセッションをブラウザ内で読み書きするだけです。自己責任でお使いください。

制作: だくてん with Claude

## できること
| 機能 | 内容 |
|---|---|
| 一覧表示 | 別タブに元画像のギャラリーを表示。拡大、プロンプト／シード値の確認・コピー、絞り込み、並べ替え |
| 複製 | セッションをそのまま複製 |
| ZIP保存 / 取り込み | 画像と生成情報をZIPに保存し、別環境にも新しいセッションとして取り込み |
| 保存量の上限（クオータ） | セッション全体の保存量を表示し、上限（初期値10GB）を超える複製・取り込みをブロック。超過時は赤い警告を表示 |
| 生成台帳 | ZIPからサムネイル付きHTML／CSVの台帳を作成（`ledger/`、完全オフライン） |

## 導入（配布ZIPを使う場合）
1. [`release/`](release/) の最新ZIPをダウンロードして**展開**
2. `chrome://extensions` →「デベロッパーモード」ON →「パッケージ化されていない拡張機能を読み込む」→ 展開したフォルダ内の `extension` を選択
3. https://novelai.net/image を開き、「Load a previous session?」の画面の右側に出るパネルを使う

詳しい使い方は [`release/README.md`](release/README.md)（配布ZIPに同梱のもの）を参照してください。

## 構成
```
extension/   Chrome拡張機能（Manifest V3、依存ライブラリなし）
  core.js      IndexedDBの読み書き・ZIP
  viewer.js    一覧表示（ギャラリー）
  content.js   セッション一覧ダイアログ横のパネルUI
ledger/      生成台帳ツール（session-ledger.html は build.py で生成する単一ファイル）
snippets/    DevToolsコンソール用スクリプト（最新セッションを複製）
release/     配布用README・ZIP作成スクリプト（make_release.py）・ZIP
```

## 開発メモ
- 台帳ツールを編集したら `python3 ledger/build.py`、配布ZIPは `python3 release/make_release.py`
- NovelAIが使うIndexedDB:
  - `generated-image-history`: `history-meta`（キー=sessionId）、`history-groups`（キー=`sessionId:groupId`）、`history-boards`（キー=sessionId）
  - `generated-images`: `images`（キー=`sessionId:imageId`、値=Blob）
- 画像のプロンプト等は、PNGの tEXt `Comment` チャンクを優先して読む。セッション記録内の `v4_prompt.caption.base_caption` はUIの古い状態が入っていて、実際に送った内容と一致しないため使わない
- NovelAI側の内部仕様が変わると動かなくなる可能性があります

## ライセンス
[MIT](LICENSE)
