import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';

describe('HTTP server threads', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  const getAccessToken = async () => {
    const app = await createServer(container);
    await request(app).post('/users').send({
      username: 'dicoding',
      password: 'secret_password',
      fullname: 'Dicoding Indonesia',
    });
    const response = await request(app).post('/authentications').send({
      username: 'dicoding',
      password: 'secret_password',
    });
    return response.body.data.accessToken;
  };

  describe('when POST /threads', () => {
    it('should response 201 and persisted thread', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const requestPayload = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedThread).toBeDefined();
      expect(response.body.data.addedThread.title).toEqual(requestPayload.title);
    });

    it('should response 401 when missing authentication', async () => {
      const app = await createServer(container);
      const requestPayload = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      const response = await request(app)
        .post('/threads')
        .send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 400 when request payload not contain needed property', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'sebuah thread',
        });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when GET /threads/:threadId', () => {
    it('should response 200 and return thread detail', async () => {
      const app = await createServer(container);

      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-123' });

      const response = await request(app)
        .get('/threads/thread-123');

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.thread).toBeDefined();
      expect(response.body.data.thread.comments).toHaveLength(1);
      expect(response.body.data.thread.comments[0].replies).toHaveLength(1);
    });

    it('should response 404 when thread not found', async () => {
      const app = await createServer(container);

      const response = await request(app)
        .get('/threads/thread-not-found');

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when POST /threads/:threadId/comments', () => {
    it('should response 201 and persisted comment', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'sebuah thread',
          body: 'sebuah body thread',
        });

      const threadId = threadResponse.body.data.addedThread.id;

      const requestPayload = {
        content: 'sebuah komentar',
      };

      const response = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedComment).toBeDefined();
      expect(response.body.data.addedComment.content).toEqual(requestPayload.content);
    });

    it('should response 400 when request payload not contain needed property', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const response = await request(app)
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when DELETE /threads/:threadId/comments/:commentId', () => {
    it('should response 200 and soft delete comment', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'sebuah thread',
          body: 'sebuah body thread',
        });
      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'sebuah komentar',
        });
      const commentId = commentResponse.body.data.addedComment.id;

      const response = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 403 when deleting comment from other user', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah komentar' });
      const commentId = commentResponse.body.data.addedComment.id;

      await request(app).post('/users').send({ username: 'other', password: 'secret_password', fullname: 'Other User' });
      const loginResponse = await request(app).post('/authentications').send({ username: 'other', password: 'secret_password' });
      const otherAccessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when POST /threads/:threadId/comments/:commentId/replies', () => {
    it('should response 201 and persisted reply', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body' });
      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah komentar' });
      const commentId = commentResponse.body.data.addedComment.id;

      const response = await request(app)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedReply).toBeDefined();
    });

    it('should response 400 when request payload not contain needed property', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const response = await request(app)
        .post('/threads/thread-123/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when DELETE /threads/:threadId/comments/:commentId/replies/:replyId', () => {
    it('should response 200 and soft delete reply', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body' });
      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah komentar' });
      const commentId = commentResponse.body.data.addedComment.id;

      const replyResponse = await request(app)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });
      const replyId = replyResponse.body.data.addedReply.id;

      const response = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 403 when deleting reply from other user', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body' });
      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah komentar' });
      const commentId = commentResponse.body.data.addedComment.id;

      const replyResponse = await request(app)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });
      const replyId = replyResponse.body.data.addedReply.id;

      await request(app).post('/users').send({ username: 'other', password: 'secret_password', fullname: 'Other User' });
      const loginResponse = await request(app).post('/authentications').send({ username: 'other', password: 'secret_password' });
      const otherAccessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when PUT /threads/:threadId/comments/:commentId/likes', () => {
    it('should response 200 and like comment', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body' });
      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah komentar' });
      const commentId = commentResponse.body.data.addedComment.id;

      const response = await request(app)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 404 when thread not found', async () => {
      const app = await createServer(container);
      const accessToken = await getAccessToken();

      const response = await request(app)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });
  });
});
