import express from 'express';
import { activateTag, createTag, getPublicTag, getTags, updatePrivacy } from '../controllers/tagController';

const router = express.Router();

router.post('/', createTag);
router.post('/activate', activateTag);
router.get('/', getTags);
router.patch('/:id/privacy', updatePrivacy);
router.get('/public/:id', getPublicTag);

export default router;
