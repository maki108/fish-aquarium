/**
 * 石川さかな巡りすごろく - 円形マップ(64マス) 状態同期対応版
 */

// 1. 基本設定
const TOTAL_STEPS = 64; 
const RADIUS = 42; 
const MAIN_SPOTS = {
    0: { name: "近江町市場", icon: "🏢" },
    8: { name: "内灘", icon: "🌍" },
    16: { name: "金沢港", icon: "🚢" },
    24: { name: "羽咋港", icon: "🚢" },
    32: { name: "七尾港", icon: "🚢" },
    40: { name: "輪島港", icon: "🛍️" },
    48: { name: "珠洲港", icon: "🚢" },
    56: { name: "能登島", icon: "🌍" }
};

/**
 * 2. 起動時の処理
 */
window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('map-nodes');
    if (!container) return;

    // マップの全ノードを描画
    for (let i = 0; i < TOTAL_STEPS; i++) {
        const angle = (i * (360 / TOTAL_STEPS) - 90) * (Math.PI / 180);
        const x = 50 + RADIUS * Math.cos(angle);
        const y = 50 + RADIUS * Math.sin(angle);
        
        const el = document.createElement('div');
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        el.style.transform = 'translate(-50%, -50%)';
        
        if (MAIN_SPOTS[i]) {
            el.className = "absolute z-10";
            el.innerHTML = `
                <div class="relative flex flex-col items-center">
                    <div class="w-10 h-10 bg-white rounded-full border-2 border-cyan-400 shadow-sm flex items-center justify-center">
                        <span class="text-sm">${MAIN_SPOTS[i].icon}</span>
                    </div>
                    <div class="absolute -top-7 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-blue-100 text-[9px] font-bold text-blue-800 whitespace-nowrap">
                        ${MAIN_SPOTS[i].name}
                    </div>
                </div>
            `;
        } else {
            el.className = "absolute w-1.5 h-1.5 bg-blue-300/40 rounded-full";
        }
        container.appendChild(el);
    }

    // マップ描画後にデータベースから現在地を取得して同期
    initPlayerPosition();
});

/**
 * 3. 初期位置・状態の同期処理
 */
async function initPlayerPosition() {
    try {
        const response = await fetch('/api/user-status');
        const data = await response.json();

        // 駒の位置とUIを更新
        updatePlayerUI(data.current_pos);
        
        document.getElementById('distance-info').innerText = `次の港まであと ${data.dist_to_next} マス`;
        document.getElementById('collection-ratio').innerText = data.collection_status;
        document.getElementById('dice-count').innerText = data.remaining_dice;
        
        const currentStep = data.current_pos % TOTAL_STEPS;
        const spotName = MAIN_SPOTS[currentStep] ? MAIN_SPOTS[currentStep].name : "道中";
        document.getElementById('current-spot').innerText = spotName;

    } catch (e) {
        console.error("初期データの取得に失敗しました", e);
    }
}

/**
 * 4. 駒の表示を更新する共通関数
 */
function updatePlayerUI(posId) {
    const playerPiece = document.getElementById('player-piece');
    const currentStep = posId % TOTAL_STEPS;
    const angle = (currentStep * (360 / TOTAL_STEPS) - 90) * (Math.PI / 180);
    const x = 50 + RADIUS * Math.cos(angle);
    const y = 50 + RADIUS * Math.sin(angle);

    playerPiece.style.left = `${x}%`;
    playerPiece.style.top = `${y}%`;
}

/**
 * 5. サイコロを振るメインロジック
 */
async function rollDice() {
    const button = document.getElementById('roll-button');
    const diceDisplay = document.getElementById('dice-result');
    const spotDisplay = document.getElementById('current-spot');
    const distanceDisplay = document.getElementById('distance-info');
    const ratioDisplay = document.getElementById('collection-ratio');
    const diceCountDisplay = document.getElementById('dice-count');
    
    button.disabled = true;
    diceDisplay.classList.add('dice-animation');

    try {
        const response = await fetch('/api/roll-dice', { method: 'POST' });
        const data = await response.json();

        if (!response.ok) {
            alert(data.error);
            button.disabled = false;
            diceDisplay.classList.remove('dice-animation');
            return;
        }

        setTimeout(() => {
            diceDisplay.classList.remove('dice-animation');
            diceDisplay.innerText = getDiceEmoji(data.dice_val);
            
            // 駒の位置を更新
            updatePlayerUI(data.current_pos);

            const currentStep = data.current_pos % TOTAL_STEPS;
            const spotName = MAIN_SPOTS[currentStep] ? MAIN_SPOTS[currentStep].name : "道中";
            spotDisplay.innerText = spotName;
            distanceDisplay.innerText = `次の港まであと ${data.dist_to_next} マス`;
            ratioDisplay.innerText = data.collection_status;
            diceCountDisplay.innerText = data.remaining_dice;
            
            if (data.obtained_fishes.length > 0) {
                showFishModal(data.obtained_fishes);
            }

            button.disabled = false;
        }, 800);

    } catch (e) {
        button.disabled = false;
        diceDisplay.classList.remove('dice-animation');
    }
}

/**
 * 6. 回復・SNS連携
 */
async function recoverDice(type) {
    try {
        const response = await fetch('/api/recovery', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('dice-count').innerText = data.new_count;
            
            if (type === 'x') {
                const ratio = document.getElementById('collection-ratio').innerText;
                const tweetText = `石川おさかなすごろくで遊んでいます！現在【${ratio}】の魚を獲得！石川県の魚を集めて図鑑を完成させよう 🐟`;
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&hashtags=石川おさかなすごろく`;
                window.open(url, '_blank');
            } else if (type === 'site') {
                window.open('https://www.hot-ishikawa.jp/index.html', '_blank');
            }
        }
    } catch (e) {
        alert("回復に失敗しました");
    }
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