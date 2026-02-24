/**

* 石川おさかな水族館 - メインロジック

*/

let activeFollowerFish = null;



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

fishEl.className = 'absolute z-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer';



// --- 動きと位置の決定 ---


// 1. 海藻の場合（底でゆらゆら）

if (seaweeds.some(name => fish.name.includes(name))) {

fishEl.dataset.behavior = 'seaweed';

fishEl.style.bottom = '0%'; // 底に固定

fishEl.style.left = `${5 + Math.random() * 90}%`; // 横位置はランダム

fishEl.style.animation = `sway ${3 + Math.random() * 2}s ease-in-out infinite`; // ゆらゆら

fishEl.style.transformOrigin = 'bottom center'; // 下を軸に揺れる



// 2. 底の生き物の場合（底でじっとする）

} else if (bottomCreatures.some(name => fish.name.includes(name))) {

fishEl.dataset.behavior = 'bottom';

fishEl.style.bottom = `${2 + Math.random() * 10}%`; // 底付近

fishEl.style.left = `${5 + Math.random() * 90}%`; // 横位置ランダム

fishEl.style.animation = `breathe ${4 + Math.random() * 2}s ease-in-out infinite`; // 呼吸するように微妙に動く



// 3. 泳ぐ魚の場合（これまで通り）

} else {

fishEl.dataset.behavior = 'swim';

const isSwimRight = Math.random() > 0.5;

const movementPattern = ['glide', 'wave', 'dart'][Math.floor(Math.random() * 3)];

let duration = 18 + Math.random() * 18;
let motionName = 'fish-glide';
let motionDuration = 4.5 + Math.random() * 2.5;
let motionTiming = 'ease-in-out';

if (movementPattern === 'wave') {
duration = 16 + Math.random() * 14;
motionName = 'fish-wave';
motionDuration = 3.5 + Math.random() * 2;
motionTiming = 'ease-in-out';
} else if (movementPattern === 'dart') {
duration = 11 + Math.random() * 10;
motionName = 'fish-dart';
motionDuration = 2.2 + Math.random() * 1.4;
motionTiming = 'cubic-bezier(0.4, 0, 0.2, 1)';
}

const delay = Math.random() * -20;

fishEl.style.animationName = `${isSwimRight ? 'swimRight' : 'swimLeft'}, ${motionName}`;
fishEl.style.animationDuration = `${duration}s, ${motionDuration}s`;
fishEl.style.animationTimingFunction = `linear, ${motionTiming}`;
fishEl.style.animationDelay = `${delay}s, ${Math.random() * -3}s`;
fishEl.style.animationIterationCount = 'infinite, infinite';

fishEl.dataset.motionName = motionName;
fishEl.dataset.motionDuration = `${motionDuration}`;
fishEl.dataset.motionTiming = motionTiming;
fishEl.dataset.swimSpeed = `${(tank.scrollWidth * 1.3) / duration}`;
fishEl.dataset.swimDirection = isSwimRight ? 'right' : 'left';

fishEl.style.top = `${5 + Math.random() * 60}%`; // 上空〜中層



// 魚の向き反転ロジック

if (isSwimRight) {

// 右へ泳ぐ時、画像自体を反転させるクラスを追加するためのデータ属性

fishEl.dataset.direction = 'right';

}

}



// --- 画像の表示設定 ---

// 泳ぐ方向に応じた反転スタイル（datasetを使用していない海藻などは影響なし）

const facingScale = fishEl.dataset.direction === 'right' ? -1 : 1;



fishEl.innerHTML = `

<div class="fish-body" style="transform: scaleX(${facingScale}); width: 80px; height: 80px;">

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
const tank = document.getElementById('fish-tank');

if (!container || !tank) return;

container.innerHTML = '';

const bubbleCount = Math.max(15, Math.floor(tank.scrollWidth / 90));


for (let i = 0; i < bubbleCount; i++) {

const b = document.createElement('div');

b.className = 'bubble';


const size = 10 + Math.random() * 20; // 泡の大きさ

b.style.width = `${size}px`;

b.style.height = `${size}px`;

b.style.left = `${Math.random() * tank.scrollWidth}px`; // 横位置（スクロール領域全体）

b.style.animationDelay = `${Math.random() * 10}s`; // 開始のズレ
b.style.animationDuration = `${8 + Math.random() * 6}s`;


container.appendChild(b);

}

}



// 2.3 光の粒子を生成する演出

function createLightParticles() {

const container = document.getElementById('light-particle-container');
const tank = document.getElementById('fish-tank');

if (!container || !tank) return;

container.innerHTML = '';

const particleCount = Math.max(10, Math.floor(tank.scrollWidth / 160));


for (let i = 0; i < particleCount; i++) {

const particle = document.createElement('span');

particle.className = 'light-particle';

const size = 2 + Math.random() * 3;
particle.style.width = `${size}px`;
particle.style.height = `${size}px`;
particle.style.left = `${Math.random() * 100}%`;
particle.style.animationDelay = `${Math.random() * 11}s`;
particle.style.animationDuration = `${12 + Math.random() * 8}s`;


container.appendChild(particle);

}

}



// 2.4 タップ位置へ最寄りの魚を追従させる

function pinFishAtCurrentPosition(fishEl, scrollArea) {

const fishRect = fishEl.getBoundingClientRect();
const scrollRect = scrollArea.getBoundingClientRect();

const currentLeft = fishRect.left - scrollRect.left + scrollArea.scrollLeft;
const currentTop = fishRect.top - scrollRect.top;

fishEl.style.left = `${currentLeft}px`;
fishEl.style.top = `${currentTop}px`;
fishEl.style.bottom = 'auto';

fishEl.style.animationName = 'none';
fishEl.style.animationDuration = '0s';
fishEl.style.animationTimingFunction = 'linear';
fishEl.style.animationDelay = '0s';
fishEl.style.animationIterationCount = '1';

fishEl.swimLoopToken = (fishEl.swimLoopToken || 0) + 1;
}

function continueSwimFromCurrentPosition(fishEl, tank) {

const fishWidth = fishEl.offsetWidth || 80;
const swimSpeed = Math.max(40, parseFloat(fishEl.dataset.swimSpeed) || 90);

const fishBody = fishEl.querySelector('.fish-body');
let swimDirection = fishEl.dataset.swimDirection || 'right';
if (fishBody && fishBody.style.transform.includes('scaleX(1)')) {
swimDirection = 'left';
}

const loopToken = (fishEl.swimLoopToken || 0) + 1;
fishEl.swimLoopToken = loopToken;

fishEl.style.animationName = fishEl.dataset.motionName || 'fish-glide';
fishEl.style.animationDuration = `${fishEl.dataset.motionDuration || '4.5'}s`;
fishEl.style.animationTimingFunction = fishEl.dataset.motionTiming || 'ease-in-out';
fishEl.style.animationDelay = '0s';
fishEl.style.animationIterationCount = 'infinite';

const setFacing = (direction) => {
if (!fishBody) return;
fishBody.style.transform = direction === 'right' ? 'scaleX(-1)' : 'scaleX(1)';
};

const moveLeg = (fromLeft, direction) => {
if (fishEl.swimLoopToken !== loopToken) return;

const targetLeft = direction === 'right'
? tank.scrollWidth + fishWidth * 0.25
: -fishWidth * 1.25;

const distance = Math.abs(targetLeft - fromLeft);
const travelSeconds = Math.max(1, distance / swimSpeed);

fishEl.dataset.swimDirection = direction;
setFacing(direction);

fishEl.style.transition = `left ${travelSeconds}s linear`;
requestAnimationFrame(() => {
if (fishEl.swimLoopToken !== loopToken) return;
fishEl.style.left = `${targetLeft}px`;
});

const onTransitionEnd = (event) => {
if (event.propertyName !== 'left') return;
fishEl.removeEventListener('transitionend', onTransitionEnd);
if (fishEl.swimLoopToken !== loopToken) return;

const nextDirection = direction === 'right' ? 'left' : 'right';
const resetLeft = nextDirection === 'right'
? -fishWidth * 1.25
: tank.scrollWidth + fishWidth * 0.25;

fishEl.style.transition = 'none';
fishEl.style.left = `${resetLeft}px`;

requestAnimationFrame(() => {
moveLeg(resetLeft, nextDirection);
});
};

fishEl.addEventListener('transitionend', onTransitionEnd);
};

fishEl.style.bottom = 'auto';

const currentLeft = parseFloat(fishEl.style.left) || 0;
moveLeg(currentLeft, swimDirection);
}

function moveNearestFishToPoint(targetX, targetY, scrollArea) {

const tank = document.getElementById('fish-tank');
if (!tank) return;

const swimmers = Array.from(tank.querySelectorAll('[data-behavior="swim"]'));
if (swimmers.length === 0) return;

let nearestFish = null;
let nearestDistance = Number.POSITIVE_INFINITY;

const scrollRect = scrollArea.getBoundingClientRect();

swimmers.forEach((fishEl) => {
const rect = fishEl.getBoundingClientRect();
const centerX = rect.left - scrollRect.left + scrollArea.scrollLeft + rect.width / 2;
const centerY = rect.top - scrollRect.top + rect.height / 2;
const distance = Math.hypot(targetX - centerX, targetY - centerY);

if (distance < nearestDistance) {
nearestDistance = distance;
nearestFish = fishEl;
}
});

if (!nearestFish) return;

if (nearestFish.followResetTimer) {
clearTimeout(nearestFish.followResetTimer);
nearestFish.followResetTimer = null;
}

pinFishAtCurrentPosition(nearestFish, scrollArea);

const fishWidth = nearestFish.offsetWidth || 80;
const fishHeight = nearestFish.offsetHeight || 80;

const minLeft = 0;
const maxLeft = Math.max(0, tank.scrollWidth - fishWidth);
const minTop = 0;
const maxTop = Math.max(0, tank.clientHeight - fishHeight);

const nextLeft = Math.min(maxLeft, Math.max(minLeft, targetX - fishWidth / 2));
const nextTop = Math.min(maxTop, Math.max(minTop, targetY - fishHeight / 2));

const currentLeft = parseFloat(nearestFish.style.left) || 0;
const fishBody = nearestFish.querySelector('.fish-body');
if (fishBody) {
const shouldFaceRight = nextLeft > currentLeft;
fishBody.style.transform = shouldFaceRight ? 'scaleX(-1)' : 'scaleX(1)';
}

nearestFish.style.transition = 'left 1s ease-out, top 1s ease-out';
nearestFish.style.left = `${nextLeft}px`;
nearestFish.style.top = `${nextTop}px`;

nearestFish.followResetTimer = setTimeout(() => {
continueSwimFromCurrentPosition(nearestFish, tank);
nearestFish.followResetTimer = null;
}, 1300);

activeFollowerFish = nearestFish;
}



// 2.5 タップ・クリック時の波紋演出

function setupWaterRipple() {

const tank = document.getElementById('fish-tank');

if (!tank || !tank.parentElement) return;

const scrollArea = tank.parentElement;



scrollArea.addEventListener('pointerdown', (event) => {

const rect = scrollArea.getBoundingClientRect();

const x = event.clientX - rect.left + scrollArea.scrollLeft;

const y = event.clientY - rect.top;



const ripple = document.createElement('span');

ripple.className = 'water-ripple';

ripple.style.left = `${x}px`;

ripple.style.top = `${y}px`;



tank.appendChild(ripple);

moveNearestFishToPoint(x, y, scrollArea);



setTimeout(() => {

ripple.remove();

}, 900);

});

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
if (typeof createLightParticles === 'function') createLightParticles();

setupWaterRipple();

});