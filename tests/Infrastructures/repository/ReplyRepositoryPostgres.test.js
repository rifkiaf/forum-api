import { describe, it, expect, afterAll, afterEach } from 'vitest';
import RepliesTableTestHelper from '../../RepliesTableTestHelper.js';
import CommentsTableTestHelper from '../../CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../UsersTableTestHelper.js';
import pool from '../../../src/Infrastructures/database/postgres/pool.js';
import ReplyRepositoryPostgres from '../../../src/Infrastructures/repository/ReplyRepositoryPostgres.js';
import NewReply from '../../../src/Domains/replies/entities/NewReply.js';
import AddedReply from '../../../src/Domains/replies/entities/AddedReply.js';
import NotFoundError from '../../../src/Commons/exceptions/NotFoundError.js';
import AuthorizationError from '../../../src/Commons/exceptions/AuthorizationError.js';

describe('ReplyRepositoryPostgres', () => {
  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply and return added reply correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-reply1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-reply1', owner: 'user-reply1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-reply1', threadId: 'thread-reply1', owner: 'user-reply1' });

      const newReply = new NewReply({
        content: 'content',
        commentId: 'comment-reply1',
        owner: 'user-reply1',
      });

      const fakeIdGenerator = () => '123';
      const repo = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      const added = await repo.addReply(newReply);

      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(added).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'content',
        owner: 'user-reply1',
      }));
    });
  });

  describe('verifyReplyAvailability function', () => {
    it('should throw NotFoundError when reply not available', async () => {
      const repo = new ReplyRepositoryPostgres(pool, {});
      await expect(repo.verifyReplyAvailability('reply-xxx')).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when reply available', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-reply1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-reply1', owner: 'user-reply1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-reply1', threadId: 'thread-reply1', owner: 'user-reply1' });
      await RepliesTableTestHelper.addReply({ id: 'reply-reply1', commentId: 'comment-reply1', owner: 'user-reply1' });

      const repo = new ReplyRepositoryPostgres(pool, {});
      await expect(repo.verifyReplyAvailability('reply-reply1')).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw NotFoundError when reply not found', async () => {
      const repo = new ReplyRepositoryPostgres(pool, {});
      await expect(repo.verifyReplyOwner('reply-xxx', 'user-reply1')).rejects.toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when owner is wrong', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-reply1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-reply1', owner: 'user-reply1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-reply1', threadId: 'thread-reply1', owner: 'user-reply1' });
      await RepliesTableTestHelper.addReply({ id: 'reply-reply1', commentId: 'comment-reply1', owner: 'user-reply1' });

      const repo = new ReplyRepositoryPostgres(pool, {});
      await expect(repo.verifyReplyOwner('reply-reply1', 'user-wrong')).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw error when owner is correct', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-reply1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-reply1', owner: 'user-reply1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-reply1', threadId: 'thread-reply1', owner: 'user-reply1' });
      await RepliesTableTestHelper.addReply({ id: 'reply-reply1', commentId: 'comment-reply1', owner: 'user-reply1' });

      const repo = new ReplyRepositoryPostgres(pool, {});
      await expect(repo.verifyReplyOwner('reply-reply1', 'user-reply1')).resolves.not.toThrowError();
    });
  });

  describe('deleteReply function', () => {
    it('should update is_delete to true', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-reply1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-reply1', owner: 'user-reply1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-reply1', threadId: 'thread-reply1', owner: 'user-reply1' });
      await RepliesTableTestHelper.addReply({ id: 'reply-reply1', commentId: 'comment-reply1', owner: 'user-reply1' });

      const repo = new ReplyRepositoryPostgres(pool, {});
      await repo.deleteReply('reply-reply1');

      const replies = await RepliesTableTestHelper.findRepliesById('reply-reply1');
      expect(replies[0].is_delete).toEqual(true);
    });
  });

  describe('getRepliesByThreadId function', () => {
    it('should return replies correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-reply1', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-reply1', owner: 'user-reply1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-reply1', threadId: 'thread-reply1', owner: 'user-reply1' });
      await RepliesTableTestHelper.addReply({ id: 'reply-reply1', commentId: 'comment-reply1', owner: 'user-reply1', content: 'content' });

      const repo = new ReplyRepositoryPostgres(pool, {});
      const replies = await repo.getRepliesByThreadId('thread-reply1');

      expect(replies).toHaveLength(1);
      expect(replies[0].id).toEqual('reply-reply1');
      expect(replies[0].username).toEqual('dicoding');
      expect(replies[0].content).toEqual('content');
      expect(replies[0].is_delete).toEqual(false);
      expect(replies[0].comment_id).toEqual('comment-reply1');
      expect(replies[0].date).toEqual(expect.any(Date));
    });
  });
});
