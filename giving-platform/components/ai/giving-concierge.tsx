"use client";

import { useState, useRef, useEffect, useMemo, useCallback, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { X, Send, Sparkles, Loader2, Minimize2, LogIn, User, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { NonprofitMiniCard } from "./nonprofit-mini-card";
import { NonprofitModal } from "@/components/directory/nonprofit-modal";
import type { Nonprofit } from "@/types/database";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Regex to match [[NONPROFIT:id:name]] format
const NONPROFIT_CARD_REGEX = /\[\[NONPROFIT:([^:]+):([^\]]+)\]\]/g;

// Format text with bold, bullets, and proper spacing
function formatTextSegment(text: string, keyPrefix: string): ReactNode[] {
  const elements: ReactNode[] = [];
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    // Skip empty lines but add spacing
    if (!trimmedLine) {
      if (lineIndex > 0) {
        elements.push(<div key={`${keyPrefix}-space-${lineIndex}`} className="h-2" />);
      }
      return;
    }

    // Check for numbered list items (1. 2. 3. etc)
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const [, num, content] = numberedMatch;
      elements.push(
        <div key={`${keyPrefix}-num-${lineIndex}`} className="flex items-start gap-2 my-1.5">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center justify-center">
            {num}
          </span>
          <span className="flex-1">{formatInlineText(content)}</span>
        </div>
      );
      return;
    }

    // Check for bullet points (• or - or *)
    const bulletMatch = trimmedLine.match(/^[•\-\*]\s*(.+)$/);
    if (bulletMatch) {
      const [, content] = bulletMatch;
      elements.push(
        <div key={`${keyPrefix}-bullet-${lineIndex}`} className="flex items-start gap-2 my-1.5">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
          <span className="flex-1">{formatInlineText(content)}</span>
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`${keyPrefix}-p-${lineIndex}`} className={lineIndex > 0 ? "mt-2" : ""}>
        {formatInlineText(trimmedLine)}
      </p>
    );
  });

  return elements;
}

// Format inline text (bold)
function formatInlineText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add bold text
    parts.push(
      <strong key={`bold-${keyIndex++}`} className="font-semibold text-slate-900">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// Parse message content and render nonprofit cards with formatted text
function renderMessageContent(
  content: string,
  onNonprofitClick?: (id: string, name: string) => void
): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let partIndex = 0;

  // Reset regex lastIndex
  NONPROFIT_CARD_REGEX.lastIndex = 0;

  while ((match = NONPROFIT_CARD_REGEX.exec(content)) !== null) {
    // Add formatted text before the match
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      parts.push(
        <div key={`text-${partIndex++}`}>
          {formatTextSegment(textBefore, `seg-${partIndex}`)}
        </div>
      );
    }

    // Add the nonprofit card
    const [, id, name] = match;
    parts.push(
      <NonprofitMiniCard
        key={`${id}-${match.index}`}
        id={id}
        name={name}
        onClick={onNonprofitClick}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining formatted text after last match
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    parts.push(
      <div key={`text-${partIndex++}`}>
        {formatTextSegment(remainingText, `seg-${partIndex}`)}
      </div>
    );
  }

  return parts.length > 0 ? parts : formatTextSegment(content, "main");
}

export function GivingConcierge() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load persisted messages from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('givingConciergeMessages');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Nonprofit preview modal state
  const [selectedNonprofit, setSelectedNonprofit] = useState<Nonprofit | null>(null);
  const [nonprofitModalOpen, setNonprofitModalOpen] = useState(false);

  // Create a stable Supabase client instance
  const supabase = useMemo(() => createClient(), []);

  // Check auth function and fetch avatar
  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);

    if (session?.user) {
      // First try to get avatar from user profile in database
      const { data: profile } = await supabase
        .from("users")
        .select("avatar_url")
        .eq("id", session.user.id)
        .single();

      // Use profile avatar, or fall back to auth metadata avatar
      const avatarUrl = profile?.avatar_url || session.user.user_metadata?.avatar_url || null;
      setUserAvatarUrl(avatarUrl);
    } else {
      setUserAvatarUrl(null);
    }
  }, [supabase]);

  // Re-check auth when pathname changes (handles login redirects)
  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  // Check authentication status on mount and listen for auth changes
  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        setIsAuthenticated(!!session?.user);
      }
    });

    // Re-check auth when window gains focus (handles login in another flow)
    const handleFocus = () => {
      checkAuth();
    };
    window.addEventListener("focus", handleFocus);

    // Re-check auth when page becomes visible (handles navigation back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAuth();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [supabase, checkAuth]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('givingConciergeMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Re-check auth and focus input when chat opens (skip focus on mobile to prevent keyboard)
  useEffect(() => {
    if (isOpen) {
      // Re-check auth status and avatar when chatbot is opened
      checkAuth();

      // Only auto-focus on desktop to prevent keyboard opening on mobile
      const isMobile = window.innerWidth < 640;
      if (!isMinimized && isAuthenticated && !isMobile) {
        inputRef.current?.focus();
      }
    }
  }, [isOpen, isMinimized, isAuthenticated, checkAuth]);

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

  // Handle nonprofit card click - fetch data and open modal
  const handleNonprofitClick = useCallback((nonprofitId: string, name: string) => {
    // Validate UUID format before querying
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(nonprofitId)) {
      return;
    }

    // Use direct REST API call for reliable async behavior
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const url = `${supabaseUrl}/rest/v1/nonprofits?id=eq.${nonprofitId}&select=*,category:categories(*)`;

    fetch(url, {
      headers: {
        'apikey': supabaseKey || '',
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const nonprofit = data?.[0];
        if (!nonprofit) return;

        setSelectedNonprofit(nonprofit as Nonprofit);
        setNonprofitModalOpen(true);
      })
      .catch((error) => {
        console.error("Error fetching nonprofit:", error);
      });
  }, []);

  // Close nonprofit modal
  const handleCloseNonprofitModal = useCallback(() => {
    setNonprofitModalOpen(false);
    setSelectedNonprofit(null);
  }, []);

  // Clear chat and start new conversation
  const handleClearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('givingConciergeMessages');
  }, []);

  // Navigate to full profile and close chat
  const handleViewFullProfile = useCallback((nonprofitId: string) => {
    setNonprofitModalOpen(false);
    setSelectedNonprofit(null);
    setIsOpen(false);
    router.push(`/directory/${nonprofitId}`);
  }, [router]);

  // Entrance animation state
  const [showButton, setShowButton] = useState(false);

  // Delayed entrance animation for the chat button
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 1500); // 1.5 second delay before appearing
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105",
          showButton
            ? "animate-in slide-in-from-bottom-8 fade-in zoom-in-75 duration-500"
            : "opacity-0 translate-y-8 scale-75"
        )}
        aria-label="Open Giving Concierge"
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 transition-all duration-300",
        "bottom-6 right-6 sm:bottom-6 sm:right-6",
        "max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:bottom-4 max-sm:right-auto",
        isMinimized ? "w-72 h-14" : "w-96 max-sm:w-[calc(100%-2rem)] h-[800px] max-sm:h-[70vh]"
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
          <Sparkles className="h-5 w-5 text-white animate-pulse" />
          <span className="font-semibold text-white">Giving Concierge</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && !isMinimized && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearChat();
              }}
              className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded"
              title="New conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
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
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-emerald-600 animate-pulse" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">
                      Hi! I&apos;m your Giving Concierge
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      I can help you discover nonprofits, build your giving
                      portfolio, and maximize your impact.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestedQuestions.map((question) => (
                        <button
                          key={question}
                          onClick={() => {
                            setInput(question);
                            // Auto-submit after setting input
                            setTimeout(() => {
                              const form = inputRef.current?.closest('form');
                              if (form) {
                                form.requestSubmit();
                              }
                            }, 0);
                          }}
                          className="px-4 py-2 text-sm bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-full text-emerald-700 transition-colors shadow-sm"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {/* Assistant Avatar */}
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm">
                          <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] text-sm",
                          message.role === "user"
                            ? "bg-emerald-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm"
                            : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm"
                        )}
                      >
                        {message.content ? (
                          message.role === "assistant" ? (
                            <div className="leading-relaxed [&>ul]:mt-1 [&>ul]:space-y-1 [&>ul]:list-disc [&>ul]:pl-4">
                              {renderMessageContent(message.content, handleNonprofitClick)}
                            </div>
                          ) : (
                            <span className="leading-relaxed">{message.content}</span>
                          )
                        ) : (
                          <div className="flex items-center gap-2 py-1">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                            <span className="text-slate-500 text-xs">Thinking...</span>
                          </div>
                        )}
                      </div>

                      {/* User Avatar */}
                      {message.role === "user" && (
                        <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 shadow-sm overflow-hidden">
                          {userAvatarUrl ? (
                            <Image
                              src={userAvatarUrl}
                              alt="You"
                              width={28}
                              height={28}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <User className="h-3.5 w-3.5 text-slate-600" />
                          )}
                        </div>
                      )}
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
              </form>
            </>
          )}
        </>
      )}

      {/* Nonprofit Preview Modal */}
      <NonprofitModal
        nonprofit={selectedNonprofit}
        open={nonprofitModalOpen}
        onClose={handleCloseNonprofitModal}
        onViewFullProfile={handleViewFullProfile}
      />
    </div>
  );
}
