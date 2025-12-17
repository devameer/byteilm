import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import gitService from '../services/gitService';
import { ExclamationTriangleIcon, ArrowPathIcon, CommandLineIcon, CircleStackIcon } from '@heroicons/react/24/outline';

function GitTools() {
    const { darkMode } = useTheme();
    const [loading, setLoading] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [showConfirm, setShowConfirm] = useState(null);

    const executeCommand = async (command, serviceFn) => {
        setLoading(command);
        setError('');
        setOutput('');
        setShowConfirm(null);
        try {
            const response = await serviceFn();
            if (response.success) {
                const logs = [];
                if (response.output) {
                    logs.push(`Output:\n${response.output}`);
                }
                if (response.error) {
                    logs.push(`Error output:\n${response.error}`);
                }
                setOutput(logs.join('\n\n'));
            } else {
                setError(response.message || 'حدث خطأ أثناء تنفيذ الأمر');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تنفيذ الأمر');
        } finally {
            setLoading('');
        }
    };

    const commands = [
        {
            id: 'pull',
            label: 'جلب آخر التغييرات',
            command: 'git pull',
            action: () => executeCommand('pull', gitService.pullLatest),
            icon: ArrowPathIcon,
            color: 'blue',
            warning: null
        },
        {
            id: 'composer',
            label: 'تثبيت الاعتماديات',
            command: 'composer install',
            action: () => executeCommand('composer', gitService.composerInstall),
            icon: CommandLineIcon,
            color: 'green',
            warning: 'سيتم تثبيت جميع اعتماديات PHP. قد يستغرق عدة دقائق.'
        },
        {
            id: 'migrate',
            label: 'تشغيل الترحيلات',
            command: 'php artisan migrate',
            action: () => executeCommand('migrate', gitService.migrate),
            icon: CircleStackIcon,
            color: 'yellow',
            warning: 'سيتم تطبيق جميع الترحيلات الجديدة على قاعدة البيانات.'
        },
        {
            id: 'fresh',
            label: 'إعادة إنشاء قاعدة البيانات',
            command: 'php artisan migrate:fresh --seed',
            action: () => executeCommand('fresh', gitService.migrateFresh),
            icon: ExclamationTriangleIcon,
            color: 'red',
            warning: '⚠️ تحذير خطير! سيتم حذف جميع البيانات وإعادة إنشاء قاعدة البيانات من الصفر. هذا الإجراء لا يمكن التراجع عنه!'
        }
    ];

    const getButtonClasses = (color, isLoading) => {
        const baseClasses = 'flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed';
        
        const colorClasses = {
            blue: 'bg-blue-600 hover:bg-blue-700 text-white',
            green: 'bg-green-600 hover:bg-green-700 text-white',
            yellow: 'bg-yellow-600 hover:bg-yellow-700 text-white',
            red: 'bg-red-600 hover:bg-red-700 text-white'
        };
        
        return `${baseClasses} ${colorClasses[color]}`;
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className={`text-3xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>أدوات Git والأوامر</h1>
                    <p className={`mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>تنفيذ عمليات Git والأوامر الشائعة مباشرة من الواجهة</p>
                </div>

                {/* Command Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {commands.map((cmd) => (
                        <div 
                            key={cmd.id}
                            className={`p-5 rounded-xl border ${
                                darkMode 
                                    ? 'bg-gray-800 border-gray-700' 
                                    : 'bg-white border-gray-200'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        cmd.color === 'red' 
                                            ? 'bg-red-100 text-red-600' 
                                            : cmd.color === 'yellow'
                                                ? 'bg-yellow-100 text-yellow-600'
                                                : cmd.color === 'green'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        <cmd.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${
                                            darkMode ? 'text-gray-200' : 'text-gray-800'
                                        }`}>{cmd.label}</h3>
                                        <code className={`text-xs ${
                                            darkMode ? 'text-gray-500' : 'text-gray-500'
                                        }`}>{cmd.command}</code>
                                    </div>
                                </div>
                            </div>

                            {cmd.warning && (
                                <div className={`mb-3 p-3 rounded-lg text-sm ${
                                    cmd.color === 'red'
                                        ? darkMode 
                                            ? 'bg-red-900/30 text-red-300 border border-red-800'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                        : darkMode
                                            ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-800'
                                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                }`}>
                                    {cmd.warning}
                                </div>
                            )}

                            {showConfirm === cmd.id ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={cmd.action}
                                        disabled={loading}
                                        className={getButtonClasses(cmd.color, loading === cmd.id)}
                                    >
                                        {loading === cmd.id ? 'جاري التنفيذ...' : 'تأكيد التنفيذ'}
                                    </button>
                                    <button
                                        onClick={() => setShowConfirm(null)}
                                        className={`px-4 py-3 rounded-lg font-medium ${
                                            darkMode 
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => cmd.warning ? setShowConfirm(cmd.id) : cmd.action()}
                                    disabled={loading}
                                    className={getButtonClasses(cmd.color, loading === cmd.id)}
                                >
                                    {loading === cmd.id && (
                                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    )}
                                    {loading === cmd.id ? 'جاري التنفيذ...' : 'تنفيذ'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Error Display */}
                {error && (
                    <div className={`p-4 border rounded-lg whitespace-pre-wrap ${
                        darkMode
                            ? 'bg-red-900/30 border-red-800 text-red-300'
                            : 'bg-red-100 border-red-200 text-red-700'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            <span className="font-medium">خطأ</span>
                        </div>
                        {error}
                    </div>
                )}

                {/* Output Display */}
                {output && (
                    <div className="space-y-2">
                        <h3 className={`font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>نتائج التنفيذ:</h3>
                        <div className="bg-black text-green-200 rounded-lg shadow p-4 whitespace-pre-wrap overflow-x-auto text-sm font-mono">
                            {output}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!output && !error && !loading && (
                    <div className={`rounded-lg shadow p-8 text-center ${
                        darkMode ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-500'
                    }`}>
                        <CommandLineIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>اختر أحد الأوامر أعلاه لتنفيذه وعرض النتائج هنا.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GitTools;
