/**
 * 石川さかな巡りすごろく - マス目見やすさ
 */

const TOTAL_STEPS = 64; 
let MAP_COORDINATES = [];

const MAIN_SPOTS = {
    0:  { name: "近江町市場", icon: "🦀", labelClass: "top-8 left-1/2 -translate-x-1/2" }, // 下に出す
    8:  { name: "内灘",      icon: "🏖️", labelClass: "-left-10 top-1/2 -translate-y-1/2" }, // 左に出す
    16: { name: "金沢港",    icon: "🚢", labelClass: "top-8 left-1/2 -translate-x-1/2" }, // 下に出す
    24: { name: "羽咋港",    icon: "🛸", labelClass: "-left-10 top-1/2 -translate-y-1/2" }, // 左に出す
    32: { name: "七尾港",    icon: "🐟", labelClass: "-right-10 top-1/2 -translate-y-1/2" },// 右に出す
    40: { name: "輪島港",    icon: "🛍️", labelClass: "-top-6 left-1/2 -translate-x-1/2" }, // 上に出す
    48: { name: "珠洲港",    icon: "💡", labelClass: "-top-6 left-1/2 -translate-x-1/2" }, // 上に出す
    56: { name: "能登島",    icon: "🐬", labelClass: "-right-12 top-1/2 -translate-y-1/2" } // 右に出す
};

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
                el.className = "absolute z-20";
                
                el.innerHTML = `
                    <div class="relative flex flex-col items-center group">
                        <div class="w-6 h-6 bg-white/95 rounded-full border border-cyan-500 shadow-md flex items-center justify-center text-[10px] z-10">
                            ${spot.icon}
                        </div>
                        <div class="absolute ${spot.labelClass} bg-white/95 px-1.5 py-0.5 rounded border border-cyan-200 text-[8px] font-bold text-cyan-900 whitespace-nowrap shadow-sm z-20">
                            ${spot.name}
                        </div>
                    </div>
                `;
            } else {
           
                el.className = "absolute w-1.5 h-1.5 bg-cyan-500/50 rounded-full z-10 shadow-sm";
            }
            container.appendChild(el);
        }
    }
    initPlayerPosition();
});

/**
 * 座標計算ロジック
 */
function calculateCoordinates() {
    MAP_COORDINATES = [];
    
    // 港の位置を意図的に広げて配置
    const ANCHORS = {
        0:  { x: 38, y: 78 }, // 近江町市場
        8:  { x: 33, y: 56 }, // 内灘 (左上へ離す)
        16: { x: 50, y: 82 }, // 金沢港 (右下へ大きく離す)
        24: { x: 42, y: 38 }, // 羽咋港
        32: { x: 58, y: 42 }, // 七尾港
        40: { x: 45, y: 15 }, // 輪島港
        48: { x: 75, y: 12 }, // 珠洲港
        56: { x: 70, y: 30 }, // 能登島
        64: { x: 38, y: 78 }  // ゴール
    };

    // 線が絡まないように、大きく迂回するカーブを設定
    const CONTROL_POINTS = {
        0:  { x: 20, y: 68 }, // 0->8: 左の海側へ大きく膨らむ
        8:  { x: 55, y: 62 }, // 8->16: 陸側を通って金沢港へ
        16: { x: 25, y: 65 }, // 16->24: 再び海側を大きく迂回して北上
        24: { x: 50, y: 35 }, // 24->32: なだらかに右へ
        32: { x: 40, y: 25 }, // 32->40: 左の海側から輪島へ
        40: { x: 60, y: 5 },  // 40->48: 一番上を回る
        48: { x: 85, y: 20 }, // 48->56: 右の海側を回る
        56: { x: 80, y: 60 }  // 56->64: 右側（富山側）を通って大きく南下して戻る
    };

    for (let i = 0; i < TOTAL_STEPS; i++) {
        let startIndex = Math.floor(i / 8) * 8;
        let endIndex = startIndex + 8;
        
        let P0 = ANCHORS[startIndex];
        let P2 = ANCHORS[endIndex];
        let P1 = CONTROL_POINTS[startIndex];
        
        let t = (i % 8) / 8;
        
        // ベジェ曲線（曲線の公式）
        let x = Math.pow(1-t, 2) * P0.x + 2 * (1-t) * t * P1.x + Math.pow(t, 2) * P2.x;
        let y = Math.pow(1-t, 2) * P0.y + 2 * (1-t) * t * P1.y + Math.pow(t, 2) * P2.y;
        
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

        setTimeout(() => {
            diceResult.innerHTML = createDiceHtml(data.dice_val);
            updateGameScreen(data);

            if (data.obtained_fishes && data.obtained_fishes.length > 0) {
                setTimeout(() => startFishing(data.obtained_fishes), 500);
            }

            button.disabled = false;
        }, 600);

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
    }
}

// サイコロHTML生成
function createDiceHtml(num) {
    let dots = '';
    for(let i=0; i<num; i++) {
        dots += '<div class="dice-dot"></div>';
    }
    return `<div class="dice-face dice-${num}">${dots}</div>`;
}

// 魚ゲットモーダル表示
function showFishModal(fishes) {
    const modal = document.getElementById('fish-modal');
    const list = document.getElementById('fish-list');
    
    list.innerHTML = fishes.map(f => `
        <div class="flex items-center bg-cyan-50 p-4 rounded-2xl border border-cyan-100 mb-2 shadow-sm">
            <div class="text-4xl mr-4">🐟</div>
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
}

// 回復処理
async function recoverDice(type) {
    try {
        const response = await fetch('/api/recovery', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            document.getElementById('dice-count').innerText = data.new_count;
            if (type === 'x') {
                window.open('https://twitter.com/intent/tweet?text=石川さかな巡りすごろくで遊んでます！&hashtags=石川県', '_blank');
            } else if (type === 'site') {
                window.open('https://www.hot-ishikawa.jp/', '_blank');
            }
        }
    } catch(e) { console.error(e); }
}

// ==========================================
// 一本釣り演出ロジック
// ==========================================
let catchQueue = [];     // 釣る予定の魚リスト
let caughtFishes = [];   // 全釣果（最後にまとめて表示するため）

// 釣りを開始する
function startFishing(fishes) {
    caughtFishes = fishes;
    catchQueue = [...fishes]; // 配列をコピー
    
    const overlay = document.getElementById('fishing-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    
    processNextCatch();
}

// 1匹ずつ釣り上げる処理
function processNextCatch() {
    const statusEl = document.getElementById('fishing-status');
    const resultEl = document.getElementById('fishing-result');
    
    // 全て釣り終わった場合
    if (catchQueue.length === 0) {
        document.getElementById('fishing-overlay').classList.add('hidden');
        document.getElementById('fishing-overlay').classList.remove('flex');
        
        // 最後に「今回の釣果まとめ」として元のリストを表示する
        showFishModal(caughtFishes); 
        return;
    }

    const currentFish = catchQueue.shift(); // 最初の1匹を取り出す

    // 演出を「待機中」にリセット
    statusEl.classList.remove('hidden', 'text-red-400', 'scale-150', 'hit-animation');
    statusEl.classList.add('text-white', 'animate-pulse');
    statusEl.innerText = "🎣 釣り糸を垂らしています...";
    
    resultEl.classList.add('hidden');
    resultEl.classList.remove('fish-pop-animation');

    // 1. ウキが沈むまでの待機時間 (1秒〜2秒のランダム)
    const waitTime = 1000 + Math.random() * 1000;
    
    setTimeout(() => {
        // 2. ヒット！演出
        statusEl.classList.remove('animate-pulse', 'text-white');
        statusEl.classList.add('text-red-400', 'scale-150', 'hit-animation');
        statusEl.innerText = "⚡ ヒット！！ ⚡";
        
        // 3. 釣り上げて魚が飛び出す演出
        setTimeout(() => {
            statusEl.classList.add('hidden');
            statusEl.classList.remove('hit-animation');
            
            // データをセット
            document.getElementById('fishing-fish-name').innerText = currentFish.name;
            document.getElementById('fishing-fish-desc').innerText = currentFish.desc;
            
            // ボタンのテキスト変更（最後なら「結果を見る」にする）
            const btn = document.getElementById('fishing-next-btn');
            btn.innerText = catchQueue.length > 0 ? "次の魚を釣る 🎣" : "釣果まとめを見る";
            
            // アニメーション付きで表示
            resultEl.classList.remove('hidden');
            resultEl.classList.add('flex', 'fish-pop-animation');

        }, 800); // ヒットしてから釣り上げるまでの「タメ」の時間
    }, waitTime);
}

// HTMLの「次へ」ボタンから呼ばれる関数
function nextCatch() {
    processNextCatch();
}