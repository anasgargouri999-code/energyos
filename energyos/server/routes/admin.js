const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseAdmin');
const { generateAccessCode } = require('../lib/codeGen');
const { sendAccessCodeEmail } = require('../lib/mailer');
const { requireAdmin } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

// All admin routes require admin secret
router.use(requireAdmin);

/**
 * GET /api/admin/requests
 * List all access requests
 */
router.get('/requests', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ requests: data });
  } catch (err) {
    logger.error('Failed to fetch requests', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
});

/**
 * GET /api/admin/codes
 * List all issued access codes
 */
router.get('/codes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ codes: data });
  } catch (err) {
    logger.error('Failed to fetch codes', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des codes' });
  }
});

/**
 * POST /api/admin/approve
 * Approve a request: generate code, store it, send email
 * Body: { request_id }
 */
router.post('/approve', async (req, res) => {
  try {
    const { request_id } = req.body;
    if (!request_id) {
      return res.status(400).json({ error: 'request_id requis' });
    }

    // Fetch the request
    const { data: request, error: fetchErr } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchErr || !request) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    // Generate code
    const code = generateAccessCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days

    // Insert code into access_codes
    const { error: insertErr } = await supabase
      .from('access_codes')
      .insert({
        code,
        request_id,
        email: request.email,
        clinic_name: request.clinic_name,
        access_level: 'standard',
        active: true,
        expires_at: expiresAt.toISOString(),
      });

    if (insertErr) throw insertErr;

    // Update request status
    const { error: updateErr } = await supabase
      .from('access_requests')
      .update({ status: 'approved' })
      .eq('id', request_id);

    if (updateErr) throw updateErr;

    // Send email (non-blocking — don't fail the response if email fails)
    try {
      await sendAccessCodeEmail(request.email, request.clinic_name, code);
      logger.info('Access code email sent', { email: request.email, code });
    } catch (emailErr) {
      logger.error('Email send failed (non-blocking)', { error: emailErr.message });
    }

    res.json({ success: true, code, email: request.email });
  } catch (err) {
    logger.error('Failed to approve request', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  }
});

/**
 * POST /api/admin/reject
 * Reject a request
 * Body: { request_id }
 */
router.post('/reject', async (req, res) => {
  try {
    const { request_id } = req.body;
    if (!request_id) {
      return res.status(400).json({ error: 'request_id requis' });
    }

    const { error } = await supabase
      .from('access_requests')
      .update({ status: 'rejected' })
      .eq('id', request_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to reject request', { error: err.message });
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
});

/**
 * POST /api/admin/revoke
 * Revoke an active access code
 * Body: { code_id }
 */
router.post('/revoke', async (req, res) => {
  try {
    const { code_id } = req.body;
    if (!code_id) {
      return res.status(400).json({ error: 'code_id requis' });
    }

    const { error } = await supabase
      .from('access_codes')
      .update({ active: false })
      .eq('id', code_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to revoke code', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la révocation' });
  }
});

/**
 * POST /api/admin/generate-code
 * Directly generate a code manually
 * Body: { clinic_name, email, access_level, custom_code }
 */
router.post('/generate-code', async (req, res) => {
  try {
    const { clinic_name, email, access_level, custom_code } = req.body;
    if (!email || !clinic_name) {
      return res.status(400).json({ error: 'Clinique et Email requis' });
    }

    const code = custom_code?.trim() || generateAccessCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days

    const { error: insertErr } = await supabase
      .from('access_codes')
      .insert({
        code,
        email,
        clinic_name,
        access_level: access_level || 'standard',
        active: true,
        expires_at: expiresAt.toISOString(),
      });

    if (insertErr) throw insertErr;

    // Send email (non-blocking)
    try {
      await sendAccessCodeEmail(email, clinic_name, code);
      logger.info('Access code email sent (manual)', { email, code });
    } catch (emailErr) {
      logger.error('Email send failed (non-blocking, manual)', { error: emailErr.message });
    }

    res.json({ success: true, code, email, clinic_name, access_level });
  } catch (err) {
    logger.error('Failed to generate manual code', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la génération du code', details: err.message });
  }
});

module.exports = router;
