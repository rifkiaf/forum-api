import NewThread from '../../Domains/threads/entities/NewThread.js';

class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, useCaseCredentials) {
    const newThread = new NewThread({
      ...useCasePayload,
      owner: useCaseCredentials,
    });
    return this._threadRepository.addThread(newThread);
  }
}

export default AddThreadUseCase;
