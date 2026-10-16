/**
 * Aura Boutique - Camada de Dados Híbrida (Opção A: IndexedDB / LocalStorage + Opção B: Supabase Nuvem)
 * Sincroniza produtos em tempo real para todos os clientes quando conectado ao Supabase.
 */

const DB_NAME = 'AuraBoutiqueDB';
const DB_VERSION = 1;

// Configurações Padrão da Loja (com suporte à Nuvem)
const DEFAULT_SETTINGS = {
  storeName: 'Aura Boutique & Conceito',
  tagline: 'Moda Feminina Autoral, Alfaiataria e Peças Exclusivas',
  whatsapp: '5598984251234',
  instagram: '@auraboutique.oficial',
  city: 'São Luís - MA',
  adminPin: '1234',
  freeShippingAlert: 'Frete Grátis para todo o Brasil nas compras acima de R$ 299',
  paymentBadge: 'Em até 6x sem juros no cartão ou 5% OFF no PIX',
  customGreeting: 'Olá! Estava navegando no catálogo da Aura Boutique e me apaixonei por essa peça:',
  supabaseUrl: '',
  supabaseKey: ''
};

// Categorias Iniciais
const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: 'Vestidos', order: 1, icon: 'sparkles' },
  { id: 'cat_2', name: 'Conjuntos', order: 2, icon: 'layers' },
  { id: 'cat_3', name: 'Alfaiataria', order: 3, icon: 'briefcase' },
  { id: 'cat_4', name: 'Blusas & Tops', order: 4, icon: 'shirt' },
  { id: 'cat_5', name: 'Jeans & Calças', order: 5, icon: 'scissors' },
  { id: 'cat_6', name: 'Acessórios', order: 6, icon: 'gem' }
];

// Produtos Demonstração Iniciais (Looks de Alto Padrão)
const SEED_PRODUCTS = [
  {
    id: 'prod_1',
    title: 'Vestido Midi Linho Santorini',
    sku: 'VES-001',
    category: 'Vestidos',
    price: 329.90,
    promoPrice: 269.90,
    installments: 6,
    description: 'Vestido midi em puro linho misto com elastano. Modelagem fluida, decote quadrado que valoriza o colo, fenda frontal sofisticada e amarração nas costas.',
    fabric: 'Linho 55%, Viscose 42%, Elastano 3%',
    sizes: ['P', 'M', 'G'],
    colors: [
      { name: 'Terracota', hex: '#B25D42' },
      { name: 'Off-White', hex: '#FAF6EE' },
      { name: 'Verde Sálvia', hex: '#8F9779' }
    ],
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80'
    ],
    position: 1,
    badge: 'Lançamento',
    featured: true,
    status: 'available',
    createdAt: Date.now() - 100000
  },
  {
    id: 'prod_2',
    title: 'Conjunto Alfaiataria Blazer & Bermuda Milão',
    sku: 'CONJ-002',
    category: 'Conjuntos',
    price: 459.00,
    promoPrice: 389.90,
    installments: 6,
    description: 'Elegância contemporânea em alfaiataria estruturada. Blazer com corte alongado e botões forrados acompanhado de bermuda de cintura alta com bolsos faca.',
    fabric: 'Alfaiataria Crepe Premium com forro acetinado',
    sizes: ['36', '38', '40', '42'],
    colors: [
      { name: 'Nude Areia', hex: '#D7C4B7' },
      { name: 'Preto Chic', hex: '#1E1E1E' },
      { name: 'Azul Sereno', hex: '#9BB2C4' }
    ],
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80'
    ],
    position: 2,
    badge: 'Mais Vendido',
    featured: true,
    status: 'available',
    createdAt: Date.now() - 200000
  },
  {
    id: 'prod_3',
    title: 'Camisa Seda Pura Amalfi',
    sku: 'CAM-003',
    category: 'Blusas & Tops',
    price: 249.90,
    promoPrice: null,
    installments: 3,
    description: 'Toque acetinado com caimento impecável. Mangas levemente bufantes com punho clássico, fechamento em botões madrepérola e gola francesa.',
    fabric: 'Crepe de Seda com toque suave de pêssego',
    sizes: ['PP', 'P', 'M', 'G'],
    colors: [
      { name: 'Branco Pérola', hex: '#FFFFFF' },
      { name: 'Champagne', hex: '#F3E5AB' },
      { name: 'Rosê Seco', hex: '#C08081' }
    ],
    images: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80'
    ],
    position: 3,
    badge: 'Exclusivo',
    featured: false,
    status: 'available',
    createdAt: Date.now() - 300000
  },
  {
    id: 'prod_4',
    title: 'Calça Wide Leg Alfaiataria Paris',
    sku: 'CAL-004',
    category: 'Alfaiataria',
    price: 299.00,
    promoPrice: 239.00,
    installments: 4,
    description: 'A calça perfeita para alongar a silhueta. Cintura super alta com passantes largos, pregas frontais bem marcadas e barra ampla com acabamento de alta costura.',
    fabric: 'Poliéster 95%, Spandex 5% encorpado',
    sizes: ['36', '38', '40', '42', '44'],
    colors: [
      { name: 'Terracota Queimado', hex: '#A85232' },
      { name: 'Bege Linho', hex: '#E6D7C3' },
      { name: 'Chumbo Grafite', hex: '#3B3B3B' }
    ],
    images: [
      'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80'
    ],
    position: 4,
    badge: 'Promoção',
    featured: true,
    status: 'available',
    createdAt: Date.now() - 400000
  },
  {
    id: 'prod_5',
    title: 'Vestido Longo Plissado Éter',
    sku: 'VES-005',
    category: 'Vestidos',
    price: 489.00,
    promoPrice: null,
    installments: 6,
    description: 'Impactante e gracioso. Tecido levemente brilhoso com plissado permanente de alta precisão, decote frente-única e cinto fino destacando a silhueta.',
    fabric: 'Georgette Plissado com forro longo',
    sizes: ['P', 'M', 'G'],
    colors: [
      { name: 'Verde Esmeralda', hex: '#1C5B42' },
      { name: 'Fúcsia Glow', hex: '#A82B68' },
      { name: 'Dourado Suave', hex: '#D4AF37' }
    ],
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80'
    ],
    position: 5,
    badge: 'Festa & Noite',
    featured: false,
    status: 'low_stock',
    createdAt: Date.now() - 500000
  },
  {
    id: 'prod_6',
    title: 'Cropped Canelado Gola Alta Capri',
    sku: 'CRO-006',
    category: 'Blusas & Tops',
    price: 119.90,
    promoPrice: 89.90,
    installments: 2,
    description: 'Básico essencial e versátil. Malha canelada encorpada que não fica transparente, toque super macio e elasticidade ideal para compor com alfaiatarias.',
    fabric: 'Viscolycra Premium 96%, Elastano 4%',
    sizes: ['PP', 'P', 'M', 'G'],
    colors: [
      { name: 'Off-White', hex: '#FAF6EE' },
      { name: 'Mocha / Caramelo', hex: '#825838' },
      { name: 'Preto', hex: '#111111' }
    ],
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80'
    ],
    position: 6,
    badge: 'Essencial',
    featured: false,
    status: 'available',
    createdAt: Date.now() - 600000
  },
  {
    id: 'prod_7',
    title: 'Calça Jeans Mom Vintage 100% Algodão',
    sku: 'JEA-007',
    category: 'Jeans & Calças',
    price: 269.90,
    promoPrice: null,
    installments: 3,
    description: 'O jeans perfeito com corte vintage autêntico. Lavagem média atemporal, cintura no lugar, bolsos anatômicos e caimento que valoriza sem apertar.',
    fabric: 'Jeans Denim 100% Algodão sustentável',
    sizes: ['36', '38', '40', '42'],
    colors: [
      { name: 'Denim Médio Vintage', hex: '#4B7095' },
      { name: 'Denim Claro Sky', hex: '#87A9C9' }
    ],
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80'
    ],
    position: 7,
    badge: 'Novidade',
    featured: false,
    status: 'available',
    createdAt: Date.now() - 700000
  },
  {
    id: 'prod_8',
    title: 'Cinto Couro Fivela Dourada Minimal',
    sku: 'ACE-008',
    category: 'Acessórios',
    price: 139.90,
    promoPrice: 99.90,
    installments: 2,
    description: 'O acessório chave para arrematar vestidos e calças de alfaiataria. Couro legítimo com acabamento acetinado e fivela metálica geométrica banhada a ouro.',
    fabric: 'Couro 100% com metal anticorrosão',
    sizes: ['Único (Ajustável P ao G)'],
    colors: [
      { name: 'Caramelo Nobre', hex: '#9E5B28' },
      { name: 'Preto Clássico', hex: '#1C1C1C' }
    ],
    images: [
      'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=900&q=80'
    ],
    position: 8,
    badge: 'Acessório',
    featured: false,
    status: 'available',
    createdAt: Date.now() - 800000
  }
];

class CatalogDatabase {
  constructor() {
    this.db = null;
    this.useLocalStorage = false;
    this.supabase = null;
  }

  // Inicializa o banco (IndexedDB e Supabase se configurado)
  async init() {
    return new Promise(async (resolve) => {
      // 1. Tenta inicializar IndexedDB
      if (!window.indexedDB) {
        console.warn('IndexedDB não suportado. Usando LocalStorage.');
        this.useLocalStorage = true;
        this._initLocalStorage();
        await this._initCloudIfConfigured();
        resolve(this);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Tabela de Produtos
        if (!db.objectStoreNames.contains('products')) {
          const prodStore = db.createObjectStore('products', { keyPath: 'id' });
          prodStore.createIndex('category', 'category', { unique: false });
          prodStore.createIndex('position', 'position', { unique: false });
          prodStore.createIndex('status', 'status', { unique: false });
          prodStore.createIndex('featured', 'featured', { unique: false });
        }

        // Tabela de Categorias
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'name' });
        }

        // Tabela de Configurações
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        
        // Verifica se precisa de seed inicial local
        const count = await this.countLocalProducts();
        if (count === 0) {
          await this.seedInitialData();
        }

        // 2. Conecta ao Supabase se as chaves estiverem configuradas
        await this._initCloudIfConfigured();

        resolve(this);
      };

      request.onerror = async (event) => {
        console.warn('Erro ao abrir IndexedDB:', event.target.error);
        this.useLocalStorage = true;
        this._initLocalStorage();
        await this._initCloudIfConfigured();
        resolve(this);
      };
    });
  }

  // Conecta ao Supabase usando as configurações salvas
  async _initCloudIfConfigured() {
    try {
      const s = await this.getSettings();
      if (s.supabaseUrl && s.supabaseKey && window.supabase) {
        this.initSupabase(s.supabaseUrl, s.supabaseKey);
      }
    } catch (e) {
      console.warn('Nuvem não configurada inicialmente:', e);
    }
  }

  initSupabase(url, key) {
    try {
      if (window.supabase && url && key) {
        this.supabase = window.supabase.createClient(url.trim(), key.trim());
        console.log('🟢 Supabase conectado com sucesso!');
        return true;
      }
    } catch (e) {
      console.error('Erro ao conectar Supabase:', e);
    }
    this.supabase = null;
    return false;
  }

  isCloudEnabled() {
    return !!this.supabase;
  }

  // Fallback LocalStorage
  _initLocalStorage() {
    if (!localStorage.getItem('aura_products')) {
      localStorage.setItem('aura_products', JSON.stringify(SEED_PRODUCTS));
    }
    if (!localStorage.getItem('aura_categories')) {
      localStorage.setItem('aura_categories', JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem('aura_settings')) {
      localStorage.setItem('aura_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  // Contagem de produtos locais
  async countLocalProducts() {
    if (this.useLocalStorage) {
      const p = JSON.parse(localStorage.getItem('aura_products') || '[]');
      return p.length;
    }
    return new Promise((resolve) => {
      const tx = this.db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const countReq = store.count();
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => resolve(0);
    });
  }

  // Preenche dados padrão se o banco estiver vazio
  async seedInitialData() {
    for (const prod of SEED_PRODUCTS) {
      await this._saveProductLocal(prod);
    }
    for (const cat of DEFAULT_CATEGORIES) {
      await this.saveCategory(cat.name, cat.order);
    }
    await this.saveSettings(DEFAULT_SETTINGS);
  }

  // ----------------------------------------------------
  // PRODUTOS (HÍBRIDO: NUVEM COM FALLBACK LOCAL)
  // ----------------------------------------------------
  async getAllProducts() {
    // 1. Se a nuvem estiver ativa, tenta buscar primeiro da nuvem
    if (this.isCloudEnabled()) {
      try {
        const { data, error } = await this.supabase
          .from('products')
          .select('*')
          .order('position', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          // Atualiza cache local silenciosamente para funcionar offline
          for (const item of data) {
            this._saveProductLocal(item);
          }
          return data;
        }
      } catch (err) {
        console.warn('Aviso: Nuvem indisponível no momento, carregando dados locais:', err);
      }
    }

    // 2. Fallback: Dados locais (IndexedDB ou LocalStorage)
    return this._getLocalProducts();
  }

  async _getLocalProducts() {
    if (this.useLocalStorage) {
      const prods = JSON.parse(localStorage.getItem('aura_products') || '[]');
      return prods.sort((a, b) => (Number(a.position) || 999) - (Number(b.position) || 999));
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.getAll();

      req.onsuccess = () => {
        const list = req.result || [];
        list.sort((a, b) => (Number(a.position) || 999) - (Number(b.position) || 999));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getProductById(id) {
    if (this.isCloudEnabled()) {
      try {
        const { data, error } = await this.supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch (e) {}
    }

    if (this.useLocalStorage) {
      const prods = JSON.parse(localStorage.getItem('aura_products') || '[]');
      return prods.find((p) => p.id === id) || null;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveProduct(product) {
    if (!product.id) {
      product.id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
    if (!product.createdAt) {
      product.createdAt = Date.now();
    }
    product.updatedAt = Date.now();

    // 1. Salva localmente
    await this._saveProductLocal(product);

    // 2. Se a nuvem estiver ativa, envia para o Supabase
    if (this.isCloudEnabled()) {
      try {
        const { error } = await this.supabase
          .from('products')
          .upsert(product);
        if (error) {
          console.error('Erro ao salvar no Supabase:', error);
        } else {
          console.log('✅ Produto sincronizado com a nuvem!');
        }
      } catch (err) {
        console.error('Falha de conexão com o Supabase ao salvar:', err);
      }
    }

    return product;
  }

  async _saveProductLocal(product) {
    if (this.useLocalStorage) {
      const prods = JSON.parse(localStorage.getItem('aura_products') || '[]');
      const index = prods.findIndex((p) => p.id === product.id);
      if (index >= 0) {
        prods[index] = product;
      } else {
        prods.push(product);
      }
      localStorage.setItem('aura_products', JSON.stringify(prods));
      return product;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.put(product);
      req.onsuccess = () => resolve(product);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteProduct(id) {
    // 1. Deleta localmente
    if (this.useLocalStorage) {
      let prods = JSON.parse(localStorage.getItem('aura_products') || '[]');
      prods = prods.filter((p) => p.id !== id);
      localStorage.setItem('aura_products', JSON.stringify(prods));
    } else {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction('products', 'readwrite');
        const store = tx.objectStore('products');
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    }

    // 2. Se a nuvem estiver ativa, deleta do Supabase
    if (this.isCloudEnabled()) {
      try {
        await this.supabase.from('products').delete().eq('id', id);
        console.log('✅ Produto removido da nuvem!');
      } catch (err) {
        console.error('Falha ao deletar do Supabase:', err);
      }
    }

    return true;
  }

  // ----------------------------------------------------
  // SINCRONIZAÇÃO COMPLETA: LOCAL -> NUVEM (SUPABASE)
  // ----------------------------------------------------
  async syncLocalToCloud() {
    if (!this.isCloudEnabled()) {
      throw new Error('Nuvem não configurada. Preencha a URL e a Chave do Supabase.');
    }

    const localProds = await this._getLocalProducts();
    if (localProds.length === 0) {
      return { count: 0 };
    }

    const { error } = await this.supabase
      .from('products')
      .upsert(localProds);

    if (error) {
      throw error;
    }

    return { count: localProds.length };
  }

  // ----------------------------------------------------
  // CATEGORIAS
  // ----------------------------------------------------
  async getAllCategories() {
    if (this.useLocalStorage) {
      const cats = JSON.parse(localStorage.getItem('aura_categories') || '[]');
      return cats.sort((a, b) => (a.order || 999) - (b.order || 999));
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('categories', 'readonly');
      const store = tx.objectStore('categories');
      const req = store.getAll();
      req.onsuccess = () => {
        let list = req.result || [];
        if (list.length === 0) {
          list = DEFAULT_CATEGORIES;
        }
        list.sort((a, b) => (a.order || 999) - (b.order || 999));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveCategory(name, order = 99) {
    const cleanName = name.trim();
    if (!cleanName) return;

    const catObj = {
      name: cleanName,
      order: Number(order) || 99,
      updatedAt: Date.now()
    };

    if (this.useLocalStorage) {
      const cats = JSON.parse(localStorage.getItem('aura_categories') || '[]');
      const idx = cats.findIndex((c) => c.name.toLowerCase() === cleanName.toLowerCase());
      if (idx >= 0) {
        cats[idx].order = catObj.order;
      } else {
        cats.push(catObj);
      }
      localStorage.setItem('aura_categories', JSON.stringify(cats));
      return catObj;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const req = store.put(catObj);
      req.onsuccess = () => resolve(catObj);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteCategory(name) {
    if (this.useLocalStorage) {
      let cats = JSON.parse(localStorage.getItem('aura_categories') || '[]');
      cats = cats.filter((c) => c.name.toLowerCase() !== name.toLowerCase());
      localStorage.setItem('aura_categories', JSON.stringify(cats));
      return true;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const req = store.delete(name);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // ----------------------------------------------------
  // CONFIGURAÇÕES DA LOJA
  // ----------------------------------------------------
  async getSettings() {
    if (this.useLocalStorage) {
      const s = localStorage.getItem('aura_settings');
      return s ? JSON.parse(s) : DEFAULT_SETTINGS;
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('store_settings');
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(Object.assign({}, DEFAULT_SETTINGS, req.result.data));
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  }

  async saveSettings(settings) {
    const current = await this.getSettings();
    const merged = Object.assign({}, current, settings);

    if (this.useLocalStorage) {
      localStorage.setItem('aura_settings', JSON.stringify(merged));
      return merged;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ key: 'store_settings', data: merged });
      req.onsuccess = () => resolve(merged);
      req.onerror = () => reject(req.error);
    });
  }

  // ----------------------------------------------------
  // BACKUP / EXPORTAÇÃO / IMPORTAÇÃO
  // ----------------------------------------------------
  async exportFullCatalogJSON() {
    const [products, categories, settings] = await Promise.all([
      this.getAllProducts(),
      this.getAllCategories(),
      this.getSettings()
    ]);

    const backupData = {
      version: 1,
      appName: 'Aura Boutique',
      exportedAt: new Date().toISOString(),
      settings,
      categories,
      products
    };

    return JSON.stringify(backupData, null, 2);
  }

  async importCatalogJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Formato de arquivo inválido: ausência da lista de produtos.');
      }

      if (data.settings) {
        await this.saveSettings(data.settings);
      }

      if (data.categories && Array.isArray(data.categories)) {
        for (const cat of data.categories) {
          await this.saveCategory(cat.name, cat.order || 99);
        }
      }

      for (const prod of data.products) {
        await this.saveProduct(prod);
      }

      return { success: true, count: data.products.length };
    } catch (err) {
      console.error('Falha ao importar JSON:', err);
      return { success: false, error: err.message };
    }
  }

  async resetToDemo() {
    if (this.useLocalStorage) {
      localStorage.clear();
      this._initLocalStorage();
      return true;
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction(['products', 'categories', 'settings'], 'readwrite');
      tx.objectStore('products').clear();
      tx.objectStore('categories').clear();
      tx.objectStore('settings').clear();

      tx.oncomplete = async () => {
        await this.seedInitialData();
        resolve(true);
      };
    });
  }

  // Compressão de fotos do celular para carregar instantâneo
  static compressImageFile(file, maxWidth = 1000, maxHeight = 1333, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Falha ao ler dados da imagem'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Falha ao abrir arquivo'));
      reader.readAsDataURL(file);
    });
  }
}

// Instância global para ser consumida pela aplicação
window.catalogDB = new CatalogDatabase();
