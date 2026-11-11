'use strict';

const { Queue } = require('bullmq');

// BullMQ uses this Redis connection for both the producer queue and worker.
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
};

// Retry defaults belong to the Queue so every added job receives them.
const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

module.exports = { emailQueue, connection };
