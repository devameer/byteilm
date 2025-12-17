import { useState, useRef } from 'react';
import axios from 'axios';

export default function VideoUploader({ lessonId, onUploadSuccess, existingVideo }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file) => {
        // Validate file type
        const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm'];
        if (!allowedTypes.includes(file.type)) {
            setError('نوع الفيديو غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, WebM');
            return;
        }

        // No file size limit - accepts unlimited video size
        setError(null);
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('video', file);

        try {
            const response = await axios.post(`/lessons/${lessonId}/video`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
            });

            if (response.data.success) {
                onUploadSuccess(response.data.data);
                setProgress(100);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'فشل رفع الفيديو');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('هل أنت متأكد من حذف الفيديو؟')) {
            return;
        }

        try {
            const response = await axios.delete(`/lessons/${lessonId}/video`);
            if (response.data.success) {
                onUploadSuccess(null);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'فشل حذف الفيديو');
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">الفيديو</h3>

            {existingVideo ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="font-medium">{existingVideo.file_name}</p>
                            <p className="text-sm text-gray-600">
                                الحجم: {existingVideo.formatted_size}
                                {existingVideo.formatted_duration && ` • المدة: ${existingVideo.formatted_duration}`}
                            </p>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            حذف
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="video/mp4,video/avi,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/webm"
                        onChange={handleChange}
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="space-y-2">
                            <p className="text-gray-600">جاري رفع الفيديو...</p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-500">{progress}%</p>
                        </div>
                    ) : (
                        <>
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                            >
                                <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">
                                اسحب الفيديو هنا أو{' '}
                                <button
                                    type="button"
                                    className="text-blue-500 hover:text-blue-700 font-medium"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    اختر ملف
                                </button>
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                MP4, AVI, MOV, WMV, WebM (حتى 500 ميجابايت)
                            </p>
                        </>
                    )}
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
