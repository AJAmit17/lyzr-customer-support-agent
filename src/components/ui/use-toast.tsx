"use client"

import * as React from "react"

type ToastProps = {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

type ToastContextType = {
  toast: (props: ToastProps) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([])

  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { ...props, id }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-0 right-0 z-50 w-full max-w-sm p-4 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`rounded-lg border p-4 shadow-lg ${
              toast.variant === 'destructive'
                ? 'border-red-500 bg-red-50 text-red-900'
                : 'border-green-500 bg-green-50 text-green-900'
            }`}
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.description && (
              <div className="text-sm opacity-90">{toast.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
