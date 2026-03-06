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

  // ★ここではまだ animation を入れない（後で入れる）
  fishEl.dataset.motionName = motionName;
  fishEl.dataset.motionDuration = `${motionDuration}`;
  fishEl.dataset.motionTiming = motionTiming;
  fishEl.dataset.swimDirection = isSwimRight ? 'right' : 'left';
  fishEl.dataset.direction = isSwimRight ? 'right' : 'left';

  fishEl.style.top = `${5 + Math.random() * 60}%`;
  fishEl.style.left = `${Math.random() * 80}%`; // 初期位置も置いておく
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
if (fishEl.dataset.behavior === 'swim') {
  // 現在位置をpxに固定してから
  pinFishAtCurrentPosition(fishEl, tank.parentElement);
  attachAutonomousSwim(fishEl, tank);
}

if (fishEl.dataset.behavior === 'bottom') {
  attachBottomBehavior(fishEl, tank);
}

});

} catch (e) {

console.error("水族館の読み込みに失敗しました", e);

}

}



// 2. 泡を生成する演出

function createBubbles() {
  const bg = document.getElementById('bubble-container');
  const fg = document.getElementById('bubble-container-fg');
  const tank = document.getElementById('fish-tank');
  if (!bg || !fg || !tank) return;

  bg.innerHTML = '';
  fg.innerHTML = '';

  // スクロール領域全体に泡をばらまく
  const w = tank.scrollWidth;
  const bgCount = Math.max(18, Math.floor(w / 80));
  const fgCount = Math.max(10, Math.floor(w / 140));

  // 遠景泡（小さめ・多め）
  for (let i = 0; i < bgCount; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    const size = 8 + Math.random() * 18;
    b.style.width = `${size}px`;
    b.style.height = `${size}px`;
    b.style.left = `${Math.random() * w}px`;
    b.style.animationDelay = `${Math.random() * 10}s`;
    b.style.animationDuration = `${10 + Math.random() * 10}s`;
    bg.appendChild(b);
  }

  // 前景泡（やや大きめ・少なめ・ぼけ）
  for (let i = 0; i < fgCount; i++) {
    const b = document.createElement('div');
    b.className = 'bubble fg';
    const size = 18 + Math.random() * 28;
    b.style.width = `${size}px`;
    b.style.height = `${size}px`;
    b.style.left = `${Math.random() * w}px`;
    b.style.animationDelay = `${Math.random() * 8}s`;
    b.style.animationDuration = `${8 + Math.random() * 8}s`;
    fg.appendChild(b);
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
nearestFish._followMode = true;

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
  // transition解除
  nearestFish.style.transition = 'none';

  // いまいる場所をpxで確定
  pinFishAtCurrentPosition(nearestFish, scrollArea);

  // ★自律遊泳へ戻す：followMode OFF が正解
  nearestFish._followMode = false;

  // stateを現在位置から再同期
  attachAutonomousSwim(nearestFish, tank);

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

    // scrollArea内座標
    const xInScroll = event.clientX - rect.left + scrollArea.scrollLeft;
    const yInScroll = event.clientY - rect.top;

    // ★tank内座標に変換（タンクはスクロール領域の中にある）
    const tankRect = tank.getBoundingClientRect();
    const x = xInScroll; // tankは横スクロール=scrollLeft込みでOK
    const y = (event.clientY - tankRect.top); // ★tank基準のy

    const ripple = document.createElement('span');
    ripple.className = 'water-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    tank.appendChild(ripple);
    moveNearestFishToPoint(x, y, scrollArea);

    setTimeout(() => ripple.remove(), 900);
  });

  scrollArea.addEventListener('scroll', () => {
    const tank = document.getElementById('fish-tank');
    if (!tank) return;
    const vp = getViewportBounds(tank);

    const fishes = Array.from(tank.querySelectorAll('[data-behavior="swim"]'));
    for (const fishEl of fishes) {
      const st = fishEl._swimState;
      if (!st || fishEl._followMode) continue;

      // スクロールで大きく外に置いていかれた魚は、見える範囲へ寄せる
      if (st.x < vp.left - vp.width * 0.8) st.x = vp.left + Math.random() * vp.width * 0.2;
      if (st.x > vp.right + vp.width * 0.8) st.x = vp.right - (fishEl.offsetWidth || 80) - Math.random() * vp.width * 0.2;
    }
  }, { passive: true });  
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
startAutonomousSwimLoop();

// createBubbles関数がある場合は実行

if (typeof createBubbles === 'function') createBubbles();
if (typeof createLightParticles === 'function') createLightParticles();

setupWaterRipple();

});

// =========================
// リアル寄り：自律遊泳（swim魚用）
// =========================
function attachAutonomousSwim(fishEl, tank) {
  // ★depthは初回だけ固定
  const depth = (fishEl._depth ?? Math.random());
  fishEl._depth = depth;

  const baseScale = 0.75 + depth * 0.35;
  fishEl.style.transform = `scale(${baseScale})`;
  fishEl.style.opacity = `${0.55 + depth * 0.45}`;
  fishEl.style.filter = `blur(${(1 - depth) * 0.6}px)`;
  fishEl.style.willChange = 'transform,left,top';

  // CSSアニメは切る
  fishEl.style.animationName = 'none';

  // ★fishの現在位置を tank 座標(px)で取り直す
  const fishRect = fishEl.getBoundingClientRect();
  const tankRect = tank.getBoundingClientRect();
  const x0 = fishRect.left - tankRect.left;
  const y0 = fishRect.top - tankRect.top;

  // 既存stateがあれば座標だけ更新、なければ新規
  const st = fishEl._swimState || {
    x: 0, y: 0,
    vx: (Math.random() > 0.5 ? 1 : -1) * (35 + depth * 55),
    vy: (Math.random() - 0.5) * 8,
    targetVx: 0,
    driftPhase: Math.random() * Math.PI * 2,
    driftAmp: 6 + Math.random() * 10,
    driftSpeed: 0.6 + Math.random() * 0.8,
    changeTimer: 0,
  };

  st.x = isFinite(x0) ? x0 : (st.x || Math.random() * tank.scrollWidth);
  st.y = isFinite(y0) ? y0 : (st.y || (0.1 + Math.random() * 0.6) * tank.clientHeight);

  // 追従直後は少し落ち着かせる
  st.changeTimer = 0.4 + Math.random() * 0.8;

  fishEl._swimState = st;
}


let _swimRAF = null;
function startAutonomousSwimLoop() {
  if (_swimRAF) return;

  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    const tank = document.getElementById('fish-tank');
    if (tank) {
      const fishes = Array.from(tank.querySelectorAll('[data-behavior="swim"]'));

      for (const fishEl of fishes) {
        const st = fishEl._swimState;
        if (fishEl._followMode) continue;
        if (!st) continue;

        const fishW = fishEl.offsetWidth || 80;

        // ★薄くしない：透明度は固定
        fishEl.style.opacity = '1';

        // ★depthは opacity から取らない（固定値を使う）
        const depth = (typeof fishEl._depth === 'number') ? fishEl._depth : 0.6;

        // たまに速度・方向を少し変える（リアル感）
        st.changeTimer -= dt;
        if (st.changeTimer <= 0) {
          st.changeTimer = 1.2 + Math.random() * 2.8;

          const base = 35 + Math.max(0, Math.min(1, depth)) * 55;

          // たまに小ダッシュ
          const dash = Math.random() < 0.18 ? (1.35 + Math.random() * 0.9) : 1.0;

          // 方向は維持しつつ微調整
          const dir = Math.sign(st.vx) || 1;
          st.targetVx = dir * base * dash;
          st.vy += (Math.random() - 0.5) * 10;
        }

        // target へなめらかに追従
        st.vx += (st.targetVx - st.vx) * 0.9 * dt;

        // 漂い（上下のゆらぎ）
        st.driftPhase += st.driftSpeed * dt;
        const drift = Math.sin(st.driftPhase) * st.driftAmp;

        // 更新
        st.x += st.vx * dt;
        st.y += st.vy * dt + drift * dt;

        // ★いま見えてる範囲を基準にする（画面外に長居させない）
        const vp = getViewportBounds(tank);

        const marginX = Math.max(40, vp.width * 0.18);
        const minX = vp.left - marginX;
        const maxX = vp.right + marginX - fishW;

        const minY = vp.height * 0.06;
        const maxY = vp.height * 0.78;

        // ★ソフトクランプ
        const pull = 2.2;
        if (st.x < minX) st.vx += pull * (minX - st.x) * dt;
        if (st.x > maxX) st.vx -= pull * (st.x - maxX) * dt;

        const pullY = 1.2;
        if (st.y < minY) st.vy += pullY * (minY - st.y) * dt;
        if (st.y > maxY) st.vy -= pullY * (st.y - maxY) * dt;

        // 瞬間リカバリ
        const hardMargin = vp.width * 0.6;
        if (st.x < vp.left - hardMargin) st.x = vp.left + Math.random() * vp.width * 0.2;
        if (st.x > vp.right + hardMargin) st.x = vp.right - fishW - Math.random() * vp.width * 0.2;

        // 反転（向き）
        const fishBody = fishEl.querySelector('.fish-body');
        if (fishBody) {
          fishBody.style.transform = (st.vx >= 0) ? 'scaleX(-1)' : 'scaleX(1)';
        }

        // 描画
        fishEl.style.left = `${st.x}px`;
        fishEl.style.top = `${st.y}px`;
        fishEl.style.bottom = 'auto';
      }
    }

    _swimRAF = requestAnimationFrame(tick);
  };

  _swimRAF = requestAnimationFrame(tick);
}

function getViewportBounds(tank) {
  const scrollArea = tank.parentElement; // overflow-x-auto のdiv
  const left = scrollArea.scrollLeft;
  const right = left + scrollArea.clientWidth;
  const top = 0;
  const bottom = tank.clientHeight;
  return { left, right, top, bottom, width: scrollArea.clientWidth, height: tank.clientHeight };
}

// =========================
// 底生（動かない魚・甲殻類）: 微動 + たまに少し移動
// =========================
function attachBottomBehavior(fishEl, tank) {
  const scrollArea = tank.parentElement;

  // まず「いまの位置」をpx固定（%のままだと移動が崩れやすい）
  pinFishAtCurrentPosition(fishEl, scrollArea);

  // 常時：微動（呼吸っぽい）
  // ※ breathe は既にCSSにある前提（あなたの現状コードと一致）
  fishEl.style.animation = `breathe ${4 + Math.random() * 2}s ease-in-out infinite`;

  // 状態
  const st = {
    x: parseFloat(fishEl.style.left) || 0,
    y: parseFloat(fishEl.style.top) || 0,
    nextMoveAt: performance.now() + (7000 + Math.random() * 9000), // 7〜16秒後に最初の移動
  };
  fishEl._bottomState = st;

  const step = (now) => {
    if (!document.body.contains(fishEl)) return;

    if (now >= st.nextMoveAt) {
      st.nextMoveAt = now + (12000 + Math.random() * 20000); // 次は 12〜32秒後

      // “ちょい移動”だけ（大移動しない）
      const dx = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 18); // 6〜24px
      const dy = (Math.random() - 0.5) * 4; // 縦はほぼ動かない

      // 画面に見えてる範囲を基準にクランプ（画面外に行かせない）
      const vp = getViewportBounds(tank);

      const fishW = fishEl.offsetWidth || 80;
      const fishH = fishEl.offsetHeight || 80;

      // 底の帯域：画面高さの 72%〜92% あたり
      const minY = vp.height * 0.85;
      const maxY = vp.height * 0.99 - fishH;

      // 左右は “少し余白” を残して範囲内へ
      const minX = vp.left + 16;
      const maxX = vp.right - fishW - 16;

      st.x = Math.max(minX, Math.min(maxX, st.x + dx));
      st.y = Math.max(minY, Math.min(maxY, st.y + dy));

      // 向きだけ合わせる（生きてる感UP）
      const body = fishEl.querySelector('.fish-body');
      if (body) body.style.transform = dx >= 0 ? 'scaleX(-1)' : 'scaleX(1)';

      // ぬるっと移動
      fishEl.style.transition = 'left 1.4s ease-in-out, top 1.4s ease-in-out';
      fishEl.style.left = `${st.x}px`;
      fishEl.style.top  = `${st.y}px`;

      // 移動後はtransitionを切っておく（他処理と干渉しにくい）
      setTimeout(() => {
        if (!document.body.contains(fishEl)) return;
        fishEl.style.transition = 'none';
      }, 1600);
    }

    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}