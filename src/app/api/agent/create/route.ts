/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lyzrApi } from '@/lib/lyzr'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, description, system_prompt, temperature = 0.7 } = body

        if (!name || !system_prompt) {
            return NextResponse.json(
                { error: 'Missing required fields: name, system_prompt' },
                { status: 400 }
            )
        }

        // Create agent in Lyzr using v3 API
        const lyzrAgent = await lyzrApi.createAgent({
            name,
            system_prompt: system_prompt,
            description: description || '',
            template_type: 'single_task',
            agent_role: "Your task is to assist users with their customer support queries.",
            agent_instructions: system_prompt,
            provider_id: 'OpenAI',
            model: 'gpt-4o-mini',
            temperature: temperature || 0.7,
            top_p: 0.9,
            features: [
                {
                    type: 'KNOWLEDGE_BASE',
                    config: {},
                    priority: 1
                }
            ],
            llm_credential_id: 'lyzr_openai'
        })

        console.log('Lyzr Agent Response:', JSON.stringify(lyzrAgent, null, 2))

        // Extract agent ID from response - check different possible response structures
        let agentId: string
        if (typeof lyzrAgent === 'object' && lyzrAgent !== null) {
            // Try different possible field names for the agent ID
            const response = lyzrAgent as Record<string, unknown>
            agentId = (response.id as string) ||
                (response.agent_id as string) ||
                ((response.data as Record<string, unknown>)?.id as string) ||
                ((response.agent as Record<string, unknown>)?.id as string)
        } else {
            agentId = lyzrAgent as string
        }

        if (!agentId) {
            console.error('No agent ID found in Lyzr response:', lyzrAgent)
            throw new Error('Failed to get agent ID from Lyzr API response')
        }

        // Create user if doesn't exist
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: `${userId}@example.com`, // Clerk will provide real email
                name: 'User'
            }
        })

        // Store agent in our database
        const agent = await prisma.agent.create({
            data: {
                lyzrAgentId: agentId,
                name,
                description,
                systemPrompt: system_prompt,
                temperature,
                userId // Use the Clerk ID directly
            },
            include: {
                kbAssets: true,
                _count: {
                    select: { tickets: true }
                }
            }
        })

        return NextResponse.json({
            success: true,
            agent: {
                id: agent.id,
                lyzrAgentId: agent.lyzrAgentId,
                name: agent.name,
                description: agent.description,
                systemPrompt: agent.systemPrompt,
                temperature: agent.temperature,
                createdAt: agent.createdAt,
                kbAssets: agent.kbAssets,
                ticketCount: agent._count.tickets
            }
        })

    } catch (error) {
        console.error('Error creating agent:', error)
        return NextResponse.json(
            { error: 'Failed to create agent', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const agents = await prisma.agent.findMany({
            where: { userId },
            include: {
                kbAssets: true,
                _count: {
                    select: { tickets: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            agents: agents.map(agent => ({
                id: agent.id,
                lyzrAgentId: agent.lyzrAgentId,
                name: agent.name,
                description: agent.description,
                systemPrompt: agent.systemPrompt,
                temperature: agent.temperature,
                createdAt: agent.createdAt,
                updatedAt: agent.updatedAt,
                kbAssets: agent.kbAssets,
                ticketCount: agent._count.tickets
            }))
        })

    } catch (error) {
        console.error('Error fetching agents:', error)
        return NextResponse.json(
            { error: 'Failed to fetch agents', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
