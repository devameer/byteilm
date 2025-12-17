import { useState, useRef } from "react";
import axios from "axios";

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk
const ALLOWED_TYPES = [
  "video/mp4",
  "video/avi",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/webm",
];

export default function ChunkedVideoUploader({
  lessonId,
  onUploadSuccess,
  existingVideo,
  mode = "lesson",
  title,
  description,
  allowMultiple = false,
}) {
  const isLessonMode = mode === "lesson";
  const chunkedBaseUrl = isLessonMode
    ? `/lessons/${lessonId}/video/chunked`
    : "/media-library/videos/chunked";
  const deleteEndpoint = isLessonMode ? `/lessons/${lessonId}/video` : null;
  const heading =
    title || (isLessonMode ? "الفيديو" : "رفع فيديو إلى مكتبة الوسائط");
  const helperText =
    description ||
    (allowMultiple && !isLessonMode
      ? "يمكن اختيار عدة ملفات (MP4, AVI, MOV, WMV, WebM) وسيتم رفعها بالتتابع عبر الرفع المجزأ"
      : "MP4, AVI, MOV, WMV, WebM (أي حجم - سيتم تقسيم الملفات الكبيرة تلقائياً)");

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState(null); // { uploadId, file, totalChunks, uploadedChunks }
  const [queuedCount, setQueuedCount] = useState(0);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const queueRef = useRef([]);

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

    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) {
      return;
    }

    const validFiles = [];
    let hasInvalid = false;

    files.forEach((file) => {
      if (ALLOWED_TYPES.includes(file.type)) {
        validFiles.push(file);
      } else {
        hasInvalid = true;
      }
    });

    if (hasInvalid) {
      setError(
        "نوع الفيديو غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, WebM"
      );
    }

    if (!validFiles.length) {
      return;
    }

    if (isLessonMode || !allowMultiple) {
      startUpload(validFiles[0]);
      return;
    }

    queueRef.current = [...queueRef.current, ...validFiles];
    setQueuedCount(queueRef.current.length);

    if (!uploadState && !uploading) {
      startNextInQueue();
    }
  };

  async function startUpload(file) {
    if (!file) {
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Start chunked upload session
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const startResponse = await axios.post(`${chunkedBaseUrl}/start`, {
        file_name: file.name,
        file_size: file.size,
        total_chunks: totalChunks,
        file_type: file.type,
      });

      if (!startResponse.data.success) {
        throw new Error(startResponse.data.message);
      }

      const uploadId = startResponse.data.upload_id;
      setUploadState({
        uploadId,
        file,
        totalChunks,
        uploadedChunks: 0,
      });

      // Upload chunks
      await uploadChunks(uploadId, file, totalChunks);

      // Complete upload
      const completeResponse = await axios.post(
        `${chunkedBaseUrl}/${uploadId}/complete`
      );

      if (completeResponse.data.success) {
        if (onUploadSuccess) {
          await onUploadSuccess(completeResponse.data.data);
        }
        setProgress(100);
        setUploadState(null);
      }
    } catch (err) {
      setUploadState(null);
      if (err.message !== "Upload paused") {
        setError(
          err.response?.data?.message || err.message || "فشل رفع الفيديو"
        );
      }
    } finally {
      setUploading(false);
      if (!isLessonMode && allowMultiple && queueRef.current.length > 0) {
        startNextInQueue();
      }
    }
  }

  function startNextInQueue() {
    if (!queueRef.current.length) {
      return;
    }
    const nextFile = queueRef.current.shift();
    setQueuedCount(queueRef.current.length);
    startUpload(nextFile);
  }

  const uploadChunks = async (uploadId, file, totalChunks) => {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("chunk_index", i);

      abortControllerRef.current = new AbortController();

      await axios.post(`${chunkedBaseUrl}/${uploadId}/chunk`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        signal: abortControllerRef.current.signal,
      });

      const progressPercent = Math.round(((i + 1) / totalChunks) * 100);
      setProgress(progressPercent);
      setUploadState((prev) => ({
        ...prev,
        uploadedChunks: i + 1,
      }));
    }
  };

  const handleCancel = async () => {
    if (!uploadState) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      await axios.delete(`${chunkedBaseUrl}/${uploadState.uploadId}`);
    } catch (err) {
      console.error("Failed to cancel upload:", err);
    }

    setUploadState(null);
    setUploading(false);
    setProgress(0);
    setError(null);
    if (!isLessonMode && allowMultiple) {
      queueRef.current = [];
      setQueuedCount(0);
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف الفيديو؟")) {
      return;
    }

    try {
      if (!deleteEndpoint) {
        return;
      }

      const response = await axios.delete(deleteEndpoint);
      if (response.data.success) {
        onUploadSuccess?.(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "فشل حذف الفيديو");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {heading && <h3 className="text-lg font-semibold">{heading}</h3>}

      {isLessonMode && existingVideo ? (
        <div className="border-2 border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-blue-50/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <i className="fas fa-video text-white text-xl"></i>
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  {existingVideo.file_name}
                </p>
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-database text-xs"></i>
                    {existingVideo.formatted_size}
                  </span>
                  {existingVideo.formatted_duration && (
                    <span className="flex items-center gap-1">
                      <i className="fas fa-clock text-xs"></i>
                      {existingVideo.formatted_duration}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-all"
            >
              <i className="fas fa-trash ml-1"></i>
              حذف
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive
              ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 scale-105 shadow-lg"
              : "border-slate-300 hover:border-indigo-300 hover:bg-slate-50"
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
            multiple={!isLessonMode && allowMultiple}
            onChange={handleChange}
            disabled={uploading}
          />

          {uploading ? (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                <i className="fas fa-spinner fa-spin text-indigo-600 text-3xl"></i>
              </div>
              <p className="text-slate-900 font-bold text-lg">
                جاري رفع الفيديو...
              </p>
              {uploadState && (
                <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    {uploadState.file.name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {formatFileSize(uploadState.file.size)}
                  </p>
                </div>
              )}
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <p className="text-2xl font-black text-slate-900">
                  {progress}%
                </p>
                {uploadState && (
                  <p className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    الجزء {uploadState.uploadedChunks} /{" "}
                    {uploadState.totalChunks}
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-bold flex items-center gap-2"
                >
                  <i className="fas fa-times"></i>
                  <span>إلغاء</span>
                </button>
              </div>
              {!isLessonMode && allowMultiple && queuedCount > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-blue-700 text-sm font-semibold">
                  <i className="fas fa-clock ml-1"></i>
                  سيتم رفع {queuedCount} ملف/ملفات بعد اكتمال الملف الحالي
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center mb-4">
                <i className="fas fa-cloud-upload-alt text-indigo-600 text-4xl"></i>
              </div>
              <p className="text-lg font-bold text-slate-900 mb-2">
                اسحب الفيديو هنا أو اختر من جهازك
              </p>
              <button
                type="button"
                className="mt-4 px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-folder-open ml-2"></i>
                اختر ملف فيديو
              </button>
              <p className="mt-4 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-2 inline-block">
                {helperText}
              </p>
              {!isLessonMode && allowMultiple && queuedCount > 0 && (
                <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-blue-700 text-sm font-semibold inline-block">
                  <i className="fas fa-list ml-1"></i>
                  في الانتظار: {queuedCount} ملف/ملفات سيتم رفعها تلقائياً
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-semibold flex items-center gap-3">
          <i className="fas fa-exclamation-triangle text-xl"></i>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
