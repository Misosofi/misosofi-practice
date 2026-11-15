# ピアノのえほん（みそそっフィ ピアノ導入アプリ）試作

練習アプリとは別のアプリ。同じ GitHub の置き場所を借りているだけで、中身は混ざらない。
- 公開URL：https://misosofi.github.io/misosofi-practice/piano/
- 共通部品（ピアノ音・マイク聞き取り・絵）：../parts/
- 練習アプリの sw.js は piano/ と parts/ にさわらない（1行で除外ずみ）。
- データはこの端末の中だけ（まだ Supabase につないでいない）。
