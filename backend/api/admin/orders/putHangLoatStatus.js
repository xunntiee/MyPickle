import express from 'express';

const router = express.Router();

router.put('/hangloat/status', (_req, res) => {
  res.status(409).json({
    error: 'Commerce orders are managed by Trevo. Bulk status updates must be handled in Trevo.',
  });
});

export default router;
