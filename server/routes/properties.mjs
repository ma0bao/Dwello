import { Router } from 'express';

import { getDatabase } from '../db/database.mjs';

const router = Router();
const REQUIRED_FIELDS = ['address', 'city', 'state', 'zip'];

function toApiProperty(row) {
  return {
    id: row.id,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    tenantName: row.tenant_name,
    tenantEmail: row.tenant_email,
    rent: row.rent,
    estimatedValue: row.estimated_value,
    squareFeet: row.square_feet,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) ? Math.round(number) : null;
}


function parsePropertyPayload(body) {
  const missing = REQUIRED_FIELDS.filter(field => !String(body[field] || '').trim());
  if (missing.length) {
    return {
      error: {
        status: 400,
        body: { error: 'Missing required fields', required: REQUIRED_FIELDS }
      }
    };
  }

  const property = {
    address: String(body.address).trim(),
    city: String(body.city).trim(),
    state: String(body.state).trim().toUpperCase(),
    zip: String(body.zip).trim(),
    tenantName: body.tenantName ? String(body.tenantName).trim() : null,
    tenantEmail: body.tenantEmail ? String(body.tenantEmail).trim() : null,
    rent: parseOptionalInteger(body.rent),
    estimatedValue: parseOptionalInteger(body.estimatedValue),
    squareFeet: parseOptionalInteger(body.squareFeet),
    photoUrl: body.photoUrl ? String(body.photoUrl).trim() : null
  };

  if (!/^\d{5}$/.test(property.zip)) {
    return { error: { status: 400, body: { error: 'Zip code must be exactly 5 digits' } } };
  }

  return { property };
}

router.get('/', (req, res) => {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT *
    FROM properties
    ORDER BY id DESC
  `).all();
  res.json(rows.map(toApiProperty));
});

router.post('/', (req, res) => {
  const { property, error } = parsePropertyPayload(req.body);
  if (error) return res.status(error.status).json(error.body);

  const db = getDatabase();
  const result = db.prepare(`
    INSERT INTO properties (
      address, city, state, zip, tenant_name, tenant_email,
      rent, estimated_value, square_feet, photo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    property.address,
    property.city,
    property.state,
    property.zip,
    property.tenantName,
    property.tenantEmail,
    property.rent,
    property.estimatedValue,
    property.squareFeet,
    property.photoUrl
  );

  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(toApiProperty(row));
});


router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid property id' });
  }

  const { property, error } = parsePropertyPayload(req.body);
  if (error) return res.status(error.status).json(error.body);

  const db = getDatabase();
  const result = db.prepare(`
    UPDATE properties
    SET address = ?,
        city = ?,
        state = ?,
        zip = ?,
        tenant_name = ?,
        tenant_email = ?,
        rent = ?,
        estimated_value = ?,
        square_feet = ?,
        photo_url = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    property.address,
    property.city,
    property.state,
    property.zip,
    property.tenantName,
    property.tenantEmail,
    property.rent,
    property.estimatedValue,
    property.squareFeet,
    property.photoUrl,
    id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Property not found' });
  }

  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  res.json(toApiProperty(row));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid property id' });
  }

  const db = getDatabase();
  const result = db.prepare('DELETE FROM properties WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Property not found' });
  }

  res.status(204).send();
});

export default router;
