/**
 * Aura Boutique - Controlador da Aplicação (App Controller)
 * Gerencia o Catálogo da Cliente, Sacola WhatsApp e Painel Admin do Dono.
 */

// Estado da Aplicação
const appState = {
  products: [],
  categories: [],
  settings: {},
  currentCategory: 'ALL',
  currentSearch: '',
  currentSizeFilter: null,
  currentSort: 'position', // position | price_asc | price_desc | newest
  cart: [],
  isAdminLoggedIn: false,
  editingProductId: null,
  formImages: [],
  formSizes: [],
  formColors: []
};

// Formatação de Moeda
function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Toast Notificações
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-900/90 border-emerald-500 text-emerald-100',
    error: 'bg-rose-900/90 border-rose-500 text-rose-100',
    info: 'bg-stone-900/90 border-stone-500 text-stone-100'
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-semibold animate-fade-scale transition-all duration-300 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <span class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">${icons[type] || '•'}</span>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ----------------------------------------------------
// INICIALIZAÇÃO DA APLICAÇÃO
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Carrega dados do Banco (IndexedDB)
    await window.catalogDB.init();
    await reloadData();

    // 2. Carrega Carrinho do LocalStorage
    loadCartFromStorage();

    // 3. Renderiza Componentes Iniciais
    renderHeaderInfo();
    renderStories();
    renderCategories();
    renderProducts();
    updateCartBadge();

    // 4. Configura Listeners de Eventos
    setupEventListeners();

    // Atualiza ícones Lucide
    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error('Erro na inicialização:', err);
    showToast('Erro ao carregar catálogo. Tente recarregar a página.', 'error');
  }
});

// Recarrega dados atualizados do banco
async function reloadData() {
  const [prods, cats, sets] = await Promise.all([
    window.catalogDB.getAllProducts(),
    window.catalogDB.getAllCategories(),
    window.catalogDB.getSettings()
  ]);

  appState.products = prods;
  appState.categories = cats;
  appState.settings = sets;
}

// ----------------------------------------------------
// RENDERIZAÇÃO: CABEÇALHO & INFORMAÇÕES DA LOJA
// ----------------------------------------------------
function renderHeaderInfo() {
  const s = appState.settings;

  // Título e Slogan
  const storeNameEls = document.querySelectorAll('.store-name-text');
  storeNameEls.forEach(el => el.textContent = s.storeName || 'Aura Boutique');

  const taglineEl = document.getElementById('store-tagline');
  if (taglineEl) taglineEl.textContent = s.tagline || 'Moda Feminina Autoral';

  // Alerta de Frete Grátis
  const freeShippingBar = document.getElementById('free-shipping-bar-text');
  if (freeShippingBar) {
    freeShippingBar.textContent = s.freeShippingAlert || 'Frete Grátis para todo o Brasil nas compras acima de R$ 299';
  }

  // Instagram Link
  const instaEl = document.getElementById('footer-instagram-link');
  if (instaEl && s.instagram) {
    const handle = s.instagram.replace('@', '');
    instaEl.href = `https://instagram.com/${handle}`;
    instaEl.querySelector('span').textContent = s.instagram;
  }
}

// ----------------------------------------------------
// RENDERIZAÇÃO: STORIES / DESTAQUES ESTILO INSTAGRAM
// ----------------------------------------------------
function renderStories() {
  const container = document.getElementById('stories-container');
  if (!container) return;

  const stories = [
    { id: 'all', title: 'Tudo', icon: '✨', category: 'ALL' },
    { id: 'novidades', title: 'Novidades', icon: '💎', category: 'Vestidos' },
    { id: 'vestidos', title: 'Vestidos', icon: '👗', category: 'Vestidos' },
    { id: 'conjuntos', title: 'Conjuntos', icon: '🧥', category: 'Conjuntos' },
    { id: 'alfaiataria', title: 'Alfaiataria', icon: '👔', category: 'Alfaiataria' },
    { id: 'promo', title: 'Sale OFF', icon: '🏷️', filter: 'promo' },
    { id: 'look', title: 'Provador', icon: '📸', category: 'ALL' }
  ];

  container.innerHTML = stories.map(st => {
    const isActive = (st.category && appState.currentCategory === st.category && !st.filter);
    return `
      <button type="button" 
              onclick="handleStoryClick('${st.category || 'ALL'}', '${st.filter || ''}')"
              class="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none">
        <div class="w-16 h-16 sm:w-18 sm:h-18 rounded-full ${isActive ? 'story-ring-active' : 'story-ring'} p-0.5 transition-transform group-hover:scale-105 group-active:scale-95 shadow-sm">
          <div class="w-full h-full rounded-full bg-white dark:bg-stone-900 border-2 border-white dark:border-stone-900 flex items-center justify-center text-2xl">
            ${st.icon}
          </div>
        </div>
        <span class="text-[11px] font-medium text-stone-700 dark:text-stone-300 max-w-[68px] truncate text-center">
          ${st.title}
        </span>
      </button>
    `;
  }).join('');
}

function handleStoryClick(category, filter) {
  if (filter === 'promo') {
    appState.currentCategory = 'ALL';
    appState.currentSort = 'newest';
    // Filtro especial para produtos com promoPrice
    const promoProds = appState.products.filter(p => p.promoPrice && p.promoPrice < p.price);
    renderProducts(promoProds);
    showToast('Exibindo peças com desconto especial Sale OFF ✨', 'info');
    return;
  }

  appState.currentCategory = category;
  renderCategories();
  renderProducts();
}

// ----------------------------------------------------
// RENDERIZAÇÃO: CATEGORIAS (ABAS DESLIZANTES)
// ----------------------------------------------------
function renderCategories() {
  const container = document.getElementById('categories-container');
  if (!container) return;

  const totalCount = appState.products.length;

  let html = `
    <button type="button" 
            onclick="setCategory('ALL')"
            class="px-5 py-2.5 rounded-full text-xs font-semibold shrink-0 transition-all duration-200 ${appState.currentCategory === 'ALL' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}">
      Todas as Peças (${totalCount})
    </button>
  `;

  appState.categories.forEach(cat => {
    const count = appState.products.filter(p => p.category === cat.name).length;
    const isSelected = appState.currentCategory === cat.name;

    html += `
      <button type="button" 
              onclick="setCategory('${cat.name}')"
              class="px-5 py-2.5 rounded-full text-xs font-semibold shrink-0 transition-all duration-200 ${isSelected ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}">
        ${cat.name} (${count})
      </button>
    `;
  });

  container.innerHTML = html;
}

function setCategory(catName) {
  appState.currentCategory = catName;
  renderCategories();
  renderProducts();
}

// ----------------------------------------------------
// RENDERIZAÇÃO: CATÁLOGO DE PRODUTOS
// ----------------------------------------------------
function renderProducts(customList = null) {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('products-count');
  const emptyState = document.getElementById('empty-products-state');
  if (!grid) return;

  let list = customList || [...appState.products];

  // 1. Filtro de Categoria
  if (appState.currentCategory !== 'ALL' && !customList) {
    list = list.filter(p => p.category === appState.currentCategory);
  }

  // 2. Filtro de Busca por Texto
  if (appState.currentSearch) {
    const q = appState.currentSearch.toLowerCase();
    list = list.filter(p => 
      p.title.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  // 3. Filtro de Tamanho
  if (appState.currentSizeFilter) {
    list = list.filter(p => p.sizes && p.sizes.includes(appState.currentSizeFilter));
  }

  // 4. Ordenação
  if (appState.currentSort === 'price_asc') {
    list.sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
  } else if (appState.currentSort === 'price_desc') {
    list.sort((a, b) => (b.promoPrice || b.price) - (a.promoPrice || a.price));
  } else if (appState.currentSort === 'newest') {
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } else {
    // Posição manual configurada pelo dono
    list.sort((a, b) => (Number(a.position) || 999) - (Number(b.position) || 999));
  }

  if (countEl) {
    countEl.textContent = `${list.length} ${list.length === 1 ? 'peça encontrada' : 'peças encontradas'}`;
  }

  if (list.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  grid.innerHTML = list.map(prod => createProductCardHTML(prod)).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Cria o HTML do Card de Cada Produto
function createProductCardHTML(prod) {
  const isSoldOut = prod.status === 'sold_out';
  const isLowStock = prod.status === 'low_stock';
  const hasPromo = prod.promoPrice && prod.promoPrice < prod.price;

  const currentPrice = hasPromo ? prod.promoPrice : prod.price;
  const originalPrice = prod.price;
  const installments = prod.installments || 3;
  const installmentVal = currentPrice / installments;

  // Imagem Principal
  const mainImage = (prod.images && prod.images.length > 0) 
    ? prod.images[0] 
    : 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80';

  // Selo / Badge Superior
  let badgeHTML = '';
  if (isSoldOut) {
    badgeHTML = `<span class="bg-stone-900/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm">Esgotado</span>`;
  } else if (prod.badge) {
    const badgeColors = {
      'Lançamento': 'bg-amber-100 text-amber-900 border border-amber-300',
      'Mais Vendido': 'bg-rose-100 text-rose-900 border border-rose-300',
      'Promoção': 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      'Exclusivo': 'bg-stone-900 text-white'
    };
    badgeHTML = `<span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm ${badgeColors[prod.badge] || 'bg-white/90 text-stone-900'}">${prod.badge}</span>`;
  } else if (hasPromo) {
    const discount = Math.round(((originalPrice - prod.promoPrice) / originalPrice) * 100);
    badgeHTML = `<span class="bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">-${discount}% OFF</span>`;
  }

  // Tamanhos disponíveis em formato miniatura
  const sizesHTML = (prod.sizes && prod.sizes.length > 0)
    ? `<div class="flex flex-wrap gap-1 mt-2">
        ${prod.sizes.slice(0, 5).map((sz, i) => `
          <button type="button" 
                  onclick="event.stopPropagation(); selectCardSize('${prod.id}', '${sz}', this)"
                  class="card-size-btn text-[10px] font-bold w-6 h-6 rounded-md border border-stone-200 hover:border-stone-900 flex items-center justify-center transition-colors bg-white/80 ${i === 0 ? 'size-chip-active' : 'text-stone-700'}"
                  data-size="${sz}">
            ${sz}
          </button>
        `).join('')}
        ${prod.sizes.length > 5 ? `<span class="text-[10px] text-stone-400 self-center">+${prod.sizes.length - 5}</span>` : ''}
      </div>`
    : '';

  // Cores disponíveis em bolinhas
  const colorsHTML = (prod.colors && prod.colors.length > 0)
    ? `<div class="flex items-center gap-1.5 mt-2">
        ${prod.colors.map((c, i) => `
          <button type="button"
                  title="${c.name}"
                  onclick="event.stopPropagation(); selectCardColor('${prod.id}', '${c.name}', this)"
                  class="card-color-btn w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner transition-transform hover:scale-125 ${i === 0 ? 'color-dot-active' : ''}"
                  style="background-color: ${c.hex};"
                  data-color="${c.name}">
          </button>
        `).join('')}
      </div>`
    : '';

  return `
    <div class="product-card group bg-white rounded-3xl p-3 border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
         onclick="openProductQuickView('${prod.id}')"
         id="card-${prod.id}"
         data-selected-size="${prod.sizes && prod.sizes.length > 0 ? prod.sizes[0] : ''}"
         data-selected-color="${prod.colors && prod.colors.length > 0 ? prod.colors[0].name : ''}">
      
      <div>
        <!-- Foto com Zoom no Hover -->
        <div class="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 mb-3">
          <img src="${mainImage}" 
               alt="${prod.title}" 
               loading="lazy"
               class="product-card-image w-full h-full object-cover">
          
          <!-- Badges Superiores -->
          <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            ${badgeHTML}
          </div>

          <!-- Botão Rápido Olho (Quick View) -->
          <button type="button" 
                  onclick="event.stopPropagation(); openProductQuickView('${prod.id}')"
                  class="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-stone-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-stone-900 hover:text-white"
                  title="Ver detalhes da peça">
            <i data-lucide="eye" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Categoria & Título -->
        <div class="px-1">
          <span class="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
            ${prod.category || 'Peça Exclusiva'}
          </span>
          <h3 class="text-sm font-semibold text-stone-900 line-clamp-1 mt-0.5 group-hover:text-[#C26D53] transition-colors" title="${prod.title}">
            ${prod.title}
          </h3>

          <!-- Preços -->
          <div class="mt-1.5 flex items-baseline gap-2">
            <span class="text-base font-extrabold text-stone-900">
              ${formatCurrency(currentPrice)}
            </span>
            ${hasPromo ? `<span class="text-xs text-stone-400 line-through">${formatCurrency(originalPrice)}</span>` : ''}
          </div>

          <!-- Parcelamento -->
          <p class="text-[11px] text-stone-500 font-medium">
            ou ${installments}x de ${formatCurrency(installmentVal)} sem juros
          </p>

          <!-- Seletores de Tamanho e Cor Direto no Card -->
          ${sizesHTML}
          ${colorsHTML}
        </div>
      </div>

      <!-- Ações do Card: WhatsApp Direto + Sacola -->
      <div class="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 px-1">
        
        <!-- Botão WhatsApp Direto com Look Escolhido -->
        <button type="button" 
                onclick="event.stopPropagation(); handleDirectWhatsAppOrder('${prod.id}')"
                class="flex-1 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}">
          <i data-lucide="message-circle" class="w-4 h-4 fill-white"></i>
          <span>Pedir</span>
        </button>

        <!-- Botão Adicionar à Sacola -->
        <button type="button" 
                onclick="event.stopPropagation(); handleAddToCartFromCard('${prod.id}')"
                class="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 flex items-center justify-center transition-all active:scale-95 shrink-0 ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}"
                title="Adicionar à Sacola">
          <i data-lucide="shopping-bag" class="w-4 h-4"></i>
        </button>

      </div>

    </div>
  `;
}

// Seleção de tamanho no próprio card
function selectCardSize(productId, size, btnEl) {
  const card = document.getElementById(`card-${productId}`);
  if (!card) return;
  card.setAttribute('data-selected-size', size);
  card.querySelectorAll('.card-size-btn').forEach(b => b.classList.remove('size-chip-active'));
  btnEl.classList.add('size-chip-active');
}

// Seleção de cor no próprio card
function selectCardColor(productId, colorName, btnEl) {
  const card = document.getElementById(`card-${productId}`);
  if (!card) return;
  card.setAttribute('data-selected-color', colorName);
  card.querySelectorAll('.card-color-btn').forEach(b => b.classList.remove('color-dot-active'));
  btnEl.classList.add('color-dot-active');
}

// ----------------------------------------------------
// PEDIDO NO WHATSAPP: COMPRA DIRETA
// ----------------------------------------------------
function handleDirectWhatsAppOrder(productId) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;

  const card = document.getElementById(`card-${productId}`);
  const chosenSize = card ? card.getAttribute('data-selected-size') : (prod.sizes ? prod.sizes[0] : '');
  const chosenColor = card ? card.getAttribute('data-selected-color') : (prod.colors ? prod.colors[0].name : '');

  const price = prod.promoPrice || prod.price;
  const storePhone = (appState.settings.whatsapp || '').replace(/\D/g, '');

  let msg = `✨ *PEDIDO VIA CATÁLOGO - ${appState.settings.storeName || 'AURA BOUTIQUE'}* ✨\n\n`;
  msg += `Olá! Gostaria de pedir a seguinte peça que vi no catálogo:\n\n`;
  msg += `👗 *${prod.title}*\n`;
  if (prod.sku) msg += `🏷️ *Ref / SKU:* ${prod.sku}\n`;
  if (chosenSize) msg += `📏 *Tamanho:* ${chosenSize}\n`;
  if (chosenColor) msg += `🎨 *Cor:* ${chosenColor}\n`;
  msg += `💰 *Valor:* ${formatCurrency(price)}\n\n`;
  msg += `Poderia me confirmar a disponibilidade para entrega/retirada? 💖`;

  const url = `https://wa.me/${storePhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ----------------------------------------------------
// SACOLA DE LOOKS (CARRINHO WHATSAPP)
// ----------------------------------------------------
function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem('aura_cart');
    appState.cart = saved ? JSON.parse(saved) : [];
  } catch (e) {
    appState.cart = [];
  }
}

function saveCartToStorage() {
  localStorage.setItem('aura_cart', JSON.stringify(appState.cart));
  updateCartBadge();
  renderCartDrawer();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge-count');
  const count = appState.cart.reduce((acc, item) => acc + item.quantity, 0);
  if (badge) {
    badge.textContent = count;
    if (count > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

function handleAddToCartFromCard(productId) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;

  const card = document.getElementById(`card-${productId}`);
  const chosenSize = card ? card.getAttribute('data-selected-size') : (prod.sizes ? prod.sizes[0] : 'Único');
  const chosenColor = card ? card.getAttribute('data-selected-color') : (prod.colors ? prod.colors[0].name : 'Padrão');

  addToCart(prod, chosenSize, chosenColor);
}

function addToCart(product, size, color) {
  const existingIndex = appState.cart.findIndex(
    item => item.productId === product.id && item.size === size && item.color === color
  );

  const price = product.promoPrice || product.price;
  const image = (product.images && product.images.length > 0) ? product.images[0] : '';

  if (existingIndex >= 0) {
    appState.cart[existingIndex].quantity += 1;
  } else {
    appState.cart.push({
      cartId: 'item_' + Date.now(),
      productId: product.id,
      title: product.title,
      sku: product.sku || '',
      price: price,
      size: size || 'Único',
      color: color || 'Padrão',
      image: image,
      quantity: 1
    });
  }

  saveCartToStorage();
  showToast(`"${product.title}" adicionado à sacola! ✨`, 'success');
  openCartDrawer();
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
    renderCartDrawer();
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('hidden');
  }
}

function renderCartDrawer() {
  const container = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal-val');
  const freeShippingBar = document.getElementById('cart-shipping-progress');
  const freeShippingText = document.getElementById('cart-shipping-msg');
  const emptyState = document.getElementById('cart-empty-state');
  const footerEl = document.getElementById('cart-footer');
  if (!container) return;

  const total = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (subtotalEl) subtotalEl.textContent = formatCurrency(total);

  // Barra de Frete Grátis (Meta: R$ 299)
  const freeGoal = 299;
  if (freeShippingBar && freeShippingText) {
    const percent = Math.min(100, Math.round((total / freeGoal) * 100));
    freeShippingBar.style.width = `${percent}%`;

    if (total >= freeGoal) {
      freeShippingText.innerHTML = `🎉 <strong>Parabéns!</strong> Você ganhou <strong>Frete Grátis</strong> para todo o Brasil!`;
    } else {
      const remaining = freeGoal - total;
      freeShippingText.innerHTML = `Faltam apenas <strong>${formatCurrency(remaining)}</strong> para você desbloquear <strong>Frete Grátis</strong>!`;
    }
  }

  if (appState.cart.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (footerEl) footerEl.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (footerEl) footerEl.classList.remove('hidden');

  container.innerHTML = appState.cart.map((item, idx) => `
    <div class="flex items-center gap-3 py-3 border-b border-stone-100 last:border-b-0">
      <img src="${item.image || 'https://via.placeholder.com/100'}" 
           alt="${item.title}" 
           class="w-16 h-20 rounded-xl object-cover bg-stone-100 shrink-0">
      
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-stone-900 truncate">${item.title}</h4>
        <div class="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
          <span>Tam: <strong>${item.size}</strong></span>
          <span>•</span>
          <span>Cor: <strong>${item.color}</strong></span>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs font-extrabold text-stone-900">${formatCurrency(item.price)}</span>
          
          <!-- Seletor de Quantidade -->
          <div class="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white">
            <button type="button" 
                    onclick="updateCartItemQuantity(${idx}, -1)" 
                    class="w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-stone-100 text-stone-700">
              -
            </button>
            <span class="w-7 text-center text-xs font-bold">${item.quantity}</span>
            <button type="button" 
                    onclick="updateCartItemQuantity(${idx}, 1)" 
                    class="w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-stone-100 text-stone-700">
              +
            </button>
          </div>
        </div>
      </div>

      <button type="button" 
              onclick="removeCartItem(${idx})" 
              class="w-7 h-7 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0"
              title="Remover peça">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function updateCartItemQuantity(index, delta) {
  if (!appState.cart[index]) return;
  appState.cart[index].quantity += delta;
  if (appState.cart[index].quantity <= 0) {
    appState.cart.splice(index, 1);
  }
  saveCartToStorage();
}

function removeCartItem(index) {
  appState.cart.splice(index, 1);
  saveCartToStorage();
  showToast('Peça removida da sacola.', 'info');
}

// Finalizar Pedido Completo via WhatsApp
function handleCheckoutWhatsApp() {
  if (appState.cart.length === 0) {
    showToast('Sua sacola está vazia!', 'error');
    return;
  }

  const customerName = (document.getElementById('checkout-customer-name')?.value || '').trim();
  const customerCity = (document.getElementById('checkout-customer-city')?.value || '').trim();

  const total = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCount = appState.cart.reduce((sum, item) => sum + item.quantity, 0);

  let msg = `✨ *NOVO PEDIDO - ${appState.settings.storeName || 'AURA BOUTIQUE'}* ✨\n\n`;
  msg += `Olá! Finalizei minha sacola de looks pelo catálogo online e gostaria de fechar o pedido:\n\n`;

  appState.cart.forEach((item, i) => {
    msg += `${i + 1}️⃣ *${item.title}*\n`;
    msg += `   • Tamanho: *${item.size}* | Cor: *${item.color}*\n`;
    msg += `   • Qtd: ${item.quantity}x | Valor: ${formatCurrency(item.price * item.quantity)}\n\n`;
  });

  msg += `────────────────────────\n`;
  msg += `🛍️ *Total do Pedido:* ${formatCurrency(total)} (${totalCount} ${totalCount === 1 ? 'peça' : 'peças'})\n`;

  if (customerName) {
    msg += `👤 *Cliente:* ${customerName}\n`;
  }
  if (customerCity) {
    msg += `📍 *Cidade / Bairro:* ${customerCity}\n`;
  }

  msg += `────────────────────────\n`;
  msg += `Poderiam me informar os dados para pagamento (PIX / Cartão) e o prazo de envio? 💖`;

  const storePhone = (appState.settings.whatsapp || '').replace(/\D/g, '');
  const url = `https://wa.me/${storePhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ----------------------------------------------------
// MODAL DE VISUALIZAÇÃO RÁPIDA (QUICK VIEW)
// ----------------------------------------------------
function openProductQuickView(productId) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;

  const modal = document.getElementById('product-modal');
  const container = document.getElementById('product-modal-content');
  if (!modal || !container) return;

  const isSoldOut = prod.status === 'sold_out';
  const hasPromo = prod.promoPrice && prod.promoPrice < prod.price;
  const currentPrice = hasPromo ? prod.promoPrice : prod.price;
  const originalPrice = prod.price;
  const installments = prod.installments || 3;
  const installmentVal = currentPrice / installments;

  const images = (prod.images && prod.images.length > 0) ? prod.images : ['https://via.placeholder.com/600'];

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
      
      <!-- Galeria de Fotos -->
      <div>
        <div class="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 mb-3 shadow-inner">
          <img id="quickview-main-img" 
               src="${images[0]}" 
               alt="${prod.title}" 
               class="w-full h-full object-cover">
        </div>

        ${images.length > 1 ? `
          <div class="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            ${images.map((img, i) => `
              <button type="button" 
                      onclick="document.getElementById('quickview-main-img').src = '${img}'" 
                      class="w-16 h-20 rounded-xl overflow-hidden border-2 border-transparent hover:border-stone-900 shrink-0 transition-colors">
                <img src="${img}" class="w-full h-full object-cover">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Detalhes do Produto -->
      <div class="flex flex-col justify-between">
        <div>
          <span class="text-xs uppercase font-bold text-[#C26D53] tracking-widest block mb-1">
            ${prod.category || 'Peça Exclusiva'}
          </span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-stone-900 font-editorial leading-tight">
            ${prod.title}
          </h2>
          ${prod.sku ? `<p class="text-xs text-stone-400 font-mono mt-1">Ref: ${prod.sku}</p>` : ''}

          <!-- Preços -->
          <div class="mt-4 flex items-baseline gap-3">
            <span class="text-3xl font-black text-stone-900">
              ${formatCurrency(currentPrice)}
            </span>
            ${hasPromo ? `<span class="text-base text-stone-400 line-through font-medium">${formatCurrency(originalPrice)}</span>` : ''}
          </div>
          <p class="text-xs text-stone-500 font-medium mt-1">
            💳 Em até <strong>${installments}x de ${formatCurrency(installmentVal)} sem juros</strong> ou 5% OFF no PIX
          </p>

          <!-- Descrição e Tecido -->
          <div class="mt-5 pt-4 border-t border-stone-200">
            <h4 class="text-xs font-bold uppercase tracking-wider text-stone-900 mb-2">Descrição & Modelagem</h4>
            <p class="text-xs text-stone-600 leading-relaxed">
              ${prod.description || 'Peça com acabamento primoroso e corte pensado para valorizar o corpo feminino.'}
            </p>
            ${prod.fabric ? `
              <p class="text-xs text-stone-500 mt-2">
                🧵 <strong>Composição:</strong> ${prod.fabric}
              </p>
            ` : ''}
          </div>

          <!-- Seleção de Tamanho -->
          ${prod.sizes && prod.sizes.length > 0 ? `
            <div class="mt-5">
              <div class="flex justify-between items-center mb-2">
                <label class="text-xs font-bold uppercase tracking-wider text-stone-900">Selecione seu Tamanho</label>
                <span class="text-[11px] text-stone-400">Guia de Medidas</span>
              </div>
              <div class="flex flex-wrap gap-2" id="modal-sizes-group">
                ${prod.sizes.map((sz, i) => `
                  <button type="button" 
                          onclick="selectModalSize(this, '${sz}')" 
                          class="modal-sz-btn px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold hover:border-stone-900 transition-colors ${i === 0 ? 'size-chip-active' : 'bg-white text-stone-800'}"
                          data-size="${sz}">
                    ${sz}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Seleção de Cor -->
          ${prod.colors && prod.colors.length > 0 ? `
            <div class="mt-5">
              <label class="text-xs font-bold uppercase tracking-wider text-stone-900 block mb-2">Selecione a Cor</label>
              <div class="flex flex-wrap gap-2.5" id="modal-colors-group">
                ${prod.colors.map((c, i) => `
                  <button type="button" 
                          onclick="selectModalColor(this, '${c.name}')" 
                          class="modal-col-btn flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 text-xs font-semibold hover:border-stone-900 transition-colors ${i === 0 ? 'border-stone-900 bg-stone-50' : 'bg-white text-stone-700'}"
                          data-color="${c.name}">
                    <span class="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner" style="background-color: ${c.hex}"></span>
                    <span>${c.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

        </div>

        <!-- Botões de Compra do Modal -->
        <div class="mt-8 pt-4 border-t border-stone-200 flex flex-col sm:flex-row gap-3">
          
          <button type="button" 
                  onclick="handleModalWhatsAppOrder('${prod.id}')"
                  class="flex-1 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}">
            <i data-lucide="message-circle" class="w-5 h-5 fill-white"></i>
            <span>Pedir no WhatsApp</span>
          </button>

          <button type="button" 
                  onclick="handleModalAddToCart('${prod.id}')"
                  class="bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}">
            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
            <span>Adicionar à Sacola</span>
          </button>

        </div>

      </div>

    </div>
  `;

  modal.classList.remove('hidden');
  modal.setAttribute('data-current-prod-id', prod.id);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeProductQuickView() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.add('hidden');
}

function selectModalSize(btn, size) {
  document.querySelectorAll('.modal-sz-btn').forEach(b => b.classList.remove('size-chip-active'));
  btn.classList.add('size-chip-active');
}

function selectModalColor(btn, colorName) {
  document.querySelectorAll('.modal-col-btn').forEach(b => {
    b.classList.remove('border-stone-900', 'bg-stone-50');
  });
  btn.classList.add('border-stone-900', 'bg-stone-50');
}

function getSelectedModalSizeAndColor() {
  const activeSizeBtn = document.querySelector('.modal-sz-btn.size-chip-active');
  const activeColorBtn = document.querySelector('.modal-col-btn.border-stone-900');
  return {
    size: activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : 'Único',
    color: activeColorBtn ? activeColorBtn.getAttribute('data-color') : 'Padrão'
  };
}

function handleModalAddToCart(productId) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;
  const { size, color } = getSelectedModalSizeAndColor();
  addToCart(prod, size, color);
  closeProductQuickView();
}

function handleModalWhatsAppOrder(productId) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;
  const { size, color } = getSelectedModalSizeAndColor();

  const price = prod.promoPrice || prod.price;
  const storePhone = (appState.settings.whatsapp || '').replace(/\D/g, '');

  let msg = `✨ *PEDIDO VIA CATÁLOGO - ${appState.settings.storeName || 'AURA BOUTIQUE'}* ✨\n\n`;
  msg += `Olá! Gostaria de pedir a seguinte peça que vi no catálogo:\n\n`;
  msg += `👗 *${prod.title}*\n`;
  if (prod.sku) msg += `🏷️ *Ref:* ${prod.sku}\n`;
  msg += `📏 *Tamanho:* ${size}\n`;
  msg += `🎨 *Cor:* ${color}\n`;
  msg += `💰 *Valor:* ${formatCurrency(price)}\n\n`;
  msg += `Poderia me confirmar se está disponível para envio? 💖`;

  const url = `https://wa.me/${storePhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ----------------------------------------------------
// PAINEL ADMINISTRATIVO DO DONO (ADMIN)
// ----------------------------------------------------
function openAdminLoginModal() {
  if (appState.isAdminLoggedIn) {
    openAdminDashboard();
    return;
  }
  const modal = document.getElementById('admin-login-modal');
  const pinInput = document.getElementById('admin-pin-input');
  if (modal) {
    modal.classList.remove('hidden');
    if (pinInput) {
      pinInput.value = '';
      setTimeout(() => pinInput.focus(), 150);
    }
  }
}

function closeAdminLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) modal.classList.add('hidden');
}

function handleAdminLoginSubmit(e) {
  if (e) e.preventDefault();
  const pinInput = document.getElementById('admin-pin-input');
  const enteredPin = (pinInput?.value || '').trim();
  const correctPin = appState.settings.adminPin || '1234';

  if (enteredPin === correctPin) {
    appState.isAdminLoggedIn = true;
    closeAdminLoginModal();
    openAdminDashboard();
    showToast('Acesso administrativo autorizado! 🔐', 'success');
  } else {
    showToast('Senha / PIN incorreto! Tente novamente.', 'error');
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  }
}

function openAdminDashboard() {
  const drawer = document.getElementById('admin-dashboard-modal');
  if (drawer) {
    drawer.classList.remove('hidden');
    switchAdminTab('products');
    renderAdminProductsList();
  }
}

function closeAdminDashboard() {
  const drawer = document.getElementById('admin-dashboard-modal');
  if (drawer) drawer.classList.add('hidden');
}

function switchAdminTab(tabName) {
  // Abas: products | form | categories | settings
  document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.remove('bg-stone-900', 'text-white');
    btn.classList.add('bg-stone-100', 'text-stone-700');
  });

  const activeContent = document.getElementById(`admin-tab-${tabName}`);
  const activeBtn = document.getElementById(`admin-btn-tab-${tabName}`);

  if (activeContent) activeContent.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.remove('bg-stone-100', 'text-stone-700');
    activeBtn.classList.add('bg-stone-900', 'text-white');
  }

  if (tabName === 'products') renderAdminProductsList();
  if (tabName === 'categories') renderAdminCategoriesList();
  if (tabName === 'settings') populateAdminSettingsForm();
}

// ----------------------------------------------------
// ADMIN: LISTAGEM DE PRODUTOS
// ----------------------------------------------------
function renderAdminProductsList() {
  const tbody = document.getElementById('admin-products-table-body');
  if (!tbody) return;

  const prods = [...appState.products];
  prods.sort((a, b) => (Number(a.position) || 999) - (Number(b.position) || 999));

  tbody.innerHTML = prods.map(p => {
    const isSoldOut = p.status === 'sold_out';
    const mainImg = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/80';

    return `
      <tr class="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
        <td class="py-3 px-3">
          <input type="number" 
                 value="${p.position || 1}" 
                 onchange="updateProductPosition('${p.id}', this.value)"
                 class="w-14 text-center py-1 rounded-lg border border-stone-200 text-xs font-bold">
        </td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-3">
            <img src="${mainImg}" class="w-12 h-14 rounded-lg object-cover bg-stone-100 shrink-0">
            <div>
              <h5 class="text-xs font-bold text-stone-900 line-clamp-1">${p.title}</h5>
              <span class="text-[11px] text-stone-400 font-mono">${p.sku || 'Sem Ref'} • ${p.category}</span>
            </div>
          </div>
        </td>
        <td class="py-3 px-3 text-xs font-extrabold text-stone-900">
          ${formatCurrency(p.promoPrice || p.price)}
          ${p.promoPrice ? `<span class="block text-[10px] text-stone-400 line-through">${formatCurrency(p.price)}</span>` : ''}
        </td>
        <td class="py-3 px-3">
          <button type="button" 
                  onclick="toggleProductStock('${p.id}')"
                  class="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isSoldOut ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
            ${isSoldOut ? 'Esgotado' : 'Disponível'}
          </button>
        </td>
        <td class="py-3 px-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button type="button" 
                    onclick="editProductInAdmin('${p.id}')" 
                    class="p-2 rounded-lg bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 transition-colors"
                    title="Editar Produto">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" 
                    onclick="deleteProductInAdmin('${p.id}')" 
                    class="p-2 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors"
                    title="Excluir Produto">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function updateProductPosition(id, newPos) {
  const prod = appState.products.find(p => p.id === id);
  if (!prod) return;
  prod.position = Number(newPos) || 1;
  await window.catalogDB.saveProduct(prod);
  await reloadData();
  renderProducts();
  showToast('Ordem da vitrine atualizada!', 'info');
}

async function toggleProductStock(id) {
  const prod = appState.products.find(p => p.id === id);
  if (!prod) return;
  prod.status = (prod.status === 'sold_out') ? 'available' : 'sold_out';
  await window.catalogDB.saveProduct(prod);
  await reloadData();
  renderAdminProductsList();
  renderProducts();
  showToast(`Status de "${prod.title}" atualizado.`, 'info');
}

// ----------------------------------------------------
// ADMIN: FORMULÁRIO DE PRODUTO (ADICIONAR / EDITAR)
// ----------------------------------------------------
function openNewProductForm() {
  appState.editingProductId = null;
  appState.formImages = [];
  appState.formSizes = ['P', 'M', 'G'];
  appState.formColors = [];

  document.getElementById('admin-form-title').textContent = 'Cadastrar Novo Produto';
  document.getElementById('product-form-element').reset();

  // Popula categorias no select
  populateCategoriesSelect();
  renderFormImagesPreview();
  renderFormSizesChips();
  renderFormColorsList();

  switchAdminTab('form');
}

function editProductInAdmin(id) {
  const prod = appState.products.find(p => p.id === id);
  if (!prod) return;

  appState.editingProductId = id;
  appState.formImages = prod.images ? [...prod.images] : [];
  appState.formSizes = prod.sizes ? [...prod.sizes] : [];
  appState.formColors = prod.colors ? [...prod.colors] : [];

  document.getElementById('admin-form-title').textContent = 'Editar Produto';

  populateCategoriesSelect(prod.category);

  document.getElementById('form-prod-title').value = prod.title || '';
  document.getElementById('form-prod-sku').value = prod.sku || '';
  document.getElementById('form-prod-price').value = prod.price || '';
  document.getElementById('form-prod-promo-price').value = prod.promoPrice || '';
  document.getElementById('form-prod-installments').value = prod.installments || 3;
  document.getElementById('form-prod-desc').value = prod.description || '';
  document.getElementById('form-prod-fabric').value = prod.fabric || '';
  document.getElementById('form-prod-position').value = prod.position || 1;
  document.getElementById('form-prod-badge').value = prod.badge || '';
  document.getElementById('form-prod-status').value = prod.status || 'available';

  renderFormImagesPreview();
  renderFormSizesChips();
  renderFormColorsList();

  switchAdminTab('form');
}

function populateCategoriesSelect(selectedCat = '') {
  const sel = document.getElementById('form-prod-category');
  if (!sel) return;

  sel.innerHTML = appState.categories.map(c => `
    <option value="${c.name}" ${c.name === selectedCat ? 'selected' : ''}>${c.name}</option>
  `).join('');
}

// Upload e Pré-visualização de Fotos
async function handlePhotosUpload(files) {
  if (!files || files.length === 0) return;

  showToast(`Comprimindo e processando ${files.length} foto(s)...`, 'info');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue;

    try {
      // Comprime a foto automaticamente para poupar espaço no IndexedDB
      const compressed = await CatalogDatabase.compressImageFile(file);
      appState.formImages.push(compressed);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
    }
  }

  renderFormImagesPreview();
  showToast('Fotos adicionadas com sucesso!', 'success');
}

function handleAddImageUrlPrompt() {
  const url = prompt('Cole a URL da foto (Unsplash, Imgur, link direto de imagem):');
  if (url && url.trim().startsWith('http')) {
    appState.formImages.push(url.trim());
    renderFormImagesPreview();
  }
}

function renderFormImagesPreview() {
  const container = document.getElementById('form-images-preview-grid');
  if (!container) return;

  if (appState.formImages.length === 0) {
    container.innerHTML = `<span class="text-xs text-stone-400 italic">Nenhuma foto adicionada ainda. Faça upload ou cole uma URL.</span>`;
    return;
  }

  container.innerHTML = appState.formImages.map((img, idx) => `
    <div class="relative w-20 h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group">
      <img src="${img}" class="w-full h-full object-cover">
      <button type="button" 
              onclick="removeFormImage(${idx})" 
              class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow hover:bg-rose-700">
        ✕
      </button>
      ${idx === 0 ? `<span class="absolute bottom-0 inset-x-0 bg-stone-900/80 text-white text-[8px] font-bold text-center py-0.5">Capa</span>` : ''}
    </div>
  `).join('');
}

function removeFormImage(idx) {
  appState.formImages.splice(idx, 1);
  renderFormImagesPreview();
}

// Gerenciador de Tamanhos no Formulário
function renderFormSizesChips() {
  const container = document.getElementById('form-sizes-container');
  if (!container) return;

  const defaultOptions = ['PP', 'P', 'M', 'G', 'GG', 'XGG', '34', '36', '38', '40', '42', '44', 'Único'];

  container.innerHTML = `
    <div class="flex flex-wrap gap-1.5 mb-2">
      ${defaultOptions.map(sz => {
        const isSelected = appState.formSizes.includes(sz);
        return `
          <button type="button" 
                  onclick="toggleFormSize('${sz}')"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isSelected ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'}">
            ${sz}
          </button>
        `;
      }).join('')}
    </div>
    
    <div class="flex gap-2 mt-2">
      <input type="text" id="custom-size-input" placeholder="Outro tamanho (ex: 46, Plus)" class="text-xs px-3 py-1.5 rounded-lg border border-stone-200 w-44">
      <button type="button" onclick="addCustomFormSize()" class="text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-800">
        + Adicionar
      </button>
    </div>
  `;
}

function toggleFormSize(sz) {
  const idx = appState.formSizes.indexOf(sz);
  if (idx >= 0) {
    appState.formSizes.splice(idx, 1);
  } else {
    appState.formSizes.push(sz);
  }
  renderFormSizesChips();
}

function addCustomFormSize() {
  const inp = document.getElementById('custom-size-input');
  if (!inp || !inp.value.trim()) return;
  const val = inp.value.trim().toUpperCase();
  if (!appState.formSizes.includes(val)) {
    appState.formSizes.push(val);
  }
  inp.value = '';
  renderFormSizesChips();
}

// Gerenciador de Cores no Formulário
function renderFormColorsList() {
  const container = document.getElementById('form-colors-container');
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-wrap gap-2 mb-3">
      ${appState.formColors.map((c, i) => `
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 bg-white text-xs font-medium shadow-sm">
          <span class="w-3.5 h-3.5 rounded-full border border-black/10" style="background-color: ${c.hex}"></span>
          <span>${c.name}</span>
          <button type="button" onclick="removeFormColor(${i})" class="text-stone-400 hover:text-rose-600 ml-1 font-bold">×</button>
        </div>
      `).join('')}
    </div>

    <div class="flex items-center gap-2">
      <input type="color" id="new-color-hex" value="#C26D53" class="w-9 h-9 rounded-lg border border-stone-200 cursor-pointer p-0.5">
      <input type="text" id="new-color-name" placeholder="Nome da cor (ex: Terracota, Nude)" class="text-xs px-3 py-2 rounded-lg border border-stone-200 flex-1">
      <button type="button" onclick="addFormColor()" class="text-xs px-4 py-2 rounded-lg bg-stone-900 text-white font-bold hover:bg-stone-800">
        + Adicionar Cor
      </button>
    </div>
  `;
}

function addFormColor() {
  const nameInp = document.getElementById('new-color-name');
  const hexInp = document.getElementById('new-color-hex');
  if (!nameInp || !nameInp.value.trim()) {
    showToast('Digite o nome da cor.', 'info');
    return;
  }

  appState.formColors.push({
    name: nameInp.value.trim(),
    hex: hexInp.value || '#000000'
  });

  nameInp.value = '';
  renderFormColorsList();
}

function removeFormColor(i) {
  appState.formColors.splice(i, 1);
  renderFormColorsList();
}

// Submissão do Formulário de Salvar Produto
async function handleSaveProductSubmit(e) {
  if (e) e.preventDefault();

  const title = document.getElementById('form-prod-title')?.value.trim();
  const price = parseFloat(document.getElementById('form-prod-price')?.value);

  if (!title) {
    showToast('O título do produto é obrigatório!', 'error');
    return;
  }

  if (isNaN(price) || price <= 0) {
    showToast('Informe um preço válido para a peça!', 'error');
    return;
  }

  const promoVal = document.getElementById('form-prod-promo-price')?.value;
  const promoPrice = promoVal ? parseFloat(promoVal) : null;

  const productData = {
    id: appState.editingProductId || null,
    title: title,
    sku: document.getElementById('form-prod-sku')?.value.trim() || '',
    category: document.getElementById('form-prod-category')?.value || 'Vestidos',
    price: price,
    promoPrice: promoPrice,
    installments: parseInt(document.getElementById('form-prod-installments')?.value) || 3,
    description: document.getElementById('form-prod-desc')?.value.trim() || '',
    fabric: document.getElementById('form-prod-fabric')?.value.trim() || '',
    position: parseInt(document.getElementById('form-prod-position')?.value) || 1,
    badge: document.getElementById('form-prod-badge')?.value || '',
    status: document.getElementById('form-prod-status')?.value || 'available',
    images: appState.formImages.length > 0 ? appState.formImages : ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80'],
    sizes: appState.formSizes.length > 0 ? appState.formSizes : ['Único'],
    colors: appState.formColors.length > 0 ? appState.formColors : [{ name: 'Única', hex: '#333333' }]
  };

  await window.catalogDB.saveProduct(productData);
  await reloadData();

  renderProducts();
  renderAdminProductsList();
  switchAdminTab('products');
  showToast(`Produto "${title}" salvo com sucesso! 🛍️`, 'success');
}

async function deleteProductInAdmin(id) {
  const prod = appState.products.find(p => p.id === id);
  if (!prod) return;

  if (confirm(`Tem certeza que deseja excluir "${prod.title}" do catálogo?`)) {
    await window.catalogDB.deleteProduct(id);
    await reloadData();
    renderProducts();
    renderAdminProductsList();
    showToast(`Produto removido.`, 'info');
  }
}

// ----------------------------------------------------
// ADMIN: GERENCIAR CATEGORIAS
// ----------------------------------------------------
function renderAdminCategoriesList() {
  const container = document.getElementById('admin-categories-list');
  if (!container) return;

  container.innerHTML = appState.categories.map(c => {
    const count = appState.products.filter(p => p.category === c.name).length;
    return `
      <div class="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200">
        <div>
          <h5 class="text-xs font-bold text-stone-900">${c.name}</h5>
          <span class="text-[11px] text-stone-500">${count} produto(s) vinculado(s)</span>
        </div>
        <button type="button" 
                onclick="deleteCategoryInAdmin('${c.name}')" 
                class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function handleAddCategorySubmit() {
  const inp = document.getElementById('admin-new-cat-name');
  if (!inp || !inp.value.trim()) return;

  const name = inp.value.trim();
  await window.catalogDB.saveCategory(name, appState.categories.length + 1);
  inp.value = '';
  await reloadData();
  renderCategories();
  renderAdminCategoriesList();
  populateCategoriesSelect();
  showToast(`Categoria "${name}" criada!`, 'success');
}

async function deleteCategoryInAdmin(name) {
  if (confirm(`Excluir categoria "${name}"? Os produtos não serão apagados.`)) {
    await window.catalogDB.deleteCategory(name);
    await reloadData();
    renderCategories();
    renderAdminCategoriesList();
    populateCategoriesSelect();
    showToast(`Categoria excluída.`, 'info');
  }
}

// ----------------------------------------------------
// ADMIN: CONFIGURAÇÕES & BACKUP
// ----------------------------------------------------
function populateAdminSettingsForm() {
  const s = appState.settings;
  const f = document.getElementById('admin-settings-form');
  if (!f) return;

  f['set-store-name'].value = s.storeName || '';
  f['set-tagline'].value = s.tagline || '';
  f['set-whatsapp'].value = s.whatsapp || '';
  f['set-instagram'].value = s.instagram || '';
  f['set-city'].value = s.city || '';
  f['set-shipping-alert'].value = s.freeShippingAlert || '';
  f['set-admin-pin'].value = s.adminPin || '1234';
}

async function handleSaveSettingsSubmit(e) {
  if (e) e.preventDefault();
  const f = document.getElementById('admin-settings-form');
  if (!f) return;

  const updated = {
    storeName: f['set-store-name'].value.trim(),
    tagline: f['set-tagline'].value.trim(),
    whatsapp: f['set-whatsapp'].value.trim(),
    instagram: f['set-instagram'].value.trim(),
    city: f['set-city'].value.trim(),
    freeShippingAlert: f['set-shipping-alert'].value.trim(),
    adminPin: f['set-admin-pin'].value.trim() || '1234'
  };

  await window.catalogDB.saveSettings(updated);
  await reloadData();
  renderHeaderInfo();
  showToast('Configurações da loja atualizadas com sucesso! ⚙️', 'success');
}

// Exportar Backup Completo (.JSON)
async function handleExportBackup() {
  try {
    const jsonStr = await window.catalogDB.exportFullCatalogJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-catalogo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Download do backup realizado com sucesso! 📦', 'success');
  } catch (err) {
    showToast('Erro ao exportar backup: ' + err.message, 'error');
  }
}

// Importar Backup (.JSON)
async function handleImportBackup(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const res = await window.catalogDB.importCatalogJSON(e.target.result);
      if (res.success) {
        await reloadData();
        renderHeaderInfo();
        renderCategories();
        renderProducts();
        renderAdminProductsList();
        showToast(`${res.count} produtos importados com sucesso! ✨`, 'success');
      } else {
        showToast('Erro na importação: ' + res.error, 'error');
      }
    } catch (err) {
      showToast('Arquivo JSON inválido!', 'error');
    }
  };
  reader.readAsText(file);
}

// Redefinir para Catálogo Modelo (Seed Demo)
async function handleResetToDemo() {
  if (confirm('Atenção: Isso redefinirá o catálogo com as 8 peças e fotos modelo de demonstração. Deseja continuar?')) {
    await window.catalogDB.resetToDemo();
    await reloadData();
    renderHeaderInfo();
    renderCategories();
    renderProducts();
    renderAdminProductsList();
    showToast('Catálogo redefinido para a demonstração original.', 'info');
  }
}

// ----------------------------------------------------
// LISTENERS & CONFIGURAÇÕES DE INTERFACE
// ----------------------------------------------------
function setupEventListeners() {
  // Campo de Busca
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.currentSearch = e.target.value.trim();
      renderProducts();
    });
  }

  // Seletor de Ordenação
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      appState.currentSort = e.target.value;
      renderProducts();
    });
  }

  // Upload de Imagens no Form
  const photosInput = document.getElementById('form-photos-input');
  if (photosInput) {
    photosInput.addEventListener('change', (e) => {
      handlePhotosUpload(e.target.files);
    });
  }

  // Importar JSON Backup
  const backupInput = document.getElementById('import-backup-file');
  if (backupInput) {
    backupInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImportBackup(e.target.files[0]);
      }
    });
  }

  // Atalho de Teclado para Abrir Admin (Pressionar Ctrl + Shift + A)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
      e.preventDefault();
      openAdminLoginModal();
    }
  });
}
