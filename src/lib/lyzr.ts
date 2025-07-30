// Lyzr API client wrapper
const LYZR_API_BASE = process.env.LYZR_BASE_URL || 'https://agent-prod.studio.lyzr.ai'
const API_KEY = process.env.LYZR_API_KEY

interface LyzrApiOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    endpoint: string
    body?: Record<string, unknown> | FormData
    headers?: Record<string, string>
}

class LyzrApiClient {
    private baseUrl: string
    private apiKey: string

    constructor() {
        if (!API_KEY) {
            throw new Error('LYZR_API_KEY environment variable is required')
        }
        this.baseUrl = LYZR_API_BASE
        this.apiKey = API_KEY
    }

    private async makeRequest<T>({ method, endpoint, body, headers = {} }: LyzrApiOptions): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`

        const requestHeaders: Record<string, string> = {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json',
            ...headers
        }

        // Remove Content-Type for FormData uploads
        if (body instanceof FormData) {
            delete requestHeaders['Content-Type']
        }

        const config: RequestInit = {
            method,
            headers: requestHeaders,
        }

        if (body && method !== 'GET') {
            config.body = body instanceof FormData ? body : JSON.stringify(body)
        }

        try {
            const response = await fetch(url, config)

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Lyzr API error: ${response.status} ${response.statusText} - ${errorText}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Lyzr API request failed:', error)
            throw error
        }
    }

    // Create a new agent using v3 API with correct format
    async createAgent(agentConfig: {
        name: string
        system_prompt: string
        description?: string
        template_type?: string
        agent_role?: string
        agent_instructions?: string
        features?: Array<{
            type: string
            config?: Record<string, unknown>
            priority: number
        }>
        tools?: string[]
        tool_usage_description?: string
        llm_credential_id?: string
        provider_id: string
        model: string
        top_p?: number
        temperature?: number
        response_format?: Record<string, unknown>
        version?: string
    }) {
        // Format the request according to the example you provided
        const requestBody = {
            api_key: this.apiKey,
            template_type: agentConfig.template_type || "single_task",
            name: agentConfig.name,
            description: agentConfig.description || '',
            agent_role: agentConfig.agent_role || agentConfig.system_prompt,
            agent_instructions: agentConfig.agent_instructions || "Your task is to assist users with their queries.",
            examples: null,
            features: agentConfig.features || [
                {
                    type: "KNOWLEDGE_BASE",
                    config: {},
                    priority: 1
                }
            ],
            tool: agentConfig.tools?.[0] || null,
            tool_usage_description: agentConfig.tool_usage_description || "Provide helpful assistance to users.",
            response_format: agentConfig.response_format || null,
            provider_id: agentConfig.provider_id,
            model: agentConfig.model,
            top_p: agentConfig.top_p || 0.9,
            temperature: agentConfig.temperature || 0.7,
            version: agentConfig.version || "3",
            llm_credential_id: agentConfig.llm_credential_id || "lyzr_openai"
        }

        return this.makeRequest({
            method: 'POST',
            endpoint: '/v3/agents/',
            body: requestBody
        })
    }

    // Get all agents for the API key
    async getAgents() {
        return this.makeRequest({
            method: 'GET',
            endpoint: '/v3/agents/'
        })
    }

    // Chat with agent using v3 API
    async chatWithAgent(chatRequest: {
        user_id: string
        agent_id: string
        session_id: string
        message: string
        system_prompt_variables?: Record<string, unknown>
        filter_variables?: Record<string, unknown>
        features?: Array<Record<string, unknown>>
        assets?: string[]
    }) {
        return this.makeRequest({
            method: 'POST',
            endpoint: '/v3/inference/chat/',
            body: chatRequest
        })
    }

    // Create RAG Knowledge Base
    async createRAGKnowledgeBase(ragConfig: {
        user_id: string
        description?: string
        collection_name: string
    }) {
        const ragBaseUrl = 'https://rag-prod.studio.lyzr.ai'
        const url = `${ragBaseUrl}/v3/rag/`

        const requestBody = {
            user_id: ragConfig.user_id,
            llm_credential_id: "lyzr_openai",
            embedding_credential_id: "lyzr_openai",
            vector_db_credential_id: "lyzr_qdrant",
            description: ragConfig.description || "Customer support knowledge base",
            collection_name: ragConfig.collection_name,
            llm_model: "gpt-4o-mini",
            embedding_model: "text-embedding-ada-002",
            vector_store_provider: "Qdrant [Lyzr]",
            semantic_data_model: false,
            meta_data: {}
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            },
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`RAG creation failed: ${response.status} ${response.statusText} - ${errorText}`)
        }

        return await response.json()
    }

    // Upload PDF to RAG Knowledge Base
    async uploadPDFToRAG(ragId: string, file: File,
        extra_info?: Record<string, unknown>
    ) {
        const ragBaseUrl = 'https://rag-prod.studio.lyzr.ai'
        const formData = new FormData()
        formData.append('file', file)
        formData.append('data_parser', 'llmsherpa')
        formData.append('extra_info', JSON.stringify(extra_info || {}))

        const url = `${ragBaseUrl}/v3/train/pdf/?rag_id=${ragId}`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
            },
            body: formData
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`PDF upload failed: ${response.status} ${response.statusText} - ${errorText}`)
        }

        return await response.json()
    }

    // Update agent to link with RAG Knowledge Base
    async updateAgentWithRAG(agentId: string, ragId: string, ragName: string, agentData: {
        name: string
        description?: string
        agent_role: string
        agent_goal?: string
        agent_instructions?: string
        provider_id: string
        model: string
        top_p: number
        temperature: number
        llm_credential_id?: string
    }) {
        return this.makeRequest({
            method: 'PUT',
            endpoint: `/v3/agents/template/single-task/${agentId}`,
            body: {
                name: agentData.name,
                description: agentData.description || '',
                agent_role: agentData.agent_role,
                agent_goal: agentData.agent_goal || 'Help raise complaint tickets and resolve it',
                agent_instructions: agentData.agent_instructions || 'Your task is to assist users with their customer support queries.',
                examples: null,
                tool: "",
                tool_usage_description: "{}",
                provider_id: agentData.provider_id,
                model: agentData.model,
                temperature: agentData.temperature,
                top_p: agentData.top_p,
                llm_credential_id: agentData.llm_credential_id || 'lyzr_openai',
                features: [
                    {
                        type: "KNOWLEDGE_BASE",
                        config: {
                            lyzr_rag: {
                                base_url: "https://rag-prod.studio.lyzr.ai",
                                rag_id: ragId,
                                rag_name: ragName,
                                params: {
                                    top_k: 5,
                                    retrieval_type: "basic",
                                    score_threshold: 0
                                }
                            },
                            agentic_rag: []
                        },
                        priority: 0
                    }
                ],
                managed_agents: [],
                response_format: {
                    type: "text"
                }
            }
        })
    }
}

export const lyzrApi = new LyzrApiClient()

// Type definitions for Lyzr API responses
export interface LyzrAgent {
    id: string
    name: string
    description?: string
    system_prompt: string
    temperature: number
    asset_ids: string[]
    created_at: string
    updated_at: string
}

export interface LyzrAsset {
    id: string
    name: string
    type: string
    size?: number
    created_at: string
}

export interface LyzrChatResponse {
    response: string
    session_id: string
    agent_id: string
    metadata?: Record<string, unknown>
    timestamp: string
}
