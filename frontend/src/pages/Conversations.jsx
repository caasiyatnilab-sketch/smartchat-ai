import { useState, useEffect } from 'react'

export default function Conversations() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConv, setSelectedConv] = useState(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  async function fetchConversations() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setConversations(data)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchConversationDetails(id) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setSelectedConv(data)
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
    }
  }

  async function handleEndConversation(id) {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'ended' })
      })
      fetchConversations()
      if (selectedConv?.id === id) {
        fetchConversationDetails(id)
      }
    } catch (error) {
      console.error('Failed to end conversation:', error)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-600">View all visitor conversations</p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <span className="text-6xl">💬</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No conversations yet</h3>
          <p className="mt-2 text-gray-600">Conversations will appear here when visitors chat with your bots</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{conversations.length} Conversations</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => fetchConversationDetails(conv.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedConv?.id === conv.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {conv.visitor_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">{conv.chatbot_name}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      conv.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDate(conv.started_at)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Details */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            {selectedConv ? (
              <>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedConv.visitor_name || 'Anonymous'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {formatDate(selectedConv.started_at)}
                      {selectedConv.ended_at && ` - ${formatDate(selectedConv.ended_at)}`}
                    </p>
                  </div>
                  {selectedConv.status === 'active' && (
                    <button
                      onClick={() => handleEndConversation(selectedConv.id)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      End Conversation
                    </button>
                  )}
                </div>

                <div className="p-4 max-h-[500px] overflow-y-auto space-y-4">
                  {selectedConv.messages?.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.role === 'user' ? 'text-primary-200' : 'text-gray-500'
                        }`}>
                          {formatDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!selectedConv.messages || selectedConv.messages.length === 0) && (
                    <p className="text-center text-gray-500 py-8">No messages</p>
                  )}
                </div>

                {selectedConv.satisfaction_score && (
                  <div className="p-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Satisfaction Score: <span className="font-semibold">{selectedConv.satisfaction_score}/5</span>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                Select a conversation to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}