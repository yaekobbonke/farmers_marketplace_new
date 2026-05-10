"use client";

import { useState, useEffect } from "react";

interface InactivityWarningProps {
  show: boolean;
  onStay: () => void;
  onLogout: () => void;
  secondsLeft?: number;
}

export default function InactivityWarning({ 
  show, 
  onStay, 
  onLogout, 
  secondsLeft = 60 
}: InactivityWarningProps) {
  const [timeLeft, setTimeLeft] = useState(secondsLeft);

  useEffect(() => {
    if (show && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0 && show) {
      onLogout();
    }
  }, [show, timeLeft, onLogout]);

  useEffect(() => {
    setTimeLeft(secondsLeft);
  }, [show, secondsLeft]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 p-6 max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Session Expiring Soon</h3>
            <p className="text-sm text-slate-500">You will be logged out in {timeLeft} seconds</p>
          </div>
        </div>
        <button
          onClick={onStay}
          className="w-full py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
        >
          Stay Logged In
        </button>
      </div>
    </div>
  );
}