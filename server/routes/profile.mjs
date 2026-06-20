import { Router } from 'express';
import { requireAuth } from '../middleware/auth.mjs';
import { createUserClient } from '../db/supabase.mjs';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const db = createUserClient(req.userToken);
  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .eq('id', req.user.id)
    .single();

  if (error?.code === 'PGRST116') {
    return res.json({ id: req.user.id, email: req.user.email, full_name: null, avatar_url: null, role: 'landlord' });
  }
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...data, email: req.user.email });
});

router.put('/', requireAuth, async (req, res) => {
  const { full_name, avatar_url } = req.body;
  if (full_name !== undefined && (typeof full_name !== 'string' || full_name.trim().length === 0)) {
    return res.status(400).json({ error: 'full_name must be a non-empty string' });
  }

  const db = createUserClient(req.userToken);
  const { data, error } = await db
    .from('profiles')
    .upsert({
      id: req.user.id,
      full_name: full_name?.trim() ?? null,
      avatar_url: avatar_url ?? null,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...data, email: req.user.email });
});

export default router;
