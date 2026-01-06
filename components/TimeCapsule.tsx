'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useFeatureAccess'
import { canAccessFeature } from '@/lib/feature-gate'
import { Clock, Send, Calendar } from 'lucide-react'

interface TimeCapsuleMessage {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  delivery_date: string
  is_delivered: boolean
  created_at: string
}

interface TimeCapsuleProps {
  onSend: (message: string, deliveryDate: Date) => void
  onClose: () => void
}

export default function TimeCapsule({ onSend, onClose }: TimeCapsuleProps) {
  const [message, setMessage] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentCapsules, setSentCapsules] = useState<TimeCapsuleMessage[]>([])
  const user = useUser()

  const canUseTimeCapsule = canAccessFeature(user, 'time_capsule')

  useEffect(() => {
    if (canUseTimeCapsule && user) {
      loadSentCapsules()
    }
  }, [canUseTimeCapsule, user])

  const loadSentCapsules = async () => {
    if (!user) return

    const { data } = await (supabase as any)
      .from('time_capsules')
      .select('*')
      .eq('sender_id', user.id)
      .order('delivery_date', { ascending: true })

    if (data) {
      setSentCapsules(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !deliveryDate || !canUseTimeCapsule) return

    const deliveryDateTime = new Date(deliveryDate)
    if (deliveryDateTime <= new Date()) {
      alert('Delivery date must be in the future')
      return
    }

    setIsSubmitting(true)
    try {
      await onSend(message.trim(), deliveryDateTime)
      setMessage('')
      setDeliveryDate('')
      await loadSentCapsules() // Refresh the list
    } catch (error) {
      console.error('Failed to send time capsule:', error)
      alert('Failed to send time capsule. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!canUseTimeCapsule) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Premium Feature</h3>
          <p className="text-gray-600 mb-4">
            Time Capsule is available for premium users only.
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Close</button>
            <button onClick={() => {/* Open pricing modal */}} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">Upgrade</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Time Capsule</span>
          </div>
          <button onClick={onClose} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">Close</button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Send New Capsule */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send a Time Capsule
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a message that will be delivered in the future..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    maxLength={1000}
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {message.length}/1000 characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Delivery Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)} // Minimum 24 hours from now
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Must be at least 24 hours in the future
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim() || !deliveryDate}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Time Capsule
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Sent Capsules */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Sent Capsules</h3>

              {sentCapsules.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No time capsules sent yet</p>
                  <p className="text-sm">Send your first message to the future!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentCapsules.map((capsule) => (
                    <div
                      key={capsule.id}
                      className={`p-4 rounded-lg border ${
                        capsule.is_delivered
                          ? 'bg-green-50 border-green-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`text-sm font-medium ${
                          capsule.is_delivered ? 'text-green-800' : 'text-blue-800'
                        }`}>
                          {capsule.is_delivered ? 'Delivered' : 'Scheduled for delivery'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created {formatDate(capsule.created_at)}
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {capsule.content}
                      </div>

                      <div className={`text-xs font-medium ${
                        capsule.is_delivered ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        📅 {formatDate(capsule.delivery_date)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}