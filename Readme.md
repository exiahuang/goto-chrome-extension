# GoTo - Fast Browser Resource Search

[English](#english) | [日本語](#日本語)

---

## English

GoTo is a lightweight, high-performance browser extension designed to help you quickly find and switch between tabs, bookmarks, and history items. Designed with a minimalist aesthetic, it brings a professional search experience to your browser.

### Features
- **Instant Search**: Concurrent searching across Tabs, Bookmarks, and History.
- **Floating Window**: Opens in a dedicated popup window for an unobtrusive experience.
- **Highly Customizable**: 
    - Custom Shortcuts (Default: `Ctrl+M` / `Cmd+M`).
    - Adjustable result limits (10-200).
    - Bilingual UI (English/Japanese).
- **Premium UI**: Clean, Japanese-minimalist design with Full Dark Mode support.
- **Favicon Support**: Real-time website icons for faster visual recognition.

### Development & Packaging
To develop and build the extension:

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Build the extension**:
   ```bash
   npm run build
   ```
3. **Create distribution ZIP**:
   ```bash
   npm run package
   ```
This will create `GoTo-Extension.zip` containing only the necessary production files.

### Keyboard Shortcuts
- `Ctrl + M` / `Cmd + M`: Toggle search window.
- `↑ / ↓`: Navigate results.
- `Enter`: Open selected item.
- `Esc`: Close window.

---

## 日本語

GoToは、タブ、ブックマーク、閲覧履歴を瞬時に検索・切り替えができる、軽量で高性能なブラウザ拡張機能です。ミニマリズムを追求したデザインにより、プロフェッショナルな検索体験を提供します。

### 主な機能
- **インスタント検索**: タブ、ブックマーク、履歴を同時に高速検索。
- **ポップアップウィンドウ**: 独立したウィンドウで開き、作業を妨げないスマートな体験。
- **カスタマイズ性**:
    - ショートカットの変更が可能 (デフォルト: `Ctrl+M` / `Cmd+M`)。
    - 表示件数の調整 (10〜200件)。
    - 英語・日本語のバイリンガルUI。
- **洗練されたUI**: 日本のミニマリズムを取り入れたクリーンなデザイン。ダークモードに完全対応。
- **ファビコン対応**: ウェブサイトのアイコンをリアルタイムで表示し、視覚的な識別を高速化。

### 開発とパッケージング
拡張機能の開発とビルド手順：

1. **依存関係のインストール**:
   ```bash
   npm install
   ```
2. **拡張機能のビルド**:
   ```bash
   npm run build
   ```
3. **配布用ZIPの作成**:
   ```bash
   npm run package
   ```
これにより、必要な本番用ファイルのみを含む `GoTo-Extension.zip` が作成されます。

### ショートカット操作
- `Ctrl + M` / `Cmd + M`: 検索ウィンドウの表示/非表示。
- `↑ / ↓`: 結果の選択。
- `Enter`: 選択した項目を開く。
- `Esc`: ウィンドウを閉じる。
