import { describe, it, expect, vi } from 'vitest';
import AddedThread from '../../../src/Domains/threads/entities/AddedThread.js';
import ThreadRepository from '../../../src/Domains/threads/ThreadRepository.js';
import AddThreadUseCase from '../../../src/Applications/use_case/AddThreadUseCase.js';
import NewThread from '../../../src/Domains/threads/entities/NewThread.js';

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread action correctly', async () => {
    const useCasePayload = {
      title: 'dicoding',
      body: 'secret',
    };
    const useCaseCredentials = 'user-123';

    const mockAddedThread = new AddedThread({
      id: 'thread-123',
      title: useCasePayload.title,
      owner: useCaseCredentials,
    });

    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.addThread = vi.fn()
      .mockImplementation(() => Promise.resolve(mockAddedThread));

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    const addedThread = await addThreadUseCase.execute(useCasePayload, useCaseCredentials);

    expect(addedThread).toStrictEqual(new AddedThread({
      id: 'thread-123',
      title: useCasePayload.title,
      owner: useCaseCredentials,
    }));
    expect(mockThreadRepository.addThread).toBeCalledWith(new NewThread({
      title: useCasePayload.title,
      body: useCasePayload.body,
      owner: useCaseCredentials,
    }));
  });
});
