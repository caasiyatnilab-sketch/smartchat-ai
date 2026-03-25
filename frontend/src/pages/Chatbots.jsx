import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Chatbots() {
  const [chatbots, setChatbots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchChatbots()
  }, [])

  async function fetchChatbots() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/chatbots', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setChatbots(data)
    } catch (error) {
      console.error('Failed to fetch chatbots:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/chatbots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const newBot = await res.json()
        setChatbots([newBot, ...chatbots])
        setShowModal(false)
        setFormData({ name: '', description: '' })
      }
    } catch (error) {
      console.error('Failed to create chatbot:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this chatbot?')) return

    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/chatbots/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setChatbots(chatbots.filter(b => b.id !== id))
    } catch (error) {
      console.error('Failed to delete chatbot:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatbots</h1>
          <p className="text-gray-600">Manage your AI chatbots</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <span className="mr-2">+</span> New Chatbot
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : chatbots.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <span className="text-6xl">🤖</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No chatbots yet</h3>
          <p className="mt-2 text-gray-600">Create your first AI chatbot to start engaging with visitors</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Chatbot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map(bot => (
            <div key={bot.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🤖</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{bot.name}</h3>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        bot.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {bot.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {bot.description || 'No description'}
                </p>
                <div className="flex gap-2">
                  <Link
                    to={`/chatbots/${bot.id}`}
                    className="flex-1 text-center px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(bot.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Chatbot</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="My Support Bot"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="What does this bot do?"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}