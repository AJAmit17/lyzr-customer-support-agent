import { Metadata } from 'next'
import AIAgentWorkflow from '@/components/AIAgentWorkflow'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
    title: 'AI Agent Setup | Lyzr Chat Support',
    description: 'Create and configure your AI agents with knowledge bases',
}

export default async function SetupPage() {
    const { userId } = await auth()
    
    if (!userId) {
        redirect('/sign-in')
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <AIAgentWorkflow />
        </div>
    )
}
