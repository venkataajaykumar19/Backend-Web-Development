'use strict';

const { randomInt } = require('node:crypto');

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const _store = new Map();

function generateOTP() {
  // randomInt's upper bound is exclusive, so this always produces 100000-999999.
  return String(randomInt(100000, 1000000));
}

function storeOTP(email, otp) {
  _store.set(email, {
    otp: String(otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
}

function verifyOTP(email, code) {
  const entry = _store.get(email);

  // Keep these checks in the required order.
  if (!entry) {
    return { ok: false, reason: 'not_found' };
  }

  if (Date.now() >= entry.expiresAt) {
    _store.delete(email);
    return { ok: false, reason: 'expired' };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: 'too_many_attempts' };
  }

  if (entry.otp !== String(code)) {
    entry.attempts += 1;
    return { ok: false, reason: 'wrong_code' };
  }

  // A successful OTP is single-use.
  _store.delete(email);
  return { ok: true };
}

function markVerified(email) {
  console.log(`Email verified: ${email}`);
}

module.exports = { generateOTP, storeOTP, verifyOTP, markVerified, _store };
