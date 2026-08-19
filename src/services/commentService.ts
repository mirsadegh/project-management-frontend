import api from './api';
import { unwrapList } from './pagination';

export interface CommentAuthor {
  id?: number;
  username: string;
  full_name?: string;
  email?: string;
}

export interface CommentReaction {
  id: number;
  user?: CommentAuthor;
  reaction_type: string;
  created_at?: string;
}

export interface Comment {
  id: number;
  author: CommentAuthor;
  text: string;
  parent: number | null;
  content_type?: string;
  is_edited: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
  reactions?: CommentReaction[];
  replies?: Comment[];
  reply_count?: number;
  is_reply?: boolean;
}

export interface CommentCreateData {
  text: string;
  content_type: string;
  object_id: number;
  parent?: number | null;
}

export interface CommentStatistics {
  object_type: string;
  object_id: number;
  total_comments: number;
  top_commenters: Array<{
    author__id: number;
    author__username: string;
    author__first_name: string;
    author__last_name: string;
    comment_count: number;
  }>;
}

export const commentService = {
  async getComments(contentType: string, objectId: number, topLevel = true): Promise<Comment[]> {
    const response = await api.get<Comment[] | { results: Comment[] }>('/comments/comments/', {
      params: {
        content_type: contentType,
        object_id: objectId,
        top_level: topLevel ? 'true' : undefined,
      },
    });
    return unwrapList(response.data);
  },

  async getComment(commentId: number): Promise<Comment> {
    const response = await api.get<Comment>(`/comments/comments/${commentId}/`);
    return response.data;
  },

  async createComment(data: CommentCreateData): Promise<Comment> {
    const response = await api.post<Comment>('/comments/comments/', data);
    return response.data;
  },

  async updateComment(commentId: number, text: string): Promise<Comment> {
    const response = await api.patch<Comment>(`/comments/comments/${commentId}/`, { text });
    return response.data;
  },

  async deleteComment(commentId: number): Promise<void> {
    await api.delete(`/comments/comments/${commentId}/`);
  },

  async getReactions(commentId: number): Promise<CommentReaction[]> {
    const response = await api.get<CommentReaction[] | { results: CommentReaction[] }>(
      `/comments/comments/${commentId}/reactions/`
    );
    return unwrapList(response.data);
  },

  async react(commentId: number, reactionType: string): Promise<CommentReaction> {
    const response = await api.post<CommentReaction>(
      `/comments/comments/${commentId}/react/`,
      { reaction_type: reactionType }
    );
    return response.data;
  },

  async unreact(commentId: number, reactionType?: string): Promise<void> {
    await api.delete(`/comments/comments/${commentId}/react/`, {
      data: reactionType ? { reaction_type: reactionType } : {},
    });
  },

  async getStatistics(objectType: 'task' | 'project', objectId: number): Promise<CommentStatistics> {
    const response = await api.get<CommentStatistics>(
      `/comments/comments/statistics/${objectType}/${objectId}/`
    );
    return response.data;
  },
};
