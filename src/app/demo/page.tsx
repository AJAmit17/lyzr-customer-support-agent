'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Copy, ExternalLink } from 'lucide-react'
import { getAppUrl, getWidgetUrl } from '@/lib/app-url'

export default function Demo() {
  const [agentId, setAgentId] = useState('')
  const [agents, setAgents] = useState<Array<{id: string, name: string, description: string}>>([])
  const { toast } = useToast()

  // Fetch available agents on component mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agent/create')
        const data = await response.json()
        if (data.success && data.agents.length > 0) {
          setAgents(data.agents)
          
          // Check URL params for pre-selected agent
          const urlParams = new URLSearchParams(window.location.search)
          const urlAgentId = urlParams.get('agent')
          
          if (urlAgentId && data.agents.find((a: {id: string}) => a.id === urlAgentId)) {
            setAgentId(urlAgentId)
          } else if (!agentId) {
            // Set first agent as default if no agent selected and no URL param
            setAgentId(data.agents[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching agents:', error)
      }
    }
    fetchAgents()
  }, [agentId])

  useEffect(() => {
    // Load the chat widget script dynamically only if agentId is provided
    if (!agentId) return

    const script = document.createElement('script')
    script.src = getWidgetUrl()
    script.setAttribute('data-agent-id', agentId)
    script.setAttribute('data-api-url', getAppUrl())
    script.setAttribute('data-title', 'Customer Support')
    script.setAttribute('data-subtitle', 'How can we help you?')
    script.setAttribute('data-primary-color', '#3b82f6')
    script.async = true
    
    document.head.appendChild(script)
    
    return () => {
      // Cleanup script when component unmounts or agentId changes
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
      // Also remove any existing widget
      const existingWidget = document.querySelector('.lyzr-chat-widget')
      if (existingWidget) {
        existingWidget.remove()
      }
    }
  }, [agentId])

  const copyEmbedCode = () => {
    if (!agentId) return
    
    const appUrl = getAppUrl()
    const embedCode = `<script
  src="${appUrl}/widget/chat.js"
  data-agent-id="${agentId}"
  data-api-url="${appUrl}"
  data-title="Customer Support"
  data-subtitle="How can we help you?"
  data-primary-color="#3b82f6"
></script>`

    navigator.clipboard.writeText(embedCode)
    toast({
      title: 'Copied!',
      description: 'Embed code copied to clipboard'
    })
  }

  const selectedAgent = agents.find(agent => agent.id === agentId)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Widget Demo & Testing</h1>
          <p className="text-gray-600">Test your AI chat widgets and get embed codes for deployment</p>
        </div>
        
        <div className="grid gap-8">
          {/* Agent Selection & Widget Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Select Agent & Test Widget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="agent-select">Choose Agent:</Label>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Select an Agent to Test --" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-sm text-gray-500">{agent.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {agentId && selectedAgent && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-green-900">✅ Widget Loaded Successfully</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/dashboard', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Dashboard
                      </Button>
                    </div>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>Agent:</strong> {selectedAgent.name}</p>
                      <p><strong>Description:</strong> {selectedAgent.description}</p>
                      <p><strong>Agent ID:</strong> <code className="bg-green-100 px-2 py-1 rounded">{agentId}</code></p>
                    </div>
                    <p className="text-sm text-green-700 mt-3">
                      🎯 Look for the chat widget in the bottom-right corner. Click it to start testing!
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Click the chat widget (bottom-right)</li>
                        <li>• Ask questions to test AI responses</li>
                        <li>• Check tickets created in dashboard</li>
                        <li>• Try different conversation flows</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Widget Features:</h4>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• Real-time AI responses</li>
                        <li>• Automatic ticket creation</li>
                        <li>• Session management</li>
                        <li>• Mobile responsive design</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Embed Code */}
          {agentId && (
            <Card>
              <CardHeader>
                <CardTitle>Embed Code for Website</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Copy this code to your website:</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Paste this code before the closing &lt;/body&gt; tag of your website to add the chat widget.
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`<script
  src="${getAppUrl()}/widget/chat.js"
  data-agent-id="${agentId}"
  data-api-url="${getAppUrl()}"
  data-title="Customer Support"
  data-subtitle="How can we help you?"
  data-primary-color="#3b82f6"
></script>`}</code>
                    </pre>
                    <Button
                      className="absolute top-2 right-2"
                      size="sm"
                      onClick={copyEmbedCode}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">Customization Options:</h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li><code>data-title</code>: Widget title text</li>
                      <li><code>data-subtitle</code>: Widget subtitle</li>
                      <li><code>data-primary-color</code>: Theme color (hex)</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Important Notes:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Each agent has a unique ID</li>
                      <li>• Tickets are linked to the agent</li>
                      <li>• Widget is mobile responsive</li>
                      <li>• Works on all modern browsers</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open('/dashboard', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Reload Widget
                </Button>
                {agentId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = `${getAppUrl()}/demo?agent=${agentId}`
                      navigator.clipboard.writeText(url)
                      toast({
                        title: 'Copied!',
                        description: 'Demo URL copied to clipboard'
                      })
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Demo URL
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
