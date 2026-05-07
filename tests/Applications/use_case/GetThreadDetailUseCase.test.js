/* eslint-disable camelcase */
import { describe, it, expect, vi } from 'vitest';
import ThreadRepository from '../../../src/Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../src/Domains/comments/CommentRepository.js';
import ReplyRepository from '../../../src/Domains/replies/ReplyRepository.js';
import GetThreadDetailUseCase from '../../../src/Applications/use_case/GetThreadDetailUseCase.js';

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    const threadId = 'thread-123';

    const mockThread = {
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    const mockComments = [
      {
        id: 'comment-1',
        username: 'johndoe',
        date: '2021-08-08T07:22:33.555Z',
        content: 'sebuah comment',
        is_delete: false,
        likeCount: "1",
      },
      {
        id: 'comment-2',
        username: 'dicoding',
        date: '2021-08-08T07:26:21.338Z',
        content: 'rahasia',
        is_delete: true,
        likeCount: "0",
      }
    ];

    const mockReplies = [
      {
        id: 'reply-1',
        comment_id: 'comment-1',
        content: 'sebuah balasan',
        date: '2021-08-08T08:07:01.522Z',
        username: 'dicoding',
        is_delete: false,
      },
      {
        id: 'reply-2',
        comment_id: 'comment-1',
        content: 'rahasia',
        date: '2021-08-08T08:08:01.522Z',
        username: 'johndoe',
        is_delete: true,
      }
    ];

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = vi.fn().mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = vi.fn().mockImplementation(() => Promise.resolve(mockComments));
    mockReplyRepository.getRepliesByThreadId = vi.fn().mockImplementation(() => Promise.resolve(mockReplies));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    const threadDetail = await getThreadDetailUseCase.execute(threadId);

    expect(threadDetail).toStrictEqual({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-1',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
          likeCount: 1,
          replies: [
            {
              id: 'reply-1',
              content: 'sebuah balasan',
              date: '2021-08-08T08:07:01.522Z',
              username: 'dicoding',
            },
            {
              id: 'reply-2',
              content: '**balasan telah dihapus**',
              date: '2021-08-08T08:08:01.522Z',
              username: 'johndoe',
            }
          ]
        },
        {
          id: 'comment-2',
          username: 'dicoding',
          date: '2021-08-08T07:26:21.338Z',
          content: '**komentar telah dihapus**',
          likeCount: 0,
          replies: []
        }
      ]
    });
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
    expect(mockReplyRepository.getRepliesByThreadId).toBeCalledWith(threadId);
  });
});
