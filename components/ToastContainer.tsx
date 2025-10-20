'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useToastStore, Toast } from '@/lib/toast'
import { useEffect } from 'react'

const icons = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
} as const

const colors = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: 'text-green-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-400',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-400',
  },
} as const

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast: Toast) => {
          const Icon = icons[toast.type]
          const colorScheme = colors[toast.type]

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300, scale: 0.3 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
              className={`max-w-sm w-full ${colorScheme.bg} border ${colorScheme.border} rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 ${colorScheme.icon}`} aria-hidden="true" />
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className={`text-sm font-medium ${colorScheme.text}`}>
                      {toast.title}
                    </p>
                    {toast.message && (
                      <p className={`mt-1 text-sm ${colorScheme.text} opacity-90`}>
                        {toast.message}
                      </p>
                    )}
                    {toast.action && (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            toast.action?.onClick()
                            removeToast(toast.id)
                          }}
                          className={`text-sm font-medium ${colorScheme.text} underline hover:opacity-75`}
                        >
                          {toast.action.label}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      className={`inline-flex rounded-md p-1.5 ${colorScheme.text} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      onClick={() => removeToast(toast.id)}
                      aria-label="Dismiss notification"
                      title="Close notification"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
