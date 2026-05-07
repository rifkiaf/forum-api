class ToggleLikeCommentUseCase {
  constructor({ threadRepository, commentRepository, likeRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._likeRepository = likeRepository;
  }

  async execute(threadId, commentId, userId) {
    await this._threadRepository.verifyThreadAvailability(threadId);
    await this._commentRepository.verifyCommentAvailability(commentId);

    const isLiked = await this._likeRepository.checkLikeIsExists(commentId, userId);
    if (isLiked) {
      await this._likeRepository.deleteLike(commentId, userId);
    } else {
      await this._likeRepository.addLike(commentId, userId);
    }
  }
}

export default ToggleLikeCommentUseCase;
