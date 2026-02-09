# init_db.py の投入データ部分を修正
from datetime import datetime

from app import app
from models.database import Fish, Spot, User, db  # Userを追加


def init_database():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # 1. テストユーザーの作成
        test_user = User(
            id=1, 
            username="石川旅人", 
            current_position_id=0, 
            dice_count=2, 
            last_dice_at=datetime.utcnow()
        )

        # 2. 初期地点データの投入
        spots = [
            Spot(id=0, name="近江町市場", is_port=False),
            Spot(id=5, name="金沢港", is_port=True),
            Spot(id=12, name="安吉港", is_port=True),
            Spot(id=20, name="輪島港(ゴール)", is_port=True)
        ]
        
        # 3. 初期魚データの投入
        fishes = [
            Fish(id=1, name="ノドグロ", rarity=3, details={"biology": "高級魚です。", "season": "冬", "food_culture": "炙り丼", "fishing_method": "底曳網", "price": "高い"}),
            Fish(id=2, name="ブリ", rarity=3, details={"biology": "能登の冬の王者。", "season": "12-2月", "food_culture": "ブリしゃぶ", "fishing_method": "定置網", "price": "普通"}),
            Fish(id=3, name="甘エビ", rarity=1, details={"biology": "甘みが強い。", "season": "通年", "food_culture": "刺身", "fishing_method": "底曳網", "price": "安い"})
        ]

        db.session.add(test_user) # ユーザーを追加
        db.session.add_all(spots)
        db.session.add_all(fishes)
        db.session.commit()
        print("Database initialized with Test User!")

if __name__ == '__main__':
    init_database()