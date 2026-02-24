import os
import random
from datetime import date, datetime

from flask import Flask, jsonify, redirect, render_template, request, session, url_for

from models.database import Fish, User, UserCollection, UserNet, db

basedir = os.path.abspath(os.path.dirname(__file__))
db_dir = os.path.join(basedir, "instance")
os.makedirs(db_dir, exist_ok=True)
db_path = os.path.join(db_dir, "game.db")

app = Flask(__name__)
# データベース接続設定
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + db_path
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

with app.app_context():
    db.create_all()

# ---------------------------------------------------------
# 定数設定 (JS側の game.js と同期させる)
# ---------------------------------------------------------
TOTAL_STEPS = 64
PORTS = {
    0: "近江町市場",
    8: "内灘",
    16: "金沢港",
    24: "羽咋港",
    32: "七尾港",
    40: "輪島港",
    48: "珠洲港",
    56: "能登島",
}

PORT_FISH_MAP = {
    # 近江町市場（市場なので高級品から定番まで）
    0: [
        "ノドグロ",
        "ズワイガニ",
        "イワガキ",
        "アジ",
        "サザエ",
        "天然能登寒ぶり「煌」",
    ],
    # 内灘（砂浜・沿岸系）
    8: [
        "アジ",
        "スルメイカ",
        "サワラ",
        "コウイカ",
        "アカカマス",
        "天然能登寒ぶり「煌」",
    ],
    # 金沢港（底引き網系）
    16: [
        "ホッコクアカエビ",
        "トゲザコエビ",
        "アカカレイ",
        "ハタハタ",
        "ズワイガニ",
    ],
    # 羽咋港
    24: [
        "サワラ",
        "アジ",
        "スルメイカ",
        "アカモク",
        "天然能登寒ぶり「煌」",
    ],
    # 七尾港（波が穏やかな内湾系）
    32: [
        "シャコ",
        "ウマヅラハギ",
        "サザエ",
        "イワガキ",
        "ウルメイワシ",
    ],
    # 輪島港（冬の日本海の王者たち）
    40: [
        "能登寒ブリ",
        "アンコウ",
        "毛ガニ",
        "ヤリイカ",
        "アブラツノザメ",
        "加能ガニ「輝」",
    ],
    # 珠洲港（磯や岩場系）
    48: [
        "キジハタ",
        "イシダイ",
        "サザエ",
        "ウスメバル",
        "アジ",
    ],
    # 能登島
    56: [
        "ウマヅラハギ",
        "アジ",
        "サザエ",
        "アカモク",
        "コウイカ",
        "天然能登寒ぶり「煌」,",
    ],  # 能登島
}


def refresh_dice_if_needed(user):
    """日付が変わっていたらサイコロをリセット"""
    today = date.today()
    if user.last_dice_at.date() < today:
        user.dice_count = 2
        user.last_dice_at = datetime.utcnow()
        db.session.commit()


# ---------------------------------------------------------
# ページルート
# ---------------------------------------------------------
app.secret_key = "ishikawa_fish_super_secret_key"

# ==========================================
# ログイン・会員登録のルートを追加
# ==========================================


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        # すでに同じ名前の人がいないかチェック
        if User.query.filter_by(username=username).first():
            return "その名前はすでに使われています", 400

        new_user = User(
            username=username,
            current_position_id=0,
            dice_count=2,
            last_dice_at=datetime.utcnow(),
        )
        new_user.set_password(password)  # パスワードを暗号化

        db.session.add(new_user)
        db.session.commit()

        # 登録したらそのまま自動ログインさせる
        session["user_id"] = new_user.id
        return redirect(url_for("index"))

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        user = User.query.filter_by(username=username).first()
        # ユーザーが存在し、パスワードが合っていればログイン成功
        if user and user.check_password(password):
            session["user_id"] = user.id
            return redirect(url_for("index"))
        else:
            return "名前かパスワードが違います", 401

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.pop("user_id", None)  # ログイン状態を解除
    return render_template("logout.html")


@app.route("/")
def index():
    if "user_id" not in session:
        return redirect(url_for("login"))  # ログインしていなければログイン画面へ

    user_id = session["user_id"]
    user = db.session.get(User, user_id)
    return render_template("index.html")


@app.route("/encyclopedia")
def encyclopedia():
    return render_template("encyclopedia.html")


@app.route("/aquarium")
def aquarium():
    return render_template(
        "aquarium.html",
        stage_id=1,
        stage_name="ステージ1",
        wallpaper_file="ver1.png",
    )


@app.route("/aquarium/stage2")
def aquarium_stage2():
    return render_template(
        "aquarium.html",
        stage_id=2,
        stage_name="ステージ2",
        wallpaper_file="ver7.png",
    )


# ---------------------------------------------------------
# APIエンドポイント
# ---------------------------------------------------------


@app.route("/api/user-status")
def get_user_status():
    """リロード時などの初期状態取得"""
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user = db.session.get(User, session["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404

    refresh_dice_if_needed(user)

    current_idx = user.current_position_id % TOTAL_STEPS
    dists = [(p - current_idx) % TOTAL_STEPS for p in PORTS.keys()]
    dist_to_next = min([d for d in dists if d > 0] or [TOTAL_STEPS])

    return jsonify(
        {
            "current_pos": user.current_position_id,
            "dist_to_next": dist_to_next,
            "remaining_dice": user.dice_count,
            "collection_status": f"{UserCollection.query.filter_by(user_id=user.id).count()}/{Fish.query.count()}",
        }
    )


@app.route("/api/roll-dice", methods=["POST"])
def roll_dice():
    """サイコロを振るメイン処理"""
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user = db.session.get(User, session["user_id"])
    refresh_dice_if_needed(user)

    if user.dice_count <= 0:
        return jsonify({"error": "本日のサイコロは終了しました"}), 400

    dice_val = random.randint(1, 6)
    old_pos_total = user.current_position_id

    actual_move = 0
    obtained_fishes = []
    stopped_at_port = False
    recovered_net = None
    net_catch_count = 0  # 網で獲れた数を記録

    for i in range(1, dice_val + 1):
        actual_move = i
        current_step = (old_pos_total + i) % TOTAL_STEPS

        if current_step in PORTS:
            stopped_at_port = True

            all_fish = Fish.query.all()
            if all_fish:
                allowed_fish_names = PORT_FISH_MAP.get(current_step, [])
                port_fishes = [f for f in all_fish if f.name in allowed_fish_names]
                if not port_fishes:
                    port_fishes = all_fish

                RARITY_WEIGHTS = {"ノーマル": 75, "レア": 20, "レジェンド": 5}

                # ==========================================
                # 1. 網の回収チェックと大漁抽選
                # ==========================================
                existing_net = UserNet.query.filter_by(
                    user_id=user.id, port_id=current_step
                ).first()

                if existing_net:
                    recovered_net = existing_net.net_type
                    db.session.delete(existing_net)  # 網を消費

                    # 2〜10匹の重み付け抽選
                    counts = [2, 3, 4, 5, 6, 7, 8, 9, 10]
                    weights = [5, 10, 20, 30, 20, 10, 5, 2, 1]
                    net_catch_count = random.choices(counts, weights=weights, k=1)[0]

                    for _ in range(net_catch_count):
                        weights_f = [
                            RARITY_WEIGHTS.get(f.rarity, 10) for f in port_fishes
                        ]
                        chosen_fish = random.choices(
                            port_fishes, weights=weights_f, k=1
                        )[
                            0
                        ]  # 網は重複OK

                        existing = UserCollection.query.filter_by(
                            user_id=user.id, fish_id=chosen_fish.id
                        ).first()
                        if not existing:
                            db.session.add(
                                UserCollection(user_id=user.id, fish_id=chosen_fish.id)
                            )

                        obtained_fishes.append(
                            {
                                "name": chosen_fish.name,
                                "image": chosen_fish.image_file,
                                "desc": chosen_fish.details.get("biology", ""),
                                "source": "net",
                            }
                        )

                # ==========================================
                # 2. 通常の釣り（網があっても必ず行う）
                # ==========================================
                normal_draw_count = min(3, len(port_fishes))
                normal_drawn = []

                for _ in range(normal_draw_count):
                    available_fish = [f for f in port_fishes if f not in normal_drawn]
                    if not available_fish:
                        break
                    weights_f = [
                        RARITY_WEIGHTS.get(f.rarity, 10) for f in available_fish
                    ]
                    chosen_fish = random.choices(
                        available_fish, weights=weights_f, k=1
                    )[
                        0
                    ]  # 通常は重複なし
                    normal_drawn.append(chosen_fish)

                    existing = UserCollection.query.filter_by(
                        user_id=user.id, fish_id=chosen_fish.id
                    ).first()
                    if not existing:
                        db.session.add(
                            UserCollection(user_id=user.id, fish_id=chosen_fish.id)
                        )

                    obtained_fishes.append(
                        {
                            "name": chosen_fish.name,
                            "image": chosen_fish.image_file,
                            "desc": chosen_fish.details.get("biology", ""),
                            "source": "normal",
                        }
                    )
            break

    user.current_position_id = old_pos_total + actual_move
    user.dice_count -= 1
    user.last_dice_at = datetime.utcnow()
    db.session.commit()

    curr_idx = user.current_position_id % TOTAL_STEPS
    dists = [(p - curr_idx) % TOTAL_STEPS for p in PORTS.keys()]
    dist_to_next = min([d for d in dists if d > 0] or [TOTAL_STEPS])

    return jsonify(
        {
            "dice_val": dice_val,
            "actual_move": actual_move,
            "current_pos": user.current_position_id,
            "dist_to_next": dist_to_next,
            "obtained_fishes": obtained_fishes,  # 網 + 通常 の合計リストが送られる
            "collection_status": f"{UserCollection.query.filter_by(user_id=user.id).count()}/{Fish.query.count()}",
            "remaining_dice": user.dice_count,
            "stopped_at_port": stopped_at_port,
            "recovered_net": recovered_net,
            "net_catch_count": net_catch_count,  # 網だけの獲得数を画面に伝える
            "port_id": user.current_position_id % TOTAL_STEPS,
        }
    )


@app.route("/api/place-net", methods=["POST"])
def place_net():
    """指定した港に網を設置するAPI"""
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    port_id = data.get("port_id")
    net_type = data.get("net_type")
    user_id = session["user_id"]

    # 既にこの港に自分の網があるかチェック
    existing_net = UserNet.query.filter_by(user_id=user_id, port_id=port_id).first()
    if existing_net:
        return jsonify({"error": "すでに網が設置されています"}), 400

    # 新しい網を設置
    new_net = UserNet(user_id=user_id, port_id=port_id, net_type=net_type)
    db.session.add(new_net)
    db.session.commit()

    return jsonify({"success": True, "message": f"{net_type}を設置しました！"})


@app.route("/api/collection")
def get_collection():
    """図鑑・水族館用の全魚データ取得（未獲得は詳細を隠す）"""
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]
    all_fish = Fish.query.all()
    # ここもユーザーIDを使って取得するように修正
    collected_ids = [
        c.fish_id for c in UserCollection.query.filter_by(user_id=user_id).all()
    ]

    result = []
    for f in all_fish:
        is_owned = f.id in collected_ids
        result.append(
            {
                "id": f.id,
                "name": f.name if is_owned else "???",
                "is_owned": is_owned,
                "rarity": f.rarity,
                "image": f.image_file,
                "price_range": f.price_range if is_owned else "???",
                "details": f.details if is_owned else {},
            }
        )
    return jsonify(result)


@app.route("/api/recovery", methods=["POST"])
def recover_dice():
    """サイコロ回復"""
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user = db.session.get(User, session["user_id"])
    user.dice_count += 1
    db.session.commit()
    return jsonify({"success": True, "new_count": user.dice_count})


@app.route("/admin/unlock-all", methods=["POST", "GET"])
def admin_unlock_all():
    """開発用: ログイン中ユーザーの魚を全解放"""
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user = db.session.get(User, session["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404

    all_fishes = Fish.query.all()
    owned_ids = {
        c.fish_id for c in UserCollection.query.filter_by(user_id=user.id).all()
    }

    new_records = 0
    for fish in all_fishes:
        if fish.id not in owned_ids:
            db.session.add(UserCollection(user_id=user.id, fish_id=fish.id))
            new_records += 1

    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "全魚を解放しました",
            "added": new_records,
            "collection_status": f"{UserCollection.query.filter_by(user_id=user.id).count()}/{Fish.query.count()}",
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)
