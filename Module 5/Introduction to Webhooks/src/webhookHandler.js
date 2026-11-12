'use strict';

const crypto = require('node:crypto');
const { handleEvent } = require('./eventHandlers');

const _processedIds = new Set();

function isValidSignature(req) {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  // Reject missing configuration, malformed headers, and non-hex digests.
  if (typeof secret !== 'string' || secret.length === 0) return false;
  if (typeof signature !== 'string') return false;

  const match = /^sha256=([a-f0-9]{64})$/i.exec(signature);
  if (!match || !Buffer.isBuffer(req.body)) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest();

  const received = Buffer.from(match[1], 'hex');

  // timingSafeEqual throws for buffers of different lengths.
  return expected.length === received.length &&
    crypto.timingSafeEqual(expected, received);
}

function handleWebhook(req, res) {
  if (!isValidSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!event || event.id === undefined || event.id === null) {
    return res.status(400).json({ error: 'Missing event id' });
  }

  if (_processedIds.has(event.id)) {
    return res.status(200).json({ status: 'already_processed' });
  }

  // Record the id before acknowledging or scheduling work, preventing
  // concurrent provider retries from scheduling the same event twice.
  _processedIds.add(event.id);

  res.status(200).json({ status: 'received' });

  setImmediate(() => {
    Promise.resolve(handleEvent(event)).catch((error) => {
      console.error('Webhook event processing failed:', error);
    });
  });
}

module.exports = { handleWebhook, _processedIds };
