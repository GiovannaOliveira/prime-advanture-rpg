'use strict';
(async () => {
  try {
    Prime.game = new Prime.Game();
    await Prime.game.init();
  } catch (error) {
    console.error('Prime Adveture could not start:', error);
    const loading = document.getElementById('loading');
    loading.hidden = false;
    loading.innerHTML = '<span class="loading-star">✦</span><h1>Your island needs a little help.</h1><p>Please reload the page. Keep the assets and src folders next to index.html.</p><button class="primary" onclick="location.reload()">Try again</button>';
  }
})();
