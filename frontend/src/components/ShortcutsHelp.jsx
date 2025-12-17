import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  CommandLineIcon,
  PlusIcon,
  FolderPlusIcon,
  MoonIcon,
  Bars3Icon,
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/solid';
import Modal from './Modal';
import { formatShortcut } from '../hooks/useKeyboardShortcuts';

/**
 * Shortcuts Help Modal
 * نافذة منبثقة تعرض جميع اختصارات لوحة المفاتيح المتاحة
 */
const ShortcutsHelp = ({ isOpen, onClose }) => {
  const shortcutGroups = [
    {
      title: 'اختصارات عامة',
      icon: CommandLineIcon,
      color: 'from-primary-500 to-accent-500',
      shortcuts: [
        {
          keys: ['ctrl', 'k'],
          description: 'فتح لوحة الأوامر',
          icon: CommandLineIcon
        },
        {
          keys: ['ctrl', '/'],
          description: 'عرض الاختصارات',
          icon: QuestionMarkCircleIcon
        },
        {
          keys: ['?'],
          description: 'عرض المساعدة',
          icon: QuestionMarkCircleIcon
        },
        {
          keys: ['esc'],
          description: 'إغلاق النافذة المنبثقة',
          icon: XMarkIcon
        },
        {
          keys: ['/'],
          description: 'التركيز على البحث',
          icon: MagnifyingGlassIcon
        }
      ]
    },
    {
      title: 'المشاريع والمهام',
      icon: FolderPlusIcon,
      color: 'from-blue-500 to-indigo-500',
      shortcuts: [
        {
          keys: ['ctrl', 'n'],
          description: 'إنشاء مهمة جديدة',
          icon: PlusIcon
        },
        {
          keys: ['ctrl', 'p'],
          description: 'إنشاء مشروع جديد',
          icon: FolderPlusIcon
        },
        {
          keys: ['ctrl', 'shift', 'n'],
          description: 'إنشاء مجلد جديد',
          icon: FolderPlusIcon
        }
      ]
    },
    {
      title: 'الواجهة',
      icon: Bars3Icon,
      color: 'from-purple-500 to-pink-500',
      shortcuts: [
        {
          keys: ['ctrl', 'd'],
          description: 'تبديل الوضع الليلي',
          icon: MoonIcon
        },
        {
          keys: ['ctrl', 'b'],
          description: 'فتح/إغلاق القائمة الجانبية',
          icon: Bars3Icon
        }
      ]
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CommandLineIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            اختصارات لوحة المفاتيح
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            استخدم هذه الاختصارات لزيادة إنتاجيتك وتسريع عملك
          </p>
        </div>

        {/* Shortcuts Groups */}
        <div className="space-y-6">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="animate-fade-in-up" style={{ animationDelay: `${groupIndex * 100}ms` }}>
              {/* Group Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${group.color} flex items-center justify-center flex-shrink-0`}>
                  <group.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {group.title}
                </h3>
              </div>

              {/* Shortcuts List */}
              <div className="space-y-2 mr-13">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    {/* Description */}
                    <div className="flex items-center gap-3">
                      {shortcut.icon && (
                        <shortcut.icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      )}
                      <span className="text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                    </div>

                    {/* Keys */}
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-gray-400 dark:text-gray-500 text-xs mx-1">+</span>
                          )}
                          <kbd className="
                            px-2.5 py-1.5
                            text-xs font-bold
                            bg-white dark:bg-gray-900
                            border-2 border-gray-300 dark:border-gray-600
                            rounded-md
                            shadow-sm
                            text-gray-700 dark:text-gray-300
                            min-w-[2rem]
                            text-center
                            group-hover:border-primary-400 dark:group-hover:border-primary-600
                            transition-colors
                          ">
                            {formatShortcut([key])}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Tip */}
        <div className="mt-8 p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl">
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
            💡 <span className="font-medium">نصيحة:</span> يمكنك الضغط على{' '}
            <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
              {formatShortcut(['ctrl', '/'])}
            </kbd>{' '}
            في أي وقت لعرض هذه القائمة
          </p>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="btn btn-primary btn-lg"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ShortcutsHelp;
