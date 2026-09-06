// src/services/queryHooks.ts
import { useQuery } from '@tanstack/react-query';
import { projectService } from './projectService';
import { taskService } from './taskService';
import { teamService } from './teamService';
import { notificationService } from './notificationService';
import { authService } from './authService';

export const useProjects = () =>
  useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });

export const useMyTasks = () =>
  useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => taskService.getMyTasks(),
  });

export const useTeams = () =>
  useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getTeams(),
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 1000 * 30,
  });

export const useProject = (slug: string) =>
  useQuery({
    queryKey: ['project', slug],
    queryFn: () => projectService.getProject(slug),
    enabled: !!slug,
  });

export const useUsers = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: () => authService.getUsers(),
  });

export const useProjectTasks = (projectId: number | undefined) =>
  useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => taskService.getTaskLists(projectId!),
    enabled: !!projectId,
  });