import { useState, useEffect, useRef } from "react";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner";
import { useTheme } from "../../contexts/ThemeContext";

export default function SubtitleGenerator({ lessonId, video, onSuccess }) {
    const { darkMode } = useTheme();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [transcript, setTranscript] = useState("");
    const [detectedLanguage, setDetectedLanguage] = useState(null);
    const [step, setStep] = useState("idle"); // idle, transcribing, transcribed
    const [showAddTranslations, setShowAddTranslations] = useState(false);
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [translating, setTranslating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStepLabel, setCurrentStepLabel] = useState("");
    const pollingRef = useRef(null);

    // Step labels mapping
    const stepLabels = {
        initializing: "تهيئة العملية...",
        preparing: "تحضير الفيديو...",
        extracting: "استخراج الصوت من الفيديو...",
        encoding: "تحويل الصوت...",
        transcribing: "تفريغ الصوت...",
        completed: "اكتمل التفريغ!",
        failed: "فشل التفريغ",
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    // Supported languages for translation
    const availableLanguages = [
        { code: "ar", name: "العربية" },
        { code: "en", name: "English" },
        { code: "fr", name: "Français" },
        { code: "es", name: "Español" },
        { code: "de", name: "Deutsch" },
        { code: "it", name: "Italiano" },
        { code: "pt", name: "Português" },
        { code: "ru", name: "Русский" },
        { code: "zh", name: "中文" },
        { code: "ja", name: "日本語" },
        { code: "ko", name: "한국어" },
        { code: "tr", name: "Türkçe" },
        { code: "hi", name: "हिन्दी" },
        { code: "ur", name: "اردو" },
    ];

    const handleTranscribe = async () => {
        if (!video) {
            setError("يجب رفع الفيديو أولاً");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            setStep("transcribing");
            setProgress(0);
            setCurrentStepLabel("جاري الاتصال...");

            // Simulate progress while waiting
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev < 90) {
                        const increment = Math.random() * 8 + 2; // Faster progress for audio extraction
                        const newProgress = Math.min(prev + increment, 90);
                        
                        // Update step label based on progress
                        if (newProgress < 30) setCurrentStepLabel("استخراج الصوت من الفيديو...");
                        else if (newProgress < 50) setCurrentStepLabel("تحويل الصوت...");
                        else if (newProgress < 80) setCurrentStepLabel("تفريغ الصوت بالذكاء الاصطناعي...");
                        else setCurrentStepLabel("إنهاء العملية...");
                        
                        return newProgress;
                    }
                    return prev;
                });
            }, 1000); // Faster interval for audio (1 second)

            // Use original synchronous endpoint
            const transcribeResponse = await axios.post(
                `/lessons/${lessonId}/video/transcribe`
            );

            // Stop progress simulation
            clearInterval(progressInterval);
            setProgress(100);
            setCurrentStepLabel("اكتمل التفريغ!");

            if (transcribeResponse.data.success) {
                const transcriptText = transcribeResponse.data.data.transcript;
                setTranscript(transcriptText);
                await processCompletedTranscript(transcriptText);
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "فشل في تفريغ الفيديو"
            );
            setStep("idle");
            setLoading(false);
        }
    };

    const processCompletedTranscript = async (transcriptText) => {
        // Detect language and save
        try {
            const detectResponse = await axios.post(
                `/lessons/${lessonId}/video/detect-language`,
                { text: transcriptText }
            );

            if (detectResponse.data.success) {
                const langInfo = {
                    code: detectResponse.data.data.language_code,
                    name: detectResponse.data.data.language_name,
                };
                setDetectedLanguage(langInfo);

                // Save original transcript
                setSaving(true);
                try {
                    const saveResponse = await axios.post(
                        `/lessons/${lessonId}/video/save-as-subtitle`,
                        {
                            text: transcriptText,
                            language: langInfo.code,
                            language_name: langInfo.name,
                        }
                    );

                    if (saveResponse.data.success) {
                        setSuccess(
                            `تم التفريغ بنجاح! اللغة المكتشفة: ${langInfo.name}`
                        );
                        if (onSuccess) {
                            onSuccess(saveResponse.data.data);
                        }
                    }
                } catch (saveErr) {
                    setError(
                        "تم التفريغ بنجاح لكن فشل حفظ الترجمة: " +
                            (saveErr.response?.data?.message ||
                                "خطأ غير معروف")
                    );
                } finally {
                    setSaving(false);
                }
            }
        } catch (detectErr) {
            // If language detection fails, default to English
            setDetectedLanguage({ code: "en", name: "English" });

            setSaving(true);
            try {
                const saveResponse = await axios.post(
                    `/lessons/${lessonId}/video/save-as-subtitle`,
                    {
                        text: transcriptText,
                        language: "en",
                        language_name: "English",
                    }
                );

                if (saveResponse.data.success) {
                    setSuccess(
                        "تم التفريغ وحفظه كـ English (افتراضي)"
                    );
                    if (onSuccess) {
                        onSuccess(saveResponse.data.data);
                    }
                }
            } catch (saveErr) {
                setError(
                    "تم التفريغ بنجاح لكن فشل حفظ الترجمة: " +
                        (saveErr.response?.data?.message ||
                            "خطأ غير معروف")
                );
            } finally {
                setSaving(false);
            }
        }

        setStep("transcribed");
        setLoading(false);
    };

    const handleAddTranslations = async () => {
        if (selectedLanguages.length === 0) {
            setError("يرجى اختيار لغة واحدة على الأقل");
            return;
        }

        try {
            setTranslating(true);
            setError(null);
            setSuccess(null);

            let successCount = 0;
            let failCount = 0;

            for (const lang of selectedLanguages) {
                try {
                    // Translate
                    const translateResponse = await axios.post(
                        `/lessons/${lessonId}/video/translate`,
                        {
                            text: transcript,
                            target_language: lang.code,
                            target_language_name: lang.name,
                        }
                    );

                    if (translateResponse.data.success) {
                        // Save translation
                        const saveResponse = await axios.post(
                            `/lessons/${lessonId}/video/save-as-subtitle`,
                            {
                                text: translateResponse.data.data
                                    .translated_text,
                                language: lang.code,
                                language_name: lang.name,
                            }
                        );

                        if (saveResponse.data.success) {
                            successCount++;
                            if (onSuccess) {
                                onSuccess(saveResponse.data.data);
                            }
                        } else {
                            failCount++;
                        }
                    } else {
                        failCount++;
                    }
                } catch (err) {
                    failCount++;
                    console.error(
                        `Failed to translate to ${lang.name}:`,
                        err
                    );
                }
            }

            if (successCount > 0) {
                setSuccess(
                    `تم إضافة ${successCount} ترجمة بنجاح!${
                        failCount > 0 ? ` (فشل ${failCount})` : ""
                    }`
                );
                setSelectedLanguages([]);
                setShowAddTranslations(false);
            } else {
                setError("فشل في إضافة الترجمات");
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "حدث خطأ أثناء إضافة الترجمات"
            );
        } finally {
            setTranslating(false);
        }
    };

    const toggleLanguageSelection = (lang) => {
        // Don't allow selecting the detected language
        if (detectedLanguage && lang.code === detectedLanguage.code) {
            return;
        }

        setSelectedLanguages((prev) => {
            const exists = prev.find((l) => l.code === lang.code);
            if (exists) {
                return prev.filter((l) => l.code !== lang.code);
            } else {
                return [...prev, lang];
            }
        });
    };

    const downloadVTT = (text, language) => {
        const vttContent = convertToVTT(text);
        const blob = new Blob([vttContent], {
            type: "text/vtt;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${lessonId}_${language}_subtitles.vtt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const convertToVTT = (text) => {
        let vtt = "WEBVTT\n\n";
        const lines = text.split("\n");
        let counter = 1;
        let currentTime = "00:00:00.000";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const timestampMatch = line.match(
                /\[(\d{1,2}):(\d{2}):(\d{2})\]|\[(\d{1,2}):(\d{2})\]/
            );

            if (timestampMatch) {
                let hours, minutes, seconds;

                if (timestampMatch[1]) {
                    hours = timestampMatch[1].padStart(2, "0");
                    minutes = timestampMatch[2];
                    seconds = timestampMatch[3];
                } else {
                    hours = "00";
                    minutes = timestampMatch[4].padStart(2, "0");
                    seconds = timestampMatch[5];
                }

                const nextTime = `${hours}:${minutes}:${seconds}.000`;
                const textContent = line
                    .replace(/\[[\d:]+\]\s*/, "")
                    .trim();

                if (textContent) {
                    vtt += `${counter}\n`;
                    vtt += `${currentTime} --> ${nextTime}\n`;
                    vtt += `${textContent}\n\n`;
                    counter++;
                    currentTime = nextTime;
                }
            } else if (line) {
                const timeParts = currentTime.split(":");
                const hours = parseInt(timeParts[0]);
                const minutes = parseInt(timeParts[1]);
                const seconds = parseFloat(timeParts[2]);

                const newSeconds = seconds + 3;
                const nextTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${newSeconds.toFixed(3).padStart(6, "0")}`;

                vtt += `${counter}\n`;
                vtt += `${currentTime} --> ${nextTime}\n`;
                vtt += `${line}\n\n`;
                counter++;
                currentTime = nextTime;
            }
        }

        return vtt;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("تم النسخ إلى الحافظة");
    };

    const reset = () => {
        setTranscript("");
        setDetectedLanguage(null);
        setStep("idle");
        setError(null);
        setSuccess(null);
        setShowAddTranslations(false);
        setSelectedLanguages([]);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    تفريغ الفيديو وإنشاء ترجمات
                </h3>
                {step !== "idle" && (
                    <button
                        onClick={reset}
                        className={`text-sm transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        إعادة تعيين
                    </button>
                )}
            </div>

            {error && (
                <div className={`rounded-lg p-4 text-sm border ${darkMode ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {error}
                </div>
            )}

            {success && (
                <div className={`rounded-lg p-4 text-sm border ${darkMode ? 'bg-green-900/30 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {success}
                </div>
            )}

            {!video && (
                <div className={`rounded-lg p-4 text-sm border ${darkMode ? 'bg-yellow-900/30 border-yellow-800 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                    يجب رفع الفيديو أولاً قبل استخدام خاصية التفريغ التلقائي
                </div>
            )}

            {video && step === "idle" && (
                <div className={`rounded-xl p-6 border-2 border-dashed ${darkMode ? 'border-purple-700 bg-purple-900/20' : 'border-purple-200 bg-purple-50/50'}`}>
                    {/* Hero Section */}
                    <div className="text-center mb-6">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${darkMode ? 'bg-purple-800' : 'bg-purple-100'}`}>
                            <svg className={`w-8 h-8 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h4 className={`text-xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            تفريغ تلقائي بالذكاء الاصطناعي
                        </h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            3 خطوات بسيطة فقط
                        </p>
                    </div>

                    {/* Simple Steps */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${darkMode ? 'bg-blue-800 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                                <span className="font-bold">1</span>
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>تفريغ الصوت</p>
                        </div>
                        <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${darkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-600'}`}>
                                <span className="font-bold">2</span>
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>حفظ الترجمة</p>
                        </div>
                        <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${darkMode ? 'bg-purple-800 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                                <span className="font-bold">3</span>
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>ترجمة للغات</p>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleTranscribe}
                        disabled={loading}
                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner />
                                جاري التفريغ...
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ابدأ التفريغ الآن
                            </>
                        )}
                    </button>

                    {/* Features */}
                    <div className={`mt-4 flex items-center justify-center gap-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            دقة عالية
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            توقيت دقيق
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            حفظ تلقائي
                        </span>
                    </div>
                </div>
            )}

            {step === "transcribing" && (
                <div className={`rounded-lg p-6 border ${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex justify-center">
                        <LoadingSpinner />
                    </div>
                    <p className={`mt-4 font-medium text-center ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        {currentStepLabel || "جاري تفريغ الفيديو..."}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className={`flex justify-between text-sm mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            <span>التقدم</span>
                            <span>{progress}%</span>
                        </div>
                        <div className={`w-full rounded-full h-2.5 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    <p className={`mt-4 text-sm text-center ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        هذه العملية قد تستغرق عدة دقائق حسب طول الفيديو
                    </p>
                    <p className={`mt-2 text-xs text-center ${darkMode ? 'text-blue-500' : 'text-blue-500'}`}>
                        لا تقم بإغلاق هذه الصفحة أثناء التفريغ
                    </p>
                </div>
            )}

            {step === "transcribed" && (
                <div className="space-y-4">
                    {/* Success Message */}
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${darkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-800' : 'bg-green-100'}`}>
                            <svg className={`w-6 h-6 ${darkMode ? 'text-green-300' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                                تم التفريغ بنجاح!
                            </p>
                            {detectedLanguage && (
                                <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    اللغة المكتشفة: {detectedLanguage.name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Transcript Display - Collapsible */}
                    <details className={`rounded-xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <summary className={`px-4 py-3 cursor-pointer flex items-center justify-between ${darkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'}`}>
                            <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                عرض النص المفرغ
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.preventDefault(); copyToClipboard(transcript); }}
                                    className={`text-sm px-3 py-1 rounded transition-colors ${darkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}
                                >
                                    نسخ
                                </button>
                            </div>
                        </summary>
                        <div className={`p-4 max-h-64 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <pre className={`whitespace-pre-wrap text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {transcript}
                            </pre>
                        </div>
                    </details>

                    {/* Add Translations Button */}
                    {!showAddTranslations && (
                        <button
                            onClick={() => setShowAddTranslations(true)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            إضافة ترجمات للغات أخرى
                        </button>
                    )}

                    {/* Translation Selection Panel */}
                    {showAddTranslations && (
                        <div className="border rounded-lg overflow-hidden bg-white">
                            <div className="bg-gradient-to-r from-green-50 to-teal-50 px-4 py-3 border-b">
                                <h4 className="font-medium text-green-800">
                                    اختر اللغات للترجمة
                                </h4>
                                <p className="text-sm text-green-600 mt-1">
                                    اختر لغة أو أكثر لترجمة النص الأصلي إليها
                                </p>
                            </div>

                            <div className="p-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {availableLanguages.map((lang) => {
                                        const isDetected =
                                            detectedLanguage &&
                                            lang.code === detectedLanguage.code;
                                        const isSelected = selectedLanguages.find(
                                            (l) => l.code === lang.code
                                        );

                                        return (
                                            <button
                                                key={lang.code}
                                                onClick={() =>
                                                    toggleLanguageSelection(lang)
                                                }
                                                disabled={isDetected}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    isDetected
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : isSelected
                                                          ? "bg-green-500 text-white hover:bg-green-600"
                                                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                }`}
                                            >
                                                {lang.name}
                                                {isDetected && " (الأصلية)"}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t">
                                    <button
                                        onClick={handleAddTranslations}
                                        disabled={
                                            translating ||
                                            selectedLanguages.length === 0
                                        }
                                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {translating ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <LoadingSpinner />
                                                جاري الترجمة...
                                            </span>
                                        ) : (
                                            `ترجمة إلى ${selectedLanguages.length} لغة`
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAddTranslations(false);
                                            setSelectedLanguages([]);
                                        }}
                                        disabled={translating}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Minimal hint - only show on idle */}
            {step === "idle" && video && (
                <p className={`text-xs text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    يستخدم AssemblyAI • توقيتات دقيقة (~400ms) • حفظ تلقائي
                </p>
            )}
        </div>
    );
}
