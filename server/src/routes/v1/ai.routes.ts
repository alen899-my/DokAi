import { Router } from 'express';
import { createOpenRouterService } from '../../lib/openrouter';

const router = Router();

router.post('/generate-docs', async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'code is required' });

  const service = createOpenRouterService();
  if (!service) {
    return res.status(503).json({ success: false, message: 'AI service not configured' });
  }

  try {
    const documentation = await service.generateDocumentation(code, language || 'typescript');
    res.json({ success: true, documentation });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'AI error' });
  }
});

export default router;
