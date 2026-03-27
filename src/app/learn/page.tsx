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
        <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-card overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm mb-6">
                  Ask anything about the proteogroup discovery project.
                </p>
                <div className="grid grid-cols-1 gap-2 max-w-lg mx-auto">
                  {SUGGESTED_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="text-left px-4 py-2.5 text-sm text-slate-600 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 border border-transparent hover:border-blue-100"
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
                } animate-fade-in-up`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-md'
                      : 'bg-slate-50 text-slate-800 rounded-2xl rounded-bl-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="px-4 py-3 bg-slate-50 rounded-2xl rounded-bl-md">
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
                className="input-modern"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="btn-primary whitespace-nowrap"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Context panel - right 1/3 */}
        <div className="bg-white rounded-xl shadow-card p-5 overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Context Sources
          </h3>

          {contextChunks.length > 0 ? (
            <div className="space-y-3">
              {contextChunks.map((chunk) => (
                <div
                  key={chunk.chunk_id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <p className="text-sm font-medium text-slate-700">
                    {chunk.title}
                  </p>
                  {chunk.similarity != null && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${chunk.similarity * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {(chunk.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
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
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Suggested Follow-ups
              </h4>
              <div className="space-y-1.5">
                {SUGGESTED_QUERIES.slice(0, 3).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="block w-full text-left px-3 py-2 text-xs text-slate-600 bg-slate-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
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
