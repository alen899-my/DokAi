import { Router } from 'express';
import { createOpenRouterService } from '../../lib/openrouter';
import { env } from '../../config/env';

const router = Router();

/**
 * POST /api/v1/ai/generate-docs
 * Body: { code: string, language?: string }
 * NOTE: For safety we only use the server-configured model (OPENROUTER_MODEL).
 */
router.post('/generate-docs', async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'code is required' });

  const service = createOpenRouterService();
  if (!service) {
    return res.status(503).json({ success: false, message: 'AI service not configured' });
  }

  try {
    // Always use the server-configured model to ensure only the allowed model is used
    const model = env.OPENROUTER_MODEL;
    const documentation = await service.generateDocumentation(code, language || 'typescript', model);
    res.json({ success: true, documentation });
  } catch (err: any) {
    console.error('AI generate-docs error:', err);
    res.status(500).json({ success: false, message: err.message || 'AI error' });
  }
});

export default router;
