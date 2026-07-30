# Stellise レンタルサーバー版

このパッケージは、さくらのレンタルサーバおよびXServerのPHP 8系環境向けです。

## 必要なもの

- PHP 8.1以降
- PHP cURL拡張
- Apacheの `.htaccess` と `mod_rewrite`
- Gemini APIキー

## 配置方法

1. `public_html` フォルダの「中身」を、契約サーバーの公開フォルダへアップロードします。
   - さくら：通常は `/home/アカウント名/www/`
   - XServer：対象ドメインの `public_html/`
2. `private/stellise-secrets.php` を、公開フォルダの1つ上へ置きます。
   - さくらの例：`/home/アカウント名/stellise-secrets.php`
   - XServer：対象ドメインの `public_html` と同じ階層へ置きます。
3. `stellise-secrets.php` を編集し、再発行したGemini APIキーを設定します。
4. 秘密設定ファイルのパーミッションは、可能なら `600` にします。
5. サイトの `/api/health.php` を開き、次のJSONが返ることを確認します。

```json
{"ok":true,"chatbotConfigured":true}
```

## 動作確認

- トップページが表示される
- `/api/health.php` が `chatbotConfigured: true` を返す
- ChatBotで「環境音は無料版でも使えますか？」と質問すると、Pro版限定と回答する
- マニュアルにない質問ではLINEサポートボタンが表示される

## APIキーについて

`stellise-secrets.php` は絶対に公開フォルダへ置かないでください。Gitにも追加しないでください。キーを変更した場合、PHPファイルやHTMLを再アップロードする必要はなく、この秘密設定ファイルだけを更新します。

## URL書き換えが動かない場合

通常は同梱の `.htaccess` により `/api/chat` が `api/chat.php` へ接続されます。サーバーでURL書き換えが無効な場合は、コントロールパネルまたはサポートへ `mod_rewrite` の利用可否を確認してください。
