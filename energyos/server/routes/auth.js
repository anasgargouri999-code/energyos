const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseAdmin');

// POST /validate-code: query Supabase access_codes where code=$body.code, check active=true, return { valid, accessLevel, clinicName }
router.post('/validate-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Bypass check: If the code entered is the ADMIN_SECRET, grant instant super admin access
    if (process.env.ADMIN_SECRET && code === process.env.ADMIN_SECRET) {
      return res.json({
        valid: true,
        accessLevel: 'admin',
        clinicName: 'Polyclinique Errachid (Admin)'
      });
    }

    const { data, error } = await supabase
      .from('access_codes')
      .select('active, access_level, clinic_name')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return res.status(404).json({ error: 'Invalid code' });
      }
      throw error;
    }

    if (!data.active) {
      return res.status(403).json({ error: 'Code is inactive or expired' });
    }

    res.json({
      valid: true,
      accessLevel: data.access_level,
      clinicName: data.clinic_name
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur de validation de code', details: err.message });
  }
});

module.exports = router;
