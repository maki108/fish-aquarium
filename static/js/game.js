/**
 * 石川さかな巡りすごろく - 完全版（一本釣り対応 + クイズマス対応）
 */

const TOTAL_STEPS = 64;
let MAP_COORDINATES = [];

// ラベル（文字）が重ならないよう、出す方向を少し広めに設定（アイコン大型化に対応）
const MAIN_SPOTS = {
    0:  { name: "近江町市場", icon: "🦀", labelClass: "top-12 left-1/2 -translate-x-1/2" },
    8:  { name: "内灘",      icon: "🏖️", labelClass: "-left-14 top-1/2 -translate-y-1/2" },
    16: { name: "金沢港",    icon: "🚢", labelClass: "top-12 left-1/2 -translate-x-1/2" },
    24: { name: "羽咋港",    icon: "🛸", labelClass: "-left-14 top-1/2 -translate-y-1/2" },
    32: { name: "七尾港",    icon: "🐟", labelClass: "-right-14 top-1/2 -translate-y-1/2" },
    40: { name: "輪島港",    icon: "🛍️", labelClass: "-top-8 left-1/2 -translate-x-1/2" },
    48: { name: "珠洲港",    icon: "💡", labelClass: "-top-8 left-1/2 -translate-x-1/2" },
    56: { name: "能登島",    icon: "🐬", labelClass: "-right-14 top-1/2 -translate-y-1/2" }
};


const fishImageCache = new Map();

function preloadImage(src) {
    return new Promise((resolve) => {
        if (fishImageCache.has(src)) {
            resolve(fishImageCache.get(src));
            return;
        }

        const img = new Image();
        img.onload = () => {
            fishImageCache.set(src, img);
            resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
}
// ------------------------------------------
// クイズマス設定
// 港マス以外の通常移動マスの約1/3を黄色マスにする
// ------------------------------------------
function generateQuizSteps() {
    const steps = [];
    for (let i = 1; i < TOTAL_STEPS; i++) {
        if (MAIN_SPOTS[i]) continue;   // 港マス除外
        if (i % 3 === 1) steps.push(i); // 約3分の1
    }
    return new Set(steps);
}

const QUIZ_STEPS = generateQuizSteps();

function getResponsiveLabelClass(labelClass) {
    if (window.innerWidth >= 768) return labelClass;

    return labelClass
        .replace('-left-10', '-left-7')
        .replace('-right-10', '-right-7')
        .replace('-right-12', '-right-8')
        .replace('top-8', 'top-6');
}

const QUIZ_DATA = [
    {
        question: "一般的に「本ズワイガニ」の漁が解禁され、最も旬とされる時期はいつからいつまででしょうか？",
        choices: [
            "A. 11月上旬〜3月下旬",
            "B. 1月上旬〜5月下旬",
            "C. 4月上旬〜8月下旬",
            "D. 9月上旬〜10月下旬"
        ],
        correctIndex: 0,
        explanation: "本ズワイガニは一般的に11月上旬〜3月下旬ごろが旬とされます。"
    },
    {
        question: "「寒ブリ」として最も脂が乗り、最高級とされる時期はいつ頃でしょうか？",
        choices: [
            "A. 6月〜8月",
            "B. 3月〜5月",
            "C. 9月〜11月",
            "D. 12月〜2月"
        ],
        correctIndex: 3,
        explanation: "寒ブリは冬の12月〜2月ごろに最も脂が乗り、特に高く評価されます。"
    },
    {
        question: "定置網漁は、泳いでいる魚を追いかけるのではなく、通り道に網を設置して待つ漁法です。このような性質の漁法を一般的に何と呼ぶでしょうか？",
        choices: [
            "A. 待ちの漁業",
            "B. 攻めの漁業",
            "C. 底引き漁業",
            "D. 流し網漁業"
        ],
        correctIndex: 0,
        explanation: "定置網漁は魚を追いかけず、通り道に仕掛けて待つため、「待ちの漁業」と呼ばれます。"
    },
    {
        question: "定置網で獲れた魚が「鮮度が良い」とされる最大の理由は何でしょうか？",
        choices: [
            "A. 網の素材に殺菌効果があるから",
            "B. 魚が網の中で眠ってしまうから",
            "C. 網の中で魚が暴れず、ストレスが少ない状態で水揚げされるから",
            "D. 網の中に冷蔵設備が付いているから"
        ],
        correctIndex: 2,
        explanation: "広い網の中で泳いでいる状態で生け捕りにするため、身の質が落ちにくいのが特徴です"
    }    
];

let quizRetryEnabled = false;     // 正解後、追加で1回振れる状態か
let currentQuiz = null;
let currentQuizStep = null;

// 現在港にいるときの港ID管理（既存処理用）
window.currentPortId = null;

window.addEventListener('DOMContentLoaded', () => {
    calculateCoordinates();

    const container = document.getElementById('map-nodes');
    if (container) {
        for (let i = 0; i < TOTAL_STEPS; i++) {
            const coord = MAP_COORDINATES[i];
            const el = document.createElement('div');
            el.style.left = `${coord.x}%`;
            el.style.top = `${coord.y}%`;
            el.style.transform = 'translate(-50%, -50%)';

            if (MAIN_SPOTS[i]) {
                const spot = MAIN_SPOTS[i];
                const responsiveLabelClass = getResponsiveLabelClass(spot.labelClass);
                el.className = "absolute z-20 port-node";
                el.dataset.step = i;
                el.innerHTML = `
                    <div class="relative flex flex-col items-center group">
                        <div class="w-10 h-10 bg-white/95 rounded-full border-2 border-cyan-500 shadow-md flex items-center justify-center text-lg z-10">
                            ${spot.icon}
                        </div>
                        <div class="absolute ${responsiveLabelClass} bg-white/95 px-2 py-1 rounded border border-cyan-200 text-[10px] font-bold text-cyan-900 whitespace-nowrap shadow-sm z-20">
                            ${spot.name}
                        </div>
                    </div>
                `;

            } else if (QUIZ_STEPS.has(i)) {
                el.className = "absolute z-10";
                el.innerHTML = `
                    <div class="w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-200 shadow-sm flex items-center justify-center">
                        <span class="text-[10px] font-black text-yellow-900 leading-none">?</span>
                    </div>
                `;
            } else {
                // ▼ 通常のドットマス：w-3 h-3 に少し大型化
                el.className = "absolute w-3.5 h-3.5 bg-cyan-400 rounded-full border-[1.5px] border-white z-10 shadow";
            }

            container.appendChild(el);
        }
    }

    const routeLine = document.getElementById('route-line');
    if (routeLine && MAP_COORDINATES.length > 0) {
        // 座標データを "x,y x,y x,y..." という文字列に変換して適用
        const pointsStr = MAP_COORDINATES.map(c => `${c.x},${c.y}`).join(' ');
        routeLine.setAttribute('points', pointsStr);
    }
    initPlayerPosition();
});

/**
 * 座標計算ロジック（ベジェ曲線でルートの交差を回避）
 */
function calculateCoordinates() {
    MAP_COORDINATES = [];

    const ANCHORS = {
        0:  { x: 38, y: 78 }, // 近江町市場
        8:  { x: 33, y: 56 }, // 内灘
        16: { x: 50, y: 82 }, // 金沢港
        24: { x: 42, y: 38 }, // 羽咋港
        32: { x: 58, y: 42 }, // 七尾港
        40: { x: 45, y: 15 }, // 輪島港
        48: { x: 75, y: 12 }, // 珠洲港
        56: { x: 70, y: 30 }, // 能登島
        64: { x: 38, y: 78 }  // ゴール
    };

    const CONTROL_POINTS = {
        0:  { x: 20, y: 68 },
        8:  { x: 55, y: 62 },
        16: { x: 25, y: 65 },
        24: { x: 50, y: 35 },
        32: { x: 40, y: 25 },
        40: { x: 60, y: 5  },
        48: { x: 85, y: 20 },
        56: { x: 80, y: 60 }
    };

    for (let i = 0; i < TOTAL_STEPS; i++) {
        let startIndex = Math.floor(i / 8) * 8;
        let endIndex = startIndex + 8;

        let P0 = ANCHORS[startIndex];
        let P2 = ANCHORS[endIndex];
        let P1 = CONTROL_POINTS[startIndex];

        let t = (i % 8) / 8;

        let x = Math.pow(1 - t, 2) * P0.x + 2 * (1 - t) * t * P1.x + Math.pow(t, 2) * P2.x;
        let y = Math.pow(1 - t, 2) * P0.y + 2 * (1 - t) * t * P1.y + Math.pow(t, 2) * P2.y;

        MAP_COORDINATES.push({ x, y });
    }
}

// プレイヤー情報の初期化
async function initPlayerPosition() {
    try {
        const response = await fetch('/api/user-status');
        const data = await response.json();
        updateGameScreen(data);
    } catch (e) {
        console.error("初期データ取得エラー", e);
    }
}

// サイコロを振るボタンの処理
async function rollDice() {
    const button = document.getElementById('roll-button');
    const diceResult = document.getElementById('dice-result');

    // クイズ正解による追加ロールをここで消費
    if (quizRetryEnabled) {
        quizRetryEnabled = false;
        clearExtraRollState();
    }

    button.disabled = true;
    diceResult.innerHTML = '<span class="text-5xl animate-spin inline-block">🎲</span>';

    try {
        const response = await fetch('/api/roll-dice', { method: 'POST' });
        const data = await response.json();

        if (data.error) {
            alert(data.error);
            button.disabled = false;
            diceResult.innerText = "🎲";
            return;
        }

        // 1. サイコロが回る演出を少し見せる (600ミリ秒待機)
        await sleep(600);

        // 2. サイコロの出目を表示
        diceResult.innerHTML = createDiceHtml(data.dice_val);

        // 3. コマを1マスずつ動かすアニメーションを実行！
        // (現在の位置から進んだ数を引いて、スタート地点を逆算)
        const oldPos = data.current_pos - data.actual_move;
        await animatePlayerMovement(oldPos, data.actual_move);

        // 4. 移動が完全に終わってから、港の名前や残りマス数を更新
        updateGameScreen(data);

        // 5. 止まったマスに応じたイベントを発生させる
        const finalStep = data.current_pos % TOTAL_STEPS;

        if (data.obtained_fishes && data.obtained_fishes.length > 0) {
            // 港マスに止まった時の処理（網回収 または 通常釣り）
            if (data.recovered_net) {
                setTimeout(() => {
                    startNetPulling(data.obtained_fishes, data.recovered_net, data.net_catch_count);
                }, 500);
            } else {
                setTimeout(() => startFishing(data.obtained_fishes), 500);
            }
        } else if (QUIZ_STEPS.has(finalStep)) {
            // クイズマス（黄色マス）に止まった時の処理
            setTimeout(() => {
                showQuizModal();
            }, 500);
        }

        button.disabled = false;

    } catch (e) {
        console.error(e);
        button.disabled = false;
        diceResult.innerText = "Error";
    }
}

// 画面全体の更新処理
function updateGameScreen(data) {
    const currentStep = data.current_pos % TOTAL_STEPS;
    const spotName = MAIN_SPOTS[currentStep] ? MAIN_SPOTS[currentStep].name : "移動中...";

    document.getElementById('current-spot').innerText = spotName;
    document.getElementById('distance-info').innerText = `次の港まであと ${data.dist_to_next} マス`;
    document.getElementById('collection-ratio').innerText = data.collection_status;
    document.getElementById('dice-count').innerText = data.remaining_dice;

    const player = document.getElementById('player-piece');
    const coord = MAP_COORDINATES[currentStep];

    if (coord) {
        player.style.display = 'flex';
        player.style.left = `${coord.x}%`;
        player.style.top = `${coord.y}%`;
        player.classList.add('piece-active');
// ▼ 画面更新時（ロード時など）にカメラを即座に現在地へ合わせる
        setTimeout(() => focusCameraOnPlayer(true), 50);
    }

    // 港にいるなら港IDを保持
    window.currentPortId = MAIN_SPOTS[currentStep] ? currentStep : null;
}

// サイコロHTML生成
function createDiceHtml(num) {
    let dots = '';
    for (let i = 0; i < num; i++) {
        dots += '<div class="dice-dot"></div>';
    }
    return `<div class="dice-face dice-${num}">${dots}</div>`;
}

// 釣果のまとめモーダル表示（すべて釣り終わった後）
function showFishModal(fishes) {
    const modal = document.getElementById('fish-modal');
    const list = document.getElementById('fish-list');

    list.innerHTML = fishes.map(f => `
        <div class="flex items-center bg-cyan-50 p-4 rounded-2xl border border-cyan-100 mb-2 shadow-sm">
            <div class="w-12 h-12 flex items-center justify-center mr-4 shrink-0 bg-white rounded-full">
                 <img src="/static/images/fish/${f.image}" class="w-10 h-10 object-contain">
            </div>
            <div>
                <div class="font-bold text-gray-800 text-lg">${f.name}</div>
                <div class="text-xs text-gray-500 mt-1">${f.desc}</div>
            </div>
        </div>
    `).join('');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    const modal = document.getElementById('fish-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');

    // 釣りが終わって画面を閉じた後、港にいるなら網モーダルを出す
    if (window.currentPortId !== null && window.currentPortId !== undefined) {
        const netModal = document.getElementById('net-modal');
        if (netModal) {
            netModal.classList.remove('hidden');
            netModal.classList.add('flex');
        }
    }
}

// 回復処理
async function recoverDice(actionType) {
    try {
        const response = await fetch('/api/recovery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            const diceEl = document.getElementById('dice-count');
            if (diceEl) {
                diceEl.innerText = data.new_count;
            }

            const rollBtn = document.getElementById('roll-button');
            if (rollBtn) {
                rollBtn.disabled = false;
                rollBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    } catch (error) {
        console.error('回復エラー:', error);
    }
}

// ==========================================
// クイズマス処理
// ==========================================

function getRandomQuiz() {
    const index = Math.floor(Math.random() * QUIZ_DATA.length);
    return QUIZ_DATA[index];
}

function showQuizModal() {
    const modal = document.getElementById('quiz-modal');
    const questionEl = document.getElementById('quiz-question');
    const choicesEl = document.getElementById('quiz-choices');
    const resultEl = document.getElementById('quiz-result');

    if (!modal || !questionEl || !choicesEl || !resultEl) return;

    currentQuiz = getRandomQuiz();
    resultEl.innerHTML = '';

    questionEl.innerText = currentQuiz.question;

    choicesEl.innerHTML = currentQuiz.choices.map((choice, index) => `
        <button
            class="w-full text-left bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-2xl px-4 py-3 font-bold text-gray-800 transition active:scale-[0.99]"
            onclick="answerQuiz(${index})"
        >
            ${choice}
        </button>
    `).join('');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function answerQuiz(selectedIndex) {
    const resultEl = document.getElementById('quiz-result');
    const choicesEl = document.getElementById('quiz-choices');
    const modal = document.getElementById('quiz-modal');
    const closeBtn = modal ? modal.querySelector('button') : null;

    if (!currentQuiz) return;

    const isCorrect = selectedIndex === currentQuiz.correctIndex;

    // 二重押し防止
    choicesEl.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        btn.classList.add('opacity-80');
    });

    if (closeBtn) closeBtn.disabled = true;

    if (isCorrect) {
        try {
            const response = await fetch('/api/quiz-reward', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                resultEl.innerHTML = `
                    <div class="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3">
                        <div class="font-black text-lg mb-1">正解！</div>
                        <div class="text-sm mb-2">${currentQuiz.explanation}</div>
                        <div class="text-sm">ただし報酬付与に失敗しました：${data.error || '不明なエラー'}</div>
                    </div>
                `;

                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    if (closeBtn) closeBtn.disabled = false;
                }, 2500);
                return;
            }

            // 残りサイコロ表示を更新
            const diceCountEl = document.getElementById('dice-count');
            if (diceCountEl) {
                diceCountEl.innerText = data.new_count;
            }

            // ボタン見た目をボーナス状態に
            enableExtraRoll();

            resultEl.innerHTML = `
                <div class="bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3">
                    <div class="font-black text-lg mb-1">正解！</div>
                    <div class="text-sm">${currentQuiz.explanation}</div>
                    <div class="text-sm font-bold mt-2">サイコロを1回分ゲット！</div>
                </div>
            `;

            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                if (closeBtn) closeBtn.disabled = false;
            }, 2500);

        } catch (e) {
            console.error("クイズ報酬付与エラー:", e);
            resultEl.innerHTML = `
                <div class="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3">
                    <div class="font-black text-lg mb-1">正解！</div>
                    <div class="text-sm mb-2">${currentQuiz.explanation}</div>
                    <div class="text-sm">通信エラーのため報酬付与に失敗しました。</div>
                </div>
            `;

            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                if (closeBtn) closeBtn.disabled = false;
            }, 2500);
        }

    } else {
        resultEl.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3">
                <div class="font-black text-lg mb-1">不正解…</div>
                <div class="text-sm">${currentQuiz.explanation}</div>
                <div class="text-xs text-gray-600 mt-2">今回は追加サイコロなしです。</div>
            </div>
        `;

        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            if (closeBtn) closeBtn.disabled = false;
        }, 1800);
    }
}



function enableExtraRoll() {
    const button = document.getElementById('roll-button');
    if (!button) return;

    quizRetryEnabled = true;
    button.disabled = false;
    button.classList.add('ring-4', 'ring-yellow-300');
    button.innerText = 'もう一度サイコロを振る！';
}

function clearExtraRollState() {
    const button = document.getElementById('roll-button');
    if (!button) return;

    button.classList.remove('ring-4', 'ring-yellow-300');
    button.innerText = 'サイコロを振る';
}

// ==========================================
// 一本釣り演出ロジック
// ==========================================
let catchQueue = [];
let caughtFishes = [];

async function startFishing(fishes) {
    caughtFishes = fishes;
    catchQueue = [...fishes];

    // 先に全部の魚画像を読み込む
    const preloadTargets = fishes.map(f => `/static/images/fish/${f.image}`);
    await Promise.all(preloadTargets.map(src => preloadImage(src)));

    const overlay = document.getElementById('fishing-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    processNextCatch();
}

function processNextCatch() {
    const lineContainer = document.getElementById('fishing-line-container');
    const line = document.getElementById('fishing-line');
    const bobber = document.getElementById('fishing-bobber');
    const ripple = document.getElementById('fishing-ripple');
    const resultEl = document.getElementById('fishing-result');

    if (catchQueue.length === 0) {
        document.getElementById('fishing-overlay').classList.add('hidden');
        document.getElementById('fishing-overlay').classList.remove('flex');
        showFishModal(caughtFishes);
        return;
    }

    const currentFish = catchQueue.shift();

    // 次に表示する魚を先読み
    if (catchQueue.length > 0) {
        const nextFish = catchQueue[0];
        preloadImage(`/static/images/fish/${nextFish.image}`);
    }

    resultEl.classList.add('hidden');
    resultEl.classList.remove('fish-pop-animation');

    lineContainer.classList.remove('hidden');
    bobber.classList.remove('bobber-hit-animation');

    line.classList.remove('animate-drop-line');
    bobber.classList.remove('animate-bobber');
    ripple.classList.remove('animate-ripple');

    void line.offsetWidth;

    line.classList.add('animate-drop-line');
    bobber.classList.add('animate-bobber');

    setTimeout(() => {
        ripple.classList.add('animate-ripple');
    }, 500);

    const waitTime = 1000 + Math.random() * 1500;

    setTimeout(() => {
        bobber.classList.add('bobber-hit-animation');
        ripple.classList.remove('animate-ripple');

        setTimeout(() => {
            lineContainer.classList.add('hidden');

            const imgEl = document.getElementById('fishing-fish-img');
            imgEl.decoding = "async";
            imgEl.loading = "eager";
            imgEl.src = `/static/images/fish/${currentFish.image}`;

            document.getElementById('fishing-fish-name').innerText = currentFish.name;
            document.getElementById('fishing-fish-desc').innerText = currentFish.desc;

            const btn = document.getElementById('fishing-next-btn');
            btn.innerText = catchQueue.length > 0 ? "次の魚を釣る 🎣" : "釣果まとめを見る";

            resultEl.classList.remove('hidden');
            resultEl.classList.add('flex', 'fish-pop-animation');
        }, 800);
    }, waitTime);
}

function nextCatch() {
    processNextCatch();
}

// ==========================================
// 網の設置ロジック
// ==========================================

// 網モーダルを閉じる
function closeNetModal() {
    const modal = document.getElementById('net-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    window.currentPortId = null;
}

// 網を設置するAPIを呼ぶ
async function placeNet(netType) {
    if (window.currentPortId === null || window.currentPortId === undefined) return;

    const portId = window.currentPortId;

    const buttons = document.querySelectorAll('.net-btn');
    const loading = document.getElementById('net-loading');

    // ボタン無効化
    buttons.forEach(btn => btn.disabled = true);

    if (loading) {
        loading.classList.remove('hidden');
    }

    try {
        const response = await fetch('/api/place-net', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                port_id: portId,
                net_type: netType
            })
        });

        const data = await response.json();

        if (data.success) {
            closeNetModal();
            showPortToast(`⚓ ${netType}を仕掛けました！`, portId);
        } else {
            closeNetModal();
            showToast(data.error, "error");
        }

    } catch (e) {
        console.error("網の設置エラー:", e);
        closeNetModal();
        showToast("通信エラー", "error");
    }
}

// 1. 網回収アニメーションを開始する
function startNetPulling(fishes, netType, netCatchCount) {
    const overlay = document.getElementById('net-pulling-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        showBigCatchEffect(fishes, netType, netCatchCount);
    }, 3000);
}

// 2. 大漁エフェクトを表示する
function showBigCatchEffect(fishes, netType, netCatchCount) {
    const count = netCatchCount;
    let title = "", effectClass = "", bgClass = "";

    if (count <= 3) {
        title = "🐟 ぼちぼちの成果！";
        effectClass = "text-blue-200 text-3xl";
        bgClass = "bg-blue-900/90";
    } else if (count <= 6) {
        title = "🌊 大漁だ！！ 🌊";
        effectClass = "text-yellow-400 text-5xl font-black animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]";
        bgClass = "bg-orange-900/90";
    } else {
        title = "⚡ 超絶大漁！！！ ⚡";
        effectClass = "text-red-500 text-6xl font-black animate-pulse drop-shadow-[0_0_20px_rgba(255,0,0,1)] scale-110";
        bgClass = "bg-gray-900/95";
    }

    const netOverlay = document.createElement('div');
    netOverlay.className = `fixed inset-0 ${bgClass} z-[150] flex flex-col items-center justify-center transition-opacity duration-500`;
    netOverlay.innerHTML = `
        <div class="text-white text-lg font-bold mb-4">仕掛けておいた【${netType}】を引き上げた！</div>
        <div class="${effectClass} mb-8 text-center leading-tight">${title}</div>
        <div class="text-white text-2xl font-bold mb-8">
            網で <span class="text-6xl text-yellow-300 mx-2 animate-bounce inline-block">${count}</span> 匹ゲット！
        </div>
        <div class="text-blue-200 text-sm font-bold animate-pulse">続けて魚を確認します...🐟</div>
    `;
    document.body.appendChild(netOverlay);

    setTimeout(() => {
        netOverlay.style.opacity = '0';
        setTimeout(() => {
            netOverlay.remove();
            startFishing(fishes);
        }, 500);
    }, 3000);
}


// ==========================================
// コマの移動 ＆ カメラ自動追従アニメーション
// ==========================================

// 指定したミリ秒だけ待機する関数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// カメラをプレイヤーの位置に合わせる関数
function focusCameraOnPlayer(isInstant = false) {
    const viewport = document.getElementById('map-viewport');
    const player = document.getElementById('player-piece');

    if (!viewport || !player || player.style.display === 'none') return;

    // プレイヤーの現在の中心座標を取得
    const playerX = player.offsetLeft + (player.offsetWidth / 2);
    const playerY = player.offsetTop + (player.offsetHeight / 2);

    // ビューポートの中心に来るようにスクロール位置を計算
    const targetX = playerX - (viewport.clientWidth / 2);
    const targetY = playerY - (viewport.clientHeight / 2);

    // スクロール実行
    viewport.scrollTo({
        left: targetX,
        top: targetY,
        behavior: isInstant ? 'auto' : 'smooth' // trueならパッと移動、falseならヌルッと移動
    });
}

// 1マスずつ順番にコマを動かす処理
async function animatePlayerMovement(startPos, actualMove) {
    const player = document.getElementById('player-piece');
    player.style.display = 'flex';

    for (let i = 1; i <= actualMove; i++) {
        let step = (startPos + i) % TOTAL_STEPS;
        let coord = MAP_COORDINATES[step];

        if (coord) {
            player.style.left = `${coord.x}%`;
            player.style.top = `${coord.y}%`;
            
            // ▼ 動いた瞬間にカメラを追従させる！
            focusCameraOnPlayer(false);
        }
        
        await sleep(400); 
    }
}

// ==========================================
// マップのズーム（拡大・縮小）機能
// ==========================================

let currentZoom = 1.0;
const BASE_MAP_WIDTH = 800;  // style.cssで設定した基本の横幅
const BASE_MAP_HEIGHT = 600; // style.cssで設定した基本の高さ

function zoomMap(factor) {
    const container = document.querySelector('.ishikawa-map-container');
    const viewport = document.getElementById('map-viewport');
    if (!container || !viewport) return;

    let newZoom = currentZoom * factor;
    
    // ズームの限界を設定（0.5倍 〜 2.5倍まで）
    if (newZoom < 0.5) newZoom = 0.5;
    if (newZoom > 2.5) newZoom = 2.5;
    
    if (newZoom === currentZoom) return; // 限界に達していたら何もしない

    // ズーム前の「今見ている中心座標」を計算
    const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
    const centerY = viewport.scrollTop + viewport.clientHeight / 2;
    
    // 現在のマップ全体のサイズに対する、中心座標の割合を出す
    const ratioX = centerX / (BASE_MAP_WIDTH * currentZoom);
    const ratioY = centerY / (BASE_MAP_HEIGHT * currentZoom);

    // ズーム倍率を更新
    currentZoom = newZoom;

    // マップのサイズを更新（%配置のコマなども自動で追従します！）
    container.style.width = `${BASE_MAP_WIDTH * currentZoom}px`;
    container.style.height = `${BASE_MAP_HEIGHT * currentZoom}px`;

    // サイズ変更後、先ほどの割合に合わせてスクロール位置を調整（ズームした場所を中心にキープ）
    viewport.scrollLeft = (ratioX * BASE_MAP_WIDTH * currentZoom) - (viewport.clientWidth / 2);
    viewport.scrollTop = (ratioY * BASE_MAP_HEIGHT * currentZoom) - (viewport.clientHeight / 2);
    
    // もしプレイヤーが表示されていれば、念のためプレイヤーにカメラを合わせ直す
    const player = document.getElementById('player-piece');
    if (player && player.style.display !== 'none') {
        focusCameraOnPlayer(true);
    }
}

function showToast(message, type = "info") {
    const toast = document.getElementById("toast-message");
    if (!toast) return;

    toast.textContent = message;

    // 色を切り替え
    toast.classList.remove("bg-cyan-600", "bg-red-500", "bg-gray-800");

    if (type === "error") {
        toast.classList.add("bg-red-500");
    } else if (type === "dark") {
        toast.classList.add("bg-gray-800");
    } else {
        toast.classList.add("bg-cyan-600");
    }

    toast.classList.remove("hidden", "opacity-0", "translate-y-2");
    toast.classList.add("opacity-100");

    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
    }, 1800);
}

function showPortToast(message, step = null) {
    const layer = document.getElementById('port-toast-layer');
    if (!layer) return;

    const targetStep = (step !== null && step !== undefined) ? step : window.currentPortId;
    if (targetStep === null || targetStep === undefined) return;

    const portEl = document.querySelector(`.port-node[data-step="${targetStep}"]`);
    if (!portEl) {
        showToast(message, "info");
        return;
    }

    const rect = portEl.getBoundingClientRect();

    const toast = document.createElement('div');
    toast.className = 'port-toast';
    toast.textContent = message;

    // 実際に見えている港アイコンの真上に出す
    toast.style.left = `${rect.left + rect.width / 2}px`;
    toast.style.top = `${rect.top - 12}px`;

    layer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('is-out');
        setTimeout(() => {
            toast.remove();
        }, 450);
    }, 1400);
}