import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";

function PomodoroTimer({ task = null, onComplete }) {
  const { darkMode } = useTheme();
  const [mode, setMode] = useState("work"); // work, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const durations = {
    work: 25 * 60, // 25 minutes
    shortBreak: 5 * 60, // 5 minutes
    longBreak: 15 * 60, // 15 minutes
  };

  useEffect(() => {
    // Initialize audio for notifications
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BZFgxDl93wvGsfBSt+zPHZijUHHnK/7OWXSg0RU6jk7K1aFw1Cld3wv20fBS1+zPHbiTUHH3G+7OWYSw0RU6fk663aFw1Cld3wv20fBS1+zPHbiTUHH3G+7OWYSw0RU6fk663aFw1Cld3wv20fBS1+zPHbiTUHH3G+7OWYSw0RU6fk663aFw1Cld3wv20fBS1+zPHbiTUHH3G+7OWYSw0RU6fk663aFw1Cld3wv20fBS1+zPHbiTUHH3G+7OWYSw0RU6fk663aFw1Cld3wv20fBS1+zPHbiTUHH3G+7OWYSw0RU6fk663aFw1Cld3wv20fBS1+zPHbiTUHH3G+7OWYSw0RU6fk663aFw1C"
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);

    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // Show notification
    if ("Notification" in window && Notification.permission === "granted") {
      const title =
        mode === "work" ? "انتهى وقت العمل!" : "انتهى وقت الاستراحة!";
      const body =
        mode === "work"
          ? "أحسنت! حان وقت الاستراحة"
          : "الاستراحة انتهت. هل أنت جاهز للعمل؟";

      new Notification(title, {
        body,
        icon: "/favicon.ico",
      });
    }

    // Auto-switch modes
    if (mode === "work") {
      setCompletedPomodoros((prev) => prev + 1);
      const nextMode =
        (completedPomodoros + 1) % 4 === 0 ? "longBreak" : "shortBreak";
      switchMode(nextMode);
    } else {
      switchMode("work");
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode]);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  const skipTimer = () => {
    handleTimerComplete();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  const getModeColor = () => {
    switch (mode) {
      case "work":
        return "from-red-500 to-orange-500";
      case "shortBreak":
        return "from-green-500 to-emerald-500";
      case "longBreak":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-red-500 to-orange-500";
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case "work":
        return "وقت العمل";
      case "shortBreak":
        return "استراحة قصيرة";
      case "longBreak":
        return "استراحة طويلة";
      default:
        return "وقت العمل";
    }
  };

  return (
    <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getModeColor()} flex items-center justify-center`}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className={`text-lg font-black ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>مؤقت بومودورو</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getModeLabel()}</p>
          </div>
        </div>
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>🍅 {completedPomodoros}</div>
      </div>

      {/* Task Info */}
      {task && (
        <div className={`mb-4 p-3 rounded-lg ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <p className={`text-sm font-semibold truncate ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {task.title}
          </p>
        </div>
      )}

      {/* Timer Display */}
      <div className="relative mb-6">
        {/* Progress Circle */}
        <svg className="w-full h-48 -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="90"
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50%"
            cy="50%"
            r="90"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                className={
                  mode === "work"
                    ? "text-red-500"
                    : mode === "shortBreak"
                    ? "text-green-500"
                    : "text-blue-500"
                }
                stopColor="currentColor"
              />
              <stop
                offset="100%"
                className={
                  mode === "work"
                    ? "text-orange-500"
                    : mode === "shortBreak"
                    ? "text-emerald-500"
                    : "text-cyan-500"
                }
                stopColor="currentColor"
              />
            </linearGradient>
          </defs>
        </svg>

        {/* Time Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className={`text-5xl font-black bg-gradient-to-br ${getModeColor()} bg-clip-text text-transparent`}
            >
              {formatTime(timeLeft)}
            </div>
            <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {isRunning ? "جاري العمل..." : "متوقف"}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 relative z-10 cursor-pointer">
        <div className="flex gap-2">
          <button
            onClick={toggleTimer}
            className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all ${
              isRunning
                ? "bg-gradient-to-br from-gray-600 to-gray-700"
                : `bg-gradient-to-br ${getModeColor()}`
            }`}
          >
            {isRunning ? (
              <>
                <svg
                  className="w-5 h-5 inline ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                إيقاف
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 inline ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                بدء
              </>
            )}
          </button>
          <button
            onClick={resetTimer}
            className={`px-4 py-3 rounded-xl font-bold transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="إعادة تعيين"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            onClick={skipTimer}
            className={`px-4 py-3 rounded-xl font-bold transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="تخطي"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => switchMode("work")}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === "work"
                ? "bg-gradient-to-br from-red-500 to-orange-500 text-white"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            عمل (25د)
          </button>
          <button
            onClick={() => switchMode("shortBreak")}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === "shortBreak"
                ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            راحة (5د)
          </button>
          <button
            onClick={() => switchMode("longBreak")}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === "longBreak"
                ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            راحة (15د)
          </button>
        </div>
      </div>

      {/* Pomodoro Info */}
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`flex items-center justify-between text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span>البومودورو المكتمل اليوم</span>
          <span className={`font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            {completedPomodoros}
          </span>
        </div>
        <div className={`flex items-center justify-between text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span>الاستراحة الطويلة التالية</span>
          <span className={`font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            {4 - (completedPomodoros % 4)} بومودورو
          </span>
        </div>
      </div>
    </div>
  );
}

export default PomodoroTimer;
