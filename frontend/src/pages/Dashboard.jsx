import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/analytics/overview', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Chatbots', value: stats?.total_chatbots || 0, icon: '🤖', color: 'bg-blue-50' },
    { label: 'Conversations', value: stats?.total_conversations || 0, icon: '💬', color: 'bg-green-50' },
    { label: 'Messages', value: stats?.total_messages || 0, icon: '💭', color: 'bg-purple-50' },
    { label: 'Active Visitors', value: stats?.active_visitors || 0, icon: '👥', color: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your AI chatbots</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))
        ) : (
          statCards.map((stat, i) => (
            <div key={i} className={`${stat.color} rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <span className="text-4xl">{stat.icon}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Today's Activity */}
      {stats && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-primary-600">{stats.conversations_today}</p>
              <p className="text-sm text-gray-600">Conversations</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-primary-600">{stats.messages_today}</p>
              <p className="text-sm text-gray-600">Messages</p>
            </div>
          </div>
          {stats.avg_satisfaction && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Average Satisfaction</p>
              <p className="text-2xl font-bold text-green-600">{stats.avg_satisfaction}/5</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/chatbots"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <span className="mr-2">+</span> New Chatbot
          </Link>
          <Link
            to="/conversations"
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            View Conversations
          </Link>
          <Link
            to="/analytics"
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {stats?.total_chatbots === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl">🤖</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No chatbots yet</h3>
          <p className="mt-2 text-gray-600">Create your first AI chatbot to get started</p>
          <Link
            to="/chatbots"
            className="mt-4 inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Chatbot
          </Link>
        </div>
      )}
    </div>
  )
}