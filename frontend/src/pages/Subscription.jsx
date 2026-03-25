import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Subscription() {
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const token = localStorage.getItem('token')
      const [plansRes, subRes, usageRes] = await Promise.all([
        fetch('/api/subscription/plans', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/subscription/subscription', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/subscription/usage', { headers: { Authorization: `Bearer ${token}` } })
      ])
      
      setPlans(await plansRes.json())
      setCurrentPlan(await subRes.json())
      setUsage(await usageRes.json())
    } catch (error) {
      console.error('Failed to fetch subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribe(planId) {
    setSubscribing(planId)
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/subscription/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: planId })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        alert(`Successfully subscribed to ${planId} plan!`)
        fetchData()
      } else {
        alert(data.error || 'Subscription failed')
      }
    } catch (error) {
      console.error('Subscribe error:', error)
      alert('Subscription failed')
    } finally {
      setSubscribing(null)
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600">Choose the plan that works for you</p>
      </div>

      {/* Current Usage */}
      {usage && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Usage</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Chatbots</span>
                <span className="text-sm font-medium">{usage.chatbots.used} / {usage.chatbots.limit === -1 ? '∞' : usage.chatbots.limit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ width: usage.chatbots.limit === -1 ? '0%' : `${Math.min(100, (usage.chatbots.used / usage.chatbots.limit) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Conversations</span>
                <span className="text-sm font-medium">{usage.conversations.used} / {usage.conversations.limit === -1 ? '∞' : usage.conversations.limit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ width: usage.conversations.limit === -1 ? '0%' : `${Math.min(100, (usage.conversations.used / usage.conversations.limit) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => (
          <div 
            key={plan.id} 
            className={`bg-white rounded-xl p-6 shadow-sm border-2 ${
              plan.id === currentPlan?.plan ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            {plan.id === currentPlan?.plan && (
              <div className="bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded-full inline-block mb-2">
                Current Plan
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
              <span className="text-gray-600">/month</span>
            </div>
            
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={plan.id === currentPlan?.plan || subscribing}
              className={`mt-6 w-full py-2 rounded-lg font-medium transition-colors ${
                plan.id === currentPlan?.plan
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {subscribing === plan.id ? 'Processing...' : plan.id === currentPlan?.plan ? 'Current Plan' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">Can I change plans anytime?</h3>
            <p className="text-sm text-gray-600 mt-1">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">What payment methods do you accept?</h3>
            <p className="text-sm text-gray-600 mt-1">We accept all major credit cards through Stripe.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Is there a free trial?</h3>
            <p className="text-sm text-gray-600 mt-1">Our Free plan lets you try the basics forever. No credit card required.</p>
          </div>
        </div>
      </div>
    </div>
  )
}