'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { analytics, useAnalytics, usePerformanceTracking } from '@/lib/analytics'
import { useAppStore } from '@/lib/store'

// Monitoring dashboard for administrators
export default function MonitoringDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'performance' | 'errors'>('overview')
  const { user } = useAppStore()

  // Only show to premium users or admins
  if (!user || user.userTier !== 'premium') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>This feature is only available to premium users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Monitoring Dashboard</h1>
          <p className="text-gray-400">Real-time analytics and performance metrics</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'performance', label: 'Performance' },
            { id: 'errors', label: 'Errors' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'errors' && <ErrorsTab />}
        </motion.div>
      </div>
    </div>
  )
}

function OverviewTab() {
  const { user } = useAppStore()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Messages"
        value="1,234"
        change="+12%"
        icon="💬"
      />
      <MetricCard
        title="Active Users"
        value="89"
        change="+8%"
        icon="👥"
      />
      <MetricCard
        title="Chat Rooms"
        value="23"
        change="+2"
        icon="🏠"
      />
      <MetricCard
        title="Error Rate"
        value="0.1%"
        change="-5%"
        icon="⚠️"
        trend="down"
      />
    </div>
  )
}

function AnalyticsTab() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    // Get analytics events
    const analyticsEvents = analytics.getEvents()
    setEvents(analyticsEvents.slice(-20).reverse()) // Show last 20 events
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.map((event, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  event.event === 'error' ? 'bg-red-500' :
                  event.event === 'user_action' ? 'bg-blue-500' :
                  event.event === 'page_view' ? 'bg-green-500' :
                  'bg-gray-500'
                }`} />
                <div>
                  <span className="font-medium capitalize">{event.event.replace('_', ' ')}</span>
                  {event.category && <span className="text-gray-400 ml-2">• {event.category}</span>}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EventChart title="Events by Type" data={getEventTypeData(events)} />
        <EventChart title="Events by Category" data={getCategoryData(events)} />
      </div>
    </div>
  )
}

function PerformanceTab() {
  const [metrics, setMetrics] = useState<any[]>([])

  useEffect(() => {
    // Get performance metrics from analytics
    const performanceEvents = analytics.getEvents().filter(e => e.event === 'performance_metric')
    setMetrics(performanceEvents.slice(-10))
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Avg Load Time"
          value="2.3s"
          change="-0.2s"
          icon="⚡"
          trend="down"
        />
        <MetricCard
          title="Core Web Vitals"
          value="Good"
          change="+5%"
          icon="📊"
        />
        <MetricCard
          title="Memory Usage"
          value="45MB"
          change="+2MB"
          icon="🧠"
        />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Component Performance</h2>
        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <span className="font-medium">{metric.label}</span>
              <span className="text-green-400">{metric.value}ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorsTab() {
  const [errors, setErrors] = useState<any[]>([])

  useEffect(() => {
    // Get error events from analytics
    const errorEvents = analytics.getEvents().filter(e => e.event === 'error')
    setErrors(errorEvents.slice(-10))
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Total Errors"
          value="12"
          change="-3"
          icon="❌"
          trend="down"
        />
        <MetricCard
          title="Error Rate"
          value="0.1%"
          change="-0.05%"
          icon="📈"
          trend="down"
        />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {errors.map((error, index) => (
            <div key={index} className="border border-red-800 rounded p-4 bg-red-900/20">
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium text-red-400">{error.category}</span>
                <span className="text-sm text-gray-400">
                  {new Date(error.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-2">{error.metadata?.message || 'Unknown error'}</p>
              {error.metadata?.component && (
                <span className="text-xs text-gray-500">Component: {error.metadata.component}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper components
function MetricCard({ title, value, change, icon, trend = 'up' }: {
  title: string
  value: string
  change: string
  icon: string
  trend?: 'up' | 'down'
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className={`text-sm font-medium ${
          trend === 'up' ? 'text-green-400' : 'text-red-400'
        }`}>
          {change}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-gray-400 text-sm">{title}</p>
      </div>
    </div>
  )
}

function EventChart({ title, data }: { title: string; data: any[] }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm">{item.label}</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-400">{item.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper functions
function getEventTypeData(events: any[]) {
  const types = events.reduce((acc, event) => {
    acc[event.event] = (acc[event.event] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total = events.length
  return Object.entries(types).map(([type, count]) => ({
    label: type.replace('_', ' '),
    count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }))
}

function getCategoryData(events: any[]) {
  const categories = events.reduce((acc, event) => {
    const category = event.category || 'other'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total = events.length
  return Object.entries(categories).map(([category, count]) => ({
    label: category,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }))
}
