const CACHE_NAME = 'meugado-V17-final'; // Mudei a versão para forçar atualização no navegador

// Apenas arquivos LOCAIS que garantimos que existem na pasta
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './Verde.jpg',
  './Branco-removebg-preview.png',
  './planos.html',
  './verificacao.html'
];

// 1. Instalação: Cache apenas dos arquivos essenciais locais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ [Service Worker] Instalando e cacheando arquivos locais...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Força o SW a ativar imediatamente
});

// 2. Ativação: Limpa caches antigos para não acumular lixo
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🧹 [Service Worker] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Controla a página imediatamente
});

// 3. Interceptação (Fetch): Estratégia "Cache, falling back to Network" + Cache Dinâmico
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET (ex: post para firebase) ou extensões do Chrome
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // A) Se estiver no cache, retorna o cache (velocidade máxima)
      if (cachedResponse) {
        return cachedResponse;
      }

      // B) Se não estiver, busca na rede
      return fetch(event.request).then((networkResponse) => {
        // Verifica se a resposta é válida
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        // C) Se baixou com sucesso da rede, salva uma CÓPIA no cache para a próxima vez
        // Isso vai salvar automaticamente o Chart.js, FontAwesome e Firebase na primeira visita
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Se estiver offline e não tiver no cache, podemos mostrar uma página de erro (opcional)
        // Por enquanto, apenas retorna nada.
        console.log('⚠️ [Service Worker] Falha na rede e sem cache para:', event.request.url);
      });
    })
  );
});
