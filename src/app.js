// ═══════════════════════════════
// PROPERTY DATA SERVICE (Zillow Mock)
// ═══════════════════════════════
const PropertyDataService = {
  _provider: 'mock',

  async lookup(address, city, state, zip) {
    switch (this._provider) {
      case 'mock': return this._mockLookup(address, city, state, zip);
      case 'zillow': return this._zillowLookup(address, city, state, zip);
      default: return this._mockLookup(address, city, state, zip);
    }
  },

  setProvider(provider) { this._provider = provider; },

  async _mockLookup(address, city, state, zip) {
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));

    const hash = this._hashString(address + city + state + zip);
    const stateMultipliers = {
      CA: 1.8, NY: 1.7, TX: 1.0, FL: 1.1, CO: 1.3,
      WA: 1.4, MA: 1.5, IL: 1.0, TN: 0.9, NC: 0.95
    };
    const mult = stateMultipliers[state.toUpperCase()] || 1.0;
    const sqft = 1200 + (hash % 2000);
    const pricePerSqft = 150 + (hash % 350);
    const estimatedValue = Math.round(sqft * pricePerSqft * mult);
    const estimatedRent = Math.round(estimatedValue * 0.005);
    const addrSlug = encodeURIComponent(address.split(' ').slice(0, 2).join('+'));
    const photoUrl = `https://placehold.co/800x500/2D6A4F/B7E4C7?text=${addrSlug}`;

    return { estimatedValue, estimatedRent, squareFeet: sqft, photoUrl, source: 'mock' };
  },

  async _zillowLookup() {
    throw new Error('Zillow API not configured. Use mock provider.');
  },

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
};

let autoFilledFields = new Set();
let currentPhotoMode = 'upload';

async function lookupPropertyData() {
  const address = document.getElementById('ap-address').value.trim();
  const city = document.getElementById('ap-city').value.trim();
  const state = document.getElementById('ap-state').value.trim().toUpperCase();
  const zip = document.getElementById('ap-zip').value.trim();

  if (!address) { showLookupStatus('Enter a street address first.', 'error'); return; }
  if (!/^\d{5}$/.test(zip)) { showLookupStatus('Enter a valid 5-digit zip code.', 'error'); return; }

  setLookupLoading(true);

  try {
    const data = await PropertyDataService.lookup(address, city, state, zip);
    if (!data) { showLookupStatus('No property data found.', 'warning'); return; }
    populatePropertyData(data);
    showLookupStatus('Property data found! You can edit any values.', 'success');
  } catch (error) {
    console.error('Lookup failed:', error);
    showLookupStatus('Lookup failed. Enter values manually.', 'error');
  } finally {
    setLookupLoading(false);
  }
}

function populatePropertyData(data) {
  autoFilledFields.clear();

  if (data.squareFeet) {
    setFieldValue('ap-sqft', data.squareFeet.toLocaleString('en-US'));
    markAsAutoFilled('ap-sqft');
  }
  if (data.estimatedValue) {
    setFieldValue('ap-est-value', data.estimatedValue.toLocaleString('en-US'));
    markAsAutoFilled('ap-est-value');
  }
  if (data.estimatedRent) {
    setFieldValue('ap-rent', data.estimatedRent.toLocaleString('en-US'));
    markAsAutoFilled('ap-rent');
  }
  if (data.photoUrl) {
    setPhotoMode('url');
    document.getElementById('ap-photo-url').value = data.photoUrl;
    previewPropertyPhotoUrl(data.photoUrl);
    markAsAutoFilled('ap-photo-url');
    document.getElementById('ap-photo-autofill-badge').style.display = 'block';
  }
}

function setFieldValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.value = value;
    el.classList.remove('field-invalid');
    const err = document.getElementById(id + '-err');
    if (err) { err.textContent = ''; err.style.display = 'none'; }
  }
}

function markAsAutoFilled(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('field-autofilled'); autoFilledFields.add(id); }
}

function clearAutoFillIndicator(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('field-autofilled'); autoFilledFields.delete(id); }
}

function setLookupLoading(isLoading) {
  const btn = document.getElementById('ap-lookup-btn');
  const txt = document.getElementById('ap-lookup-btn-text');
  if (!btn || !txt) return;

  if (isLoading) {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'wait';
    txt.innerHTML = '<span class="lookup-spinner"></span> Looking up...';
  } else {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    txt.textContent = 'Auto-fill from Address';
  }
}

function showLookupStatus(msg, type) {
  const el = document.getElementById('ap-lookup-status');
  if (!el) return;
  const colors = {
    success: { bg: 'rgba(183,228,199,0.4)', color: 'var(--forest)' },
    error: { bg: 'rgba(217,83,79,0.12)', color: '#D9534F' },
    warning: { bg: 'rgba(212,168,83,0.25)', color: '#8B6914' }
  };
  const styles = colors[type] || colors.success;
  el.style.display = 'block';
  el.style.background = styles.bg;
  el.style.color = styles.color;
  el.textContent = msg;
  if (type === 'success') setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function setPhotoMode(mode) {
  currentPhotoMode = mode;
  const uploadTab = document.getElementById('ap-photo-upload-tab');
  const urlTab = document.getElementById('ap-photo-url-tab');
  const uploadMode = document.getElementById('ap-photo-upload-mode');
  const urlMode = document.getElementById('ap-photo-url-mode');
  if (!uploadTab || !urlTab || !uploadMode || !urlMode) return;

  if (mode === 'upload') {
    uploadTab.classList.add('active');
    urlTab.classList.remove('active');
    uploadMode.style.display = 'block';
    urlMode.style.display = 'none';
  } else {
    urlTab.classList.add('active');
    uploadTab.classList.remove('active');
    uploadMode.style.display = 'none';
    urlMode.style.display = 'block';
  }
}

function previewPropertyPhotoUrl(url) {
  if (!url) return;
  const img = document.getElementById('ap-photo-img');
  const preview = document.getElementById('ap-photo-preview');
  if (!img || !preview) return;
  img.onload = () => { preview.style.display = 'block'; };
  img.onerror = () => { preview.style.display = 'none'; showLookupStatus('Could not load image.', 'warning'); };
  img.src = url;
}

function clearPhotoPreview() {
  document.getElementById('ap-photo-preview').style.display = 'none';
  document.getElementById('ap-photo-img').src = '';
  document.getElementById('ap-photo').value = '';
  document.getElementById('ap-photo-url').value = '';
  document.getElementById('ap-photo-autofill-badge').style.display = 'none';
  clearAutoFillIndicator('ap-photo-url');
}

function getPhotoSource() {
  const fileInput = document.getElementById('ap-photo');
  const urlInput = document.getElementById('ap-photo-url');
  if (currentPhotoMode === 'upload' && fileInput.files && fileInput.files[0]) {
    return { type: 'file', value: document.getElementById('ap-photo-img').src };
  }
  if (currentPhotoMode === 'url' && urlInput.value.trim()) {
    return { type: 'url', value: urlInput.value.trim() };
  }
  return { type: 'none', value: null };
}

function formatNumberInput(input) {
  const raw = input.value.replace(/[^0-9]/g, '');
  if (!raw) return;
  const num = parseInt(raw, 10);
  if (!Number.isNaN(num)) input.value = num.toLocaleString('en-US');
}

// ═══════════════════════════════
// PROPERTY DATA
// ═══════════════════════════════
const LOCAL_PROPERTIES_STORAGE_KEY = 'dwello.properties.v1';
const properties = [];

const demoApiProperties = [
  {
    id: 3,
    address: '331 Lakeview Drive',
    city: 'Nashville',
    state: 'TN',
    zip: '37201',
    tenantName: 'Priya Nair',
    tenantEmail: 'priya.nair@email.com',
    rent: 1950,
    estimatedValue: 395000,
    squareFeet: 1650,
    photoUrl: 'https://placehold.co/400x200/40916C/F8F6F1?text=331+Lakeview+Dr',
    leaseStart: '2023-06-01',
    leaseEnd: '2024-05-31'
  },
  {
    id: 2,
    address: '78 Birchwood Ave',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    tenantName: 'James Okafor',
    tenantEmail: 'james.okafor@email.com',
    rent: 2800,
    estimatedValue: 620000,
    squareFeet: 2100,
    photoUrl: 'https://placehold.co/400x200/D4A853/1A2420?text=78+Birchwood+Ave',
    leaseStart: '2024-03-01',
    leaseEnd: '2025-02-28'
  },
  {
    id: 1,
    address: '142 Maple Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    tenantName: 'Sarah Mitchell',
    tenantEmail: 'sarah.mitchell@email.com',
    rent: 2200,
    estimatedValue: 485000,
    squareFeet: 1850,
    photoUrl: 'https://placehold.co/400x200/2D6A4F/B7E4C7?text=142+Maple+St',
    leaseStart: '2024-01-01',
    leaseEnd: '2024-12-31'
  }
];

let propertyPersistenceMode = 'api';

const propertyAvatarStyles = [
  { avatarGrad: 'linear-gradient(135deg,#B7E4C7,#40916C)', avatarColor: '#1B4332' },
  { avatarGrad: 'linear-gradient(135deg,rgba(212,168,83,0.3),rgba(212,168,83,0.7))', avatarColor: '#8B6914' },
  { avatarGrad: 'linear-gradient(135deg,rgba(27,67,50,0.15),rgba(27,67,50,0.35))', avatarColor: '#1B4332' },
  { avatarGrad: 'linear-gradient(135deg,var(--mint),var(--sage))', avatarColor: '#1B4332' }
];

function initialsFromName(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return '$' + number.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function mapApiPropertyToCard(property, index) {
  const avatar = propertyAvatarStyles[index % propertyAvatarStyles.length];
  const tenant = property.tenantName || 'Unassigned';
  return {
    id: property.id,
    address: property.address,
    city: property.city + ', ' + property.state,
    cityName: property.city,
    state: property.state,
    zip: property.zip,
    tenantName: property.tenantName,
    tenantEmail: property.tenantEmail,
    rentAmount: property.rent,
    estimatedValue: property.estimatedValue,
    squareFeet: property.squareFeet,
    photoUrl: property.photoUrl,
    leaseStart: property.leaseStart,
    leaseEnd: property.leaseEnd,
    tenant,
    initials: initialsFromName(tenant),
    value: formatCurrency(property.estimatedValue),
    rent: formatCurrency(property.rent) + '/mo',
    sqft: property.squareFeet ? property.squareFeet.toLocaleString('en-US') + ' sq ft' : null,
    img: property.photoUrl || `https://placehold.co/400x200/2D6A4F/B7E4C7?text=${encodeURIComponent(property.address)}`,
    avatarGrad: avatar.avatarGrad,
    avatarColor: avatar.avatarColor
  };
}

function createApiUnavailableError(message) {
  const error = new Error(message);
  error.apiUnavailable = true;
  return error;
}

async function requestJson(endpoint, options = {}) {
  const authHeaders = window.dwelloAuth?.getAuthHeader() || {};
  options.headers = { ...authHeaders, ...(options.headers || {}) };

  let response;
  try {
    response = await fetch(endpoint, options);
  } catch (error) {
    throw createApiUnavailableError(error.message || 'API request failed');
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const result = isJson ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 404 || response.status === 405 || !isJson) {
      throw createApiUnavailableError(`API unavailable: ${response.status}`);
    }
    throw new Error(result?.error || `Request failed with ${response.status}`);
  }

  if (!isJson) {
    throw createApiUnavailableError('API did not return JSON');
  }

  return result;
}

function readLocalProperties() {
  try {
    const saved = window.localStorage.getItem(LOCAL_PROPERTIES_STORAGE_KEY);
    if (!saved) return demoApiProperties.map(property => ({ ...property }));
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : demoApiProperties.map(property => ({ ...property }));
  } catch (error) {
    console.warn('Could not read local properties:', error);
    return demoApiProperties.map(property => ({ ...property }));
  }
}

function writeLocalProperties(apiProperties) {
  try {
    window.localStorage.setItem(LOCAL_PROPERTIES_STORAGE_KEY, JSON.stringify(apiProperties));
  } catch (error) {
    console.warn('Could not save local properties:', error);
  }
}

function saveLocalProperty(payload, id = null) {
  const localProperties = readLocalProperties();
  if (id) {
    const index = localProperties.findIndex(property => Number(property.id) === Number(id));
    if (index === -1) throw new Error('Property not found');
    const updated = { ...localProperties[index], ...payload, id: Number(id), updatedAt: new Date().toISOString() };
    localProperties[index] = updated;
    writeLocalProperties(localProperties);
    return updated;
  }

  const nextId = localProperties.reduce((max, property) => Math.max(max, Number(property.id) || 0), 0) + 1;
  const created = {
    id: nextId,
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  localProperties.unshift(created);
  writeLocalProperties(localProperties);
  return created;
}

function deleteLocalProperty(id) {
  const localProperties = readLocalProperties();
  const nextProperties = localProperties.filter(property => Number(property.id) !== Number(id));
  if (nextProperties.length === localProperties.length) throw new Error('Property not found');
  writeLocalProperties(nextProperties);
}

function syncTenantsFromProperties(apiProperties) {
  const gradients = [
    'linear-gradient(135deg,#B7E4C7,#40916C)',
    'linear-gradient(135deg,rgba(212,168,83,0.3),rgba(212,168,83,0.7))',
    'linear-gradient(135deg,rgba(27,67,50,0.15),rgba(27,67,50,0.35))',
    'linear-gradient(135deg,var(--mint),var(--sage))'
  ];
  const colors = ['#1B4332', '#8B6914', '#1B4332', '#1B4332'];

  threads.length = 0;

  apiProperties.forEach((property, index) => {
    if (property.tenantName && property.tenantEmail) {
      const gradIndex = index % gradients.length;
      threads.push({
        name: property.tenantName,
        initials: initialsFromName(property.tenantName),
        email: property.tenantEmail,
        property: `${property.address}, ${property.city} ${property.state}`,
        avatarGrad: gradients[gradIndex],
        avatarColor: colors[gradIndex],
        messages: []
      });
    }
  });
}

function renderTenantTable() {
  const tbody = document.getElementById('tenant-table-body');
  if (!tbody) return;

  tbody.innerHTML = threads.map((tenant, index) => {
    const property = properties.find(p => p.tenantEmail === tenant.email);
    const leaseStartDisplay = property?.leaseStart ? formatDate(property.leaseStart) : '-';
    const leaseEndDisplay = property?.leaseEnd ? formatDate(property.leaseEnd) : '-';

    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:50%;background:${tenant.avatarGrad};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:${tenant.avatarColor};">${tenant.initials}</div>
            <span style="font-weight:500;">${tenant.name}</span>
          </div>
        </td>
        <td style="color:rgba(26,36,32,0.65);">${tenant.property}</td>
        <td><span class="chip chip-mint">${leaseStartDisplay}</span></td>
        <td><span class="chip chip-gold">${leaseEndDisplay}</span></td>
        <td><button class="btn-primary btn-sm" onclick="openEmailModal(${index})">Contact</button></td>
      </tr>
    `;
  }).join('');
}

function renderPropertiesFromApi(apiProperties) {
  properties.splice(0, properties.length, ...apiProperties.map(mapApiPropertyToCard));
  syncTenantsFromProperties(apiProperties);
  renderPropertyCards('#dashboard-cards-grid', true);
  renderPropertyCards('#properties-cards-grid', false);
  renderTenantTable();
  updatePortfolioStats();
}

async function loadPropertiesFromApi() {
  try {
    const apiProperties = await requestJson('/api/properties');
    propertyPersistenceMode = 'api';
    renderPropertiesFromApi(apiProperties);
  } catch (error) {
    if (!error.apiUnavailable) {
      console.error('Property load failed:', error);
      showToast('Could not load saved properties.', '#D9534F');
      return;
    }

    propertyPersistenceMode = 'local';
    console.info('Properties API unavailable; using browser storage fallback.');
    renderPropertiesFromApi(readLocalProperties());
  }
}

function updatePortfolioStats() {
  const propStat = document.getElementById('stat-properties');
  const tenStat  = document.getElementById('stat-tenants');
  if (propStat) propStat.textContent = properties.length;
  if (tenStat)  tenStat.textContent  = properties.length;
}

const threads = [
  {
    name: 'Sarah Mitchell',
    initials: 'SM',
    email: 'sarah.mitchell@email.com',
    property: '142 Maple Street, Austin TX',
    avatarGrad: 'linear-gradient(135deg,#B7E4C7,#40916C)',
    avatarColor: '#1B4332',
    messages: [
      { sent: false, text: 'Hi Michael, just wanted to check in about the heater — it\'s making a noise.' },
      { sent: true, text: 'Thanks for letting me know Sarah! I\'ll schedule a maintenance visit this week.' },
      { sent: false, text: 'That would be great, thank you!' },
    ]
  },
  {
    name: 'James Okafor',
    initials: 'JO',
    email: 'james.okafor@email.com',
    property: '78 Birchwood Ave, Denver CO',
    avatarGrad: 'linear-gradient(135deg,rgba(212,168,83,0.3),rgba(212,168,83,0.7))',
    avatarColor: '#8B6914',
    messages: [
      { sent: false, text: 'Hi, I wanted to confirm the lease renewal timeline.' },
      { sent: true, text: 'Hi James! I\'ll send you a renewal agreement by end of November.' },
      { sent: false, text: 'Thanks for the quick response!' },
    ]
  },
  {
    name: 'Priya Nair',
    initials: 'PN',
    email: 'priya.nair@email.com',
    property: '331 Lakeview Drive, Nashville TN',
    avatarGrad: 'linear-gradient(135deg,rgba(27,67,50,0.15),rgba(27,67,50,0.35))',
    avatarColor: '#1B4332',
    messages: [
      { sent: false, text: 'Hello! The maintenance team just left — the faucet is all fixed.' },
      { sent: true, text: 'Wonderful, so glad to hear that Priya! Let me know if anything else comes up.' },
      { sent: false, text: 'The maintenance team was great, will do!' },
    ]
  }
];

let activeThread = 0;
let editingPropertyId = null;

// ═══════════════════════════════
// VIEW SWITCHING
// ═══════════════════════════════
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'landlord') {
    renderPropertyCards('#dashboard-cards-grid', true);
    renderPropertyCards('#properties-cards-grid', false);
    renderThread(activeThread);
  }
}

// ═══════════════════════════════
// LANDLORD SECTION NAV
// ═══════════════════════════════
const landlordSections = ['dashboard', 'properties', 'tenants', 'messaging'];
function landlordSection(name) {
  landlordSections.forEach(s => {
    const el = document.getElementById('ls-' + s);
    const ln = document.getElementById('ln-' + s);
    if (el) el.style.display = s === name ? '' : 'none';
    if (ln) {
      ln.classList.toggle('active-nav', s === name);
    }
  });
  const titles = { dashboard: 'Dashboard', properties: 'Properties', tenants: 'Tenants', messaging: 'Messages' };
  document.getElementById('landlord-page-title').textContent = titles[name] || '';
}

// ═══════════════════════════════
// TENANT SECTION NAV
// ═══════════════════════════════
const tenantSections = ['home', 'messages', 'maintenance'];
function tenantSection(name) {
  tenantSections.forEach(s => {
    const el = document.getElementById('ts-' + s);
    const tn = document.getElementById('tn-' + s);
    if (el) el.style.display = s === name ? '' : 'none';
    if (tn) tn.classList.toggle('active-nav', s === name);
  });
  const titles = { home: 'My Home', messages: 'Messages', maintenance: 'Maintenance' };
  document.getElementById('tenant-page-title').textContent = titles[name] || '';
}

// ═══════════════════════════════
// PROPERTY CARDS
// ═══════════════════════════════
function renderPropertyCards(selector, compact) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = properties.map((p, i) => `
    <div class="property-card">
      <div class="property-img-wrap">
        <img src="${p.img}" alt="${p.address}" loading="lazy" />
        <div class="property-img-gradient"></div>
        <div class="property-img-badge">${p.rent}</div>
      </div>
      <div style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <div style="font-size:16px;font-weight:600;color:var(--slate);font-family:'Playfair Display',serif;letter-spacing:-0.02em;">${p.address}</div>
            <div style="font-size:13px;color:rgba(26,36,32,0.55);margin-top:2px;">${p.city}</div>
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--sage);text-align:right;font-family:'DM Sans',sans-serif;">${p.value}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <div style="width:28px;height:28px;border-radius:50%;background:${p.avatarGrad || 'linear-gradient(135deg,var(--mint),var(--sage))'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${p.avatarColor || 'var(--forest)'};flex-shrink:0;">${p.initials}</div>
          <span style="font-size:13px;color:rgba(26,36,32,0.65);">${p.tenant}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button class="btn-secondary btn-sm" style="justify-content:center;" onclick="openEditPropertyModal(${p.id})">
            Edit
          </button>
          <button class="btn-primary btn-sm" style="justify-content:center;background:#B3261E;" onclick="deleteProperty(${p.id})">
            Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}


// ═══════════════════════════════
// MESSAGING
// ═══════════════════════════════
function setActiveThread(idx) {
  activeThread = idx;
  const t = threads[idx];
  // Update thread list selection
  threads.forEach((_, i) => {
    const el = document.getElementById('lt-' + i);
    if (el) el.classList.toggle('selected', i === idx);
  });
  // Update header
  document.getElementById('msg-avatar').style.background = t.avatarGrad;
  document.getElementById('msg-avatar').style.color = t.avatarColor;
  document.getElementById('msg-avatar').textContent = t.initials;
  document.getElementById('msg-name').textContent = t.name;
  document.getElementById('msg-property').textContent = t.property;
  renderThread(idx);
}

function renderThread(idx) {
  const t = threads[idx];
  const container = document.getElementById('landlord-msg-thread');
  if (!container) return;
  container.innerHTML = `
    <div style="text-align:center;margin:8px 0;">
      <span style="font-size:12px;color:rgba(26,36,32,0.4);background:var(--offwhite);padding:4px 12px;border-radius:100px;">Today</span>
    </div>
    ${t.messages.map(m => `
      <div style="display:flex;justify-content:${m.sent ? 'flex-end' : 'flex-start'};">
        <div class="msg-bubble ${m.sent ? 'sent' : 'received'}">${m.text}</div>
      </div>
    `).join('')}
  `;
  container.scrollTop = container.scrollHeight;
}

function sendLandlordMessage() {
  const input = document.getElementById('landlord-compose');
  const text = input.value.trim();
  if (!text) return;
  threads[activeThread].messages.push({ sent: true, text });
  input.value = '';
  renderThread(activeThread);
  showToast('Message sent');
}

function sendTenantMessage() {
  const input = document.getElementById('tenant-compose');
  const text = input.value.trim();
  if (!text) return;
  const thread = document.getElementById('tenant-msg-thread');
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;justify-content:flex-end;';
  div.innerHTML = `<div class="msg-bubble sent">${text}</div>`;
  thread.appendChild(div);
  thread.scrollTop = thread.scrollHeight;
  input.value = '';
  showToast('Message sent');
}

// ═══════════════════════════════
// MAINTENANCE MODAL
// ═══════════════════════════════
function openMaintenanceModal() {
  document.getElementById('maintenance-modal').classList.add('open');
}
function closeMaintenanceModal(e) {
  if (!e || e.target === document.getElementById('maintenance-modal')) {
    document.getElementById('maintenance-modal').classList.remove('open');
  }
}
function submitMaintenance(e) {
  e.preventDefault();
  const label = document.getElementById('maint-label').value;
  document.getElementById('maint-label').value = '';
  document.getElementById('maint-desc').value = '';
  document.getElementById('maintenance-modal').classList.remove('open');
  showToast('Maintenance request submitted');
}

// ═══════════════════════════════
// EMAIL TENANT MODAL
// ═══════════════════════════════
let currentEmailTenantIndex = 0;

function openEmailModal(tenantIndex) {
  currentEmailTenantIndex = tenantIndex;
  const tenant = threads[tenantIndex];

  // Populate recipient info
  document.getElementById('email-recipient-avatar').style.background = tenant.avatarGrad;
  document.getElementById('email-recipient-avatar').style.color = tenant.avatarColor;
  document.getElementById('email-recipient-avatar').textContent = tenant.initials;
  document.getElementById('email-recipient-name').textContent = tenant.name;
  document.getElementById('email-recipient-email').textContent = tenant.email;
  document.getElementById('email-recipient-property').textContent = tenant.property;

  // Clear form
  document.getElementById('email-subject').value = '';
  document.getElementById('email-message').value = '';
  document.getElementById('email-sending-status').style.display = 'none';
  const sendBtn = document.getElementById('email-send-btn');
  sendBtn.disabled = false;
  sendBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg> Send Email';

  // Open modal
  document.getElementById('email-modal').classList.add('open');
}

function closeEmailModal(e) {
  if (!e || e.target === document.getElementById('email-modal')) {
    document.getElementById('email-modal').classList.remove('open');
  }
}

async function parseApiResponse(response) {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned an invalid response (${response.status}). Make sure Dwello is running with npm start.`);
  }
}

async function sendTenantEmail(e) {
  e.preventDefault();

  const tenant = threads[currentEmailTenantIndex];
  const subject = document.getElementById('email-subject').value.trim();
  const message = document.getElementById('email-message').value.trim();
  const statusEl = document.getElementById('email-sending-status');
  const sendBtn = document.getElementById('email-send-btn');

  // Show sending state
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> Sending...</span>';
  statusEl.style.display = 'block';
  statusEl.style.background = 'rgba(212,168,83,0.15)';
  statusEl.style.color = '#8B6914';
  statusEl.textContent = 'Sending email to ' + tenant.name + '...';

  try {
    await requestJson('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: tenant.email,
        subject: subject,
        message: message,
        from_name: 'Dwello Property Management',
        tenant_name: tenant.name,
        property: tenant.property
      })
    });

    // Success state
    statusEl.style.background = 'rgba(183,228,199,0.3)';
    statusEl.style.color = 'var(--forest)';
    statusEl.textContent = '✓ Email sent to ' + tenant.name;

    // Reset button
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg> Send Email';

    // Close modal and show toast
    setTimeout(() => {
      closeEmailModal();
      showToast('Email sent to ' + tenant.name);
    }, 1500);

  } catch (error) {
    console.warn('Email send failed:', error.message);

    // Error state
    statusEl.style.background = 'rgba(220,53,69,0.1)';
    statusEl.style.color = '#dc3545';
    statusEl.textContent = '✗ ' + error.message;

    // Reset button
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg> Send Email';
  }
}

// Add spin animation for loading state
const styleSheet = document.createElement('style');
styleSheet.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
document.head.appendChild(styleSheet);

// ═══════════════════════════════
// TOAST
// ═══════════════════════════════
let toastTimeout;
function showToast(msg, bg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.style.background = bg || 'var(--forest)';
  t.style.opacity = '1';
  t.style.transform = 'translateY(0)';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
  }, 3000);
}

// ═══════════════════════════════
// KEYBOARD: close modal on Escape
// ═══════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('maintenance-modal').classList.remove('open');
    document.getElementById('email-modal').classList.remove('open');
    closeAddPropertyModal();
  }
});

// ═══════════════════════════════
// ADD PROPERTY MODAL
// ═══════════════════════════════
function openAddPropertyModal() {
  editingPropertyId = null;
  setPropertyModalMode('add');
  document.getElementById('add-property-form').reset();
  document.getElementById('add-property-modal').classList.add('open');
}

function closeAddPropertyModal(e) {
  if (e && e.target !== document.getElementById('add-property-modal')) return;
  document.getElementById('add-property-modal').classList.remove('open');
  document.getElementById('add-property-form').reset();
  document.getElementById('ap-photo-preview').style.display = 'none';
  document.getElementById('ap-lookup-status').style.display = 'none';
  document.getElementById('ap-photo-autofill-badge').style.display = 'none';
  clearAddPropertyErrors();
  editingPropertyId = null;
  setPropertyModalMode('add');

  // Reset auto-fill state
  autoFilledFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('field-autofilled');
  });
  autoFilledFields.clear();

  // Reset photo mode to upload
  setPhotoMode('upload');
}

function isEditingProperty() {
  return editingPropertyId !== null;
}

function setPropertyModalMode(mode) {
  const isEdit = mode === 'edit';
  document.getElementById('add-property-title').textContent = isEdit ? 'Edit Property' : 'Add a Property';
  document.getElementById('add-property-description').textContent = isEdit
    ? 'Update this property and save your changes.'
    : 'Fill in the details below to add a new property to your portfolio.';
  document.getElementById('add-property-submit-text').textContent = isEdit ? 'Save Changes' : 'Save Property';
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

function openEditPropertyModal(id) {
  const property = properties.find(item => item.id === id);
  if (!property) {
    showToast('Property not found.', '#D9534F');
    return;
  }

  editingPropertyId = id;
  setPropertyModalMode('edit');
  clearAddPropertyErrors();
  document.getElementById('add-property-form').reset();

  setInputValue('ap-address', property.address);
  setInputValue('ap-city', property.cityName);
  setInputValue('ap-state', property.state);
  setInputValue('ap-zip', property.zip);
  setInputValue('ap-sqft', property.squareFeet ? property.squareFeet.toLocaleString('en-US') : '');
  setInputValue('ap-est-value', property.estimatedValue ? property.estimatedValue.toLocaleString('en-US') : '');
  setInputValue('ap-rent', property.rentAmount ? property.rentAmount.toLocaleString('en-US') : '');
  setInputValue('ap-tenant-name', property.tenantName || '');
  setInputValue('ap-tenant-email', property.tenantEmail || '');
  setInputValue('ap-lease-start', property.leaseStart || '');
  setInputValue('ap-lease-end', property.leaseEnd || '');

  if (property.photoUrl) {
    setPhotoMode('url');
    setInputValue('ap-photo-url', property.photoUrl);
    previewPropertyPhotoUrl(property.photoUrl);
  } else {
    setPhotoMode('upload');
    clearPhotoPreview();
  }

  document.getElementById('add-property-modal').classList.add('open');
}

async function deleteProperty(id) {
  const property = properties.find(item => item.id === id);
  if (!property) return;
  if (!confirm(`Delete ${property.address}? This cannot be undone.`)) return;

  try {
    if (propertyPersistenceMode === 'local') {
      deleteLocalProperty(id);
    } else {
      await requestJson(`/api/properties/${id}`, { method: 'DELETE' });
    }

    const index = properties.findIndex(item => item.id === id);
    if (index !== -1) {
      const deletedProperty = properties[index];
      properties.splice(index, 1);

      // Remove tenant from threads
      const threadIndex = threads.findIndex(t => t.email === deletedProperty.tenantEmail);
      if (threadIndex !== -1) {
        threads.splice(threadIndex, 1);
        if (activeThread >= threads.length) activeThread = Math.max(0, threads.length - 1);
      }
    }

    renderPropertyCards('#dashboard-cards-grid', true);
    renderPropertyCards('#properties-cards-grid', false);
    renderTenantTable();
    updatePortfolioStats();
    showToast('Property deleted.', '#40916C');
  } catch (error) {
    if (error.apiUnavailable) {
      try {
        propertyPersistenceMode = 'local';
        deleteLocalProperty(id);
        const index = properties.findIndex(item => item.id === id);
        if (index !== -1) {
          const deletedProperty = properties[index];
          properties.splice(index, 1);

          // Remove tenant from threads
          const threadIndex = threads.findIndex(t => t.email === deletedProperty.tenantEmail);
          if (threadIndex !== -1) {
            threads.splice(threadIndex, 1);
            if (activeThread >= threads.length) activeThread = Math.max(0, threads.length - 1);
          }
        }

        renderPropertyCards('#dashboard-cards-grid', true);
        renderPropertyCards('#properties-cards-grid', false);
        renderTenantTable();
        updatePortfolioStats();
        showToast('Property deleted from this browser.', '#40916C');
        return;
      } catch (localError) {
        console.error('Local property delete failed:', localError);
      }
    }

    console.error('Property delete failed:', error);
    showToast('Could not delete property. Try again.', '#D9534F');
  }
}

const AP_FIELDS = ['ap-address','ap-city','ap-state','ap-zip','ap-sqft','ap-est-value','ap-rent','ap-tenant-name','ap-tenant-email','ap-lease-start','ap-lease-end'];

function clearAddPropertyErrors() {
  AP_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    if (el) el.classList.remove('field-invalid');
    if (err) { err.textContent = ''; err.style.display = 'none'; }
  });
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  const err = document.getElementById(id + '-err');
  if (el) el.classList.add('field-invalid');
  if (err) { err.textContent = msg; err.style.display = 'block'; }
}

function formatCurrencyInput(input) {
  const raw = input.value.replace(/[^0-9.]/g, '');
  if (!raw) return;
  const num = parseFloat(raw);
  if (!isNaN(num)) {
    input.value = num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
}

function previewPropertyPhoto(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('ap-photo-img').src = e.target.result;
      document.getElementById('ap-photo-preview').style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function submitAddProperty(e) {
  e.preventDefault();
  clearAddPropertyErrors();

  const address     = document.getElementById('ap-address').value.trim();
  const city        = document.getElementById('ap-city').value.trim();
  const state       = document.getElementById('ap-state').value.trim().toUpperCase();
  const zip         = document.getElementById('ap-zip').value.trim();
  const sqftRaw     = document.getElementById('ap-sqft').value.trim();
  const valueRaw    = document.getElementById('ap-est-value').value.trim();
  const rentRaw     = document.getElementById('ap-rent').value.trim();
  const tenantName  = document.getElementById('ap-tenant-name').value.trim();
  const tenantEmail = document.getElementById('ap-tenant-email').value.trim();
  const leaseStart  = document.getElementById('ap-lease-start').value;
  const leaseEnd    = document.getElementById('ap-lease-end').value;

  let valid = true;

  if (!address)                                       { showFieldError('ap-address', 'Street address is required.'); valid = false; }
  if (!city)                                          { showFieldError('ap-city', 'City is required.'); valid = false; }
  if (!state)                                         { showFieldError('ap-state', 'State is required.'); valid = false; }
  if (!/^\d{5}$/.test(zip))                          { showFieldError('ap-zip', 'Zip code must be exactly 5 digits.'); valid = false; }

  // Square feet is optional, but if provided must be valid
  const sqftNum = sqftRaw ? parseFloat(sqftRaw.replace(/,/g, '')) : null;
  if (sqftRaw && (isNaN(sqftNum) || sqftNum <= 0))   { showFieldError('ap-sqft', 'Enter a valid square footage.'); valid = false; }

  const valueNum = parseFloat(valueRaw.replace(/,/g, ''));
  if (!valueRaw || isNaN(valueNum) || valueNum <= 0) { showFieldError('ap-est-value', 'Enter a valid property value.'); valid = false; }

  const rentNum = parseFloat(rentRaw.replace(/,/g, ''));
  if (!rentRaw || isNaN(rentNum) || rentNum <= 0)    { showFieldError('ap-rent', 'Enter a valid monthly rent.'); valid = false; }

  if (!tenantName)                                    { showFieldError('ap-tenant-name', 'Tenant name is required.'); valid = false; }
  if (!tenantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantEmail)) { showFieldError('ap-tenant-email', 'Enter a valid email address.'); valid = false; }
  if (!isEditingProperty()) {
    if ((leaseStart && !leaseEnd) || (!leaseStart && leaseEnd)) {
      showFieldError('ap-lease-end', 'Enter both lease dates, or leave both blank.');
      valid = false;
    }
    if (leaseStart && leaseEnd && leaseEnd <= leaseStart) { showFieldError('ap-lease-end', 'Lease end must be after lease start.'); valid = false; }
  }

  if (!valid) return;

  // Build photo src - handle both upload and URL modes
  const photoSource = getPhotoSource();
  const slug = encodeURIComponent(address.split(' ').slice(0, 3).join('+'));
  let photoSrc;
  if (photoSource.type === 'file' || photoSource.type === 'url') {
    photoSrc = photoSource.value;
  } else {
    photoSrc = `https://placehold.co/400x200/2D6A4F/B7E4C7?text=${slug}`;
  }

  const propertyPayload = {
    address,
    city,
    state,
    zip,
    tenantName,
    tenantEmail,
    rent: rentNum,
    estimatedValue: valueNum,
    squareFeet: sqftNum,
    photoUrl: photoSrc,
    leaseStart: leaseStart || null,
    leaseEnd: leaseEnd || null
  };

  let savedProperty;
  let savedLocally = false;
  try {
    const isEdit = isEditingProperty();
    if (propertyPersistenceMode === 'local') {
      savedProperty = saveLocalProperty(propertyPayload, isEdit ? editingPropertyId : null);
      savedLocally = true;
    } else {
      const endpoint = isEdit ? `/api/properties/${editingPropertyId}` : '/api/properties';
      savedProperty = await requestJson(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyPayload)
      });
    }
  } catch (error) {
    if (error.apiUnavailable) {
      try {
        propertyPersistenceMode = 'local';
        savedProperty = saveLocalProperty(propertyPayload, isEditingProperty() ? editingPropertyId : null);
        savedLocally = true;
      } catch (localError) {
        console.error('Local property save failed:', localError);
        showToast('Could not save property in this browser.', '#D9534F');
        return;
      }
    } else {
      console.error('Property save failed:', error);
      showToast('Could not save property. Try again.', '#D9534F');
      return;
    }
  }

  const initials = initialsFromName(tenantName);

  if (isEditingProperty()) {
    const index = properties.findIndex(property => property.id === editingPropertyId);
    if (index !== -1) {
      const oldProperty = properties[index];
      properties[index] = mapApiPropertyToCard(savedProperty, index);

      // Update tenant in threads
      const threadIndex = threads.findIndex(t => t.email === oldProperty.tenantEmail);
      const gradients = [
        'linear-gradient(135deg,#B7E4C7,#40916C)',
        'linear-gradient(135deg,rgba(212,168,83,0.3),rgba(212,168,83,0.7))',
        'linear-gradient(135deg,rgba(27,67,50,0.15),rgba(27,67,50,0.35))',
        'linear-gradient(135deg,var(--mint),var(--sage))'
      ];
      const colors = ['#1B4332', '#8B6914', '#1B4332', '#1B4332'];
      const gradIndex = threadIndex >= 0 ? threadIndex % gradients.length : threads.length % gradients.length;

      const updatedThread = {
        name: tenantName,
        initials: initials,
        email: tenantEmail,
        property: address + ', ' + city + ' ' + state,
        avatarGrad: gradients[gradIndex],
        avatarColor: colors[gradIndex],
        messages: threadIndex >= 0 ? threads[threadIndex].messages : []
      };

      if (threadIndex >= 0) {
        threads[threadIndex] = updatedThread;
      } else {
        threads.push(updatedThread);
      }
    }

    renderPropertyCards('#dashboard-cards-grid', true);
    renderPropertyCards('#properties-cards-grid', false);
    renderTenantTable();
    updatePortfolioStats();
    closeAddPropertyModal();
    showToast(savedLocally ? 'Property updated in this browser.' : 'Property updated successfully.', '#40916C');
    return;
  }

  // Add saved property to local UI state
  properties.unshift(mapApiPropertyToCard(savedProperty, 0));

  // Add tenant to threads array so Contact button works
  const gradients = [
    'linear-gradient(135deg,#B7E4C7,#40916C)',
    'linear-gradient(135deg,rgba(212,168,83,0.3),rgba(212,168,83,0.7))',
    'linear-gradient(135deg,rgba(27,67,50,0.15),rgba(27,67,50,0.35))',
    'linear-gradient(135deg,var(--mint),var(--sage))'
  ];
  const colors = ['#1B4332', '#8B6914', '#1B4332', '#1B4332'];
  const gradIndex = threads.length % gradients.length;

  threads.push({
    name: tenantName,
    initials: initials,
    email: tenantEmail,
    property: address + ', ' + city + ' ' + state,
    avatarGrad: gradients[gradIndex],
    avatarColor: colors[gradIndex],
    messages: []
  });

  // Re-render property cards and tenant table
  renderPropertyCards('#dashboard-cards-grid', true);
  renderPropertyCards('#properties-cards-grid', false);
  renderTenantTable();
  updatePortfolioStats();

  // Close and reset modal
  document.getElementById('add-property-modal').classList.remove('open');
  document.getElementById('add-property-form').reset();
  document.getElementById('ap-photo-preview').style.display = 'none';

  // Success toast
  showToast(savedLocally ? 'Property saved in this browser.' : 'Property added successfully.', '#40916C');
}

// ═══════════════════════════════
// INIT
// ═══════════════════════════════
function updateSidebarUser(session) {
  const name = session?.user?.user_metadata?.full_name || session?.user?.email || 'Landlord';
  const initial = name.charAt(0).toUpperCase();
  const nameEl = document.getElementById('sidebar-user-name');
  const avatarEl = document.getElementById('sidebar-user-avatar');
  if (nameEl) nameEl.textContent = name;
  if (avatarEl) avatarEl.textContent = initial;
}

async function initializeApp() {
  const session = await window.dwelloAuth.init();

  window.dwelloAuth.onAuthChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      showView('login');
    } else if (event === 'PASSWORD_RECOVERY') {
      document.getElementById('reset-request-card').style.display = 'none';
      document.getElementById('reset-new-password-card').style.display = 'block';
      showView('reset-password');
    } else if (event === 'SIGNED_IN' && document.getElementById('view-login').classList.contains('active')) {
      updateSidebarUser(session);
      loadPropertiesFromApi().then(() => renderThread(0));
      showView('landlord');
    }
  });

  if (!session) {
    showView('login');
    return;
  }

  updateSidebarUser(session);
  await loadPropertiesFromApi();
  renderThread(0);
  showView('landlord');
}

// ═══════════════════════════════
// AUTH FORM HANDLERS
// ═══════════════════════════════
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  errorEl.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  const { error } = await window.dwelloAuth.signIn(email, password);

  submitBtn.disabled = false;
  submitBtn.textContent = 'Sign in';

  if (error) {
    let msg = error.message;
    if (msg.toLowerCase().includes('not confirmed')) {
      msg = 'Please confirm your email before signing in. Check your inbox for a confirmation link.';
    }
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
  // onAuthStateChange fires automatically on success
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const errorEl = document.getElementById('register-error');
  const successEl = document.getElementById('register-success');
  const submitBtn = document.getElementById('register-submit');

  errorEl.style.display = 'none';
  successEl.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  if (password.length < 8) {
    errorEl.textContent = 'Password must be at least 8 characters.';
    errorEl.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create account';
    return;
  }

  const { error } = await window.dwelloAuth.signUp(email, password, name);

  submitBtn.disabled = false;
  submitBtn.textContent = 'Create account';

  if (error) {
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
  } else {
    successEl.textContent = 'Account created! Check your email to confirm, then sign in.';
    successEl.style.display = 'block';
    document.getElementById('register-form').reset();
  }
}

async function handleResetRequest(e) {
  e.preventDefault();
  const email = document.getElementById('reset-email').value.trim();
  const errorEl = document.getElementById('reset-request-error');
  const successEl = document.getElementById('reset-request-success');

  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  const { error } = await window.dwelloAuth.resetPasswordForEmail(email);

  if (error) {
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
  } else {
    successEl.textContent = 'Reset link sent! Check your email inbox.';
    successEl.style.display = 'block';
  }
}

async function handleSetNewPassword(e) {
  e.preventDefault();
  const newPassword = document.getElementById('reset-new-password').value;
  const errorEl = document.getElementById('reset-new-error');

  errorEl.style.display = 'none';

  if (newPassword.length < 8) {
    errorEl.textContent = 'Password must be at least 8 characters.';
    errorEl.style.display = 'block';
    return;
  }

  const { error } = await window.dwelloAuth.updatePassword(newPassword);

  if (error) {
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
  } else {
    showToast('Password updated! Signing you in...');
    setTimeout(() => showView('landlord'), 1500);
  }
}

async function handleLogout() {
  await window.dwelloAuth.signOut();
  // onAuthStateChange fires SIGNED_OUT which calls showView('login')
}

initializeApp();
