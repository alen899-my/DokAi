import { Router } from 'express';
import authRouter from '../../modules/auth/auth.routes';

const router = Router();

// Mount all v1 routes here
// Adding new modules later = just add one line below
router.use('/auth', authRouter);

// Future routes go here:
import projectsRouter from '../../modules/project/project.routes';

router.use('/projects', projectsRouter);
// router.use('/sections',  sectionsRouter);
// router.use('/users',     usersRouter);

export default router;