import { describe, it, expect, vi } from 'vitest';
import ThreadRepository from '../../../src/Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../src/Domains/comments/CommentRepository.js';
import LikeRepository from '../../../src/Domains/likes/LikeRepository.js';
import ToggleLikeCommentUseCase from '../../../src/Applications/use_case/ToggleLikeCommentUseCase.js';

describe('ToggleLikeCommentUseCase', () => {
  it('should orchestrating the add like action correctly if like not exists', async () => {
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.verifyThreadAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockLikeRepository.checkLikeIsExists = vi.fn().mockImplementation(() => Promise.resolve(false));
    mockLikeRepository.addLike = vi.fn().mockImplementation(() => Promise.resolve());

    const toggleLikeUseCase = new ToggleLikeCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository,
    });

    await toggleLikeUseCase.execute('thread-123', 'comment-123', 'user-123');

    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentAvailability).toBeCalledWith('comment-123');
    expect(mockLikeRepository.checkLikeIsExists).toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.addLike).toBeCalledWith('comment-123', 'user-123');
  });

  it('should orchestrating the delete like action correctly if like exists', async () => {
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.verifyThreadAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockLikeRepository.checkLikeIsExists = vi.fn().mockImplementation(() => Promise.resolve(true));
    mockLikeRepository.deleteLike = vi.fn().mockImplementation(() => Promise.resolve());

    const toggleLikeUseCase = new ToggleLikeCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository,
    });

    await toggleLikeUseCase.execute('thread-123', 'comment-123', 'user-123');

    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentAvailability).toBeCalledWith('comment-123');
    expect(mockLikeRepository.checkLikeIsExists).toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.deleteLike).toBeCalledWith('comment-123', 'user-123');
  });
});
