import { Router } from 'express';
import { createProject, getProjectById, streamProjectGeneration, updateProject, getAllProjects, deleteProject } from './project.controller';

const router = Router();

router.post('/', createProject);
router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.get('/:id/stream', streamProjectGeneration);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
