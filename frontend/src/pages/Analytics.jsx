import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function Analytics() {
  const [overview, setOverview] = useState(null)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const token = localStorage.getItem('token')
      const [overviewRes, convRes] = await Promise.all([
        fetch('/api/analytics/overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/analytics/conversations?days=14', { headers: { Authorization: `Bearer ${token}` } })
      ])

      const overviewData = await overviewRes.json()
      const convData = await convRes.json()

      setOverview(overviewData)
      setConversations(convData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Conversations', value: overview?.total_conversations || 0, icon: '💬' },
    { label: 'Total Messages', value: overview?.total_messages || 0, icon: '💭' },
    { label: 'Active Visitors', value: overview?.active_visitors || 0, icon: '👥' },
    { label: 'Avg Satisfaction', value: overview?.avg_satisfaction || 'N/A', icon: '⭐' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Track your chatbot performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Conversations Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Conversations (Last 14 Days)</h2>
        {conversations.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="conversations" fill="#3b82f6" name="Conversations" />
              <Bar dataKey="ended" fill="#10b981" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No conversation data yet
          </div>
        )}
      </div>

      {/* Satisfaction Trend */}
      {conversations.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Satisfaction Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversations.filter(c => c.avg_satisfaction)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="avg_satisfaction" 
                stroke="#10b981" 
                name="Avg Satisfaction"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}