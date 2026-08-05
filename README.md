# Stellise

睡眠から朝の支度、出発までをひとつにつなぐiPhoneアプリです。

マイクとモーションセンサーから睡眠状態を推定し、眠りが浅い時間帯にアラームを鳴らします。起床後は、天気・予定・移動時間に合わせて、その朝にやることと出発時刻を整理します。

[App Storeで見る](https://apps.apple.com/jp/app/stellise-ai%E7%9D%A1%E7%9C%A0-%E3%82%B9%E3%82%B1%E3%82%B8%E3%83%A5%E3%83%BC%E3%83%AB%E7%AE%A1%E7%90%86/id6760934295?pt=128489607&ct=github_readme&mt=8) ｜ [公式サイト](https://stellise-app.com) ｜ [プライバシーポリシー](https://stellise-app.com/privacy.html) ｜ [サポート](https://stellise-app.com/#support)

## 実際の画面

<p align='center'>
  <img src='docs/screenshots/home-clear.png' alt='朝のホーム画面' width='23%'>
  <img src='docs/screenshots/home-night.png' alt='夜の画面' width='23%'>
  <img src='docs/screenshots/tasks.png' alt='朝のタスク画面' width='23%'>
  <img src='docs/screenshots/sleep-score.png' alt='睡眠レポート画面' width='23%'>
</p>

画面の背景は固定画像ではありません。時刻と天気に合わせて、SceneKitで空・太陽・月・星・雲・雨を描画しています。

## なぜ作ったか

遅刻の原因は、起きられないことだけではありません。起きたあとに天気や電車の遅延で予定が崩れ、「何から始めるか」を考えている間にも時間は過ぎます。

Stelliseは、睡眠と朝支度を別々に管理せず、次の流れとして扱います。

1. 睡眠中の音と体動を端末内で解析する
2. 眠りが浅い時間帯に起こす
3. 天気・カレンダー・移動時間を確認する
4. 出発に間に合うよう、朝のタスクを並べ直す

## 主な機能

- **スマートアラーム**：睡眠状態を推定し、設定範囲内の起きやすい時間帯に通知
- **睡眠レポート**：睡眠スコア、就床時間、いびき・体動の検知結果を表示
- **朝のタスク提案**：予定、天気、移動時間をもとに朝の行動を整理
- **予定変更への対応**：悪天候や交通状況を踏まえて出発時刻とタスクを見直し
- **環境音**：焚き火・波・雨などの入眠用サウンドを再生（Stellise Pro限定）
- **サブスクリプション**：StoreKitによる購入と復元

## 設計

```text
マイク ──────┐
              ├─ 端末内解析 ─ 睡眠スコア・検知結果
CoreMotion ──┘      （生データは外部送信しない）

カレンダー ─┐
天気・位置 ─┼─ スケジュール生成 ─ 朝のタスク・出発時刻
睡眠結果 ───┘

StoreKit ───── 購入・復元 ───── Stellise Pro
```

音声と体動の生データは端末内で処理します。外部サービスへ送る情報と利用目的は、[プライバシーポリシー](https://stellise-app.com/privacy.html)に記載しています。

## 技術的に工夫した点

### オンデバイスでの睡眠解析

TensorFlow LiteのYAMNetで環境音を分類し、CoreMotionで取得した体動と組み合わせています。録音データをクラウドへ送らずに解析できる構成にしました。

### 朝の状況をひとつの流れとして扱う

EventKit、CoreLocation、MapKit、天気・交通APIから得た情報を、朝のタスク生成にまとめて利用します。各機能を個別に表示するのではなく、出発までの行動へ変換することを重視しました。

### 状態と見た目を分離する

SwiftUIとCombineを用い、アプリの状態を`ObservableObject`で管理しています。色、余白、角丸、ガラス表現などはデザインシステムへ集約し、画面間の差を抑えています。

### リリース後も改善を続ける

App Storeへの公開後、ユーザーの利用状況と審査フィードバックをもとに8回のアップデートを行いました。実装だけでなく、申請、プライバシー開示、サブスクリプション設定、Webサイト運用まで継続して担当しています。

## 技術構成

| 分野 | 技術 |
|---|---|
| iOS | Swift、SwiftUI、Combine |
| オンデバイスAI | TensorFlow Lite、YAMNet |
| センサー・音声 | CoreMotion、AVFoundation、AudioToolbox |
| 位置・予定 | CoreLocation、MapKit、EventKit |
| 3D表現 | SceneKit、Canvas |
| OS連携 | UserNotifications、App Intents |
| 課金 | StoreKit |
| 認証・データ | Firebase Authentication、Cloud Firestore |
| API | Python、天気API、交通・経路API、Google Gemini API |
| Web | HTML、CSS、JavaScript、PHP |

## 開発体制と担当

2名で開発しています。

**担当したこと（Yunosuke Tokiwai）**

- 企画、要件整理、全体進行
- センサー、睡眠解析、天気・交通連携などUI以外のiOS実装
- Python/PHP APIとFirebase連携
- StoreKitによるサブスクリプション対応
- テスト、App Store申請、公開後のアップデート
- 公式サイト、サポート導線、プライバシー関連ページの運用

**分担したこと**

- UI設計と画面実装はチームメンバーが担当
- 仕様と実装の接続部分は相談しながら調整

## プライバシー

- 音声と体動の生データは外部サーバーへ送信・保存しません
- 第三者広告と広告目的のトラッキングSDKは使用していません
- Firebaseは匿名認証と必要なデータの保存に使用します
- AIへの送信対象と利用目的をプライバシーポリシーで公開しています

## ローカルでの実行

### iOS

macOS、Xcode、CocoaPodsが必要です。

```bash
pod install
open Stellise.xcworkspace
```

Firebaseの`GoogleService-Info.plist`と各種API設定はリポジトリに含めていません。ローカル設定を追加してからビルドしてください。

### APIテスト

```bash
python3 -m pip install -r requirements.txt
python3 -m pytest
```

## 公開状況

- App Storeで公開中
- 日本向けに配信
- 無料版とStellise Proを提供
- 2026年8月時点で継続開発中

## クレジット

- アラーム音・環境音：[OtoLogic](https://otologic.jp)（[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja)）

© 2026 Stellise Yunosuke Tokiwai & Masashi Nakamura
