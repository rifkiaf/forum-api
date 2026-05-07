import { describe, it, expect, vi } from 'vitest';
import ReplyRepository from '../../../src/Domains/replies/ReplyRepository.js';
import CommentRepository from '../../../src/Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../src/Domains/threads/ThreadRepository.js';
import DeleteReplyUseCase from '../../../src/Applications/use_case/DeleteReplyUseCase.js';

describe('DeleteReplyUseCase', () => {
  it('should orchestrating the delete reply action correctly', async () => {
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    const replyId = 'reply-123';
    const useCaseCredentials = 'user-123';

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyThreadAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyOwner = vi.fn().mockImplementation(() => Promise.resolve());
    mockReplyRepository.deleteReply = vi.fn().mockImplementation(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    await deleteReplyUseCase.execute(threadId, commentId, replyId, useCaseCredentials);

    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith(threadId);
    expect(mockCommentRepository.verifyCommentAvailability).toBeCalledWith(commentId);
    expect(mockReplyRepository.verifyReplyAvailability).toBeCalledWith(replyId);
    expect(mockReplyRepository.verifyReplyOwner).toBeCalledWith(replyId, useCaseCredentials);
    expect(mockReplyRepository.deleteReply).toBeCalledWith(replyId);
  });
});
