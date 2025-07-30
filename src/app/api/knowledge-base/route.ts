import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { lyzrApi } from '@/lib/lyzr'
import { prisma } from '@/lib/prisma'

// GET - List all knowledge bases for user
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get knowledge bases from database
        const knowledgeBases = await prisma.assetLink.findMany({
            where: {
                fileType: 'rag_kb'
            },
            include: {
                agent: true
            }
        })

        return NextResponse.json({ knowledgeBases })
    } catch (error) {
        console.error('Error fetching knowledge bases:', error)
        return NextResponse.json({ error: 'Failed to fetch knowledge bases' }, { status: 500 })
    }
}

// POST - Create new knowledge base
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, description, agentId } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // Generate unique collection name
        const collectionName = `kb_${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`

        // Create RAG Knowledge Base using Lyzr API
        const ragResponse = await lyzrApi.createRAGKnowledgeBase({
            collection_name: collectionName,
            description: description || `Knowledge base for ${name}`,
            user_id: process.env.LYZR_API_KEY!
        }) as { id: string }

        // Store in database
        const knowledgeBase = await prisma.assetLink.create({
            data: {
                assetId: ragResponse.id,
                fileName: name,
                fileType: 'rag_kb',
                agentId: agentId || null
            }
        })

        return NextResponse.json({ 
            id: ragResponse.id,
            name: name,
            description: description,
            collectionName: collectionName,
            knowledgeBase 
        })
    } catch (error) {
        console.error('Error creating knowledge base:', error)
        return NextResponse.json({ error: 'Failed to create knowledge base' }, { status: 500 })
    }
}
