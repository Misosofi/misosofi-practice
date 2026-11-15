# MISOSOFI 部品箱（misosofi-parts）

3つのアプリ（MISOSOFI 会員サイト、ピアノ導入アプリ、練習アプリ）で共通に使う部品。
ここを1か所直すと、読み込んでいるアプリがすべて新しくなる。

| ファイル | 中身 |
|---|---|
| piano.js | 本物のピアノ音（30個の録音から88鍵）。ピンポン／ブー の効果音 |
| listen.js | マイクでピアノ・歌を聞き取る（読譜ゲームの MPM 方式をそのまま部品化） |
| piano/*.mp3 | ピアノの録音 |
| art/*.webp | 絵本の絵（くりーと、ことり、ぞう ほか）。絵：Juan Macias／© Misosofi |

読み込み方（同じ GitHub Pages の中なら）：
```html
<script src="../misosofi-parts/piano.js"></script>
<script src="../misosofi-parts/listen.js"></script>
```

約束
- 教材・文章・コースの中身はアプリ側に置く（ここには置かない）。
- ここを更新したら、3つのアプリの画面をスクリーンショットで確認してから本番へ。
