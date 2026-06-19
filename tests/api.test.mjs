import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import sendEmailHandler from '../api/send-email.js';

const PORT = 45100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function waitForServer() {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) return;
    } catch {
      // Server not ready yet.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Server did not become ready');
}

async function postJson(path, body) {
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      this.ended = true;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };
}

test('properties API lists seeded demo properties and creates persisted properties', async (t) => {
  const dbPath = fileURLToPath(new URL(`../data/test-${Date.now()}.sqlite`, import.meta.url));
  const server = spawn(process.execPath, ['server/app.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(PORT), DB_PATH: dbPath },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  server.stdout.on('data', chunk => { output += chunk.toString(); });
  server.stderr.on('data', chunk => { output += chunk.toString(); });

  t.after(() => {
    server.kill();
  });

  try {
    await waitForServer();

    const initialResponse = await fetch(`${BASE_URL}/api/properties`);
    assert.equal(initialResponse.status, 200);
    const initialProperties = await initialResponse.json();
    assert.equal(initialProperties.length, 3);
    assert.ok(initialProperties.some(property => property.address === '142 Maple Street'));

    const payload = {
      address: '123 Test Street',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      tenantName: 'Test Tenant',
      tenantEmail: 'tenant@example.com',
      rent: 2200,
      estimatedValue: 485000,
      squareFeet: 1850
    };

    const createResponse = await postJson('/api/properties', payload);
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    assert.equal(created.address, payload.address);
    assert.equal(created.city, payload.city);
    assert.equal(created.state, payload.state);
    assert.equal(created.zip, payload.zip);
    assert.equal(created.tenantName, payload.tenantName);
    assert.equal(created.tenantEmail, payload.tenantEmail);
    assert.equal(created.rent, payload.rent);
    assert.equal(created.estimatedValue, payload.estimatedValue);
    assert.equal(created.squareFeet, payload.squareFeet);
    assert.ok(created.id);

    const listResponse = await fetch(`${BASE_URL}/api/properties`);
    assert.equal(listResponse.status, 200);
    const properties = await listResponse.json();
    assert.equal(properties.length, 4);
    assert.equal(properties[0].id, created.id);
  } catch (error) {
    error.message += `\nServer output:\n${output}`;
    throw error;
  }
});

test('properties API updates and deletes persisted properties', async (t) => {
  const editPort = PORT + 2;
  const editBaseUrl = `http://127.0.0.1:${editPort}`;
  const dbPath = fileURLToPath(new URL(`../data/test-edit-delete-${Date.now()}.sqlite`, import.meta.url));
  const server = spawn(process.execPath, ['server/app.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(editPort), DB_PATH: dbPath },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  server.stdout.on('data', chunk => { output += chunk.toString(); });
  server.stderr.on('data', chunk => { output += chunk.toString(); });
  t.after(() => server.kill());

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${editBaseUrl}/api/health`);
      if (response.ok) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  try {
    const createResponse = await fetch(`${editBaseUrl}/api/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '44 Editable Road',
        city: 'Austin',
        state: 'TX',
        zip: '78705',
        tenantName: 'Before Tenant',
        tenantEmail: 'before@example.com',
        rent: 2100,
        estimatedValue: 450000,
        squareFeet: 1700
      })
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();

    const updateResponse = await fetch(`${editBaseUrl}/api/properties/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '44 Updated Road',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        tenantName: 'After Tenant',
        tenantEmail: 'after@example.com',
        rent: 2400,
        estimatedValue: 520000,
        squareFeet: 1800
      })
    });
    assert.equal(updateResponse.status, 200);
    const updated = await updateResponse.json();
    assert.equal(updated.id, created.id);
    assert.equal(updated.address, '44 Updated Road');
    assert.equal(updated.city, 'Dallas');
    assert.equal(updated.tenantName, 'After Tenant');
    assert.equal(updated.rent, 2400);

    const deleteResponse = await fetch(`${editBaseUrl}/api/properties/${created.id}`, {
      method: 'DELETE'
    });
    assert.equal(deleteResponse.status, 204);

    const listResponse = await fetch(`${editBaseUrl}/api/properties`);
    const properties = await listResponse.json();
    assert.equal(properties.some(property => property.id === created.id), false);
  } catch (error) {
    error.message += `\nServer output:\n${output}`;
    throw error;
  }
});

test('frontend add property flow does not require lease dates before saving', async () => {
  const appSource = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(appSource, /Lease start date is required/);
  assert.doesNotMatch(appSource, /Lease end date is required/);
});

test('frontend markup is organized into view partials instead of one large index file', async () => {
  const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const landingPartial = await readFile(new URL('../src/views/landing.html', import.meta.url), 'utf8');
  const landlordPartial = await readFile(new URL('../src/views/landlord.html', import.meta.url), 'utf8');
  const tenantPartial = await readFile(new URL('../src/views/tenant.html', import.meta.url), 'utf8');
  const modalsPartial = await readFile(new URL('../src/views/modals.html', import.meta.url), 'utf8');

  assert.match(indexSource, /id="app-root"/);
  assert.match(indexSource, /src\/bootstrap\.js/);
  assert.doesNotMatch(indexSource, /id="view-landlord"/);
  assert.match(landingPartial, /id="view-landing"/);
  assert.match(landlordPartial, /id="view-landlord"/);
  assert.match(tenantPartial, /id="view-tenant"/);
  assert.match(modalsPartial, /id="add-property-modal"/);
});

test('email API returns JSON when email credentials are missing', async (t) => {
  const emailPort = PORT + 3;
  const emailBaseUrl = `http://127.0.0.1:${emailPort}`;
  const dbPath = fileURLToPath(new URL(`../data/test-email-${Date.now()}.sqlite`, import.meta.url));
  const server = spawn(process.execPath, ['server/app.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PORT: String(emailPort),
      DB_PATH: dbPath,
      GMAIL_USER: '',
      GMAIL_APP_PASSWORD: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  t.after(() => server.kill());

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${emailBaseUrl}/api/health`);
      if (response.ok) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const response = await fetch(`${emailBaseUrl}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'tenant@example.com',
      subject: 'Lease update',
      message: 'Hello tenant'
    })
  });

  assert.equal(response.status, 503);
  assert.match(response.headers.get('content-type'), /application\/json/);
  const body = await response.json();
  assert.equal(body.error, 'Email service is not configured');
  assert.deepEqual(body.required, ['GMAIL_USER', 'GMAIL_APP_PASSWORD']);
});

test('Vercel email function returns JSON when email credentials are missing', async () => {
  const previousUser = process.env.GMAIL_USER;
  const previousPassword = process.env.GMAIL_APP_PASSWORD;
  delete process.env.GMAIL_USER;
  delete process.env.GMAIL_APP_PASSWORD;

  const res = createMockResponse();
  await sendEmailHandler({
    method: 'POST',
    body: {
      to: 'tenant@example.com',
      subject: 'Lease update',
      message: 'Hello tenant'
    }
  }, res);

  if (previousUser === undefined) delete process.env.GMAIL_USER;
  else process.env.GMAIL_USER = previousUser;
  if (previousPassword === undefined) delete process.env.GMAIL_APP_PASSWORD;
  else process.env.GMAIL_APP_PASSWORD = previousPassword;

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, 'Email service is not configured');
  assert.deepEqual(res.body.required, ['GMAIL_USER', 'GMAIL_APP_PASSWORD']);
});

test('properties API validates required property fields', async (t) => {
  const dbPath = fileURLToPath(new URL(`../data/test-validation-${Date.now()}.sqlite`, import.meta.url));
  const server = spawn(process.execPath, ['server/app.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(PORT + 1), DB_PATH: dbPath },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const validationBaseUrl = `http://127.0.0.1:${PORT + 1}`;
  t.after(() => server.kill());

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${validationBaseUrl}/api/health`);
      if (response.ok) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const response = await fetch(`${validationBaseUrl}/api/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city: 'Austin' })
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, 'Missing required fields');
  assert.deepEqual(body.required, ['address', 'city', 'state', 'zip']);
});

test('frontend falls back to browser storage when deployed without API routes', async () => {
  const appSource = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(appSource, /LOCAL_PROPERTIES_STORAGE_KEY/);
  assert.match(appSource, /propertyPersistenceMode = 'local'/);
  assert.match(appSource, /saveLocalProperty\(propertyPayload/);
  assert.match(appSource, /Property saved in this browser\./);
  assert.doesNotMatch(appSource, /const response = await fetch\(endpoint/);
});
