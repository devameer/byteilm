import React from "react";
import { Link } from "react-router-dom";
import PublicNavbar from "../landing/PublicNavbar";
import { useTheme } from "../../contexts/ThemeContext";

function PublicLayout({ children }) {
  const { darkMode } = useTheme();
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      {/* Navigation */}
      <PublicNavbar />
      {/* Main Content */}
      <main>{children}</main>

      <footer className={`py-16 transition-colors duration-300 ${
        darkMode ? 'bg-gray-950 text-white' : 'bg-gray-900 text-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center transform hover:rotate-6 transition-transform duration-300">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className={`text-xl font-black transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-white'
                }`}>منصتك</span>
              </div>
              <p className={`leading-relaxed transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-400'
              }`}>
                منصتك الشاملة لإدارة المشاريع والتعلم الذكي
              </p>
              <div className="flex gap-3">
                {["𝕏", "f", "📷"].map((icon, i) => (
                  <button
                    key={i}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6 ${
                      darkMode
                        ? 'bg-gray-800 hover:bg-gradient-to-br hover:from-indigo-600 hover:to-purple-600'
                        : 'bg-gray-800 hover:bg-gradient-to-br hover:from-indigo-600 hover:to-purple-600'
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className={`text-lg font-black transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-white'
              }`}>روابط سريعة</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/"
                    className={`transition-colors hover:translate-x-1 inline-block duration-300 ${
                      darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    الرئيسية
                  </Link>
                </li>
                <li>
                  <Link
                    to="/features"
                    className={`transition-colors hover:translate-x-1 inline-block duration-300 ${
                      darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    المميزات
                  </Link>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className={`transition-colors hover:translate-x-1 inline-block duration-300 ${
                      darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    الأسعار
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className={`text-lg font-black transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-white'
              }`}>الدعم</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className={`transition-colors hover:translate-x-1 inline-block duration-300 ${
                      darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    مركز المساعدة
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`transition-colors hover:translate-x-1 inline-block duration-300 ${
                      darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    الأسئلة الشائعة
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`transition-colors hover:translate-x-1 inline-block duration-300 ${
                      darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    اتصل بنا
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className={`text-lg font-black transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-white'
              }`}>النشرة الإخبارية</h4>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-400'
              }`}>اشترك ليصلك كل جديد</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  className={`flex-1 px-4 py-2 rounded-xl border focus:border-indigo-500 focus:outline-none transition-colors ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  }`}
                />
                <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold hover:scale-105 transition-transform duration-300">
                  اشترك
                </button>
              </div>
            </div>
          </div>

          <div className={`pt-8 border-t text-center text-sm transition-colors duration-300 ${
            darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-800 text-gray-400'
          }`}>
            <p>© 2025 منصتك. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
