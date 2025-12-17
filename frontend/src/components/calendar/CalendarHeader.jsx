import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

function CalendarHeader({ currentDate, onPrevMonth, onNextMonth, onToday }) {
  const { darkMode } = useTheme();
  const monthName = currentDate.toLocaleDateString("ar-EG", {
    month: "long",
    year: "numeric",
  });
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  return (
    <div
      className={`mb-4 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-800 via-gray-900 to-black text-gray-100"
          : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white"
      }`}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-10 left-10 w-60 h-60 bg-white rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl lg:text-4xl font-black mb-2">{monthName}</h1>
          <p className="text-white/90">نظّم وقتك وأنجز مهامك</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPrevMonth}
            className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-300 flex items-center justify-center group"
          >
            <svg
              className="w-6 h-6 group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {!isCurrentMonth && (
            <button
              onClick={onToday}
              className="px-6 py-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-300 font-bold"
            >
              اليوم
            </button>
          )}

          <button
            onClick={onNextMonth}
            className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-300 flex items-center justify-center group"
          >
            <svg
              className="w-6 h-6 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalendarHeader;
