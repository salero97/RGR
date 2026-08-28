import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext({ showToast: () => {}, toasts: [] });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    function handleForbidden(event) {
      showToast(event.detail?.message || 'Недостаточно прав для этого действия', 'error');
    }
    window.addEventListener('apiforbidden', handleForbidden);
    return () => window.removeEventListener('apiforbidden', handleForbidden);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext).showToast;
}

export function useToasts() {
  return useContext(ToastContext).toasts;
}