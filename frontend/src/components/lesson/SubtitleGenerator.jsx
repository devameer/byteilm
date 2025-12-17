import { useState, useEffect, useRef } from "react";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner";

export default function SubtitleGenerator({ lessonId, video, onSuccess }) {
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
        uploading: "رفع الفيديو...",
        processing: "معالجة الملف...",
        transcribing: "تفريغ الفيديو...",
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
                        const increment = Math.random() * 5 + 1;
                        const newProgress = Math.min(prev + increment, 90);
                        
                        // Update step label based on progress
                        if (newProgress < 20) setCurrentStepLabel("رفع الفيديو...");
                        else if (newProgress < 50) setCurrentStepLabel("معالجة الملف...");
                        else if (newProgress < 80) setCurrentStepLabel("تفريغ الفيديو...");
                        else setCurrentStepLabel("إنهاء العملية...");
                        
                        return newProgress;
                    }
                    return prev;
                });
            }, 2000);

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
                <h3 className="text-lg font-semibold">
                    تفريغ الفيديو وإنشاء ترجمات
                </h3>
                {step !== "idle" && (
                    <button
                        onClick={reset}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        إعادة تعيين
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
                    {success}
                </div>
            )}

            {!video && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
                    يجب رفع الفيديو أولاً قبل استخدام خاصية التفريغ التلقائي
                </div>
            )}

            {video && step === "idle" && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        قم بتفريغ الفيديو تلقائياً باستخدام الذكاء الاصطناعي
                        (Gemini AI). سيتم استخراج النص مع الطوابع الزمنية وتحديد
                        اللغة تلقائياً.
                    </p>
                    <button
                        onClick={handleTranscribe}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md hover:shadow-lg"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner />
                                جاري التفريغ...
                            </span>
                        ) : (
                            "بدء التفريغ التلقائي"
                        )}
                    </button>
                </div>
            )}

            {step === "transcribing" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex justify-center">
                        <LoadingSpinner />
                    </div>
                    <p className="mt-4 text-blue-700 font-medium text-center">
                        {currentStepLabel || "جاري تفريغ الفيديو..."}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex justify-between text-sm text-blue-600 mb-1">
                            <span>التقدم</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2.5">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    <p className="mt-4 text-sm text-blue-600 text-center">
                        هذه العملية قد تستغرق عدة دقائق حسب طول الفيديو
                    </p>
                    <p className="mt-2 text-xs text-blue-500 text-center">
                        لا تقم بإغلاق هذه الصفحة أثناء التفريغ
                    </p>
                </div>
            )}

            {step === "transcribed" && (
                <div className="space-y-4">
                    {/* Detected Language Badge */}
                    {detectedLanguage && (
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                />
                            </svg>
                            <span className="text-sm text-blue-800 font-medium">
                                اللغة المكتشفة: {detectedLanguage.name} (
                                {detectedLanguage.code})
                            </span>
                        </div>
                    )}

                    {/* Transcript Display */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                            <h4 className="font-medium">
                                النص الأصلي (محفوظ تلقائياً)
                            </h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => copyToClipboard(transcript)}
                                    className="text-sm px-3 py-1 bg-white border rounded hover:bg-gray-50"
                                >
                                    نسخ
                                </button>
                                <button
                                    onClick={() =>
                                        downloadVTT(transcript, "original")
                                    }
                                    className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    تحميل VTT
                                </button>
                            </div>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto bg-white">
                            <pre className="whitespace-pre-wrap text-sm font-mono">
                                {transcript}
                            </pre>
                        </div>
                    </div>

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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <h4 className="font-medium mb-2">ملاحظات:</h4>
                <ul className="space-y-1 list-disc list-inside">
                    <li>الحد الأقصى لحجم الفيديو للتفريغ التلقائي: 20 ميجابايت</li>
                    <li>
                        يستخدم هذا النظام Gemini AI لتفريغ الفيديو تلقائياً
                    </li>
                    <li>يتم تحديد لغة النص تلقائياً بعد التفريغ</li>
                    <li>يتم استخراج النص مرة واحدة فقط، ثم ترجمته للغات الأخرى</li>
                    <li>للفيديوهات الأكبر من 20 ميجابايت، يرجى رفع ملف الترجمة يدوياً</li>
                    <li>يمكنك إضافة ترجمات لأي لغة من اللغات المدعومة</li>
                    <li>عملية التفريغ سريعة للفيديوهات الصغيرة (أقل من دقيقة عادةً)</li>
                    <li>تأكد من إضافة GEMINI_API_KEY في ملف .env</li>
                </ul>
            </div>
        </div>
    );
}
