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
  const [isLoadingWidget, setIsLoadingWidget] = useState(false)
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

    setIsLoadingWidget(true)

    // Clean up any existing widget first
    const existingWidget = document.querySelector('.lyzr-chat-widget')
    if (existingWidget) {
      existingWidget.remove()
    }

    // Remove any existing scripts
    const existingScripts = document.querySelectorAll('script[data-agent-id]')
    existingScripts.forEach(script => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    })

    // Add a small delay to ensure cleanup is complete
    const timeoutId = setTimeout(() => {
      const script = document.createElement('script')
      script.src = getWidgetUrl()
      script.setAttribute('data-agent-id', agentId)
      script.setAttribute('data-api-url', getAppUrl())
      script.setAttribute('data-title', 'Customer Support')
      script.setAttribute('data-subtitle', 'How can we help you?')
      script.setAttribute('data-primary-color', '#3b82f6')
      script.async = true
      
      // Add load event listener to know when widget is ready
      script.onload = () => {
        setTimeout(() => setIsLoadingWidget(false), 500) // Small delay to ensure widget is fully rendered
      }
      
      document.head.appendChild(script)
    }, 100)
    
    return () => {
      // Clear timeout if component unmounts before script loads
      clearTimeout(timeoutId)
      
      // Cleanup script when component unmounts or agentId changes
      const scripts = document.querySelectorAll('script[data-agent-id]')
      scripts.forEach(script => {
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      })
      
      // Also remove any existing widget
      const existingWidget = document.querySelector('.lyzr-chat-widget')
      if (existingWidget) {
        existingWidget.remove()
      }
      
      setIsLoadingWidget(false)
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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Widget Demo & Testing</h1>
          <p className="text-gray-600 text-sm sm:text-base">Test your AI chat widgets and get embed codes for deployment</p>
        </div>
        
        <div className="grid gap-6 lg:gap-8">
          {/* Agent Selection & Widget Demo */}
          <Card className="w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Select Agent & Test Widget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="w-full">
                <Label htmlFor="agent-select" className="text-sm font-medium">Choose Agent:</Label>
                <Select value={agentId} onValueChange={(newAgentId) => {
                  setAgentId(newAgentId)
                  const selectedAgentName = agents.find(a => a.id === newAgentId)?.name
                  if (selectedAgentName) {
                    toast({
                      title: 'Agent Changed',
                      description: `Widget is now using ${selectedAgentName}`,
                    })
                  }
                }}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="-- Select an Agent to Test --" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <span className="font-medium">{agent.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {agentId && selectedAgent && (
                <div className="space-y-4 w-full">
                  {isLoadingWidget ? (
                    <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <h3 className="font-medium text-blue-900 text-sm sm:text-base">Loading Widget for {selectedAgent.name}...</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-blue-700 mt-2">
                        Please wait while the widget is being initialized...
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                        <h3 className="font-medium text-green-900 text-sm sm:text-base">✅ Widget Loaded Successfully</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('/dashboard', '_blank')}
                          className="w-full sm:w-auto"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Dashboard
                        </Button>
                      </div>
                      <div className="text-sm text-green-800 space-y-1 break-words">
                        <p><strong>Agent:</strong> <span className="break-words">{selectedAgent.name}</span></p>
                        <p><strong>Description:</strong> <span className="break-words">{selectedAgent.description}</span></p>
                        <p><strong>Agent ID:</strong> <code className="bg-green-100 px-2 py-1 rounded text-xs break-all">{agentId}</code></p>
                      </div>
                      <p className="text-xs sm:text-sm text-green-700 mt-3">
                        🎯 Look for the chat widget in the bottom-right corner. Click it to start testing!
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">How to Test:</h4>
                      <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                        <li>• Click the chat widget (bottom-right)</li>
                        <li>• Ask questions to test AI responses</li>
                        <li>• Check tickets created in dashboard</li>
                        <li>• Try different conversation flows</li>
                      </ul>
                    </div>

                    <div className="p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2 text-sm sm:text-base">Widget Features:</h4>
                      <ul className="text-xs sm:text-sm text-purple-800 space-y-1">
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
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Embed Code for Website</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full">
                  <Label className="text-sm font-medium">Copy this code to your website:</Label>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    Paste this code before the closing &lt;/body&gt; tag of your website to add the chat widget.
                  </p>
                  <div className="relative w-full">
                    <pre className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm max-w-full">
                      <code className="block whitespace-pre-wrap break-all">{`<script
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
                      <Copy className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Copy Code</span>
                      <span className="sm:hidden">Copy</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2 text-sm sm:text-base">Customization Options:</h4>
                    <ul className="text-xs sm:text-sm text-orange-800 space-y-1">
                      <li><code className="text-xs">data-title</code>: Widget title text</li>
                      <li><code className="text-xs">data-subtitle</code>: Widget subtitle</li>
                      <li><code className="text-xs">data-primary-color</code>: Theme color (hex)</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Important Notes:</h4>
                    <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
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
          <Card className="w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open('/dashboard', '_blank')}
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto"
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
                    className="w-full sm:w-auto"
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
