import NewReply from '../../Domains/replies/entities/NewReply.js';

class AddReplyUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload, threadId, commentId, useCaseCredentials) {
    const newReply = new NewReply({
      ...useCasePayload,
      commentId,
      owner: useCaseCredentials,
    });
    await this._threadRepository.verifyThreadAvailability(threadId);
    await this._commentRepository.verifyCommentAvailability(commentId);
    return this._replyRepository.addReply(newReply);
  }
}
export default AddReplyUseCase;
