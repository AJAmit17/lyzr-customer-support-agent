# 🧠 Lyzr Chat Support - AI-Powered Customer Support Platform

A full-stack, plug-and-play customer support chat application built with Next.js and powered by the Lyzr AI API. This application allows users to create, manage, and deploy AI support agents with custom knowledge bases and embeddable chat widgets.

![Lyzr Chat Support](https://img.shields.io/badge/Powered%20by-Lyzr%20AI-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC)

## ✨ Features

### 🤖 AI Agent Management
- **Create Custom Agents**: Build AI support agents with custom system prompts and personalities
- **Temperature Control**: Fine-tune response creativity and consistency
- **Real-time Agent Updates**: Modify agent behavior without downtime

### 📚 Knowledge Base Integration
- **Multi-format Support**: Upload PDF, DOCX, CSV, and text files
- **URL Integration**: Add web pages as knowledge sources
- **Dynamic Updates**: Add/remove knowledge sources anytime

### 💬 Chat System
- **Real-time Communication**: Instant responses via Lyzr AI API
- **Session Management**: Persistent chat sessions with visitor tracking
- **Message History**: Complete conversation logs for analysis

### 🔌 Embeddable Widget
- **One-line Integration**: Simple script tag deployment
- **Customizable UI**: Configurable colors, position, and messaging
- **Responsive Design**: Works on desktop and mobile devices

### 🎫 Ticket Management
- **Automated Logging**: Every conversation becomes a trackable ticket
- **Status Management**: Open, closed, and pending ticket states
- **Visitor Analytics**: Track user engagement and support metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Lyzr API key ([Get one here](https://studio.lyzr.ai/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lyzr-chat-support.git
   cd lyzr-chat-support
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   # Application URLs
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Lyzr API
   LYZR_API_KEY=your_lyzr_api_key_here
   LYZR_BASE_URL=https://agent-prod.studio.lyzr.ai
   
   # Database
   DATABASE_URL="mongodb+srv://username:password@localhost:5432/lyzr_chat_support"
   
   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # Environment
   NODE_ENV=development
   ```

   **Note:** For production, update `NEXT_PUBLIC_APP_URL` to your production domain (e.g., `https://your-domain.com`)

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Visit the application**
   - Dashboard: http://localhost:3000/dashboard (or your configured NEXT_PUBLIC_APP_URL)
   - Demo page: http://localhost:3000/demo

## 📖 Usage Guide

### Creating Your First Agent

1. **Navigate to Dashboard**: Go to `/dashboard` in your browser
2. **Create Agent Tab**: Click on "Create Agent" 
3. **Fill Details**:
   - **Name**: Give your agent a descriptive name
   - **Description**: Brief description of the agent's purpose
   - **System Prompt**: Define the agent's personality and behavior
   - **Temperature**: Set creativity level (0.0 = focused, 1.0 = creative)
4. **Submit**: Click "Create Agent"

### Adding Knowledge Base

1. **Select Agent**: Choose an agent from the "Agents" tab
2. **Upload Documents**: Use the file upload section to add:
   - PDF files
   - Word documents
   - CSV files
   - Text files
3. **Add URLs**: Enter website URLs to include as knowledge sources
4. **Automatic Processing**: Lyzr API will process and index your content

### Embedding Chat Widget

1. **Get Embed Code**: Go to "Embed Code" tab
2. **Select Agent**: Choose which agent to embed
3. **Copy Script**: Copy the generated embed code
4. **Add to Website**: Paste the script tag in your website's HTML

```html
<script
  src="https://yourdomain.com/widget/chat.js"
  data-agent-id="your-agent-id"
  data-api-url="https://yourdomain.com"
  data-title="Customer Support"
  data-subtitle="How can we help you?"
  data-primary-color="#3b82f6"
></script>
```

## 🔌 API Endpoints

### Agent Management
- `POST /api/agent/create` - Create new agent
- `GET /api/agent/create?user_id=xyz` - List user agents
- `PUT /api/agent/[agentId]` - Update agent
- `DELETE /api/agent/[agentId]` - Delete agent

### Document Upload
- `POST /api/upload-doc` - Upload document/URL to knowledge base

### Chat System
- `POST /api/chat` - Process chat message

### Ticket Management
- `GET /api/tickets?agent_id=xyz` - Get agent tickets
- `PATCH /api/tickets` - Update ticket status

## 🧪 Testing

Visit the demo page at `/demo` to test the chat widget functionality.

## 🚀 Deployment

Deploy to Vercel by connecting your GitHub repository and setting the required environment variables.

---

**Built with ❤️ using Lyzr AI Platform**
