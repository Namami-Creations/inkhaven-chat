'use client'

import { useState, useRef, useMemo } from 'react'
import { useSupabase } from './SupabaseProvider'

interface FileUploadLimits {
  singleFileLimit: number
  dailyLimit: number | null
  compressionEnabled: boolean
}

interface FileUploadProps {
  roomId: string
  isRegistered?: boolean
  showLimits?: boolean
  onUploadSuccess?: (message: any) => void
  onUploadError?: (error: string) => void
}

export default function FileUpload({
  roomId,
  isRegistered = false,
  showLimits = true,
  onUploadSuccess,
  onUploadError
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [compressionStatus, setCompressionStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useSupabase()

  // Mock file upload service - replace with actual implementation
  const fileUploadService = {
    getLimits: (isRegistered: boolean): FileUploadLimits => ({
      singleFileLimit: isRegistered ? 50 : 10,
      dailyLimit: isRegistered ? null : 100,
      compressionEnabled: !isRegistered
    }),
    getRemainingDailyLimit: (userId: string, isRegistered: boolean): number => {
      // Mock implementation - replace with actual logic
      return isRegistered ? 0 : 75
    },
    prepareFileForUpload: async (file: File, userId: string, isRegistered: boolean) => {
      // Mock compression logic
      if (!isRegistered && file.size > 1024 * 1024) { // 1MB
        // Simulate compression
        await new Promise(resolve => setTimeout(resolve, 1000))
        return {
          file: new File([file], file.name, { type: file.type }),
          wasCompressed: true,
          reason: 'File compressed to reduce size'
        }
      }
      return {
        file,
        wasCompressed: false
      }
    }
  }

  // Mock chat service - replace with actual implementation
  const chatService = {
    sendFileMessage: async (roomId: string, file: File, userId: string, userName: string) => {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      return {
        success: true,
        message: {
          id: Date.now(),
          content: `Shared file: ${file.name}`,
          fileUrl: `https://example.com/files/${file.name}`,
          fileName: file.name,
          fileSize: file.size,
          userId,
          userName,
          createdAt: new Date().toISOString()
        }
      }
    }
  }

  const limits = useMemo(() => fileUploadService.getLimits(isRegistered), [isRegistered])
  const canUpload = true // Always allow uploads now, with limits handled in service
  const remainingDaily = useMemo(() =>
    fileUploadService.getRemainingDailyLimit(user?.id || 'anonymous', isRegistered),
    [user?.id, isRegistered]
  )

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    try {
      // Validate file type
      if (!isValidFileType(file)) {
        onUploadError?.('Unsupported file type. Please upload images, videos, or documents.')
        return
      }

      // Show upload modal
      setShowUploadModal(true)
      setCompressionStatus('Preparing file...')

      // Use the file upload service
      const userId = user?.id || 'anonymous'
      const preparedFile = await fileUploadService.prepareFileForUpload(file, userId, isRegistered)

      if (preparedFile.wasCompressed) {
        setCompressionStatus(preparedFile.reason || 'File compressed successfully')
      } else {
        setCompressionStatus('File ready for upload')
      }

      const fileToUpload = preparedFile.file

      // Upload file
      setCompressionStatus('Uploading...')
      setUploadProgress(0)

      // Simulate progress (in real implementation, you'd track actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15
          if (newProgress >= 90) {
            clearInterval(progressInterval)
          }
          return newProgress
        })
      }, 200)

      const result = await chatService.sendFileMessage(
        roomId,
        fileToUpload,
        userId,
        user?.email?.split('@')[0] || 'Anonymous'
      )

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success && result.message) {
        onUploadSuccess?.(result.message)
        setTimeout(() => {
          setShowUploadModal(false)
          setSelectedFile(null)
          setUploadProgress(0)
          setCompressionStatus('')
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }, 1000)
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      console.error('File upload error:', error)
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
      setShowUploadModal(false)
    }
  }

  const isValidFileType = (file: File): boolean => {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Videos
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    return allowedTypes.includes(file.type) || !!(file.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|wmv|flv|pdf|doc|docx|txt)$/i))
  }

  const cancelUpload = () => {
    setShowUploadModal(false)
    setSelectedFile(null)
    setUploadProgress(0)
    setCompressionStatus('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="file-upload">
      {/* File Input Trigger */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={!canUpload}
        className={`upload-button ${!canUpload ? 'disabled' : ''}`}
        aria-label="Upload file"
      >
        <div className="upload-icon">📎</div>
        <span className="upload-text">{canUpload ? 'Share File' : 'Premium Required'}</span>
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
      />

      {/* Upload Progress Modal */}
      {showUploadModal && (
        <div className="upload-modal-overlay" onClick={cancelUpload}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upload-header">
              <h3>Uploading {selectedFile?.name}</h3>
              <button
                onClick={cancelUpload}
                className="close-button"
                aria-label="Cancel upload"
              >
                ×
              </button>
            </div>

            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="progress-text">
                {uploadProgress}% complete
              </div>
            </div>

            {compressionStatus && (
              <div className="compression-status">
                <div className="compression-spinner" />
                <span>{compressionStatus}</span>
              </div>
            )}

            <div className="upload-actions">
              <button onClick={cancelUpload} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Limits Info */}
      {showLimits && (
        <div className="file-limits-info">
          <div className="limit-item">
            <span className="limit-label">Single file:</span>
            <span className="limit-value">{limits.singleFileLimit}MB</span>
          </div>
          {!isRegistered && limits.dailyLimit && (
            <div className="limit-item">
              <span className="limit-label">Daily remaining:</span>
              <span className="limit-value">{remainingDaily.toFixed(1)}MB</span>
            </div>
          )}
          <div className="limit-item">
            <span className="limit-label">Compression:</span>
            <span className="limit-value">{limits.compressionEnabled ? 'Auto' : 'Off'}</span>
          </div>
          <div className="limit-item">
            <span className="limit-label">Supported:</span>
            <span className="limit-value">Images, Videos, Documents</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .file-upload {
          @apply relative;
        }

        .upload-button {
          @apply flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors;
        }

        .upload-button.disabled {
          @apply cursor-not-allowed opacity-50;
        }

        .upload-icon {
          @apply text-lg;
        }

        .upload-text {
          @apply text-sm font-medium;
        }

        .upload-modal-overlay {
          @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
        }

        .upload-modal {
          @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6;
        }

        .upload-header {
          @apply flex items-center justify-between mb-4;
        }

        .upload-header h3 {
          @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
        }

        .close-button {
          @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold;
        }

        .upload-progress {
          @apply mb-4;
        }

        .progress-bar {
          @apply w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2;
        }

        .progress-fill {
          @apply bg-blue-500 h-2 rounded-full transition-all duration-300;
        }

        .progress-text {
          @apply text-sm text-gray-600 dark:text-gray-400 text-center;
        }

        .compression-status {
          @apply flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 mb-4;
        }

        .compression-spinner {
          @apply w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin;
        }

        .upload-actions {
          @apply flex justify-end;
        }

        .cancel-button {
          @apply px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors;
        }

        .file-limits-info {
          @apply mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1;
        }

        .limit-item {
          @apply flex justify-between;
        }

        .limit-label {
          @apply font-medium;
        }

        .limit-value {
          @apply text-right;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .upload-modal {
            @apply mx-2 p-4;
          }

          .upload-button {
            @apply px-3 py-2;
          }

          .upload-text {
            @apply text-xs;
          }
        }
      `}</style>
    </div>
  )
}
