import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lyzrApi } from '@/lib/lyzr'

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Allow-Credentials': 'false',
}

// Handle CORS preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            ...corsHeaders,
            'Access-Control-Max-Age': '86400',
        },
    })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { agent_id, session_id, message, visitor_info } = body

        if (!agent_id || !session_id || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: agent_id, session_id, message' },
                {
                    status: 400,
                    headers: corsHeaders
                }
            )
        }

        // Verify agent exists
        const agent = await prisma.agent.findUnique({
            where: { id: agent_id }
        })

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                {
                    status: 404,
                    headers: corsHeaders
                }
            )
        }

        // Create or update visitor info
        if (visitor_info) {
            await prisma.visitor.upsert({
                where: { sessionId: session_id },
                update: {
                    name: visitor_info.name,
                    email: visitor_info.email,
                    userAgent: visitor_info.userAgent,
                    ipAddress: visitor_info.ipAddress
                },
                create: {
                    sessionId: session_id,
                    name: visitor_info.name,
                    email: visitor_info.email,
                    userAgent: visitor_info.userAgent,
                    ipAddress: visitor_info.ipAddress
                }
            })
        }

        // Chat with Lyzr agent using v3 API
        const chatResponse = await lyzrApi.chatWithAgent({
            user_id: session_id,
            agent_id: agent.lyzrAgentId,
            session_id,
            message
        }) as { response: string; status: string }

        // Store ticket in database
        const ticket = await prisma.ticket.create({
            data: {
                sessionId: session_id,
                userInput: message,
                agentReply: chatResponse.response,
                agentId: agent_id,
                status: 'OPEN'
            }
        })

        // Enhance the agent response with ticket information
        const enhancedResponse = `${chatResponse.response}

📋 **Support Ticket Created:** #${ticket.id.slice(-8)}
Your query has been logged in our system and our support team can track your case.`

        // Update the ticket with the enhanced response
        await prisma.ticket.update({
            where: { id: ticket.id },
            data: { agentReply: enhancedResponse }
        })

        return NextResponse.json({
            success: true,
            response: enhancedResponse,
            ticket_id: ticket.id,
            session_id,
            agent_id
        }, {
            headers: corsHeaders
        })

    } catch (error) {
        console.error('Error in chat:', error)
        return NextResponse.json(
            { error: 'Failed to process chat', details: error instanceof Error ? error.message : 'Unknown error' },
            {
                status: 500,
                headers: corsHeaders
            }
        )
    }
}
