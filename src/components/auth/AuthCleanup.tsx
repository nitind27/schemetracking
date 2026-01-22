"use client";

import { useEffect } from "react";

// Client component to clear sessionStorage if no auth cookie exists
// This ensures that when browser is closed and reopened, sessionStorage is cleared
export default function AuthCleanup() {
  useEffect(() => {
    // Check if auth_token cookie exists
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
    
    // If no auth cookie, clear sessionStorage (browser was closed/reopened)
    // Session cookies expire when browser closes, so no cookie = browser was closed
    if (!authCookie) {
      sessionStorage.clear();
    }
  }, []);

  return null;
}

