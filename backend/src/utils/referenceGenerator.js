const Counter = require('../models/Counter');

/**
 * Concurrency-safe atomic reference ID generator.
 * Example result: HF-2026-0001, HF-2026-0002...
 */
const generateComplaintReference = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `complaints_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `HF-${currentYear}-${paddedSeq}`;
};

module.exports = {
  generateComplaintReference,
};
