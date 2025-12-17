import React, { useState } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import {
  RocketLaunchIcon,
  FolderPlusIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';

/**
 * Onboarding Flow Component
 * نظام تعليمي تفاعلي للمستخدمين الجدد
 */
const OnboardingFlow = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: RocketLaunchIcon,
      title: 'مرحباً بك في Plan!',
      description: 'نظام إدارة المهام والمشاريع الشامل الذي يساعدك على تنظيم عملك وزيادة إنتاجيتك.',
      image: '/images/onboarding/welcome.svg',
      color: 'from-primary-500 to-accent-500'
    },
    {
      icon: FolderPlusIcon,
      title: 'أنشئ مشروعك الأول',
      description: 'ابدأ بإنشاء مشروع جديد لتجميع المهام المرتبطة معاً. يمكنك إنشاء مشاريع غير محدودة.',
      tips: [
        'حدد اسماً واضحاً للمشروع',
        'اختر لوناً مميزاً لسهولة التعرف عليه',
        'أضف وصفاً تفصيلياً للمشروع'
      ],
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: ClipboardDocumentListIcon,
      title: 'أضف مهامك',
      description: 'أضف المهام إلى مشاريعك وحدد الأولويات والمواعيد النهائية لكل مهمة.',
      tips: [
        'حدد أولوية لكل مهمة',
        'أضف وصفاً تفصيلياً',
        'حدد موعداً نهائياً',
        'أضف علامات للتنظيم'
      ],
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: ChartBarIcon,
      title: 'تتبع التقدم',
      description: 'راقب تقدمك في لوحة التحكم واطلع على إحصائيات مفصلة عن إنتاجيتك.',
      tips: [
        'استخدم لوحة التحكم لمراقبة الأداء',
        'اطلع على الإحصائيات اليومية',
        'حدد أهدافاً وتتبع تحقيقها'
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: UserGroupIcon,
      title: 'تعاون مع فريقك',
      description: 'ادعُ أعضاء فريقك للتعاون على المشاريع والمهام معاً بشكل فعال.',
      tips: [
        'أنشئ فرقاً للمشاريع المختلفة',
        'شارك المهام مع أعضاء الفريق',
        'تابع تقدم الفريق بشكل دوري'
      ],
      color: 'from-orange-500 to-red-500'
    }
  ];

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const handleComplete = () => {
    // حفظ أن المستخدم أكمل التعليمات
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) {
      onComplete();
    }
  };

  const StepIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-strong max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">خطوة {currentStep + 1} من {totalSteps}</span>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="تخطي"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar">
            <div
              className="progress-fill transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentStepData.color} flex items-center justify-center mb-6 animate-float`}>
            <StepIcon className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
            {currentStepData.title}
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Tips */}
          {currentStepData.tips && (
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">💡</span>
                </span>
                نصائح مفيدة
              </h3>
              <ul className="space-y-2">
                {currentStepData.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                    <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Illustration */}
          {currentStepData.image && (
            <div className="rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-8 mb-6">
              <img
                src={currentStepData.image}
                alt={currentStepData.title}
                className="w-full h-48 object-contain opacity-80"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between gap-3">
          {/* Step Indicators */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === currentStep
                    ? 'w-8 bg-primary-600 dark:bg-primary-500'
                    : index < currentStep
                      ? 'bg-primary-300 dark:bg-primary-700'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }
                `}
                aria-label={`الانتقال إلى الخطوة ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="btn btn-outline btn-md"
              >
                السابق
              </button>
            )}

            <button
              onClick={handleNext}
              className="btn btn-primary btn-md min-w-[120px]"
            >
              {isLastStep ? 'ابدأ الآن' : 'التالي'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
