// components/CreemProvider.js
'use client';
import React, { createContext, useContext, useState, useEffect } from "react";

const CreemContext = createContext(null);

export function useCreem() {
  return useContext(CreemContext);
}

export default function CreemProvider({ children }) {
  const [loading, setLoading] = useState(false);

  // Example: Create a checkout session and redirect
  const createCheckout = async ({ product_id, userId, userEmail }) => {
    try {
      setLoading(true);

      const response = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id, userId, userEmail }),
      });

      const data = await response.json();
      if (response.ok && data.checkout_url) {
        window.location.href = data.checkout_url; // Creem hosted checkout page
      } else {
        console.error("Creem checkout failed:", data);
        throw new Error(data.error || "Checkout failed");
      }
    } catch (err) {
      console.error("Creem error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Example: Check subscription status
  const checkSubscription = async (userId) => {
    try {
      const response = await fetch(`/api/creem/subscription?userId=${userId}`);
      const data = await response.json();
      return data; // { active: true/false, plan: "pro" }
    } catch (err) {
      console.error("Creem subscription check failed:", err);
      return { active: false };
    }
  };

  const value = {
    createCheckout,
    checkSubscription,
    loading,
  };

  return (
    <CreemContext.Provider value={value}>
      {children}
    </CreemContext.Provider>
  );
}
