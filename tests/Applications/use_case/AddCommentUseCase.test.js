import { describe, it, expect, vi } from 'vitest';
import AddedComment from '../../../src/Domains/comments/entities/AddedComment.js';
import CommentRepository from '../../../src/Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../src/Domains/threads/ThreadRepository.js';
import AddCommentUseCase from '../../../src/Applications/use_case/AddCommentUseCase.js';
import NewComment from '../../../src/Domains/comments/entities/NewComment.js';

describe('AddCommentUseCase', () => {
  it('should orchestrating the add comment action correctly', async () => {
    const useCasePayload = { content: 'content' };
    const threadId = 'thread-123';
    const useCaseCredentials = 'user-123';

    const mockAddedComment = new AddedComment({
      id: 'comment-123',
      content: useCasePayload.content,
      owner: useCaseCredentials,
    });

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.addComment = vi.fn().mockImplementation(() => Promise.resolve(mockAddedComment));

    const addCommentUseCase = new AddCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    const addedComment = await addCommentUseCase.execute(useCasePayload, threadId, useCaseCredentials);

    expect(addedComment).toStrictEqual(new AddedComment({
      id: 'comment-123',
      content: useCasePayload.content,
      owner: useCaseCredentials,
    }));
    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith(threadId);
    expect(mockCommentRepository.addComment).toBeCalledWith(new NewComment({
      content: useCasePayload.content,
      threadId,
      owner: useCaseCredentials,
    }));
  });
});
