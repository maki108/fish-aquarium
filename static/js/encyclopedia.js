/**
 * 石川さかな図鑑 - ロジック統合版
 */

let allFishData = [];

/**
 * 起動時に全コレクションデータを取得
 */
async function loadEncyclopedia() {
    try {
        const response = await fetch('/api/collection');
        allFishData = await response.json();
        
        // 獲得数の更新
        const collected = allFishData.filter(f => f.is_owned).length;
        const totalCountEl = document.getElementById('total-count');
        if (totalCountEl) {
            totalCountEl.innerText = `${collected} / ${allFishData.length} 種類獲得`;
        }
        
        renderList(allFishData);
    } catch (e) {
        console.error("図鑑の読み込みに失敗しました", e);
    }
}

/**
 * 魚リストの描画
 */
function renderList(fishes) {
    const list = document.getElementById('encyclopedia-list');
    if (!list) return;

    list.innerHTML = fishes.map(fish => {
        // レアリティに応じた色分け（ここを新しい区分に修正！）
        const rarityColor = fish.rarity === 'レジェンド' ? 'bg-yellow-400' : 
                            fish.rarity === 'レア' ? 'bg-purple-400' :
                            fish.rarity === 'ノーマル' ? 'bg-blue-300' : 'bg-gray-300';
        
        // 魚のデータを安全に渡すための工夫
        const fishDataStr = encodeURIComponent(JSON.stringify(fish));

        return `
            <div onclick="showDetail(JSON.parse(decodeURIComponent('${fishDataStr}')))" class="relative aspect-square rounded-3xl p-4 flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-md border-4 ${fish.is_owned ? 'border-transparent bg-white cursor-pointer hover:shadow-xl' : 'border-gray-200 bg-gray-50/50 cursor-not-allowed'} group overflow-hidden">
                
                ${fish.is_owned ? `
                    <div class="absolute top-0 right-0 ${rarityColor} text-white text-[8px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10">
                        ${fish.rarity}
                    </div>
                ` : ''}
                
                <div class="mb-2 w-20 h-20 flex items-center justify-center">
                    ${fish.is_owned 
                        ? `<img src="/static/images/fish/${fish.image}" class="w-full h-full object-contain drop-shadow-md transition-transform group-hover:scale-110">` 
                        : '<span class="text-4xl opacity-30 grayscale filter">❓</span>'
                    }
                </div>
                
                <div class="text-[10px] font-bold text-center text-blue-900 line-clamp-2 leading-tight">
                    ${fish.name}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * レアリティによるフィルタリング
 */
function filterRarity(rarity, event) {
    // ボタンのスタイル更新
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        btn.classList.add('bg-white', 'text-gray-600', 'shadow-sm');
    });

    // クリックされたボタンをアクティブ化
    const clickedBtn = event.currentTarget;
    clickedBtn.classList.remove('bg-white', 'text-gray-600', 'shadow-sm');
    clickedBtn.classList.add('bg-blue-600', 'text-white', 'shadow-md');

    // データの絞り込み
    if (rarity === 'All') {
        renderList(allFishData);
    } else {
        const filtered = allFishData.filter(f => f.rarity === rarity);
        renderList(filtered);
    }
}

/**
 * 詳細モーダルの表示
 */
function showDetail(fish) {
    if (!fish.is_owned) return;

    const content = document.getElementById('detail-content');
    const d = fish.details || {};
    
    content.innerHTML = `
        <div class="text-center mb-6">
            <img src="/static/images/fish/${fish.image}" class="w-32 h-32 mx-auto object-contain mb-4 animate-bounce">
            <h3 class="text-2xl font-black text-blue-900">${fish.name}</h3>
            <div class="flex justify-center gap-2 mt-2">
                <span class="px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">${fish.rarity}</span>
                <span class="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">${fish.price_range || '価格調査中'}</span>
            </div>
        </div>
        
        <div class="space-y-4 text-sm">
            <div class="bg-blue-50 p-4 rounded-2xl">
                <p class="font-bold text-blue-800 text-[10px] uppercase tracking-widest mb-1">🌊 生態</p>
                <p class="text-gray-700 leading-relaxed text-xs">${d.biology || '石川の豊かな海に生息しています。'}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-orange-50 p-4 rounded-2xl">
                    <p class="font-bold text-orange-800 text-[10px] uppercase tracking-widest mb-1">🗓 旬</p>
                    <p class="text-gray-800 font-bold">${d.season || '通年'}</p>
                </div>
                <div class="bg-cyan-50 p-4 rounded-2xl">
                    <p class="font-bold text-cyan-800 text-[10px] uppercase tracking-widest mb-1">🚢 漁法</p>
                    <p class="text-gray-800 text-xs">${d.fishing_method || '定置網など'}</p>
                </div>
            </div>

            <div class="bg-emerald-50 p-4 rounded-2xl">
                <p class="font-bold text-emerald-800 text-[10px] uppercase tracking-widest mb-1">🍽 食文化</p>
                <p class="text-gray-700 leading-relaxed text-xs">${d.food_culture || '刺身や焼き物で美味しくいただけます。'}</p>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('detail-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * モーダルを閉じる
 */
function closeDetail() {
    const modal = document.getElementById('detail-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// 読み込み完了時に実行
window.addEventListener('load', loadEncyclopedia);