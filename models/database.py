# models/database.py
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# ユーザー情報
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    current_position_id = db.Column(db.Integer, default=0)
    dice_count = db.Column(db.Integer, default=2)
    last_dice_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 追加：歩数カード管理用フラグ
    has_double_dice_card = db.Column(db.Boolean, default=False)

# 魚マスタデータ
class Fish(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    image_file = db.Column(db.String(50), default="default.png")
    rarity = db.Column(db.String(20), default="普通") # 普通/珍しい/レア/伝説
    price_range = db.Column(db.String(50)) # 例: 1,000円〜3,000円
    details = db.Column(db.JSON) # 生態、旬、食文化、漁法を格納

# 地点（港・市場）データ
class Spot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    is_port = db.Column(db.Boolean, default=False)

# 図鑑（ユーザーと魚の中間テーブル）
class UserCollection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    fish_id = db.Column(db.Integer, db.ForeignKey('fish.id'))
    obtained_at = db.Column(db.DateTime, default=datetime.utcnow)