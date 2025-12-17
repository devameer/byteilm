import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Query keys
export const quizKeys = {
  all: ['quizzes'],
  lists: () => [...quizKeys.all, 'list'],
  lessonQuizzes: (lessonId) => [...quizKeys.all, 'lesson', lessonId],
  details: () => [...quizKeys.all, 'detail'],
  detail: (id) => [...quizKeys.details(), id],
  attempt: (attemptId) => ['quiz-attempts', attemptId],
  results: (attemptId) => ['quiz-attempts', attemptId, 'results'],
};

// Quiz API functions
const quizApi = {
  getQuizzes: (filters) => axios.get('/quizzes', { params: filters }).then(res => res.data),
  getLessonQuizzes: (lessonId) => axios.get(`/lessons/${lessonId}/quizzes`).then(res => res.data),
  generateQuiz: (lessonId, options) => axios.post(`/lessons/${lessonId}/quizzes/generate`, options).then(res => res.data),
  deleteQuiz: (quizId) => axios.delete(`/quizzes/${quizId}`).then(res => res.data),
  startQuiz: (quizId) => axios.post(`/quizzes/${quizId}/start`).then(res => res.data),
  saveAnswer: (attemptId, data) => axios.post(`/quiz-attempts/${attemptId}/answer`, data).then(res => res.data),
  submitQuiz: (attemptId) => axios.post(`/quiz-attempts/${attemptId}/submit`).then(res => res.data),
  getResults: (attemptId) => axios.get(`/quiz-attempts/${attemptId}/results`).then(res => res.data),
};

/**
 * Hook to fetch quizzes
 */
export const useQuizzes = (filters = {}) => {
  return useQuery({
    queryKey: quizKeys.lists(),
    queryFn: () => quizApi.getQuizzes(filters),
  });
};

/**
 * Hook to fetch lesson quizzes
 */
export const useLessonQuizzes = (lessonId) => {
  return useQuery({
    queryKey: quizKeys.lessonQuizzes(lessonId),
    queryFn: () => quizApi.getLessonQuizzes(lessonId),
    enabled: !!lessonId,
  });
};

/**
 * Hook to fetch quiz results
 */
export const useQuizResults = (attemptId) => {
  return useQuery({
    queryKey: quizKeys.results(attemptId),
    queryFn: () => quizApi.getResults(attemptId),
    enabled: !!attemptId,
  });
};

/**
 * Hook to generate quiz
 */
export const useGenerateQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, options }) => quizApi.generateQuiz(lessonId, options),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lessonQuizzes(lessonId) });
    },
  });
};

/**
 * Hook to delete quiz
 */
export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quizId) => quizApi.deleteQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
};

/**
 * Hook to start a quiz
 */
export const useStartQuiz = () => {
  return useMutation({
    mutationFn: (quizId) => quizApi.startQuiz(quizId),
  });
};

/**
 * Hook to save quiz answer
 */
export const useSaveQuizAnswer = () => {
  return useMutation({
    mutationFn: ({ attemptId, questionId, answer, timeSpent }) => 
      quizApi.saveAnswer(attemptId, { question_id: questionId, answer, time_spent: timeSpent }),
  });
};

/**
 * Hook to submit quiz
 */
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attemptId) => quizApi.submitQuiz(attemptId),
    onSuccess: (_, attemptId) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.results(attemptId) });
    },
  });
};
