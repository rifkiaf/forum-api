import { describe, it, expect, afterAll, afterEach } from 'vitest';
import CommentsTableTestHelper from '../../CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../UsersTableTestHelper.js';
import pool from '../../../src/Infrastructures/database/postgres/pool.js';
import CommentRepositoryPostgres from '../../../src/Infrastructures/repository/CommentRepositoryPostgres.js';
import NewComment from '../../../src/Domains/comments/entities/NewComment.js';
import AddedComment from '../../../src/Domains/comments/entities/AddedComment.js';
import NotFoundError from '../../../src/Commons/exceptions/NotFoundError.js';
import AuthorizationError from '../../../src/Commons/exceptions/AuthorizationError.js';

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment and return added comment correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-comment1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-comment1', owner: 'user-comment1' });

      const newComment = new NewComment({
        content: 'content',
        threadId: 'thread-comment1',
        owner: 'user-comment1',
      });

      const fakeIdGenerator = () => '123';
      const repo = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      const added = await repo.addComment(newComment);

      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
      expect(added).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'content',
        owner: 'user-comment1',
      }));
    });
  });

  describe('verifyCommentAvailability function', () => {
    it('should throw NotFoundError when comment not available', async () => {
      const repo = new CommentRepositoryPostgres(pool, {});
      await expect(repo.verifyCommentAvailability('comment-xxx')).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when comment available', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-comment1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-comment1', owner: 'user-comment1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-comment1', threadId: 'thread-comment1', owner: 'user-comment1' });

      const repo = new CommentRepositoryPostgres(pool, {});
      await expect(repo.verifyCommentAvailability('comment-comment1')).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      const repo = new CommentRepositoryPostgres(pool, {});
      await expect(repo.verifyCommentOwner('comment-xxx', 'user-comment1')).rejects.toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when owner is wrong', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-comment1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-comment1', owner: 'user-comment1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-comment1', threadId: 'thread-comment1', owner: 'user-comment1' });

      const repo = new CommentRepositoryPostgres(pool, {});
      await expect(repo.verifyCommentOwner('comment-comment1', 'user-wrong')).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw error when owner is correct', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-comment1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-comment1', owner: 'user-comment1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-comment1', threadId: 'thread-comment1', owner: 'user-comment1' });

      const repo = new CommentRepositoryPostgres(pool, {});
      await expect(repo.verifyCommentOwner('comment-comment1', 'user-comment1')).resolves.not.toThrowError();
    });
  });

  describe('deleteComment function', () => {
    it('should update is_delete to true', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-comment1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-comment1', owner: 'user-comment1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-comment1', threadId: 'thread-comment1', owner: 'user-comment1' });

      const repo = new CommentRepositoryPostgres(pool, {});
      await repo.deleteComment('comment-comment1');

      const comments = await CommentsTableTestHelper.findCommentsById('comment-comment1');
      expect(comments[0].is_delete).toEqual(true);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return comments correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-comment1', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-comment1', owner: 'user-comment1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-comment1', threadId: 'thread-comment1', owner: 'user-comment1', content: 'content' });

      const repo = new CommentRepositoryPostgres(pool, {});
      const comments = await repo.getCommentsByThreadId('thread-comment1');

      expect(comments).toHaveLength(1);
      expect(comments[0].id).toEqual('comment-comment1');
      expect(comments[0].username).toEqual('dicoding');
      expect(comments[0].content).toEqual('content');
      expect(comments[0].is_delete).toEqual(false);
      expect(comments[0].date).toEqual(expect.any(Date));
      expect(comments[0].likeCount).toEqual('0');
    });
  });
});
