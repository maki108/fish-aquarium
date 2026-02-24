# models/database.py
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


# ユーザー情報
class User(db.Model):
    # 1. データ項目
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255))  # パスワード用

    current_position_id = db.Column(db.Integer, default=0)
    dice_count = db.Column(db.Integer, default=2)
    last_dice_at = db.Column(db.DateTime, default=datetime.utcnow)

    # 歩数カード管理用フラグ
    has_double_dice_card = db.Column(db.Boolean, default=False)

    # パスワードを暗号化してセットする機能
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # パスワードが合っているかチェックする機能
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


# 魚マスタデータ
class Fish(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    image_file = db.Column(db.String(50), default="default.png")
    rarity = db.Column(db.String(20), default="普通")  # 普通/珍しい/レア/伝説
    price_range = db.Column(db.String(50))  # 例: 1,000円〜3,000円
    details = db.Column(db.JSON)  # 生態、旬、食文化、漁法を格納


# 地点（港・市場）データ
class Spot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    is_port = db.Column(db.Boolean, default=False)


# 図鑑（ユーザーと魚の中間テーブル）
class UserCollection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    fish_id = db.Column(db.Integer, db.ForeignKey("fish.id"))
    obtained_at = db.Column(db.DateTime, default=datetime.utcnow)


class UserNet(db.Model):
    """プレイヤーが設置した網を記憶するテーブル"""

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    port_id = db.Column(db.Integer, nullable=False)  # どの港(マス目)に置いたか
    net_type = db.Column(db.String(50), nullable=False)  # まき網、定置網など
