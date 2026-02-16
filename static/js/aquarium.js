/**

* 石川おさかな水族館 - メインロジック

*/



// 1. サーバーから所持している魚のリストを取得して表示

async function loadAquarium() {

try {

const response = await fetch('/api/collection');

const data = await response.json();

const tank = document.getElementById('fish-tank');


// 所持している(is_owned: true)の魚だけを表示

const myFishes = data.filter(f => f.is_owned);



// ★ 生き物の分類リスト

const bottomCreatures = ['ズワイガニ', '毛ガニ', 'サザエ', 'イワガキ', 'シャコ', 'アカカレイ', 'アンコウ', 'ハタハタ', 'トゲザコエビ']; // 底にいる

const seaweeds = ['アカモク']; // 海藻



myFishes.forEach((fish) => {

const fishEl = document.createElement('div');

// 基本クラス設定（位置調整用）

fishEl.className = 'absolute flex flex-col items-center justify-center transition-all duration-300 cursor-pointer';



// --- 動きと位置の決定 ---


// 1. 海藻の場合（底でゆらゆら）

if (seaweeds.some(name => fish.name.includes(name))) {

fishEl.style.bottom = '0%'; // 底に固定

fishEl.style.left = `${5 + Math.random() * 90}%`; // 横位置はランダム

fishEl.style.animation = `sway ${3 + Math.random() * 2}s ease-in-out infinite`; // ゆらゆら

fishEl.style.transformOrigin = 'bottom center'; // 下を軸に揺れる



// 2. 底の生き物の場合（底でじっとする）

} else if (bottomCreatures.some(name => fish.name.includes(name))) {

fishEl.style.bottom = `${2 + Math.random() * 10}%`; // 底付近

fishEl.style.left = `${5 + Math.random() * 90}%`; // 横位置ランダム

fishEl.style.animation = `breathe ${4 + Math.random() * 2}s ease-in-out infinite`; // 呼吸するように微妙に動く



// 3. 泳ぐ魚の場合（これまで通り）

} else {

const isSwimRight = Math.random() > 0.5;

const duration = 15 + Math.random() * 20;

const delay = Math.random() * -20;


fishEl.style.animation = `${isSwimRight ? 'swimRight' : 'swimLeft'} ${duration}s linear infinite`;

fishEl.style.animationDelay = `${delay}s`;

fishEl.style.top = `${5 + Math.random() * 60}%`; // 上空〜中層



// 魚の向き反転ロジック

if (isSwimRight) {

// 右へ泳ぐ時、画像自体を反転させるクラスを追加するためのデータ属性

fishEl.dataset.direction = 'right';

}

}



// --- 画像の表示設定 ---

// 泳ぐ方向に応じた反転スタイル（datasetを使用していない海藻などは影響なし）

let transformStyle = '';

if (fishEl.dataset.direction === 'right') {

transformStyle = 'transform: scaleX(-1);';

}



fishEl.innerHTML = `

<div style="${transformStyle} width: 80px; height: 80px;">

<img src="/static/images/fish/${fish.image}"

class="w-full h-full object-contain drop-shadow-lg transition-transform hover:scale-110">

</div>

`;



// クリック時のイベント

fishEl.onclick = () => showTalkBubble(fish.name);



tank.appendChild(fishEl);

});

} catch (e) {

console.error("水族館の読み込みに失敗しました", e);

}

}



// 2. 泡を生成する演出

function createBubbles() {

const container = document.getElementById('bubble-container');

if (!container) return;



for (let i = 0; i < 15; i++) {

const b = document.createElement('div');

b.className = 'bubble';


const size = 10 + Math.random() * 20; // 泡の大きさ

b.style.width = `${size}px`;

b.style.height = `${size}px`;

b.style.left = `${Math.random() * 100}%`; // 横位置

b.style.animationDelay = `${Math.random() * 10}s`; // 開始のズレ


container.appendChild(b);

}

}



// 3. おしゃべり吹き出しの表示制御

function showTalkBubble(fishName) {

const msg = document.getElementById('fish-message');

const bubble = document.getElementById('talk-bubble');


// メッセージのランダム化（お好みで増やせます）

const comments = [

"石川の海は最高だよ！",

"今日はいい天気だね〜",

"ご飯まだかな？",

"泳ぐの楽しい！"

];

const randomComment = comments[Math.floor(Math.random() * comments.length)];



msg.innerText = `${fishName}「${randomComment}」`;


bubble.classList.remove('hidden');

bubble.classList.add('animate-bounce'); // 登場時に少し跳ねる



// 3秒後に消す

setTimeout(() => {

bubble.classList.add('hidden');

bubble.classList.remove('animate-bounce');

}, 3000);

}



window.addEventListener('DOMContentLoaded', () => {

loadAquarium();

// createBubbles関数がある場合は実行

if (typeof createBubbles === 'function') createBubbles();

});