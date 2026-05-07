import { describe, it, expect, afterEach, afterAll } from 'vitest';
import LikesTableTestHelper from '../../LikesTableTestHelper.js';
import CommentsTableTestHelper from '../../CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../UsersTableTestHelper.js';
import pool from '../../../src/Infrastructures/database/postgres/pool.js';
import LikeRepositoryPostgres from '../../../src/Infrastructures/repository/LikeRepositoryPostgres.js';

describe('LikeRepositoryPostgres', () => {
  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addLike function', () => {
    it('should persist like and add it correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

      const fakeIdGenerator = () => '123';
      const repo = new LikeRepositoryPostgres(pool, fakeIdGenerator);

      await repo.addLike('comment-123', 'user-123');

      const likes = await LikesTableTestHelper.findLikeById('like-123');
      expect(likes).toHaveLength(1);
      expect(likes[0].comment_id).toEqual('comment-123');
      expect(likes[0].user_id).toEqual('user-123');
    });
  });

  describe('checkLikeIsExists function', () => {
    it('should return true if like exists', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      await LikesTableTestHelper.addLike({ id: 'like-123', userId: 'user-123', commentId: 'comment-123' });

      const repo = new LikeRepositoryPostgres(pool, {});
      const isExists = await repo.checkLikeIsExists('comment-123', 'user-123');
      expect(isExists).toEqual(true);
    });

    it('should return false if like not exists', async () => {
      const repo = new LikeRepositoryPostgres(pool, {});
      const isExists = await repo.checkLikeIsExists('comment-123', 'user-123');
      expect(isExists).toEqual(false);
    });
  });

  describe('deleteLike function', () => {
    it('should delete like correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      await LikesTableTestHelper.addLike({ id: 'like-123', userId: 'user-123', commentId: 'comment-123' });

      const repo = new LikeRepositoryPostgres(pool, {});
      await repo.deleteLike('comment-123', 'user-123');

      const likes = await LikesTableTestHelper.findLikeById('like-123');
      expect(likes).toHaveLength(0);
    });
  });
});
