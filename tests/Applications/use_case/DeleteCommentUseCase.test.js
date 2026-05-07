import { describe, it, expect, vi } from 'vitest';
import CommentRepository from '../../../src/Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../src/Domains/threads/ThreadRepository.js';
import DeleteCommentUseCase from '../../../src/Applications/use_case/DeleteCommentUseCase.js';

describe('DeleteCommentUseCase', () => {
  it('should orchestrating the delete comment action correctly', async () => {
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    const useCaseCredentials = 'user-123';

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentOwner = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.deleteComment = vi.fn().mockImplementation(() => Promise.resolve());

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await deleteCommentUseCase.execute(threadId, commentId, useCaseCredentials);

    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith(threadId);
    expect(mockCommentRepository.verifyCommentAvailability).toBeCalledWith(commentId);
    expect(mockCommentRepository.verifyCommentOwner).toBeCalledWith(commentId, useCaseCredentials);
    expect(mockCommentRepository.deleteComment).toBeCalledWith(commentId);
  });
});
