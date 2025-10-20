'use client'

import { create, SetState, GetState } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastStore>()(
  subscribeWithSelector((set: SetState<ToastStore>, get: GetState<ToastStore>) => ({
    toasts: [],

    addToast: (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9)
      const newToast: Toast = {
        id,
        duration: 5000,
        ...toast,
      }

      set((state) => ({
        toasts: [...state.toasts, newToast],
      }))

      // Auto remove toast after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          get().removeToast(id)
        }, newToast.duration)
      }
    },

    removeToast: (id: string) => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }))
    },

    clearToasts: () => {
      set({ toasts: [] })
    },
  }))
)

// Hook for using toasts
export function useToast() {
  const { addToast, removeToast, clearToasts } = useToastStore()

  return {
    toast: {
      success: (title: string, message?: string, options?: Partial<Pick<Toast, 'duration' | 'action'>>) =>
        addToast({ type: 'success', title, message, ...options }),
      error: (title: string, message?: string, options?: Partial<Pick<Toast, 'duration' | 'action'>>) =>
        addToast({ type: 'error', title, message, ...options }),
      warning: (title: string, message?: string, options?: Partial<Pick<Toast, 'duration' | 'action'>>) =>
        addToast({ type: 'warning', title, message, ...options }),
      info: (title: string, message?: string, options?: Partial<Pick<Toast, 'duration' | 'action'>>) =>
        addToast({ type: 'info', title, message, ...options }),
    },
    dismiss: removeToast,
    clear: clearToasts,
  }
}
