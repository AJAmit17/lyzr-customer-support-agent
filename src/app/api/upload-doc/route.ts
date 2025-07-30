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

        const formData = await request.formData()
        const file = formData.get('file') as File
        const agentId = formData.get('agent_id') as string

        if (!agentId) {
            return NextResponse.json(
                { error: 'agent_id is required' },
                { status: 400 }
            )
        }

        if (!file) {
            return NextResponse.json(
                { error: 'file is required' },
                { status: 400 }
            )
        }

        // Verify agent exists in our database and belongs to the user
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            include: { kbAssets: true }
        })

        if (!agent || agent.userId !== userId) {
            return NextResponse.json(
                { error: 'Agent not found or unauthorized' },
                { status: 404 }
            )
        }

        console.log('Starting RAG workflow for agent:', agentId)

        // Step 1: Check if agent already has a RAG knowledge base
        let ragId: string
        let ragName: string

        const existingRAGAsset = agent.kbAssets.find(asset => asset.fileType === 'rag_kb')

        if (existingRAGAsset) {
            // Use existing RAG knowledge base
            ragId = existingRAGAsset.assetId
            ragName = existingRAGAsset.fileName || `kb_${agent.name}`
            console.log('Using existing RAG KB:', ragId)
        } else {
            // Step 2: Create new RAG Knowledge Base
            console.log('Creating new RAG knowledge base...')
            ragName = `kb_${agent.name}_${Date.now()}`

            const ragResponse = await lyzrApi.createRAGKnowledgeBase({
                collection_name: ragName,
                description: `Knowledge base for ${agent.name}`,
                user_id: process.env.LYZR_API_KEY!
            }) as { id: string }

            ragId = ragResponse.id
            console.log('Created RAG KB with ID:', ragId)

            // Store RAG reference in database
            await prisma.assetLink.create({
                data: {
                    assetId: ragId,
                    fileName: ragName,
                    fileType: 'rag_kb',
                    agentId: agentId
                }
            })

            // Step 3: Update agent to link with RAG Knowledge Base
            console.log('Linking RAG to agent...')
            await lyzrApi.updateAgentWithRAG(agent.lyzrAgentId, ragId, ragName, {
                name: agent.name,
                description: agent.description || 'This agent helps to manage customer queries',
                agent_role: agent.systemPrompt,
                agent_goal: 'Help raise complaint tickets and resolve it',
                agent_instructions: `You are a professional customer support agent. Your primary role is to help users with their queries and create support tickets for complaints or issues.

IMPORTANT TICKET CREATION PROCESS:
1. First, determine if the user has a COMPLAINT or ISSUE that requires a support ticket
2. If it's just a general question or information request, answer directly without creating a ticket
3. If it's a complaint/issue, you MUST collect these details before creating a ticket:
   - Full Name
   - Phone Number with Country Code (format: +country_code phone_number)
   - Detailed description of the complaint/issue
   
CONVERSATION FLOW:
- Greet the user professionally
- Listen to their query
- If it's a complaint/issue, say: "I understand you have a complaint/issue. I'll help you create a support ticket. I need to collect some information first."
- Ask for missing information one by one:
  * "May I have your full name please?"
  * "Could you provide your phone number with country code? (example: +1 234-567-8900)"
  * "Please describe your complaint/issue in detail"
- Once ALL information is collected, create the ticket and provide the ticket number
- For general queries, provide helpful answers without mentioning tickets

RESPONSE FORMAT when creating ticket:
"Thank you [Name]. I've created support ticket #[TICKET_NUMBER] for your complaint. Our team will contact you at [PHONE_NUMBER] within 24 hours. Your complaint: [COMPLAINT_DETAILS]"

Remember: Only create tickets for actual complaints/issues, not for general information requests.`,
                provider_id: 'OpenAI',
                model: 'gpt-4o-mini',
                top_p: 0.9,
                temperature: agent.temperature,
                llm_credential_id: 'lyzr_openai'
            })
        }

        // Step 4: Upload PDF to RAG Knowledge Base
        console.log('Uploading PDF to RAG...')

        const uploadResponse = await lyzrApi.uploadPDFToRAG(ragId, file, {
            agent_id: agentId,
            uploaded_by: userId,
            upload_date: new Date().toISOString()
        })

        console.log('PDF upload response:', uploadResponse)

        // Step 5: Store file reference in database
        await prisma.assetLink.create({
            data: {
                assetId: `rag_file_${Date.now()}`,
                fileName: file.name,
                fileType: file.type,
                agentId: agentId
            }
        })

        return NextResponse.json({
            success: true,
            message: 'PDF uploaded to knowledge base successfully',
            ragId: ragId,
            ragName: ragName,
            fileName: file.name,
            uploadResponse: uploadResponse
        })

    } catch (error) {
        console.error('Error in RAG workflow:', error)
        return NextResponse.json(
            {
                error: 'Failed to upload to knowledge base',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
