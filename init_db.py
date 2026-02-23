# init_db.py の投入データ部分を修正
from datetime import datetime

from werkzeug.security import generate_password_hash

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
            password_hash=generate_password_hash("password123"),
            current_position_id=0,
            dice_count=2,
            last_dice_at=datetime.utcnow(),
        )

        # 2. 初期地点データの投入
        spots = [
            Spot(id=0, name="近江町市場", is_port=False),
            Spot(id=5, name="金沢港", is_port=True),
            Spot(id=12, name="安吉港", is_port=True),
            Spot(id=20, name="輪島港(ゴール)", is_port=True),
        ]

        # 3. 初期魚データの投入
        fishes = [
            # ----------------------------------------
            # 伝説 (Legend) - 石川を代表する高級ブランド
            # ----------------------------------------
            Fish(
                name="加能ガニ「輝」",
                rarity="レジェンド",
                price_range="450,000円〜",
                image_file="kagayaki.png",
                details={
                    "biology": "石川県産ズワイガニの中で、重さ1.5kg以上など極めて厳しい基準をクリアした奇跡の最高級ブランド。",
                    "season": "冬",
                    "fishing_method": "底引き網",
                    "food_culture": "茹でガニ、カニ刺し、焼きガニ",
                },
            ),
            Fish(
                name="天然能登寒ぶり「煌」",
                rarity="レジェンド",
                price_range="4,000,000円",
                image_file="kirameki.png",
                details={
                    "biology": "重さ14kg以上など極めて厳しい基準をクリアした天然能登寒ぶりの最高峰ブランド。奇跡の1本とも呼ばれる。",
                    "season": "冬",
                    "fishing_method": "定置網",
                    "food_culture": "極上のブリしゃぶ、刺身",
                },
            ),
            Fish(
                name="ノドグロ",
                rarity="レジェンド",
                price_range="5,000円〜",
                image_file="nodoguro.png",
                details={
                    "biology": "正式名はアカムツ。「白身のトロ」と称される。",
                    "season": "秋〜冬",
                    "fishing_method": "底引き網",
                    "food_culture": "炙り刺身、塩焼き",
                },
            ),
            Fish(
                name="能登寒ブリ",
                rarity="レジェンド",
                price_range="20,000円〜",
                image_file="notokanburi.png",
                details={
                    "biology": "7kg以上など厳しい基準を超えた冬の王者。",
                    "season": "冬",
                    "fishing_method": "定置網",
                    "food_culture": "ブリしゃぶ、刺身",
                },
            ),
            Fish(
                name="キジハタ",
                rarity="レジェンド",
                price_range="4,000円〜",
                image_file="kizihata.png",
                details={
                    "biology": "地元では「ナメラ」と呼ばれる夏の高級魚。",
                    "season": "夏",
                    "fishing_method": "定置網、釣り",
                    "food_culture": "薄造り、煮付け",
                },
            ),
            # ----------------------------------------
            # レア - 高級、または地元ならではの特産
            # ----------------------------------------
            Fish(
                name="イワガキ",
                rarity="レア",
                price_range="800円/個〜",
                image_file="iwagaki.png",
                details={
                    "biology": "「海のミルク」。夏に旬を迎える。",
                    "season": "夏",
                    "fishing_method": "素潜り",
                    "food_culture": "生食（レモンを搾って）",
                },
            ),
            Fish(
                name="トゲザコエビ",
                rarity="レア",
                price_range="2,000円〜",
                image_file="togezakoebi.png",
                details={
                    "biology": "通称「ガスエビ」。鮮度落ちが早く県外に出回らない。",
                    "season": "冬〜春",
                    "fishing_method": "底引き網",
                    "food_culture": "刺身（甘エビより甘い）",
                },
            ),
            Fish(
                name="イシダイ",
                rarity="レア",
                price_range="3,000円〜",
                image_file="isidai.png",
                details={
                    "biology": "縞模様が特徴。「磯の王者」。",
                    "season": "夏",
                    "fishing_method": "定置網",
                    "food_culture": "刺身、皮の湯引き",
                },
            ),
            Fish(
                name="アンコウ",
                rarity="レア",
                price_range="2,500円〜",
                image_file="ankou.png",
                details={
                    "biology": "能登は有数の産地。「七つ道具」捨てるところがない。",
                    "season": "冬",
                    "fishing_method": "底引き網",
                    "food_culture": "アンコウ鍋、とも和え",
                },
            ),
            Fish(
                name="毛ガニ",
                rarity="レア",
                price_range="3,000円〜",
                image_file="kegani.png",
                details={
                    "biology": "身は少ないが濃厚なカニ味噌が絶品。",
                    "season": "冬〜春",
                    "fishing_method": "カゴ漁",
                    "food_culture": "塩茹で、甲羅酒",
                },
            ),
            Fish(
                name="ズワイガニ",
                rarity="レア",
                price_range="5,000円〜",
                image_file="zuwaigani.png",
                details={
                    "biology": "メスは「香箱ガニ」と呼ばれ内子が絶品。",
                    "season": "冬",
                    "fishing_method": "底引き網",
                    "food_culture": "カニ面、おでん",
                },
            ),
            Fish(
                name="ホッコクアカエビ",
                rarity="レア",
                price_range="1,000円〜",
                image_file="hokkokuakaebi.png",
                details={
                    "biology": "通称「甘エビ」。鮮やかな赤色が特徴。",
                    "season": "秋〜冬",
                    "fishing_method": "底引き網",
                    "food_culture": "刺身、頭の味噌汁",
                },
            ),
            Fish(
                name="サワラ",
                rarity="レア",
                price_range="1,500円〜",
                image_file="sawara.png",
                details={
                    "biology": "春を告げる魚。石川では「カジ」と呼ばれることも。",
                    "season": "春・冬",
                    "fishing_method": "定置網",
                    "food_culture": "昆布締め、炙り",
                },
            ),
            Fish(
                name="ヤリイカ",
                rarity="レア",
                price_range="1,200円〜",
                image_file="yariika.png",
                details={
                    "biology": "冬のイカ。身が柔らかく甘みが強い。",
                    "season": "冬",
                    "fishing_method": "定置網",
                    "food_culture": "刺身、煮付け",
                },
            ),
            Fish(
                name="ウスメバル",
                rarity="レア",
                price_range="1,000円〜",
                image_file="usumebaru.png",
                details={
                    "biology": "通称「柳八目（ヤナギバチメ）」。春告げ魚。",
                    "season": "春",
                    "fishing_method": "定置網",
                    "food_culture": "煮付け、塩焼き",
                },
            ),
            Fish(
                name="シャコ",
                rarity="レア",
                price_range="800円〜",
                image_file="shako.png",
                details={
                    "biology": "七尾湾などが産地。見た目に反して美味。",
                    "season": "春・秋",
                    "fishing_method": "刺し網",
                    "food_culture": "塩茹で、寿司",
                },
            ),
            Fish(
                name="コウイカ",
                rarity="レア",
                price_range="1,000円〜",
                image_file="kouika.png",
                details={
                    "biology": "墨を大量に吐くためスミイカとも。肉厚。",
                    "season": "春",
                    "fishing_method": "底引き網",
                    "food_culture": "天ぷら、刺身",
                },
            ),
            Fish(
                name="アカカマス",
                rarity="レア",
                price_range="1,000円〜",
                image_file="akakamasu.png",
                details={
                    "biology": "秋に脂が乗る。鋭い歯を持つ。",
                    "season": "秋〜冬",
                    "fishing_method": "定置網",
                    "food_culture": "塩焼き、炙り刺身",
                },
            ),
            # ----------------------------------------
            # ノーマル - 食卓でおなじみ
            # ----------------------------------------
            Fish(
                name="アジ",
                rarity="ノーマル",
                price_range="100円〜",
                image_file="azi.png",
                details={
                    "biology": "能登のアジは脂乗りが良い。",
                    "season": "春〜夏",
                    "fishing_method": "巻き網",
                    "food_culture": "フライ、たたき、南蛮漬け",
                },
            ),
            Fish(
                name="ハタハタ",
                rarity="ノーマル",
                price_range="300円〜",
                image_file="hatahata.png",
                details={
                    "biology": "ウロコがない。冬の雷の時期に獲れる。",
                    "season": "冬",
                    "fishing_method": "底引き網",
                    "food_culture": "塩焼き、煮付け、唐揚げ",
                },
            ),
            Fish(
                name="アカカレイ",
                rarity="ノーマル",
                price_range="300円〜",
                image_file="akakarei.png",
                details={
                    "biology": "石川の冬の惣菜魚。子持ちが美味。",
                    "season": "冬",
                    "fishing_method": "底引き網",
                    "food_culture": "煮付け（真子煮）",
                },
            ),
            Fish(
                name="スルメイカ",
                rarity="ノーマル",
                price_range="200円〜",
                image_file="surumeika.png",
                details={
                    "biology": "石川県の「県魚」の一つ。小木港が有名。",
                    "season": "夏〜秋",
                    "fishing_method": "イカ釣り",
                    "food_culture": "黒作り、いしる、鉄砲焼き",
                },
            ),
            Fish(
                name="サザエ",
                rarity="ノーマル",
                price_range="300円〜",
                image_file="sazae.png",
                details={
                    "biology": "磯の香り。夏のバーベキューの定番。",
                    "season": "夏",
                    "fishing_method": "素潜り、刺し網",
                    "food_culture": "つぼ焼き、刺身",
                },
            ),
            Fish(
                name="ウマヅラハギ",
                rarity="ノーマル",
                price_range="200円〜",
                image_file="umadurahagi.png",
                details={
                    "biology": "カワハギより面長。肝が大きくて美味。",
                    "season": "冬",
                    "fishing_method": "定置網",
                    "food_culture": "肝醤油で刺身、鍋",
                },
            ),
            Fish(
                name="ウルメイワシ",
                rarity="ノーマル",
                price_range="100円〜",
                image_file="urumeiwasi.png",
                details={
                    "biology": "目が潤んで見える。干物の原料として優秀。",
                    "season": "秋〜冬",
                    "fishing_method": "巻き網",
                    "food_culture": "丸干し、つみれ汁",
                },
            ),
            Fish(
                name="アブラツノザメ",
                rarity="ノーマル",
                price_range="200円〜",
                image_file="aburatunozame.png",
                details={
                    "biology": "能登ではサメを食べる習慣がある。骨が柔らかい。",
                    "season": "冬",
                    "fishing_method": "底引き網",
                    "food_culture": "煮付け、ぬた（酢味噌和え）",
                },
            ),
            Fish(
                name="アカモク",
                rarity="ノーマル",
                price_range="200円〜",
                image_file="akamoku.png",
                details={
                    "biology": "強い粘り気がある海藻。栄養価が高い。",
                    "season": "春",
                    "fishing_method": "素潜り",
                    "food_culture": "酢の物、味噌汁",
                },
            ),
        ]

        db.session.add(test_user)  # ユーザーを追加
        db.session.add_all(spots)
        db.session.add_all(fishes)
        db.session.commit()
        print("魚データの更新完了")


if __name__ == "__main__":
    init_database()
