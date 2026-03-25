import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

export default function ChatbotDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [chatbot, setChatbot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')
  const [knowledgeBase, setKnowledgeBase] = useState([])
  const [newKB, setNewKB] = useState({ question: '', answer: '' })
  const [embedCode, setEmbedCode] = useState('')

  useEffect(() => {
    fetchChatbot()
  }, [id])

  async function fetchChatbot() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/chatbots/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setChatbot(data)
      setKnowledgeBase(JSON.parse(data.knowledge_base || '[]'))
    } catch (error) {
      console.error('Failed to fetch chatbot:', error)
      navigate('/chatbots')
    } finally {
      setLoading(false)
    }
  }

  async function fetchEmbedCode() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/chatbots/${id}/embed`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setEmbedCode(data.embedCode)
    } catch (error) {
      console.error('Failed to fetch embed code:', error)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/chatbots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(chatbot)
      })

      if (res.ok) {
        const updated = await res.json()
        setChatbot(updated)
      }
    } catch (error) {
      console.error('Failed to save chatbot:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddKB(e) {
    e.preventDefault()
    if (!newKB.question || !newKB.answer) return

    const updated = [...knowledgeBase, newKB]
    setKnowledgeBase(updated)
    setNewKB({ question: '', answer: '' })

    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/chatbots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ knowledge_base: JSON.stringify(updated) })
      })
    } catch (error) {
      console.error('Failed to update knowledge base:', error)
    }
  }

  async function handleDeleteKB(index) {
    const updated = knowledgeBase.filter((_, i) => i !== index)
    setKnowledgeBase(updated)

    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/chatbots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ knowledge_base: JSON.stringify(updated) })
      })
    } catch (error) {
      console.error('Failed to update knowledge base:', error)
    }
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
      <div className="flex items-center gap-4">
        <Link to="/chatbots" className="text-gray-500 hover:text-gray-700">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{chatbot?.name}</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {['settings', 'knowledge', 'embed'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'embed') fetchEmbedCode()
              }}
              className={`py-4 border-b-2 font-medium capitalize ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={chatbot?.name || ''}
                onChange={e => setChatbot({ ...chatbot, name: e.target.value })}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={chatbot?.is_active ? 1 : 0}
                onChange={e => setChatbot({ ...chatbot, is_active: parseInt(e.target.value) })}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={chatbot?.description || ''}
              onChange={e => setChatbot({ ...chatbot, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Welcome Message</label>
            <input
              type="text"
              value={chatbot?.welcome_message || ''}
              onChange={e => setChatbot({ ...chatbot, welcome_message: e.target.value })}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fallback Message</label>
            <input
              type="text"
              value={chatbot?.fallback_message || ''}
              onChange={e => setChatbot({ ...chatbot, fallback_message: e.target.value })}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <form onSubmit={handleAddKB} className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Add Q&A</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={newKB.question}
                onChange={e => setNewKB({ ...newKB, question: e.target.value })}
                placeholder="Question"
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                value={newKB.answer}
                onChange={e => setNewKB({ ...newKB, answer: e.target.value })}
                placeholder="Answer"
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add
            </button>
          </form>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Answer</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {knowledgeBase.map((kb, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">{kb.question}</td>
                    <td className="px-6 py-4">{kb.answer}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteKB(i)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {knowledgeBase.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No knowledge base entries yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embed Tab */}
      {activeTab === 'embed' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Embed Code</h3>
          <p className="text-sm text-gray-600 mb-4">
            Copy this code and paste it before the closing &lt;/body&gt; tag of your website.
          </p>
          <textarea
            readOnly
            value={embedCode}
            className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
          />
          <button
            onClick={() => navigator.clipboard.writeText(embedCode)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  )
}