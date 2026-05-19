require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

/**
 * Middleware to check admin secret header
 */
function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret.trim() !== (process.env.ADMIN_SECRET || '').trim()) {
    return res.status(401).json({ error: 'Accès refusé — secret admin invalide' });
  }
  next();
}

module.exports = { requireAdmin };
