import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import gitService from '../services/gitService';

function GitTools() {
    const { darkMode } = useTheme();
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');

    const handlePull = async () => {
        setLoading(true);
        setError('');
        setOutput('');
        try {
            const response = await gitService.pullLatest();
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
            setError(err.response?.data?.message || 'تعذر تنفيذ أمر Git');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>أدوات Git</h1>
                    <p className={`mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>تنفيذ عمليات Git الشائعة مباشرة من الواجهة</p>
                </div>
                <button
                    onClick={handlePull}
                    disabled={loading}
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {loading ? 'جاري التحديث...' : 'جلب آخر التغييرات'}
                </button>
            </div>

            {error && (
                <div className={`p-4 border rounded-lg whitespace-pre-wrap ${
                    darkMode
                        ? 'bg-red-900/30 border-red-800 text-red-300'
                        : 'bg-red-100 border-red-200 text-red-700'
                }`}>
                    {error}
                </div>
            )}

            {output && (
                <div className="bg-black text-green-200 rounded-lg shadow p-4 whitespace-pre-wrap overflow-x-auto text-sm">
                    {output}
                </div>
            )}

            {!output && !error && !loading && (
                <div className={`rounded-lg shadow p-8 text-center ${
                    darkMode ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-500'
                }`}>
                    اضغط على زر "جلب آخر التغييرات" لتنفيذ العملية وعرض النتائج هنا.
                </div>
            )}
        </div>
        </div>
    );
}

export default GitTools;
