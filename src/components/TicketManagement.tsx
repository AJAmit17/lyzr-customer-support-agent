'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    MessageSquare,
    Clock,
    CheckCircle,
    AlertTriangle,
    User,
    Bot,
    Search,
    Filter,
    RefreshCw,
    Archive,
    Reply
} from 'lucide-react'

interface Agent {
    id: string
    name: string
    description: string
}

interface Visitor {
    name: string | null
    email: string | null
}

interface Ticket {
    id: string
    sessionId: string
    userInput: string
    agentReply: string
    status: 'OPEN' | 'CLOSED' | 'PENDING' | 'RESOLVED' | 'ESCALATED'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    createdAt: string
    resolvedAt?: string
    agent: Agent
    visitor: Visitor | null
}

export default function TicketManagement() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
    const [activeTab, setActiveTab] = useState('all')

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [agentFilter, setAgentFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')

    // Response form
    const [responseText, setResponseText] = useState('')
    const [isResponding, setIsResponding] = useState(false)

    useEffect(() => {
        fetchTickets()
        fetchAgents()
    }, [])

    const fetchTickets = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/tickets')
            const data = await response.json()
            if (data.success) {
                setTickets(data.tickets || [])
            }
        } catch (error) {
            console.error('Error fetching tickets:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAgents = async () => {
        try {
            const response = await fetch('/api/agent/create')
            const data = await response.json()
            if (data.success) {
                setAgents(data.agents || [])
            }
        } catch (error) {
            console.error('Error fetching agents:', error)
        }
    }

    const filterTickets = useCallback(() => {
        let filtered = tickets

        // Filter by tab
        if (activeTab !== 'all') {
            switch (activeTab) {
                case 'open':
                    filtered = filtered.filter(t => t.status === 'OPEN')
                    break
                case 'pending':
                    filtered = filtered.filter(t => t.status === 'PENDING')
                    break
                case 'resolved':
                    filtered = filtered.filter(t => t.status === 'RESOLVED')
                    break
            }
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.userInput.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.agentReply.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.visitor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.visitor?.email?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter)
        }

        // Filter by agent
        if (agentFilter !== 'all') {
            filtered = filtered.filter(t => t.agent.id === agentFilter)
        }

        // Filter by priority
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(t => t.priority === priorityFilter)
        }

        setFilteredTickets(filtered)
    }, [tickets, searchTerm, statusFilter, agentFilter, priorityFilter, activeTab])

    useEffect(() => {
        filterTickets()
    }, [filterTickets])

    const updateTicketStatus = async (ticketId: string, status: string) => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (response.ok) {
                await fetchTickets()
                if (selectedTicket?.id === ticketId) {
                    setSelectedTicket(prev => prev ? { ...prev, status: status as 'OPEN' | 'CLOSED' | 'PENDING' | 'RESOLVED' | 'ESCALATED' } : null)
                }
            }
        } catch (error) {
            console.error('Error updating ticket status:', error)
        }
    }

    const addResponse = async (ticketId: string) => {
        if (!responseText.trim()) return

        try {
            setIsResponding(true)
            const response = await fetch(`/api/tickets/${ticketId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    response: responseText,
                    status: 'IN_PROGRESS'
                })
            })

            if (response.ok) {
                await fetchTickets()
                setResponseText('')
                // Update selected ticket if it's the one we responded to
                if (selectedTicket?.id === ticketId) {
                    const updatedTicket = tickets.find(t => t.id === ticketId)
                    if (updatedTicket) {
                        setSelectedTicket(updatedTicket)
                    }
                }
            }
        } catch (error) {
            console.error('Error adding response:', error)
        } finally {
            setIsResponding(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-red-100 text-red-800'
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
            case 'RESOLVED': return 'bg-green-100 text-green-800'
            case 'CLOSED': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getTicketCounts = () => {
        return {
            all: tickets.length,
            open: tickets.filter(t => t.status === 'OPEN').length,
            inProgress: tickets.filter(t => t.status === 'PENDING').length,
            resolved: tickets.filter(t => t.status === 'RESOLVED').length
        }
    }

    const counts = getTicketCounts()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading tickets...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Ticket Management</h1>
                        <p className="text-gray-600 mt-2">Manage and resolve customer support tickets from AI bot widgets</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={fetchTickets}
                            variant="outline"
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
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
                                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                                <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
                            </div>
                            <MessageSquare className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Open</p>
                                <p className="text-2xl font-bold text-red-600">{counts.open}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">In Progress</p>
                                <p className="text-2xl font-bold text-yellow-600">{counts.inProgress}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Resolved</p>
                                <p className="text-2xl font-bold text-green-600">{counts.resolved}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <Input
                                    placeholder="Search tickets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="OPEN">Open</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                    <SelectItem value="ESCALATED">Escalated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Agent</label>
                            <Select value={agentFilter} onValueChange={setAgentFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Agents" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Agents</SelectItem>
                                    {agents.map(agent => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Priorities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="LOW">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                    <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({counts.inProgress})</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved ({counts.resolved})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Ticket List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Tickets ({filteredTickets.length})</span>
                                    <Filter className="w-4 h-4" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-96 overflow-y-auto">
                                    {filteredTickets.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No tickets found</p>
                                            <p className="text-sm">Try adjusting your filters</p>
                                        </div>
                                    ) : (
                                        filteredTickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-50 border-blue-200' : ''
                                                    }`}
                                                onClick={() => setSelectedTicket(ticket)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={getStatusColor(ticket.status)}>
                                                            {ticket.status}
                                                        </Badge>
                                                        {ticket.priority && (
                                                            <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                                                {ticket.priority}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <p className="font-medium text-sm mb-1 line-clamp-2">
                                                    {ticket.userInput}
                                                </p>

                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Bot className="w-3 h-3" />
                                                        {ticket.agent.name}
                                                    </span>
                                                    {ticket.visitor?.name && (
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {ticket.visitor.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ticket Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {selectedTicket ? 'Ticket Details' : 'Select a Ticket'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {selectedTicket ? (
                                    <div className="space-y-6">
                                        {/* Ticket Info */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={getStatusColor(selectedTicket.status)}>
                                                        {selectedTicket.status}
                                                    </Badge>
                                                    {selectedTicket.priority && (
                                                        <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>
                                                            {selectedTicket.priority}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(selectedTicket.createdAt).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium">Agent:</span> {selectedTicket.agent.name}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Session:</span>
                                                    <code className="ml-1 text-xs bg-gray-100 px-1 rounded">
                                                        {selectedTicket.sessionId.slice(-8)}
                                                    </code>
                                                </div>
                                                {selectedTicket.visitor?.name && (
                                                    <div>
                                                        <span className="font-medium">Customer:</span> {selectedTicket.visitor.name}
                                                    </div>
                                                )}
                                                {selectedTicket.visitor?.email && (
                                                    <div>
                                                        <span className="font-medium">Email:</span> {selectedTicket.visitor.email}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Conversation */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium">Conversation</h4>

                                            {/* Customer Message */}
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                    <span className="font-medium text-blue-900">Customer</span>
                                                </div>
                                                <p className="text-sm text-blue-800">{selectedTicket.userInput}</p>
                                            </div>

                                            {/* AI Response */}
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Bot className="w-4 h-4 text-gray-600" />
                                                    <span className="font-medium text-gray-900">AI Agent</span>
                                                </div>
                                                <p className="text-sm text-gray-800">{selectedTicket.agentReply}</p>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Actions */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium">Actions</h4>

                                            {/* Status Actions */}
                                            <div className="flex gap-2 flex-wrap">
                                                {selectedTicket.status !== 'PENDING' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateTicketStatus(selectedTicket.id, 'IN_PROGRESS')}
                                                    >
                                                        <Clock className="w-4 h-4 mr-2" />
                                                        Mark In Progress
                                                    </Button>
                                                )}

                                                {selectedTicket.status !== 'RESOLVED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateTicketStatus(selectedTicket.id, 'RESOLVED')}
                                                        className="text-green-700 border-green-300 hover:bg-green-50"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Mark Resolved
                                                    </Button>
                                                )}

                                                {selectedTicket.status !== 'CLOSED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateTicketStatus(selectedTicket.id, 'CLOSED')}
                                                        className="text-gray-700 border-gray-300 hover:bg-gray-50"
                                                    >
                                                        <Archive className="w-4 h-4 mr-2" />
                                                        Close Ticket
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Add Response */}
                                            {selectedTicket.status !== 'CLOSED' && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Add Response:</label>
                                                    <Textarea
                                                        placeholder="Type your response to the customer..."
                                                        value={responseText}
                                                        onChange={(e) => setResponseText(e.target.value)}
                                                        rows={3}
                                                    />
                                                    <Button
                                                        onClick={() => addResponse(selectedTicket.id)}
                                                        disabled={!responseText.trim() || isResponding}
                                                        size="sm"
                                                    >
                                                        <Reply className="w-4 h-4 mr-2" />
                                                        {isResponding ? 'Sending...' : 'Send Response'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Select a ticket from the list to view details</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
