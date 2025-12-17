import React from 'react';
import { Link } from 'react-router-dom';

const PublicFooter = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center transform hover:rotate-6 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-black">منصتك</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              منصتك الشاملة لإدارة المشاريع والتعلم الذكي
            </p>
            <div className="flex gap-3">
              {['𝕏', 'f', '📷'].map((icon, i) => (
                <button key={i} className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gradient-to-br hover:from-indigo-600 hover:to-purple-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6">
                  <span className="text-xl">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-black">روابط سريعة</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">الرئيسية</Link></li>
              <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">المميزات</Link></li>
              <li><a href="/#pricing" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">الأسعار</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-black">الدعم</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">مركز المساعدة</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">الأسئلة الشائعة</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">اتصل بنا</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-black">النشرة الإخبارية</h4>
            <p className="text-gray-400 text-sm">اشترك ليصلك كل جديد</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="بريدك الإلكتروني"
                className="flex-1 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold hover:scale-105 transition-transform duration-300">
                اشترك
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>© 2025 منصتك. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
