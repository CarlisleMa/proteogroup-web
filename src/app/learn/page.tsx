'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import type { ChatMessage } from '@/lib/types';

const SUGGESTED_QUERIES = [
  'What are the main proteogroup discovery methods and how do they compare?',
  'Which proteogroups are most associated with mortality?',
  'Tell me about the complement cascade proteins and their groupings.',
  'What is the most stable method across bootstrap iterations?',
  'Which proteins appear consistently across multiple methods?',
  'What disease outcomes have the strongest proteogroup associations?',
];

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><p className="text-slate-400">Loading...</p></div>}>
      <LearnPageInner />
    </Suspense>
  );
}

function LearnPageInner() {
  const searchParams = useSearchParams();
  const initialContext = searchParams.get('context') ?? '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(
    initialContext ? `Tell me about ${initialContext}` : '',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [contextChunks, setContextChunks] = useState<
    { chunk_id: string; title: string; similarity?: number }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: msg,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiFetch<{
        reply: string;
        context_chunks: { chunk_id: string; title: string; similarity?: number }[];
        session_id: string;
      }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          message: msg,
        }),
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        context_chunks: response.context_chunks.map((c) => c.chunk_id),
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setContextChunks(response.context_chunks);
      if (response.session_id) setSessionId(response.session_id);
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          'Sorry, I encountered an error processing your request. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Learn"
        description="Ask questions about proteogroups, proteins, methods, and disease associations."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
        {/* Chat window - left 2/3 */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm mb-6">
                  Ask anything about the proteogroup discovery project.
                </p>
                <div className="grid grid-cols-1 gap-2 max-w-lg mx-auto">
                  {SUGGESTED_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="text-left px-4 py-2.5 text-sm text-slate-600 bg-slate-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-lg text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about proteins, methods, disease associations..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Context panel - right 1/3 */}
        <div className="bg-white rounded-lg shadow-sm p-5 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Context Sources
          </h3>

          {contextChunks.length > 0 ? (
            <div className="space-y-3">
              {contextChunks.map((chunk) => (
                <div
                  key={chunk.chunk_id}
                  className="p-3 bg-slate-50 rounded-lg"
                >
                  <p className="text-sm font-medium text-slate-700">
                    {chunk.title}
                  </p>
                  {chunk.similarity != null && (
                    <p className="text-xs text-slate-400 mt-1">
                      Relevance: {(chunk.similarity * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Context sources will appear here when you ask a question.
            </p>
          )}

          {messages.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                Suggested Follow-ups
              </h4>
              <div className="space-y-1.5">
                {SUGGESTED_QUERIES.slice(0, 3).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="block w-full text-left px-3 py-2 text-xs text-slate-600 bg-slate-50 rounded hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
