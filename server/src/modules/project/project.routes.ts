import { Router } from 'express';
import { createProject, getProjectById, streamProjectGeneration, updateProject, getAllProjects, deleteProject } from './project.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Apply requireAuth middleware to all project routes
router.use(requireAuth);

router.post('/', createProject);
router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.get('/:id/stream', streamProjectGeneration);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;

