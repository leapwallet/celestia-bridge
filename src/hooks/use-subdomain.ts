'use client'; // Mark as client component

import { useState, useEffect } from 'react';

export function useSubdomain() {
  const [subdomain, setSubdomain] = useState('');
  
  useEffect(() => {
    // Only runs in browser environment
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Parse subdomain - different approaches based on your setup
      let extractedSubdomain;
      
      // For localhost testing (e.g., sub.localhost:3000)
      if (hostname.includes('localhost')) {
        extractedSubdomain = hostname.split('.')[0];
        if (extractedSubdomain === 'localhost') {
          extractedSubdomain = '';
        }
      } 
      // For production domains (e.g., sub.example.com)
      else {
        // Get parts and handle multi-level domains
        const parts = hostname.split('.');
        if (parts.length > 2) {
          extractedSubdomain = parts[0];
        } else {
          extractedSubdomain = '';
        }
      }
      
      setSubdomain(extractedSubdomain);
      const className = extractedSubdomain;
      if (className) {
        document.body.classList.add(className);
      }
    
    // Cleanup
    return () => {
      if (className) {
        document.body.classList.remove(className);
      }
    };
    }
  }, []); // Empty dependency array - runs once on mount
  
  return subdomain;
}