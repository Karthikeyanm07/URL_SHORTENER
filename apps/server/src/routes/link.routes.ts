// src/routes/link.routes.ts

import {Router} from 'express';
import {validate} from '@/middleware/validate';
import {authenticate, optionalAuthenticate} from '@/middleware/authenticate';
import {createLinkLimiter} from '@/middleware/rateLimiter';
import {createLinkSchema} from '@/services/link.service';
import * as linkController from '@/controllers/link.controller';

const router = Router();

// POST /api/v1/links
// optionalAuthenticate: anonymous users can create links too,
// but if a valid token exists, the link is owned by that user
router.post(
	'/',
	createLinkLimiter,
	optionalAuthenticate,
	validate({body: createLinkSchema}),
	linkController.createLink
);

// GET /api/v1/links — requires login
router.get('/', authenticate, linkController.getMyLinks);

// PATCH /api/v1/links/:shortCode/toggle — requires login + ownership
router.patch('/:shortCode/toggle', authenticate, linkController.toggleLink);

// DELETE /api/v1/links/:shortCode — requires login + ownership
router.delete('/:shortCode', authenticate, linkController.removeLink);

export default router;