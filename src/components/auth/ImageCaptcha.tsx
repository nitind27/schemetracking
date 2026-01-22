"use client";

import React, { useState, useEffect, useRef } from "react";
import Label from "@/components/form/Label";

interface ImageCaptchaProps {
  onVerify: (isValid: boolean, captchaText: string | null) => void;
}

export default function ImageCaptcha({ onVerify }: ImageCaptchaProps) {
  const [captchaText, setCaptchaText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate random alphanumeric string (only capital letters and numbers)
  const generateCaptcha = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Draw captcha on canvas
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background with gradient effect
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#f9fafb");
    gradient.addColorStop(1, "#f3f4f6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise lines (more subtle)
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw text with random rotation and position
    ctx.font = "bold 16px 'Arial', sans-serif";
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = 12 + i * 20;
      const y = 20 + Math.random() * 4 - 2;
      const rotation = (Math.random() - 0.5) * 0.15; // Random rotation between -0.075 and 0.075 radians
      
      // Alternate colors for better visibility
      const colors = ["#1e40af", "#7c3aed", "#dc2626", "#059669", "#ea580c"];
      ctx.fillStyle = colors[i % colors.length];

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Add noise dots (more subtle)
    ctx.fillStyle = "#d1d5db";
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 1.5 + 0.5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  // Initialize captcha
  useEffect(() => {
    const newCaptcha = generateCaptcha();
    setCaptchaText(newCaptcha);
    drawCaptcha(newCaptcha);
    setUserInput("");
    setIsValid(false);
    setError("");
    onVerify(false, null);
  }, []);

  const handleRefresh = () => {
    const newCaptcha = generateCaptcha();
    setCaptchaText(newCaptcha);
    drawCaptcha(newCaptcha);
    setUserInput("");
    setIsValid(false);
    setError("");
    onVerify(false, null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert input to uppercase and filter out non-alphanumeric
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setUserInput(value);
    setError("");

    // Case-sensitive comparison (both should be uppercase)
    const isValidAnswer = value === captchaText && value.length === captchaText.length;
    setIsValid(isValidAnswer);
    onVerify(isValidAnswer, isValidAnswer ? captchaText : null);
  };

  return (
    <div className="space-y-2">
      <Label>
        Captcha <span className="text-error-500">*</span>
      </Label>
      <div className="flex items-center gap-3">
        <div className="relative inline-flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm p-1.5">
          <canvas
            ref={canvasRef}
            width={120}
            height={28}
            className="rounded"
          />
          <button
            type="button"
            onClick={handleRefresh}
            className="absolute -right-2 -top-2 p-1.5 bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group transform hover:scale-110"
            title="Refresh captcha"
          >
            <svg 
              className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          className={`h-11 flex-1 rounded-lg border-2 appearance-none px-4 py-2.5 text-base font-bold tracking-widest shadow-sm placeholder:text-gray-400 focus:outline-none dark:placeholder:text-white/30 bg-white dark:bg-gray-900 text-gray-900 border-gray-300 dark:border-gray-600 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:text-white dark:focus:border-brand-400 uppercase transition-all ${
            isValid ? 'border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/20 ring-4 ring-green-500/20' : ''
          } ${
            error ? 'border-error-500 dark:border-error-500 ring-4 ring-error-500/20' : ''
          }`}
          placeholder="Enter code"
          required
          maxLength={5}
          style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}
        />
      </div>
      <div className="min-h-[20px]">
        {error && (
          <p className="text-sm text-error-500 flex items-center gap-1.5 font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {isValid && userInput && !error && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5 font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Captcha verified
          </p>
        )}
      </div>
    </div>
  );
}
