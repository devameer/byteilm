import React, { lazy } from "react";

// Public Pages
const LandingPage = lazy(() => import("../pages/landing/Landing"));
const FeaturesPage = lazy(() => import("../pages/landing/Features.jsx"));
const LoginPage = lazy(() => import("../pages/auth/Login"));
const RegisterPage = lazy(() => import("../pages/auth/Register"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPassword"));

// Protected Pages
const DashboardPage = lazy(() => import("../pages/Dashboard"));
const CalendarPage = lazy(() => import("../pages/Calendar.jsx"));
const TasksPage = lazy(() => import("../features/tasks/pages/TasksPage.jsx"));
const TaskDetailsPage = lazy(() => import("../pages/TaskDetails"));
const CoursesPage = lazy(() => import("../pages/Courses"));
const CourseDetailsPage = lazy(() => import("../pages/CourseDetails"));
const ProjectsPage = lazy(() => import("../pages/Projects"));
const ProjectDetailsPage = lazy(() => import("../pages/ProjectDetails"));
const TeamsPage = lazy(() => import("../pages/Teams"));
const CategoriesPage = lazy(() => import("../pages/Categories"));
const CategoryDetailsPage = lazy(() => import("../pages/CategoryDetails"));
const LessonsPage = lazy(() => import("../pages/Lessons"));
const LessonMediaPage = lazy(() => import("../pages/LessonMedia"));
const MediaLibraryPage = lazy(() => import("../pages/MediaLibrary"));
const PromptsPage = lazy(() => import("../pages/Prompts"));
const GitToolsPage = lazy(() => import("../pages/GitTools"));
const ReferralsPage = lazy(() => import("../pages/Referrals"));
const NotificationsPage = lazy(() => import("../pages/Notifications"));
const SharedResourcesPage = lazy(() => import("../pages/SharedResources"));
const KanbanBoardPage = lazy(() => import("../pages/KanbanBoard"));
const JoinTeamPage = lazy(() => import("../pages/JoinTeam"));

// New Pages
const GoalsPage = lazy(() => import("../pages/Goals"));
const IntegrationsPage = lazy(() => import("../pages/Integrations"));
const ProductivityReportPage = lazy(() => import("../pages/ProductivityReport"));
const AIAssistantPage = lazy(() => import("../pages/AIAssistantDashboard"));
const QuizTakePage = lazy(() => import("../pages/QuizTake"));
const QuizResultsPage = lazy(() => import("../pages/QuizResults"));

export const publicRoutes = [
  { path: "/", element: <LandingPage /> },
  { path: "/features", element: <FeaturesPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/teams/join/:token", element: <JoinTeamPage /> },
];

export const privateRoutes = [
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/calendar", element: <CalendarPage /> },
  { path: "/tasks", element: <TasksPage /> },
  { path: "/tasks/:id", element: <TaskDetailsPage /> },
  { path: "/courses", element: <CoursesPage /> },
  { path: "/courses/:id", element: <CourseDetailsPage /> },
  { path: "/projects", element: <ProjectsPage /> },
  { path: "/projects/:id", element: <ProjectDetailsPage /> },
  { path: "/teams", element: <TeamsPage /> },
  { path: "/categories", element: <CategoriesPage /> },
  { path: "/categories/:id", element: <CategoryDetailsPage /> },
  { path: "/lessons", element: <LessonsPage /> },
  { path: "/lessons/:id/media", element: <LessonMediaPage /> },
  { path: "/media-library", element: <MediaLibraryPage /> },
  { path: "/prompts", element: <PromptsPage /> },
  { path: "/git-tools", element: <GitToolsPage /> },
  { path: "/referrals", element: <ReferralsPage /> },
  { path: "/notifications", element: <NotificationsPage /> },
  { path: "/shared-resources/:teamId", element: <SharedResourcesPage /> },
  { path: "/kanban", element: <KanbanBoardPage /> },
  // New Pages
  { path: "/goals", element: <GoalsPage /> },
  { path: "/integrations", element: <IntegrationsPage /> },
  { path: "/productivity-report", element: <ProductivityReportPage /> },
  { path: "/ai-assistant", element: <AIAssistantPage /> },
  { path: "/quizzes/:quizId", element: <QuizTakePage /> },
  { path: "/quiz-results/:attemptId", element: <QuizResultsPage /> },
];
