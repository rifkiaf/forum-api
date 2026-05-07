import NewComment from '../../Domains/comments/entities/NewComment.js';

class AddCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload, threadId, useCaseCredentials) {
    const newComment = new NewComment({
      ...useCasePayload,
      threadId,
      owner: useCaseCredentials,
    });
    await this._threadRepository.verifyThreadAvailability(threadId);
    return this._commentRepository.addComment(newComment);
  }
}
export default AddCommentUseCase;
