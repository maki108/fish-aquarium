# いしかわ海巡りすごろく

石川県の漁港を巡り、旬の魚を集めるすごろくアプリ。

## 概要

Python (Backend)
Flask: Webフレームワーク本体。

Flask-SQLAlchemy: SQLiteを直感的に操作するためのORM。

Flask-Login: ユーザー認証（1日2回の制限を管理する場合に推奨）。

datetime: 「1日2回」の回数リセット判定に使用。

Frontend (JS/CSS)
Canvas API: すごろくの盤面や魚の動きを滑らかに描写する場合に便利です。

Confetti.js: ゴール時や魚獲得時の演出用。

Google Fonts: 「さわらび明朝」など、和風や海を感じさせるフォント。

Database (SQLite)
users: ID、最後にサイコロを振った日、本日の残り回数。

fish_inventory: ユーザーが所持している魚（図鑑・水族館用）。

game_state: 現在のマス目（位置）情報。
