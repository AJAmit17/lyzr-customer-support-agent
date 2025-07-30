import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { agentId } = await params

        if (!agentId) {
            return NextResponse.json(
                { error: 'Agent ID is required' },
                { status: 400 }
            )
        }

        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            include: {
                user: true,
                kbAssets: true
            }
        })

        if (!agent || agent.userId !== userId) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            agent: {
                id: agent.id,
                name: agent.name,
                description: agent.description,
                lyzrAgentId: agent.lyzrAgentId,
                systemPrompt: agent.systemPrompt,
                temperature: agent.temperature,
                createdAt: agent.createdAt,
                updatedAt: agent.updatedAt,
                assets: agent.kbAssets.map(asset => ({
                    id: asset.id,
                    filename: asset.fileName,
                    assetId: asset.assetId,
                    fileType: asset.fileType,
                    uploadedAt: asset.uploadedAt
                }))
            }
        })

    } catch (error) {
        console.error('Error fetching agent:', error)
        return NextResponse.json(
            { error: 'Failed to fetch agent', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { agentId } = await params
        const body = await request.json()
        const { name, description, systemPrompt, temperature } = body

        if (!agentId) {
            return NextResponse.json(
                { error: 'Agent ID is required' },
                { status: 400 }
            )
        }

        if (!name || !description) {
            return NextResponse.json(
                { error: 'Name and description are required' },
                { status: 400 }
            )
        }

        // Check if agent exists and belongs to user
        const existingAgent = await prisma.agent.findUnique({
            where: { id: agentId }
        })

        if (!existingAgent || existingAgent.userId !== userId) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }

        const updatedAgent = await prisma.agent.update({
            where: { id: agentId },
            data: {
                name,
                description,
                ...(systemPrompt && { systemPrompt }),
                ...(temperature !== undefined && { temperature })
            }
        })

        return NextResponse.json({
            success: true,
            agent: {
                id: updatedAgent.id,
                name: updatedAgent.name,
                description: updatedAgent.description,
                systemPrompt: updatedAgent.systemPrompt,
                temperature: updatedAgent.temperature,
                lyzrAgentId: updatedAgent.lyzrAgentId,
                createdAt: updatedAgent.createdAt,
                updatedAt: updatedAgent.updatedAt
            }
        })

    } catch (error) {
        console.error('Error updating agent:', error)
        return NextResponse.json(
            { error: 'Failed to update agent', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { agentId } = await params

        if (!agentId) {
            return NextResponse.json(
                { error: 'Agent ID is required' },
                { status: 400 }
            )
        }

        // Check if agent exists and belongs to user
        const existingAgent = await prisma.agent.findUnique({
            where: { id: agentId }
        })

        if (!existingAgent || existingAgent.userId !== userId) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }

        // Delete related asset links
        await prisma.assetLink.deleteMany({
            where: { agentId }
        })

        // Delete related tickets
        await prisma.ticket.deleteMany({
            where: { agentId }
        })

        // Delete the agent
        await prisma.agent.delete({
            where: { id: agentId }
        })

        return NextResponse.json({
            success: true,
            message: 'Agent deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting agent:', error)
        return NextResponse.json(
            { error: 'Failed to delete agent', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
