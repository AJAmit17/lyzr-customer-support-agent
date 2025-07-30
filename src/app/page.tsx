'use client'

import Link from "next/link";
import { useUser, UserButton } from '@clerk/nextjs';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Authentication */}
      <header className="w-full px-4 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">
            Lyzr Chat Support
          </div>

          {isLoaded && (
            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <div className="flex items-center gap-4">
                  <Link
                    href="/demo"
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Demo
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Dashboard
                  </Link>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10"
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/support"
                    className="text-green-600 hover:text-green-700 font-medium px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Get Support
                  </Link>
                  <Link
                    href="/sign-in"
                    className="text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Lyzr Chat Support
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build and deploy AI-powered customer support chatbots in minutes.
            Create intelligent agents, upload knowledge bases, and embed chat widgets on your website.
          </p>

          <div className="flex gap-4 justify-center mb-12">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/sign-up"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            )}
            <a
              href="#features"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        <div id="features" className="grid md:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              🤖
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Agents</h3>
            <p className="text-gray-600">
              Create intelligent customer support agents using Lyzr&apos;s advanced AI technology.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              📚
            </div>
            <h3 className="text-xl font-semibold mb-2">Knowledge Base</h3>
            <p className="text-gray-600">
              Upload documents, URLs, and text to create comprehensive knowledge bases for your agents.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              🔌
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Integration</h3>
            <p className="text-gray-600">
              Embed chat widgets on any website with a simple script tag. No complex setup required.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-green-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              🎯
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Support</h3>
            <p className="text-gray-600 mb-4">
              Get instant help from our AI agents. Auto-resolved tickets and intelligent escalation.
            </p>
            <Link
              href="/support"
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              Try Support Portal →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Create Agent</h4>
              <p className="text-gray-600 text-sm">Set up your AI agent with custom prompts and personality</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">Upload Knowledge</h4>
              <p className="text-gray-600 text-sm">Add documents and URLs to train your agent</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Get Embed Code</h4>
              <p className="text-gray-600 text-sm">Copy the generated script to embed on your website</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold mb-2">Go Live</h4>
              <p className="text-gray-600 text-sm">Your AI support agent is ready to help customers</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Create Your First Agent
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
