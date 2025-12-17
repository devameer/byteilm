import React from 'react';
import EmptyState from './EmptyState';
import {
  ClipboardDocumentListIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  BellIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  CalendarIcon,
  InboxIcon
} from '@heroicons/react/24/outline';

/**
 * No Tasks Empty State
 */
export const NoTasks = ({ onCreateTask, size = 'md' }) => (
  <EmptyState
    icon={ClipboardDocumentListIcon}
    title="لا توجد مهام بعد"
    description="ابدأ بإضافة مهمتك الأولى وتنظيم عملك بشكل أفضل. استخدم المهام لتتبع تقدمك وتحقيق أهدافك."
    action={onCreateTask}
    actionLabel="إنشاء مهمة جديدة"
    size={size}
  />
);

/**
 * No Projects Empty State
 */
export const NoProjects = ({ onCreateProject, size = 'md' }) => (
  <EmptyState
    icon={FolderIcon}
    title="لا توجد مشاريع"
    description="أنشئ مشروعك الأول وابدأ في تنظيم مهامك. المشاريع تساعدك على تجميع المهام ذات الصلة معاً."
    action={onCreateProject}
    actionLabel="إنشاء مشروع جديد"
    size={size}
  />
);

/**
 * No Search Results Empty State
 */
export const NoSearchResults = ({ query, onClearSearch, size = 'md' }) => (
  <EmptyState
    icon={MagnifyingGlassIcon}
    title="لا توجد نتائج"
    description={query ? `لم نعثر على نتائج لـ "${query}". جرب البحث بكلمات مختلفة أو تحقق من الإملاء.` : 'لم نعثر على أي نتائج.'}
    action={onClearSearch}
    actionLabel="مسح البحث"
    size={size}
  />
);

/**
 * No Notifications Empty State
 */
export const NoNotifications = ({ size = 'md' }) => (
  <EmptyState
    icon={BellIcon}
    title="لا توجد إشعارات"
    description="ستظهر هنا جميع إشعاراتك الجديدة. سنبقيك على اطلاع بكل ما يهمك."
    size={size}
  />
);

/**
 * No Team Members Empty State
 */
export const NoTeamMembers = ({ onInviteMembers, size = 'md' }) => (
  <EmptyState
    icon={UserGroupIcon}
    title="لا يوجد أعضاء في الفريق"
    description="ادعُ زملاءك للانضمام إلى فريقك والتعاون على المشاريع معاً."
    action={onInviteMembers}
    actionLabel="دعوة أعضاء"
    size={size}
  />
);

/**
 * No Courses Empty State
 */
export const NoCourses = ({ onCreateCourse, size = 'md' }) => (
  <EmptyState
    icon={AcademicCapIcon}
    title="لا توجد دورات تعليمية"
    description="أنشئ دورتك التعليمية الأولى وابدأ رحلة التعلم. نظم محتواك التعليمي بشكل احترافي."
    action={onCreateCourse}
    actionLabel="إنشاء دورة جديدة"
    size={size}
  />
);

/**
 * No Lessons Empty State
 */
export const NoLessons = ({ onCreateLesson, size = 'md' }) => (
  <EmptyState
    icon={BookOpenIcon}
    title="لا توجد دروس"
    description="أضف درسك الأول إلى الدورة. يمكنك إضافة فيديوهات، نصوص، وملفات تعليمية."
    action={onCreateLesson}
    actionLabel="إضافة درس جديد"
    size={size}
  />
);

/**
 * No Categories Empty State
 */
export const NoCategories = ({ onCreateCategory, size = 'md' }) => (
  <EmptyState
    icon={FolderIcon}
    title="لا توجد فئات"
    description="أنشئ فئات لتنظيم دوراتك التعليمية بشكل أفضل وسهولة الوصول إليها."
    action={onCreateCategory}
    actionLabel="إنشاء فئة جديدة"
    size={size}
  />
);

/**
 * No Prompts Empty State
 */
export const NoPrompts = ({ onCreatePrompt, size = 'md' }) => (
  <EmptyState
    icon={RocketLaunchIcon}
    title="لا توجد قوالب نصوص"
    description="أنشئ قالب نصك الأول لتسهيل عملك مع الذكاء الاصطناعي."
    action={onCreatePrompt}
    actionLabel="إنشاء قالب جديد"
    size={size}
  />
);

/**
 * No Comments Empty State
 */
export const NoComments = ({ size = 'sm' }) => (
  <EmptyState
    icon={ChatBubbleLeftRightIcon}
    title="لا توجد تعليقات"
    description="كن أول من يضيف تعليقاً على هذه المهمة."
    size={size}
  />
);

/**
 * No Media Empty State
 */
export const NoMedia = ({ onUploadMedia, size = 'md' }) => (
  <EmptyState
    icon={PhotoIcon}
    title="لا توجد ملفات وسائط"
    description="قم برفع الصور، الفيديوهات، أو المستندات الخاصة بك."
    action={onUploadMedia}
    actionLabel="رفع ملف"
    size={size}
  />
);

/**
 * No Calendar Events Empty State
 */
export const NoCalendarEvents = ({ onCreateEvent, size = 'md' }) => (
  <EmptyState
    icon={CalendarIcon}
    title="لا توجد فعاليات"
    description="لا توجد فعاليات مجدولة لهذا اليوم. أضف فعالية جديدة للبقاء منظماً."
    action={onCreateEvent}
    actionLabel="إضافة فعالية"
    size={size}
  />
);

/**
 * No Shared Resources Empty State
 */
export const NoSharedResources = ({ onShareResource, size = 'md' }) => (
  <EmptyState
    icon={InboxIcon}
    title="لا توجد موارد مشتركة"
    description="شارك الملفات والموارد مع فريقك لتسهيل التعاون."
    action={onShareResource}
    actionLabel="مشاركة مورد"
    size={size}
  />
);

/**
 * Loading Empty State
 */
export const LoadingState = ({ message = "جاري التحميل..." }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
    <div className="w-16 h-16 mb-4">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"></div>
    </div>
    <p className="text-gray-600 dark:text-gray-400 animate-pulse-soft">{message}</p>
  </div>
);

/**
 * Error State
 */
export const ErrorState = ({ error, onRetry, onGoHome }) => (
  <EmptyState
    icon={MagnifyingGlassIcon}
    title="حدث خطأ"
    description={typeof error === 'string' ? error : "عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."}
    action={onRetry}
    actionLabel="إعادة المحاولة"
    secondaryAction={onGoHome}
    secondaryActionLabel="العودة للرئيسية"
    size="md"
  />
);

export default EmptyState;
