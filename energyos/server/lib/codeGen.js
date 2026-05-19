const crypto = require('crypto');

/**
 * Generate a unique access code in the format EOS-XXXX-XXXX
 * @returns {string} Access code
 */
function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[crypto.randomInt(chars.length)];
    part2 += chars[crypto.randomInt(chars.length)];
  }
  return `EOS-${part1}-${part2}`;
}

module.exports = { generateAccessCode };
