/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Copy, Settings, MessageSquare, FileText, Trash2, BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import TicketManagement from '@/components/TicketManagement'
import { getAppUrl } from '@/lib/app-url'

interface Agent {
    id: string
    lyzrAgentId: string
    name: string
    description: string | null
    systemPrompt: string
    temperature: number
    createdAt: string
    updatedAt: string
    kbAssets: Array<{
        id: string
        assetId: string
        fileName: string | null
        fileType: string | null
    }>
    ticketCount: number
}

interface Ticket {
    id: string
    sessionId: string
    userInput: string
    agentReply: string
    status: string
    createdAt: string
    visitor: {
        name: string | null
        email: string | null
    } | null
}

export default function Dashboard() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const { toast } = useToast()
    const { isLoaded, isSignedIn } = useUser()

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchAgents()
        }
    }, [isLoaded, isSignedIn])

    useEffect(() => {
        if (selectedAgent) {
            fetchTickets(selectedAgent.id)
        }
    }, [selectedAgent])

    const fetchAgents = async () => {
        try {
            const response = await fetch('/api/agent/create')
            const data = await response.json()
            if (data.success) {
                setAgents(data.agents)
                if (data.agents.length > 0 && !selectedAgent) {
                    setSelectedAgent(data.agents[0])
                }
            }
        } catch (error) {
            console.error('Error fetching agents:', error)
            toast({
                title: 'Error',
                description: 'Failed to fetch agents',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchTickets = async (agentId: string) => {
        try {
            const response = await fetch(`/api/tickets?agent_id=${agentId}`)
            const data = await response.json()
            if (data.success) {
                setTickets(data.tickets)
            }
        } catch (error) {
            console.error('Error fetching tickets:', error)
        }
    }

    const updateAgent = async (agentId: string, updates: {
        name?: string
        description?: string
        system_prompt?: string
        temperature?: number
    }) => {
        try {
            const response = await fetch(`/api/agent/${agentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })

            const data = await response.json()
            if (data.success) {
                await fetchAgents()
                toast({
                    title: 'Success',
                    description: 'Agent updated successfully'
                })
                return true
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('Error updating agent:', error)
            toast({
                title: 'Error',
                description: 'Failed to update agent',
                variant: 'destructive'
            })
            return false
        }
    }

    const deleteAgent = async (agentId: string) => {
        if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`/api/agent/${agentId}`, {
                method: 'DELETE'
            })

            const data = await response.json()
            if (data.success) {
                await fetchAgents()
                setSelectedAgent(null)
                toast({
                    title: 'Success',
                    description: 'Agent deleted successfully'
                })
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('Error deleting agent:', error)
            toast({
                title: 'Error',
                description: 'Failed to delete agent',
                variant: 'destructive'
            })
        }
    }

    const uploadDocument = async (agentId: string, file: File) => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('agent_id', agentId)

            const response = await fetch('/api/upload-doc', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()
            if (data.success) {
                await fetchAgents()
                toast({
                    title: 'Success',
                    description: 'Document uploaded successfully'
                })
                return true
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('Error uploading document:', error)
            toast({
                title: 'Error',
                description: 'Failed to upload document',
                variant: 'destructive'
            })
            return false
        }
    }

    const copyEmbedCode = (agentId: string) => {
        const appUrl = getAppUrl()
        const embedCode = `<script
  src="${appUrl}/widget/chat.js"
  data-agent-id="${agentId}"
  data-api-url="${appUrl}"
  data-title="Customer Support"
  data-subtitle="How can we help you?"
></script>`

        navigator.clipboard.writeText(embedCode)
        toast({
            title: 'Copied!',
            description: 'Embed code copied to clipboard'
        })
    }

    if (!isLoaded || loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!isSignedIn) {
        return <div className="flex items-center justify-center min-h-screen">Please sign in to access the dashboard.</div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto p-6">
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">AI Support Dashboard</h1>
                            <p className="text-gray-600 mt-2">Manage your AI agents, knowledge bases, and customer support</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => window.location.href = '/demo'}
                                variant="outline"
                                className="border-green-500 text-green-600 hover:bg-green-50"
                            >
                                🎯 Try Demo
                            </Button>
                            <Button
                                onClick={() => window.location.href = '/setup'}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                🚀 Setup New Agent
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Agents</p>
                                    <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    🤖
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Knowledge Bases</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {agents.reduce((total, agent) => total + agent.kbAssets.filter(kb => kb.fileType === 'rag_kb').length, 0)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    📚
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {agents.reduce((total, agent) => total + (agent.ticketCount || 0), 0)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    🎫
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {tickets.filter(t => t.status === 'OPEN').length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    💬
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="agents">Agents</TabsTrigger>
                        <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                        <TabsTrigger value="tickets">Tickets</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="embed">Deploy</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <DashboardOverview
                            agents={agents}
                            tickets={tickets}
                            onSelectAgent={setSelectedAgent}
                        />
                    </TabsContent>

                    <TabsContent value="agents" className="space-y-6">
                        <AgentsList
                            agents={agents}
                            selectedAgent={selectedAgent}
                            onSelectAgent={setSelectedAgent}
                            onUpdateAgent={updateAgent}
                            onDeleteAgent={deleteAgent}
                        />
                    </TabsContent>

                    <TabsContent value="knowledge">
                        <KnowledgeBaseManager
                            agents={agents}
                            selectedAgent={selectedAgent}
                            onSelectAgent={setSelectedAgent}
                            onUploadDocument={uploadDocument}
                        />
                    </TabsContent>

                    <TabsContent value="tickets">
                        <TicketManagement />
                    </TabsContent>

                    <TabsContent value="analytics">
                        <AnalyticsDashboard agents={agents} tickets={tickets} />
                    </TabsContent>

                    <TabsContent value="embed">
                        <EmbedCode selectedAgent={selectedAgent} onCopyEmbed={copyEmbedCode} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

// New Dashboard Overview Component
function DashboardOverview({
    agents,
    tickets,
    onSelectAgent
}: {
    agents: Agent[]
    tickets: Ticket[]
    onSelectAgent: (agent: Agent) => void
}) {
    const totalKBs = agents.reduce((total, agent) => total + agent.kbAssets.filter(kb => kb.fileType === 'rag_kb').length, 0)

    return (
        <div className="space-y-6">
            {/* Quick Actions */}
            {/* <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            onClick={() => window.location.href = '/setup'}
                            className="h-20 flex flex-col gap-2"
                        >
                            <span className="text-2xl">🚀</span>
                            <span>Create New Agent</span>
                        </Button>
                        <Button
                            onClick={() => agents.length > 0 && onSelectAgent(agents[0])}
                            variant="outline"
                            className="h-20 flex flex-col gap-2"
                            disabled={agents.length === 0}
                        >
                            <span className="text-2xl">📊</span>
                            <span>View Analytics</span>
                        </Button>
                    </div>
                </CardContent>
            </Card> */}

            {/* System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>System Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="font-medium">AI Agents</span>
                            </div>
                            <Badge variant="secondary">{agents.length} Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="font-medium">Knowledge Bases</span>
                            </div>
                            <Badge variant="secondary">{totalKBs} Connected</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <span className="font-medium">Support Portal</span>
                            </div>
                            <Badge variant="secondary">Online</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tickets.slice(0, 5).map((ticket) => (
                                <div key={ticket.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {ticket.userInput.slice(0, 50)}...
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={ticket.status === 'RESOLVED' ? 'default' : 'secondary'}
                                        className="text-xs"
                                    >
                                        {ticket.status}
                                    </Badge>
                                </div>
                            ))}
                            {tickets.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No recent activity</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Agent Overview */}
            {agents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Agent Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {agents.map((agent) => (
                                <div key={agent.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium">{agent.name}</h4>
                                        <Badge variant="outline">{agent.ticketCount || 0} tickets</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>KB Assets: {agent.kbAssets.length}</span>
                                        <span>Temp: {agent.temperature}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// Analytics Dashboard Component
function AnalyticsDashboard({ agents, tickets }: { agents: Agent[], tickets: Ticket[] }) {
    const totalTickets = agents.reduce((total, agent) => total + (agent.ticketCount || 0), 0)
    const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED').length
    const openTickets = tickets.filter(t => t.status === 'OPEN').length
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                                <p className="text-2xl font-bold text-green-600">{resolutionRate}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                                <p className="text-2xl font-bold text-blue-600">&lt; 1s</p>
                            </div>
                            <Clock className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                                <p className="text-2xl font-bold text-purple-600">{resolvedTickets}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                                <p className="text-2xl font-bold text-orange-600">{openTickets}</p>
                            </div>
                            <MessageSquare className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Agent Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Agent Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {agents.map((agent) => (
                            <div key={agent.id} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 className="font-medium">{agent.name}</h4>
                                        <p className="text-xs text-gray-500 font-mono">ID: {agent.id}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline">{agent.ticketCount || 0} tickets</Badge>
                                        <Badge variant="secondary">{agent.kbAssets.length} KB assets</Badge>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Created:</span>
                                        <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Temperature:</span>
                                        <span>{agent.temperature}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">RAG Enabled:</span>
                                        <span className={agent.kbAssets.some(kb => kb.fileType === 'rag_kb') ? 'text-green-600' : 'text-gray-400'}>
                                            {agent.kbAssets.some(kb => kb.fileType === 'rag_kb') ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Tickets Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle>Ticket Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium mb-3">Status Distribution</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                    <span className="text-sm">Resolved</span>
                                    <Badge variant="default">{resolvedTickets}</Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                                    <span className="text-sm">Open</span>
                                    <Badge variant="secondary">{openTickets}</Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                    <span className="text-sm">In Progress</span>
                                    <Badge variant="outline">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</Badge>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-3">Recent Activity</h4>
                            <div className="space-y-2">
                                {tickets.slice(0, 5).map((ticket) => (
                                    <div key={ticket.id} className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {ticket.userInput.slice(0, 40)}...
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(ticket.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={ticket.status === 'RESOLVED' ? 'default' : 'secondary'}
                                            className="text-xs ml-2"
                                        >
                                            {ticket.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function AgentsList({
    agents,
    selectedAgent,
    onSelectAgent,
    onUpdateAgent,
    onDeleteAgent
}: {
    agents: Agent[]
    selectedAgent: Agent | null
    onSelectAgent: (agent: Agent) => void
    onUpdateAgent: (agentId: string, updates: any) => Promise<boolean>
    onDeleteAgent: (agentId: string) => void
}) {
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        system_prompt: '',
        temperature: 0.7
    })

    const startEditing = (agent: Agent) => {
        setEditingAgent(agent)
        setEditForm({
            name: agent.name,
            description: agent.description || '',
            system_prompt: agent.systemPrompt,
            temperature: agent.temperature
        })
    }

    const handleUpdate = async () => {
        if (!editingAgent) return

        const success = await onUpdateAgent(editingAgent.id, editForm)
        if (success) {
            setEditingAgent(null)
        }
    }



    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Agents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {agents.map((agent) => (
                            <div
                                key={agent.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedAgent?.id === agent.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => onSelectAgent(agent)}
                            >
                                <div className="font-medium">{agent.name}</div>
                                <div className="text-sm text-gray-600">{agent.description}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">ID: {agent.id}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary">
                                        <MessageSquare className="w-3 h-3 mr-1" />
                                        {agent.ticketCount} tickets
                                    </Badge>
                                    <Badge variant="outline">
                                        <FileText className="w-3 h-3 mr-1" />
                                        {agent.kbAssets.length} docs
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                {selectedAgent && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{selectedAgent.name}</CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => startEditing(selectedAgent)}
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => onDeleteAgent(selectedAgent.id)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {editingAgent?.id === selectedAgent.id ? (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="edit-name">Name</Label>
                                        <Input
                                            id="edit-name"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-description">Description</Label>
                                        <Input
                                            id="edit-description"
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-prompt">System Prompt</Label>
                                        <Textarea
                                            id="edit-prompt"
                                            rows={6}
                                            value={editForm.system_prompt}
                                            onChange={(e) => setEditForm({ ...editForm, system_prompt: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-temperature">Temperature: {editForm.temperature}</Label>
                                        <Input
                                            id="edit-temperature"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={editForm.temperature}
                                            onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleUpdate}>Save Changes</Button>
                                        <Button variant="outline" onClick={() => setEditingAgent(null)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <Label>Agent ID</Label>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm bg-gray-100 px-3 py-2 rounded border font-mono">{selectedAgent.id}</code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedAgent.id)
                                                    // You can add a toast notification here if needed
                                                }}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Use this ID when embedding the widget on your website</p>
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <p className="text-sm text-gray-600">{selectedAgent.description || 'No description'}</p>
                                    </div>
                                    <div>
                                        <Label>System Prompt</Label>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">{selectedAgent.systemPrompt}</p>
                                    </div>
                                    <div>
                                        <Label>Temperature</Label>
                                        <p className="text-sm text-gray-600">{selectedAgent.temperature}</p>
                                    </div>
                                    <div>
                                        <Label>Knowledge Base Documents</Label>
                                        <div className="space-y-2">
                                            {selectedAgent.kbAssets.map((asset) => (
                                                <div key={asset.id} className="flex items-center gap-2 text-sm text-gray-600">
                                                    <FileText className="w-4 h-4" />
                                                    {asset.fileName} ({asset.fileType})
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            To upload documents, use the Knowledge Base tab.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

function EmbedCode({ selectedAgent, onCopyEmbed }: { selectedAgent: Agent | null, onCopyEmbed: (agentId: string) => void }) {
    if (!selectedAgent) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <p className="text-gray-600">Select an agent to get embed code</p>
                </CardContent>
            </Card>
        )
    }

    const embedCode = `<script
  src="${getAppUrl()}/widget/chat.js"
  data-agent-id="${selectedAgent.id}"
  data-api-url="${getAppUrl()}"
  data-title="Customer Support"
  data-subtitle="How can we help you?"
></script>`

    return (
        <Card>
            <CardHeader>
                <CardTitle>Deploy Widget for {selectedAgent.name}</CardTitle>
                <p className="text-gray-600">
                    Each agent has a unique ID. Tickets raised through this widget will be associated with this specific agent.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Agent Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Agent Details:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Name:</span> {selectedAgent.name}
                        </div>
                        <div>
                            <span className="font-medium">Agent ID:</span>
                            <code className="ml-1 bg-gray-200 px-1 rounded">{selectedAgent.id}</code>
                        </div>
                        <div>
                            <span className="font-medium">Description:</span> {selectedAgent.description || 'None'}
                        </div>
                        <div>
                            <span className="font-medium">Knowledge Base:</span>
                            {selectedAgent.kbAssets.some(kb => kb.fileType === 'rag_kb') ?
                                <span className="text-green-600 ml-1">✓ Enabled</span> :
                                <span className="text-gray-500 ml-1">Not configured</span>
                            }
                        </div>
                    </div>
                </div>

                <div>
                    <Label>Embed Code:</Label>
                    <p className="text-sm text-gray-600 mb-2">
                        Copy and paste this code into your website. All tickets will be linked to agent &quot;{selectedAgent.name}&quot;.
                    </p>
                    <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            <code>{embedCode}</code>
                        </pre>
                        <Button
                            className="absolute top-2 right-2"
                            size="sm"
                            onClick={() => onCopyEmbed(selectedAgent.id)}
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Widget Features:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Real-time AI responses</li>
                            <li>• Automatic ticket creation</li>
                            <li>• Session management</li>
                            <li>• Visitor tracking</li>
                            <li>• Mobile responsive</li>
                        </ul>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Customization Options:</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                            <li><code>data-title</code>: Chat widget title</li>
                            <li><code>data-subtitle</code>: Chat widget subtitle</li>
                            <li><code>data-primary-color</code>: Widget color (hex)</li>
                            <li><code>data-position</code>: Widget position</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">🎯 Testing Your Widget:</h4>
                    <p className="text-sm text-yellow-800 mb-2">
                        Test this agent&apos;s widget on the demo page or support portal:
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/demo?agent=${selectedAgent.id}`, '_blank')}
                        >
                            Test on Demo Page
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function KnowledgeBaseManager({
    agents,
    selectedAgent,
    onSelectAgent,
    onUploadDocument
}: {
    agents: Agent[]
    selectedAgent: Agent | null
    onSelectAgent: (agent: Agent) => void
    onUploadDocument: (agentId: string, file: File) => Promise<boolean>
}) {
    const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({})
    const [dragOver, setDragOver] = useState<string | null>(null)
    const { toast } = useToast()

    const handleFileUpload = async (agentId: string, files: FileList) => {
        const file = files[0]
        if (!file) return

        // Validate file type
        if (!file.type.includes('pdf')) {
            toast({
                title: 'Invalid File Type',
                description: 'Only PDF files are supported for RAG knowledge base',
                variant: 'destructive'
            })
            return
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: 'File Too Large',
                description: 'Please select a file smaller than 10MB',
                variant: 'destructive'
            })
            return
        }

        setUploadingFiles(prev => ({ ...prev, [agentId]: true }))

        try {
            const success = await onUploadDocument(agentId, file)
            if (success) {
                toast({
                    title: 'Success',
                    description: `PDF uploaded to RAG knowledge base for ${agents.find(a => a.id === agentId)?.name}`,
                })
            }
        } finally {
            setUploadingFiles(prev => ({ ...prev, [agentId]: false }))
        }
    }

    const handleDrop = (e: React.DragEvent, agentId: string) => {
        e.preventDefault()
        setDragOver(null)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFileUpload(agentId, files)
        }
    }

    const handleDragOver = (e: React.DragEvent, agentId: string) => {
        e.preventDefault()
        setDragOver(agentId)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(null)
    }

    const getKnowledgeBaseAssets = (agent: Agent) => {
        return agent.kbAssets.filter(asset =>
            asset.fileType === 'application/pdf' ||
            asset.fileType === 'rag_kb' ||
            asset.fileName?.toLowerCase().includes('pdf')
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Knowledge Base Management</CardTitle>
                    <p className="text-gray-600">
                        Upload PDF documents to create and enhance your agents&apos; knowledge bases using RAG (Retrieval Augmented Generation).
                    </p>
                </CardHeader>
            </Card>

            {/* Agent Selection for KB Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Select Agent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {agents.map((agent) => {
                                const kbAssets = getKnowledgeBaseAssets(agent)
                                const hasRAG = kbAssets.some(asset => asset.fileType === 'rag_kb')

                                return (
                                    <div
                                        key={agent.id}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedAgent?.id === agent.id
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                        onClick={() => onSelectAgent(agent)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-lg">{agent.name}</div>
                                                <div className="text-sm text-gray-600 mt-1">{agent.description}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">ID: {agent.id}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {hasRAG && (
                                                    <Badge variant="default" className="bg-green-500">
                                                        RAG Enabled
                                                    </Badge>
                                                )}
                                                <Badge variant="outline">
                                                    {kbAssets.length} docs
                                                </Badge>
                                            </div>
                                        </div>

                                        {kbAssets.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="text-xs text-gray-500 mb-2">Knowledge Base Files:</div>
                                                <div className="space-y-1">
                                                    {kbAssets.slice(0, 3).map((asset) => (
                                                        <div key={asset.id} className="flex items-center gap-2 text-xs text-gray-600">
                                                            <FileText className="w-3 h-3" />
                                                            <span className="truncate">{asset.fileName}</span>
                                                        </div>
                                                    ))}
                                                    {kbAssets.length > 3 && (
                                                        <div className="text-xs text-gray-500">
                                                            +{kbAssets.length - 3} more files
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Knowledge Base Details & Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {selectedAgent ? `Knowledge Base: ${selectedAgent.name}` : 'Select an Agent'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedAgent ? (
                            <div className="space-y-6">
                                {/* Upload Area */}
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragOver === selectedAgent.id
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                        } ${uploadingFiles[selectedAgent.id] ? 'opacity-50' : ''}`}
                                    onDrop={(e) => handleDrop(e, selectedAgent.id)}
                                    onDragOver={(e) => handleDragOver(e, selectedAgent.id)}
                                    onDragLeave={handleDragLeave}
                                >
                                    {uploadingFiles[selectedAgent.id] ? (
                                        <div className="space-y-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="text-sm text-gray-600">
                                                Creating RAG knowledge base and uploading PDF...
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                                            <div>
                                                <p className="text-lg font-medium text-gray-900">
                                                    Upload PDF to Knowledge Base
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Drag and drop a PDF file here, or click to browse
                                                </p>
                                            </div>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => e.target.files && handleFileUpload(selectedAgent.id, e.target.files)}
                                                className="hidden"
                                                id={`file-upload-${selectedAgent.id}`}
                                                aria-label="Upload PDF file"
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={() => document.getElementById(`file-upload-${selectedAgent.id}`)?.click()}
                                            >
                                                Choose PDF File
                                            </Button>
                                            <p className="text-xs text-gray-500">
                                                Maximum file size: 10MB • Supported format: PDF only
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Knowledge Base Status */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-3">Knowledge Base Status</h4>
                                    <div className="space-y-2">
                                        {getKnowledgeBaseAssets(selectedAgent).map((asset) => (
                                            <div key={asset.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm font-medium">{asset.fileName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {asset.fileType === 'rag_kb' ? (
                                                        <Badge variant="default" className="bg-green-500">RAG KB</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">PDF</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {getKnowledgeBaseAssets(selectedAgent).length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                No knowledge base files uploaded yet. Upload your first PDF to get started.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Information Box */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Upload PDF documents to create a RAG knowledge base</li>
                                        <li>• First upload automatically creates and links the RAG system</li>
                                        <li>• Additional PDFs enhance the existing knowledge base</li>
                                        <li>• Your agent will use this knowledge to answer questions</li>
                                        <li>• Supports semantic search and context-aware responses</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">
                                    Select an agent from the left to manage its knowledge base
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
