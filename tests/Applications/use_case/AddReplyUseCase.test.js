import { describe, it, expect, vi } from 'vitest';
import AddedReply from '../../../src/Domains/replies/entities/AddedReply.js';
import ReplyRepository from '../../../src/Domains/replies/ReplyRepository.js';
import CommentRepository from '../../../src/Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../src/Domains/threads/ThreadRepository.js';
import AddReplyUseCase from '../../../src/Applications/use_case/AddReplyUseCase.js';
import NewReply from '../../../src/Domains/replies/entities/NewReply.js';

describe('AddReplyUseCase', () => {
  it('should orchestrating the add reply action correctly', async () => {
    const useCasePayload = { content: 'content' };
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    const useCaseCredentials = 'user-123';

    const mockAddedReply = new AddedReply({
      id: 'reply-123',
      content: useCasePayload.content,
      owner: useCaseCredentials,
    });

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyThreadAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockReplyRepository.addReply = vi.fn().mockImplementation(() => Promise.resolve(mockAddedReply));

    const addReplyUseCase = new AddReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    const addedReply = await addReplyUseCase.execute(useCasePayload, threadId, commentId, useCaseCredentials);

    expect(addedReply).toStrictEqual(new AddedReply({
      id: 'reply-123',
      content: useCasePayload.content,
      owner: useCaseCredentials,
    }));
    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith(threadId);
    expect(mockCommentRepository.verifyCommentAvailability).toBeCalledWith(commentId);
    expect(mockReplyRepository.addReply).toBeCalledWith(new NewReply({
      content: useCasePayload.content,
      commentId,
      owner: useCaseCredentials,
    }));
  });
});
