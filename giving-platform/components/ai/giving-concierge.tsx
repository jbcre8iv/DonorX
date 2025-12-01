"use client";

import { useState, useRef, useEffect, useMemo, ReactNode } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Sparkles, Loader2, Minimize2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { NonprofitMiniCard } from "./nonprofit-mini-card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Regex to match [[NONPROFIT:id:name]] format
const NONPROFIT_CARD_REGEX = /\[\[NONPROFIT:([^:]+):([^\]]+)\]\]/g;

// Parse message content and render nonprofit cards
function renderMessageContent(content: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex lastIndex
  NONPROFIT_CARD_REGEX.lastIndex = 0;

  while ((match = NONPROFIT_CARD_REGEX.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add the nonprofit card
    const [, id, name] = match;
    parts.push(
      <NonprofitMiniCard key={`${id}-${match.index}`} id={id} name={name} />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

export function GivingConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create a stable Supabase client instance
  const supabase = useMemo(() => createClient(), []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    // Re-check auth when window gains focus (handles login in another flow)
    const handleFocus = () => {
      checkAuth();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, [supabase]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Re-check auth and focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      // Re-check auth status when chatbot is opened
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsAuthenticated(!!session?.user);
      });

      if (!isMinimized && isAuthenticated) {
        inputRef.current?.focus();
      }
    }
  }, [isOpen, isMinimized, isAuthenticated, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isAuthenticated) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add placeholder for assistant response
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          feature: "givingConcierge",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          fullContent += text;

          // Update the assistant message with streamed content
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullContent } : m
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What causes should I support?",
    "How do I maximize my impact?",
    "Recommend education nonprofits",
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="Open Giving Concierge"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 transition-all duration-300",
        isMinimized ? "w-72 h-14" : "w-96 h-[500px]"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-t-2xl",
          isMinimized && "rounded-2xl cursor-pointer"
        )}
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-white" />
          <span className="font-semibold text-white">Giving Concierge</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Loading State */}
          {isAuthenticated === null ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : /* Login Required Message */
          !isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <LogIn className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Sign in to Chat
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Log in to access your personal Giving Concierge. I can help you discover nonprofits, build your giving portfolio, and maximize your impact.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Log In
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/register">
                    Create Account
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">
                      Hi! I&apos;m your Giving Concierge
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      I can help you discover nonprofits, build your giving
                      portfolio, and maximize your impact.
                    </p>
                    <div className="space-y-2">
                      {suggestedQuestions.map((question) => (
                        <button
                          key={question}
                          onClick={() => {
                            setInput(question);
                            inputRef.current?.focus();
                          }}
                          className="block w-full text-left px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                          message.role === "user"
                            ? "bg-emerald-600 text-white rounded-br-md"
                            : "bg-slate-100 text-slate-900 rounded-bl-md"
                        )}
                      >
                        {message.content ? (
                          message.role === "assistant" ? (
                            <div className="whitespace-pre-wrap">
                              {renderMessageContent(message.content)}
                            </div>
                          ) : (
                            message.content
                          )
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="p-4 border-t border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about giving..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isLoading}
                    className="h-9 w-9 rounded-full p-0 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">
                  Powered by Claude AI
                </p>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
}
