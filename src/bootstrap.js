const viewPartials = [
  '/src/views/chrome.html',
  '/src/views/login.html',
  '/src/views/register.html',
  '/src/views/reset-password.html',
  '/src/views/landing.html',
  '/src/views/landlord.html',
  '/src/views/tenant.html',
  '/src/views/modals.html'
];

async function fetchPartial(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}: ${response.status}`);
  }
  return response.text();
}

function loadClassicScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = path;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${path}`));
    document.body.appendChild(script);
  });
}

async function bootstrapDwello() {
  const root = document.getElementById('app-root');
  const html = await Promise.all(viewPartials.map(fetchPartial));
  root.innerHTML = html.join('\n');
  await loadClassicScript('/src/auth.js');
  await loadClassicScript('/src/app.js');
}

bootstrapDwello().catch(error => {
  console.error('Dwello failed to start:', error);
  const root = document.getElementById('app-root');
  if (root) {
    root.innerHTML = `
      <main style="min-height:100vh;display:grid;place-items:center;padding:32px;font-family:'DM Sans',sans-serif;">
        <section style="max-width:560px;text-align:center;background:#fff;border:1px solid rgba(183,228,199,0.5);border-radius:20px;padding:32px;box-shadow:0 12px 36px rgba(27,67,50,0.08);">
          <h1 style="color:#1B4332;margin:0 0 12px;font-family:'Playfair Display',serif;">Dwello could not load</h1>
          <p style="color:rgba(26,36,32,0.68);margin:0;">Refresh the page or restart the app with <code>npm start</code>.</p>
        </section>
      </main>
    `;
  }
});
