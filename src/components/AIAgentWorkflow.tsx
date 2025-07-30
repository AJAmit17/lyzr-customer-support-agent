'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Brain, Database, Link, CheckCircle } from 'lucide-react'

interface Agent {
    id: string
    name: string
    description: string
    lyzrAgentId: string
    systemPrompt: string
    model: string
    provider_id: string
    top_p: number
    temperature: number
}

interface KnowledgeBase {
    id: string
    name: string
    description: string
    agentId?: string
    agent?: Agent
}

export default function AIAgentWorkflow() {
    const [currentStep, setCurrentStep] = useState(1)
    const [agents, setAgents] = useState<Agent[]>([])
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Step 1: Agent Creation
    const [agentData, setAgentData] = useState({
        name: '',
        description: '',
        systemPrompt: '',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        top_p: 0.9
    })

    // Step 2: Knowledge Base Creation
    const [kbData, setKbData] = useState({
        name: '',
        description: '',
        selectedAgentId: ''
    })

    // Step 3: PDF Upload
    const [uploadData, setUploadData] = useState({
        selectedKbId: '',
        selectedAgentId: '',
        file: null as File | null
    })

    useEffect(() => {
        fetchAgents()
        fetchKnowledgeBases()
    }, [])

    const fetchAgents = async () => {
        try {
            const response = await fetch('/api/agent')
            if (response.ok) {
                const data = await response.json()
                setAgents(data.agents || [])
            }
        } catch (error) {
            console.error('Error fetching agents:', error)
        }
    }

    const fetchKnowledgeBases = async () => {
        try {
            const response = await fetch('/api/knowledge-base')
            if (response.ok) {
                const data = await response.json()
                setKnowledgeBases(data.knowledgeBases || [])
            }
        } catch (error) {
            console.error('Error fetching knowledge bases:', error)
        }
    }

    // Step 1: Create AI Agent
    const createAgent = async () => {
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/agent/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: agentData.name,
                    description: agentData.description,
                    system_prompt: agentData.systemPrompt,
                    model: agentData.model,
                    temperature: agentData.temperature,
                    top_p: agentData.top_p,
                    provider_id: 'lyzr_openai',
                    llm_credential_id: 'lyzr_openai'
                })
            })

            if (response.ok) {
                const data = await response.json()
                setSuccess(`Agent "${agentData.name}" created successfully!`)
                setAgents([...agents, data.agent])
                setKbData({ ...kbData, selectedAgentId: data.agent.id })
                setCurrentStep(2)
            } else {
                const errorData = await response.json()
                setError(errorData.error || 'Failed to create agent')
            }
        } catch (error) {
            setError('Failed to create agent')
            console.error('Error creating agent:', error)
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Create Knowledge Base
    const createKnowledgeBase = async () => {
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/knowledge-base', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: kbData.name,
                    description: kbData.description,
                    agentId: kbData.selectedAgentId
                })
            })

            if (response.ok) {
                const data = await response.json()
                setSuccess(`Knowledge base "${kbData.name}" created successfully!`)
                setKnowledgeBases([...knowledgeBases, data.knowledgeBase])
                setUploadData({ 
                    ...uploadData, 
                    selectedKbId: data.id,
                    selectedAgentId: kbData.selectedAgentId 
                })
                setCurrentStep(3)
            } else {
                const errorData = await response.json()
                setError(errorData.error || 'Failed to create knowledge base')
            }
        } catch (error) {
            setError('Failed to create knowledge base')
            console.error('Error creating knowledge base:', error)
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Upload PDF and Train
    const uploadPDF = async () => {
        if (!uploadData.file) {
            setError('Please select a PDF file')
            return
        }

        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const formData = new FormData()
            formData.append('file', uploadData.file)
            formData.append('agent_id', uploadData.selectedAgentId)

            const response = await fetch('/api/upload-doc', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                setSuccess('PDF uploaded and knowledge base trained successfully!')
                setCurrentStep(4) // Complete
            } else {
                const errorData = await response.json()
                setError(errorData.error || 'Failed to upload PDF')
            }
        } catch (error) {
            setError('Failed to upload PDF')
            console.error('Error uploading PDF:', error)
        } finally {
            setLoading(false)
        }
    }

    const steps = [
        { number: 1, title: 'Create AI Agent', icon: Brain, completed: currentStep > 1 },
        { number: 2, title: 'Setup Knowledge Base', icon: Database, completed: currentStep > 2 },
        { number: 3, title: 'Upload & Train PDF', icon: Upload, completed: currentStep > 3 },
        { number: 4, title: 'Complete', icon: CheckCircle, completed: currentStep > 3 }
    ]

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">AI Agent Setup Workflow</h1>
                <p className="text-gray-600">Create your AI agent, setup knowledge base, and train with documents</p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-between mb-8">
                {steps.map((step, index) => (
                    <div key={step.number} className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            step.completed ? 'bg-green-500 text-white' : 
                            currentStep === step.number ? 'bg-blue-500 text-white' : 
                            'bg-gray-200 text-gray-500'
                        }`}>
                            <step.icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm mt-2 text-center">{step.title}</span>
                        {index < steps.length - 1 && (
                            <div className={`w-full h-0.5 mt-4 ${
                                step.completed ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Alerts */}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}

            {/* Step 1: Create Agent */}
            {currentStep === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5" />
                            Step 1: Create AI Agent
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Agent Name</label>
                            <Input
                                placeholder="e.g., Customer Support Agent"
                                value={agentData.name}
                                onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <Textarea
                                placeholder="Describe what this agent does..."
                                value={agentData.description}
                                onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">System Prompt / Role</label>
                            <Textarea
                                placeholder="You are a helpful customer support assistant..."
                                value={agentData.systemPrompt}
                                onChange={(e) => setAgentData({ ...agentData, systemPrompt: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Model</label>
                                <Select value={agentData.model} onValueChange={(value) => setAgentData({ ...agentData, model: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Temperature</label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={agentData.temperature}
                                    onChange={(e) => setAgentData({ ...agentData, temperature: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <Button 
                            onClick={createAgent} 
                            disabled={loading || !agentData.name || !agentData.systemPrompt}
                            className="w-full"
                        >
                            {loading ? 'Creating Agent...' : 'Create Agent'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Create Knowledge Base */}
            {currentStep === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            Step 2: Setup Knowledge Base
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Knowledge Base Name</label>
                            <Input
                                placeholder="e.g., Customer Support Docs"
                                value={kbData.name}
                                onChange={(e) => setKbData({ ...kbData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <Textarea
                                placeholder="Knowledge base for customer support documentation..."
                                value={kbData.description}
                                onChange={(e) => setKbData({ ...kbData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Link to Agent</label>
                            <Select value={kbData.selectedAgentId} onValueChange={(value) => setKbData({ ...kbData, selectedAgentId: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agents.map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button 
                            onClick={createKnowledgeBase} 
                            disabled={loading || !kbData.name || !kbData.selectedAgentId}
                            className="w-full"
                        >
                            {loading ? 'Creating Knowledge Base...' : 'Create Knowledge Base'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Upload PDF */}
            {currentStep === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Step 3: Upload & Train PDF
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Select PDF File</label>
                            <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                            />
                        </div>

                        {uploadData.file && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-800">{uploadData.file.name}</span>
                                <Badge variant="outline" className="ml-auto">
                                    {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB
                                </Badge>
                            </div>
                        )}

                        <Button 
                            onClick={uploadPDF} 
                            disabled={loading || !uploadData.file}
                            className="w-full"
                        >
                            {loading ? 'Uploading & Training...' : 'Upload PDF & Train Knowledge Base'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Setup Complete!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="text-6xl">🎉</div>
                        <h3 className="text-xl font-semibold">Your AI Agent is Ready!</h3>
                        <p className="text-gray-600">
                            Your AI agent has been created, knowledge base setup, and trained with your PDF documents.
                            You can now start using it for customer support or other tasks.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => setCurrentStep(1)} variant="outline">
                                Create Another Agent
                            </Button>
                            <Button onClick={() => window.location.href = '/dashboard'}>
                                Go to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Existing Agents & Knowledge Bases Summary */}
            {(agents.length > 0 || knowledgeBases.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {agents.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Your Agents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {agents.map((agent) => (
                                        <div key={agent.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div>
                                                <span className="font-medium">{agent.name}</span>
                                                <p className="text-xs text-gray-500">{agent.model}</p>
                                            </div>
                                            <Badge variant="outline">{agent.provider_id}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {knowledgeBases.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Knowledge Bases</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {knowledgeBases.map((kb) => (
                                        <div key={kb.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div>
                                                <span className="font-medium">{kb.name}</span>
                                                {kb.agent && (
                                                    <p className="text-xs text-gray-500">
                                                        <Link className="w-3 h-3 inline mr-1" />
                                                        {kb.agent.name}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="outline">RAG</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
