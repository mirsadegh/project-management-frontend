// src/services/queryHooks.ts
import { useQuery } from '@tanstack/react-query';
import { projectService } from './projectService';
import { taskService } from './taskService';
import { teamService } from './teamService';
import { notificationService } from './notificationService';

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