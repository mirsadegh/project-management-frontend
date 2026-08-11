import React, { useState, useEffect, FormEvent } from 'react';
// 1. سرویس api خود را وارد کنید
import api from '../services/api';
import { formatDateTime } from '../utils/labels';

// 2. تعریف تایپ‌ها برای داده‌ها
interface Author {
  username: string;
}

interface Reaction {
  reaction_type: string; // مثلاً 'LIKE', 'LOVE'
  // ... فیلدهای دیگر مربوط به ری‌اکشن
}

// این تایپ به صورت بازگشتی (recursive) تعریف شده است چون یک کامنت می‌تواند شامل ریپلای (کامنت‌های فرزند) باشد
interface Comment {
  id: number;
  author: Author;
  text: string;
  created_at: string; // معمولاً به فرمت ISO 8601 از سرور می‌آید
  is_edited: boolean;
  reactions?: Reaction[]; // اختیاری
  replies?: Comment[]; // اختیاری و بازگشتی
}

// 3. تعریف تایپ برای props کامپوننت
interface CommentSectionProps {
  contentType: string;
  objectId: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ contentType, objectId }) => {
  // 4. تایپ کردن state ها
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchComments();
  }, [contentType, objectId]);

  const fetchComments = async (): Promise<void> => {
    try {
      // 5. استفاده از سرویس api و params برای تمیزتر شدن URL
      const response = await api.get<{ results: Comment[] } | Comment[]>('/comments/comments/', {
        params: {
          content_type: contentType,
          object_id: objectId,
          top_level: 'true',
        },
      });
      // بررسی اینکه آیا پاسخ paginated است یا خیر
      setComments(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      // استفاده از سرویس api برای ارسال کامنت جدید
      await api.post('/comments/comments/', {
        text: newComment,
        content_type: contentType,
        object_id: objectId,
      });

      setNewComment('');
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('ارسال نظر ناموفق بود');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (commentId: number, reactionType: string): Promise<void> => {
    try {
      // استفاده از سرویس api برای ری‌اکشن
      await api.post(`/comments/comments/${commentId}/react/`, { reaction_type: reactionType });
      fetchComments(); // Refresh to show new reaction
    } catch (error) {
      console.error('Error reacting to comment:', error);
    }
  };

  if (loading) {
    return <div>در حال بارگذاری نظرات...</div>;
  }

  return (
    <div className="comment-section">
      <h3>نظرات ({comments.length})</h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="نظر خود را بنویسید... (برای اشاره به کسی از @username استفاده کنید)"
          rows={3} // بهتر است به صورت عددی داده شود
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !newComment.trim()}>
          {submitting ? 'در حال ارسال...' : 'ارسال نظر'}
        </button>
      </form>

      {/* Comments List */}
      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <strong>{comment.author.username}</strong>
              <span className="comment-date">
                {formatDateTime(comment.created_at)}
              </span>
              {comment.is_edited && <span className="edited">(ویرایش‌شده)</span>}
            </div>
            
            <div className="comment-text">{comment.text}</div>
            
            <div className="comment-actions">
              <button onClick={() => handleReact(comment.id, 'LIKE')}>
                👍 {comment.reactions?.filter(r => r.reaction_type === 'LIKE').length || 0}
              </button>
              <button onClick={() => handleReact(comment.id, 'LOVE')}>
                ❤️ {comment.reactions?.filter(r => r.reaction_type === 'LOVE').length || 0}
              </button>
              <button>پاسخ</button>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="replies">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="comment reply">
                    <div className="comment-header">
                      <strong>{reply.author.username}</strong>
                      <span className="comment-date">
                        {new Date(reply.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="comment-text">{reply.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;


