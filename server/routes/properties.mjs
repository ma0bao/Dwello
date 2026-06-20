import { Router } from 'express';
import { createUserClient } from '../db/supabase.mjs';
import { requireAuth } from '../middleware/auth.mjs';

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
    leaseStart: row.lease_start,
    leaseEnd: row.lease_end,
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
    tenant_name: body.tenantName ? String(body.tenantName).trim() : null,
    tenant_email: body.tenantEmail ? String(body.tenantEmail).trim() : null,
    rent: parseOptionalInteger(body.rent),
    estimated_value: parseOptionalInteger(body.estimatedValue),
    square_feet: parseOptionalInteger(body.squareFeet),
    photo_url: body.photoUrl ? String(body.photoUrl).trim() : null,
    lease_start: body.leaseStart ? String(body.leaseStart).trim() : null,
    lease_end: body.leaseEnd ? String(body.leaseEnd).trim() : null
  };

  if (!/^\d{5}$/.test(property.zip)) {
    return { error: { status: 400, body: { error: 'Zip code must be exactly 5 digits' } } };
  }

  return { property };
}

router.get('/', requireAuth, async (req, res) => {
  const db = createUserClient(req.userToken);
  const { data, error } = await db
    .from('properties')
    .select('*')
    .order('id', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(toApiProperty));
});

router.post('/', requireAuth, async (req, res) => {
  const { property, error: parseError } = parsePropertyPayload(req.body);
  if (parseError) return res.status(parseError.status).json(parseError.body);

  const db = createUserClient(req.userToken);
  const { data, error } = await db
    .from('properties')
    .insert({ ...property, user_id: req.user.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(toApiProperty(data));
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid property id' });
  }

  const { property, error: parseError } = parsePropertyPayload(req.body);
  if (parseError) return res.status(parseError.status).json(parseError.body);

  const db = createUserClient(req.userToken);
  const { data, error } = await db
    .from('properties')
    .update({ ...property, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Property not found' });
  if (error) return res.status(500).json({ error: error.message });
  res.json(toApiProperty(data));
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid property id' });
  }

  const db = createUserClient(req.userToken);
  const { error, count } = await db
    .from('properties')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  if (count === 0) return res.status(404).json({ error: 'Property not found' });
  res.status(204).send();
});

export default router;
