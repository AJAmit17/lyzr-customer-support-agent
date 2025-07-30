import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { lyzrApi } from '@/lib/lyzr'
import { prisma } from '@/lib/prisma'

// POST - Link knowledge base to agent
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { agentId, ragId, ragName } = await request.json()

        if (!agentId || !ragId) {
            return NextResponse.json({ error: 'Agent ID and RAG ID are required' }, { status: 400 })
        }

        // Get agent details
        const agent = await prisma.agent.findUnique({
            where: { id: agentId }
        })

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        // Update agent to link with RAG Knowledge Base
        await lyzrApi.updateAgentWithRAG(agent.lyzrAgentId, ragId, ragName || `kb_${Date.now()}`, {
            name: agent.name,
            description: agent.description || '',
            agent_role: agent.systemPrompt,
            agent_instructions: agent.systemPrompt, // Use systemPrompt as instructions
            provider_id: 'lyzr_openai', // Default provider
            model: 'gpt-4o-mini', // Default model
            top_p: 0.9, // Default top_p
            temperature: agent.temperature,
            llm_credential_id: 'lyzr_openai'
        })

        // Update database link
        await prisma.assetLink.updateMany({
            where: {
                assetId: ragId,
                fileType: 'rag_kb'
            },
            data: {
                agentId: agentId
            }
        })

        return NextResponse.json({ 
            success: true,
            message: 'Knowledge base linked to agent successfully'
        })
    } catch (error) {
        console.error('Error linking knowledge base to agent:', error)
        return NextResponse.json({ error: 'Failed to link knowledge base to agent' }, { status: 500 })
    }
}
