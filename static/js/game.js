/**
 * 石川さかな巡りすごろく - 石川県マップ対応版
 */

// 64マスの設定
const TOTAL_STEPS = 64; 
let MAP_COORDINATES = [];

// 主要スポット（港）の設定
const MAIN_SPOTS = {
    0: { name: "近江町市場", icon: "🦀" },
    8: { name: "内灘", icon: "🏖️" },
    16: { name: "金沢港", icon: "🚢" },
    24: { name: "羽咋港", icon: "🛸" },
    32: { name: "七尾港", icon: "🐟" },
    40: { name: "輪島港", icon: "🛍️" },
    48: { name: "珠洲港", icon: "💡" },
    56: { name: "能登島", icon: "🐬" }
};

// ページ読み込み時に実行される処理
window.addEventListener('DOMContentLoaded', () => {
    // 1. 座標計算 (石川県のような縦長ルートを作る)
    calculateCoordinates();

    // 2. マップ上の「点」を描画
    const container = document.getElementById('map-nodes');
    if (container) {
        for (let i = 0; i < TOTAL_STEPS; i++) {
            const coord = MAP_COORDINATES[i];
            const el = document.createElement('div');
            // %指定で位置を決める
            el.style.left = `${coord.x}%`;
            el.style.top = `${coord.y}%`;
            el.style.transform = 'translate(-50%, -50%)';
            
            if (MAIN_SPOTS[i]) {
                // 港などの主要スポット（アイコン付き）
                el.className = "absolute z-20";
                el.innerHTML = `
                    <div class="relative flex flex-col items-center group">
                        <div class="w-8 h-8 bg-white/95 rounded-full border-2 border-cyan-500 shadow-md flex items-center justify-center text-xs">
                            ${MAIN_SPOTS[i].icon}
                        </div>
                        <div class="absolute top-8 bg-white/90 px-1.5 py-0.5 rounded border border-cyan-200 text-[9px] font-bold text-cyan-900 whitespace-nowrap z-30 pointer-events-none">
                            ${MAIN_SPOTS[i].name}
                        </div>
                    </div>
                `;
            } else {
                // 通常のマス（小さな点）
                el.className = "absolute w-1.5 h-1.5 bg-cyan-600/30 rounded-full z-10";
            }
            container.appendChild(el);
        }
    }

    // 3. サーバーから現在のプレイヤー位置を取得して表示
    initPlayerPosition();
});

/**
 * 座標計算ロジック
 * 0(スタート/下) -> 左側を北上 -> 32(折り返し/上) -> 右側を南下 -> 64(ゴール/下)
 */
function calculateCoordinates() {
    MAP_COORDINATES = [];
    
    const ANCHORS = {
        0:  { x: 41, y: 61 }, // 近江町市場
        8:  { x: 46, y: 52 }, // 内灘
        16: { x: 45, y: 63 }, // 金沢港
        24: { x: 47, y: 34 }, // 羽咋港
        32: { x: 55, y: 35 }, // 七尾港
        40: { x: 52, y: 15 }, // 輪島港
        48: { x: 67, y: 9 },  // 珠洲港
        56: { x: 62, y: 29 }, // 能登島
        64: { x: 41, y: 61 }  // ゴール (近江町市場に戻る)
    };

    for (let i = 0; i < TOTAL_STEPS; i++) {
        // 現在の区間の開始港と終了港を特定（8マスごと）
        let startIndex = Math.floor(i / 8) * 8;
        let endIndex = startIndex + 8;
        
        let start = ANCHORS[startIndex];
        let end = ANCHORS[endIndex];
        
        // 区間内の進行度 (0.0 〜 1.0)
        let progress = (i % 8) / 8;
        
        // 港と港の間を直線で結ぶ
        let dx = end.x - start.x;
        let dy = end.y - start.y;
        
        let x = start.x + dx * progress;
        let y = start.y + dy * progress;

        // 行き来のルートが重ならないよう、少しだけ線をカーブさせる（外側に膨らませる）
        let curveOffset = Math.sin(progress * Math.PI) * 2.5; 
        
        if (startIndex === 0 || startIndex === 8) {
            x -= curveOffset; // 左側に膨らむ
        } else if (startIndex >= 32) {
            x += curveOffset; // 右側（海側）に膨らむ
        }

        MAP_COORDINATES.push({ x, y });
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
    
    // 連打防止のためボタンを無効化
    button.disabled = true;
    
    // 演出：回転アニメーション
    diceResult.innerHTML = '<span class="text-5xl animate-spin inline-block">🎲</span>';

    try {
        // サーバーにサイコロを振るリクエストを送る
        const response = await fetch('/api/roll-dice', { method: 'POST' });
        const data = await response.json();

        if (data.error) {
            alert(data.error);
            button.disabled = false;
            diceResult.innerText = "🎲";
            return;
        }

        // 少し待って結果表示（演出のため）
        setTimeout(() => {
            // サイコロの目をHTMLで生成して表示
            diceResult.innerHTML = createDiceHtml(data.dice_val);
            
            // 画面更新
            updateGameScreen(data);

            // 魚ゲット演出がある場合
            if (data.obtained_fishes && data.obtained_fishes.length > 0) {
                setTimeout(() => showFishModal(data.obtained_fishes), 500);
            }

            button.disabled = false;
        }, 600);

    } catch (e) {
        console.error(e);
        button.disabled = false;
        diceResult.innerText = "Error";
    }
}

// 画面全体の更新処理（位置移動、テキスト更新など）
function updateGameScreen(data) {
    // テキスト更新
    const currentStep = data.current_pos % TOTAL_STEPS;
    const spotName = MAIN_SPOTS[currentStep] ? MAIN_SPOTS[currentStep].name : "移動中...";
    
    document.getElementById('current-spot').innerText = spotName;
    document.getElementById('distance-info').innerText = `次の港まであと ${data.dist_to_next} マス`;
    document.getElementById('collection-ratio').innerText = data.collection_status;
    document.getElementById('dice-count').innerText = data.remaining_dice;

    // 駒の移動
    const player = document.getElementById('player-piece');
    const coord = MAP_COORDINATES[currentStep];
    
    if (coord) {
        player.style.display = 'flex'; // 初期は非表示なので表示する
        player.style.left = `${coord.x}%`;
        player.style.top = `${coord.y}%`;
        player.classList.add('piece-active'); // パルスアニメーション付与
    }
}

// サイコロの目を生成する関数（数字→ドット絵のHTML）
function createDiceHtml(num) {
    let dots = '';
    for(let i=0; i<num; i++) {
        dots += '<div class="dice-dot"></div>';
    }
    return `<div class="dice-face dice-${num}">${dots}</div>`;
}

// モーダル表示（魚ゲット画面）
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

// モーダルを閉じる
function closeModal() {
    const modal = document.getElementById('fish-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// 回復処理（API呼び出しのみ）
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

/**
 * 7. ヘルパー・モーダル制御
 */
function getDiceEmoji(val) {
    return {1:"⚀", 2:"⚁", 3:"⚂", 4:"⚃", 5:"⚄", 6:"⚅"}[val] || "🎲";
}

function showFishModal(fishes) {
    const modal = document.getElementById('fish-modal');
    const list = document.getElementById('fish-list');
    list.innerHTML = fishes.map(f => `
        <div class="flex items-center bg-cyan-50 p-4 rounded-2xl border border-cyan-100 mb-2">
            <div class="w-16 h-16 mr-4 flex-shrink-0 bg-white rounded-full p-1 shadow-sm">
                <img src="/static/images/fish/${f.image}" class="w-full h-full object-contain">
            </div>
            <div>
                <div class="font-bold text-slate-800">${f.name}</div>
                <div class="text-xs text-slate-500">${f.desc}</div>
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
