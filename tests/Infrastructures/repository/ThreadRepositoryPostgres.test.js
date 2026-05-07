import { describe, it, expect, afterAll, afterEach } from 'vitest';
import ThreadsTableTestHelper from '../../ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../UsersTableTestHelper.js';
import pool from '../../../src/Infrastructures/database/postgres/pool.js';
import ThreadRepositoryPostgres from '../../../src/Infrastructures/repository/ThreadRepositoryPostgres.js';
import NewThread from '../../../src/Domains/threads/entities/NewThread.js';
import AddedThread from '../../../src/Domains/threads/entities/AddedThread.js';
import NotFoundError from '../../../src/Commons/exceptions/NotFoundError.js';

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist new thread and return added thread correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-thread3', username: 'dicodingthread3' });

      const newThread = new NewThread({
        title: 'dicoding',
        body: 'secret',
        owner: 'user-thread3',
      });

      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      const threads = await ThreadsTableTestHelper.findThreadsById('thread-123');
      expect(threads).toHaveLength(1);
      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: 'dicoding',
        owner: 'user-thread3',
      }));
    });
  });

  describe('verifyThreadAvailability function', () => {
    it('should throw NotFoundError when thread not available', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.verifyThreadAvailability('thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when thread available', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-thread2', username: 'dicodingthread2' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-1234', owner: 'user-thread2' });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.verifyThreadAvailability('thread-1234'))
        .resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('getThreadById function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.getThreadById('thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should return thread detail correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-thread1', username: 'dicodingthread' });
      const date = new Date();
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner: 'user-thread1',
        date: date.toISOString()
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      const thread = await threadRepositoryPostgres.getThreadById('thread-123');

      expect(thread.id).toEqual('thread-123');
      expect(thread.title).toEqual('sebuah thread');
      expect(thread.body).toEqual('sebuah body thread');
      expect(thread.username).toEqual('dicodingthread');
      expect(thread.date).toEqual(expect.any(Date)); // node-pg returns Date object for timestamp
    });
  });
});
