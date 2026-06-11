import express from 'express';

const router = express.Router();

router.delete('/:id', (_req, res) => {
  res.status(409).json({
    error: 'Commerce orders are managed by Trevo. Delete or cancel orders in Trevo instead of MyPick local DB.',
  });
});

export default router;
