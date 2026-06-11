import express from 'express';

const router = express.Router();

router.put('/:id/status', (_req, res) => {
  res.status(409).json({
    error: 'Commerce orders are managed by Trevo. Update order status in Trevo instead of MyPick local DB.',
  });
});

export default router;
