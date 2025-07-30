import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { status } = body
        const ticketId = params.id

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            )
        }

        // Validate status
        const validStatuses = ['OPEN', 'CLOSED', 'PENDING', 'RESOLVED', 'ESCALATED']
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be one of: OPEN, CLOSED, PENDING, RESOLVED, ESCALATED' },
                { status: 400 }
            )
        }

        // Update ticket status
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: { 
                status,
                updatedAt: new Date()
            },
            include: {
                visitor: true,
                agent: true
            }
        })

        return NextResponse.json({
            success: true,
            ticket: {
                id: updatedTicket.id,
                sessionId: updatedTicket.sessionId,
                userInput: updatedTicket.userInput,
                agentReply: updatedTicket.agentReply,
                status: updatedTicket.status,
                createdAt: updatedTicket.createdAt,
                updatedAt: updatedTicket.updatedAt,
                visitor: updatedTicket.visitor,
                agent: updatedTicket.agent
            }
        })

    } catch (error) {
        console.error('Error updating ticket:', error)
        
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to update ticket', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const ticketId = params.id

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                visitor: true,
                agent: true
            }
        })

        if (!ticket) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            )
        }

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
                visitor: ticket.visitor,
                agent: ticket.agent
            }
        })

    } catch (error) {
        console.error('Error fetching ticket:', error)
        return NextResponse.json(
            { error: 'Failed to fetch ticket', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
