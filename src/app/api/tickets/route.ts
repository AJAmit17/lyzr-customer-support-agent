/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const agentId = searchParams.get('agent_id')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        // Build where clause - if no agentId, fetch all tickets
        const whereClause = {} as any
        if (agentId) {
            whereClause.agentId = agentId
        }
        if (status) {
            whereClause.status = status.toUpperCase()
        }

        const [tickets, totalCount] = await Promise.all([
            prisma.ticket.findMany({
                where: whereClause,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    visitor: true,
                    agent: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.ticket.count({ where: whereClause })
        ])

        return NextResponse.json({
            success: true,
            tickets: tickets.map((ticket) => ({
                id: ticket.id,
                sessionId: ticket.sessionId,
                userInput: ticket.userInput,
                agentReply: ticket.agentReply,
                status: ticket.status,
                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt,
                visitor: (ticket as any).visitor || null,
                agent: (ticket as any).agent || null
            })),
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        })

    } catch (error) {
        console.error('Error fetching tickets:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tickets', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { agent_id, session_id, user_input, agent_reply, visitor_info } = body

        if (!agent_id || !session_id || !user_input || !agent_reply) {
            return NextResponse.json(
                { error: 'Missing required fields: agent_id, session_id, user_input, agent_reply' },
                { status: 400 }
            )
        }

        // Verify agent exists
        const agent = await prisma.agent.findUnique({
            where: { id: agent_id }
        })

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }

        // Create or update visitor info if provided
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

        // Create the ticket
        const ticket = await prisma.ticket.create({
            data: {
                agentId: agent_id,
                sessionId: session_id,
                userInput: user_input,
                agentReply: agent_reply,
                status: 'OPEN'
            },
            include: {
                visitor: true,
                agent: true
            }
        })

        return NextResponse.json({
            success: true,
            ticket: {
                id: ticket.id,
                sessionId: ticket.sessionId,
                userInput: ticket.userInput,
                agentReply: ticket.agentReply,
                status: ticket.status,
                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt,
                visitor: (ticket as any).visitor,
                agent: (ticket as any).agent
            }
        })

    } catch (error) {
        console.error('Error creating ticket:', error)
        return NextResponse.json(
            { error: 'Failed to create ticket', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { ticket_id, status } = body

        if (!ticket_id || !status) {
            return NextResponse.json(
                { error: 'Missing required fields: ticket_id, status' },
                { status: 400 }
            )
        }

        const validStatuses = ['OPEN', 'CLOSED', 'PENDING']
        if (!validStatuses.includes(status.toUpperCase())) {
            return NextResponse.json(
                { error: 'Invalid status. Must be one of: OPEN, CLOSED, PENDING' },
                { status: 400 }
            )
        }

        const ticket = await prisma.ticket.update({
            where: { id: ticket_id },
            data: { status: status.toUpperCase() as any },
            include: {
                visitor: true,
                agent: true
            }
        })

        return NextResponse.json({
            success: true,
            ticket: {
                id: ticket.id,
                sessionId: ticket.sessionId,
                userInput: ticket.userInput,
                agentReply: ticket.agentReply,
                status: ticket.status,
                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt,
                visitor: (ticket as any).visitor,
                agent: (ticket as any).agent
            }
        })

    } catch (error) {
        console.error('Error updating ticket:', error)
        return NextResponse.json(
            { error: 'Failed to update ticket', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
