import ThreadsHandler from './handler.js';
import { Router } from 'express';
import AuthenticationTokenManager from '../../../../Applications/security/AuthenticationTokenManager.js';
import AuthenticationError from '../../../../Commons/exceptions/AuthenticationError.js';

const routes = (container) => {
  const router = Router();
  const threadsHandler = new ThreadsHandler(container);

  const authMiddleware = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new AuthenticationError('Missing authentication');
      }

      const token = authHeader.split(' ')[1];
      const tokenManager = container.getInstance(AuthenticationTokenManager.name);
      const decoded = await tokenManager.decodePayload(token);
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };

  router.post('/', authMiddleware, threadsHandler.postThreadHandler);
  router.get('/:threadId', threadsHandler.getThreadDetailHandler);
  router.post('/:threadId/comments', authMiddleware, threadsHandler.postCommentHandler);
  router.delete('/:threadId/comments/:commentId', authMiddleware, threadsHandler.deleteCommentHandler);
  router.post('/:threadId/comments/:commentId/replies', authMiddleware, threadsHandler.postReplyHandler);
  router.delete('/:threadId/comments/:commentId/replies/:replyId', authMiddleware, threadsHandler.deleteReplyHandler);
  router.put('/:threadId/comments/:commentId/likes', authMiddleware, threadsHandler.putLikeCommentHandler);

  return router;
};

export default routes;
