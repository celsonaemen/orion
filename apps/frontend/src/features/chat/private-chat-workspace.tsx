"use client";

import {
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { useAuthenticatedUser } from "@/components/app-shell/authenticated-user-context";

import { chatApiRequest } from "./api";
import { buildMessagesQuery } from "./chat-utils";
import {
  chatRealtimeUrl,
  mergePrivateConversation,
  mergePrivateMessages,
  privateConversationLabel,
} from "./private-chat-utils";
import type {
  PrivateChatMessage,
  PrivateChatUser,
  PrivateChatUsersResponse,
  PrivateConversation,
  PrivateConversationResponse,
  PrivateConversationsResponse,
  PrivateMessageResponse,
  PrivateMessagesResponse,
  RealtimeTicketResponse,
} from "./types";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

type RealtimeStatus = "connected" | "connecting" | "disconnected";

export function PrivateChatWorkspace() {
  const currentUser = useAuthenticatedUser();
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PrivateChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connecting");
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<PrivateChatUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const messagesRequestIdRef = useRef(0);
  const shouldScrollToLatestRef = useRef(false);

  selectedConversationIdRef.current = selectedConversationId;

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const loadConversations = useCallback(async (preferredConversationId?: string) => {
    setConversationsError(null);
    const result = await chatApiRequest<PrivateConversationsResponse>("/api/chat/conversations");

    if (!result.ok) {
      setConversationsError(result.message);
      setIsLoadingConversations(false);
      return;
    }

    setConversations(result.data.conversations);
    setSelectedConversationId((current) => {
      const preferred = preferredConversationId ?? current;
      if (preferred && result.data.conversations.some((item) => item.id === preferred)) {
        return preferred;
      }
      return result.data.conversations[0]?.id ?? null;
    });
    setIsLoadingConversations(false);
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    let disposed = false;
    let reconnectTimer: number | undefined;
    let socket: Socket | undefined;

    const scheduleFreshConnection = () => {
      if (disposed || reconnectTimer) return;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined;
        void connect();
      }, 1500);
    };

    const connect = async () => {
      setRealtimeStatus("connecting");
      const ticketResult = await chatApiRequest<RealtimeTicketResponse>(
        "/api/chat/realtime-ticket",
        { body: JSON.stringify({}), method: "POST" },
      );

      if (disposed) return;
      if (!ticketResult.ok) {
        setRealtimeStatus("disconnected");
        scheduleFreshConnection();
        return;
      }

      socket?.disconnect();
      socket = io(chatRealtimeUrl(), {
        auth: { ticket: ticketResult.data.ticket },
        reconnection: true,
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => setRealtimeStatus("connected"));
      socket.on("disconnect", (reason) => {
        setRealtimeStatus("disconnected");
        if (reason === "io server disconnect") scheduleFreshConnection();
      });
      socket.on("connect_error", (error) => {
        setRealtimeStatus("disconnected");
        if (error.message === "unauthorized") {
          socket?.disconnect();
          scheduleFreshConnection();
        }
      });
      socket.on("conversation.updated", ({ conversationId }: { conversationId: string }) => {
        void loadConversations(
          conversationId === selectedConversationIdRef.current ? conversationId : undefined,
        );
      });
      socket.on(
        "conversation.message",
        (payload: { conversationId: string; message: PrivateChatMessage }) => {
          if (payload.conversationId === selectedConversationIdRef.current) {
            shouldScrollToLatestRef.current = isNearBottom(messagesViewportRef.current);
            setMessages((current) => mergePrivateMessages(current, [payload.message]));
          }
          void loadConversations();
        },
      );
    };

    void connect();

    return () => {
      disposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.disconnect();
    };
  }, [loadConversations]);

  useEffect(() => {
    const requestId = ++messagesRequestIdRef.current;
    setMessages([]);
    setNextCursor(null);
    setMessagesError(null);
    setSendError(null);

    if (!selectedConversationId) return;

    setIsLoadingMessages(true);
    void chatApiRequest<PrivateMessagesResponse>(
      `/api/chat/conversations/${encodeURIComponent(selectedConversationId)}/messages?${buildMessagesQuery()}`,
    ).then((result) => {
      if (
        requestId !== messagesRequestIdRef.current ||
        selectedConversationId !== selectedConversationIdRef.current
      ) {
        return;
      }

      if (!result.ok) {
        setMessagesError(result.message);
      } else {
        shouldScrollToLatestRef.current = true;
        setMessages(result.data.messages);
        setNextCursor(result.data.nextCursor);
      }
      setIsLoadingMessages(false);
    });
  }, [selectedConversationId]);

  useLayoutEffect(() => {
    if (!shouldScrollToLatestRef.current) return;
    messagesEndRef.current?.scrollIntoView({ block: "end" });
    shouldScrollToLatestRef.current = false;
  }, [messages]);

  useEffect(() => {
    if (!isNewConversationOpen) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearchingUsers(true);
      setUserSearchError(null);
      const query = new URLSearchParams({ limit: "30" });
      if (userSearch.trim()) query.set("search", userSearch.trim());
      const result = await chatApiRequest<PrivateChatUsersResponse>(
        `/api/chat/users?${query.toString()}`,
        { signal: controller.signal },
      );

      if (!result.ok) {
        setUserSearchError(result.message);
        setUserResults([]);
      } else {
        setUserResults(result.data.users);
      }
      setIsSearchingUsers(false);
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isNewConversationOpen, userSearch]);

  async function handleStartConversation(userId: string) {
    setStartingUserId(userId);
    setUserSearchError(null);
    const result = await chatApiRequest<PrivateConversationResponse>(
      "/api/chat/conversations/direct",
      { body: JSON.stringify({ userId }), method: "POST" },
    );

    if (!result.ok) {
      setUserSearchError(result.message);
      setStartingUserId(null);
      return;
    }

    setConversations((current) => mergePrivateConversation(current, result.data.conversation));
    setSelectedConversationId(result.data.conversation.id);
    setStartingUserId(null);
    setUserSearch("");
    setIsNewConversationOpen(false);
  }

  async function handleSendMessage() {
    const content = draft.trim();
    if (!selectedConversationId || !content || isSending) return;

    setIsSending(true);
    setSendError(null);
    const result = await chatApiRequest<PrivateMessageResponse>(
      `/api/chat/conversations/${encodeURIComponent(selectedConversationId)}/messages`,
      { body: JSON.stringify({ content }), method: "POST" },
    );

    if (!result.ok) {
      setSendError(result.message);
      setIsSending(false);
      return;
    }

    shouldScrollToLatestRef.current = true;
    setMessages((current) => mergePrivateMessages(current, [result.data.message]));
    setDraft("");
    setIsSending(false);
    void loadConversations(selectedConversationId);
  }

  async function handleLoadOlder() {
    if (!selectedConversationId || !nextCursor || isLoadingOlder) return;
    const viewport = messagesViewportRef.current;
    const previousHeight = viewport?.scrollHeight ?? 0;
    const previousTop = viewport?.scrollTop ?? 0;

    setIsLoadingOlder(true);
    const result = await chatApiRequest<PrivateMessagesResponse>(
      `/api/chat/conversations/${encodeURIComponent(selectedConversationId)}/messages?${buildMessagesQuery(nextCursor)}`,
    );

    if (!result.ok) {
      setMessagesError(result.message);
    } else {
      setMessages((current) => mergePrivateMessages(result.data.messages, current));
      setNextCursor(result.data.nextCursor);
      requestAnimationFrame(() => {
        if (viewport) viewport.scrollTop = viewport.scrollHeight - previousHeight + previousTop;
      });
    }
    setIsLoadingOlder(false);
  }

  return (
    <>
      <div className="grid min-h-[620px] overflow-hidden border border-[var(--orion-border)] bg-[var(--orion-panel)] lg:h-[calc(100vh-230px)] lg:max-h-[820px] lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-72 flex-col border-b border-[var(--orion-border)] lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="flex h-[74px] items-center justify-between border-b border-[var(--orion-border)] px-4">
            <div>
              <h2 className="font-semibold">Conversas</h2>
              <p className="mt-1 text-xs text-[var(--orion-muted)]">Colaboradores autenticados</p>
            </div>
            <button
              aria-label="Nova conversa"
              className="inline-flex h-10 w-10 items-center justify-center border border-[var(--orion-border-strong)] text-[var(--orion-accent)] hover:bg-[var(--orion-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
              onClick={() => setIsNewConversationOpen(true)}
              title="Nova conversa"
              type="button"
            >
              <Plus aria-hidden="true" size={19} />
            </button>
          </div>

          <div className="max-h-72 flex-1 overflow-y-auto p-3 lg:max-h-none">
            {isLoadingConversations ? (
              <StatusLine icon="loading" text="Carregando conversas..." />
            ) : conversationsError ? (
              <div className="space-y-3 p-2 text-sm text-[var(--orion-danger)]">
                <p role="alert">{conversationsError}</p>
                <button
                  className="inline-flex items-center gap-2 text-[var(--orion-text)] underline"
                  onClick={() => void loadConversations()}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={15} /> Tentar novamente
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <MessageCircle className="mx-auto text-[var(--orion-muted)]" size={27} />
                <p className="mt-3 text-sm font-medium">Nenhuma conversa</p>
                <button
                  className="mt-3 text-sm font-medium text-[var(--orion-accent)] underline"
                  onClick={() => setIsNewConversationOpen(true)}
                  type="button"
                >
                  Conversar com alguém
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => {
                  const label = privateConversationLabel(conversation);
                  const isSelected = conversation.id === selectedConversationId;
                  return (
                    <button
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left outline-none focus:ring-2 focus:ring-[var(--orion-focus)] ${
                        isSelected
                          ? "bg-[var(--orion-accent-soft)] text-[var(--orion-text)]"
                          : "hover:bg-[var(--orion-surface)]"
                      }`}
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      type="button"
                    >
                      <Avatar name={label} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{label}</span>
                          {conversation.lastMessageAt ? (
                            <span className="shrink-0 text-[11px] text-[var(--orion-muted)]">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block truncate text-xs text-[var(--orion-muted)]">
                          {conversation.lastMessage?.content ?? "Conversa iniciada"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[560px] min-w-0 flex-col">
          {selectedConversation ? (
            <>
              <header className="flex min-h-[74px] items-center justify-between gap-4 border-b border-[var(--orion-border)] px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={privateConversationLabel(selectedConversation)} />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {privateConversationLabel(selectedConversation)}
                    </h2>
                    <p className="truncate text-xs text-[var(--orion-muted)]">
                      {selectedConversation.otherParticipant?.email ?? "Conversa em grupo"}
                    </p>
                  </div>
                </div>
                <RealtimeIndicator status={realtimeStatus} />
              </header>

              <div
                className="min-h-0 flex-1 overflow-y-auto bg-[var(--orion-surface)] px-4 py-5 sm:px-6"
                ref={messagesViewportRef}
              >
                {nextCursor ? (
                  <div className="mb-5 text-center">
                    <button
                      className="text-xs font-medium text-[var(--orion-accent)] underline disabled:opacity-50"
                      disabled={isLoadingOlder}
                      onClick={() => void handleLoadOlder()}
                      type="button"
                    >
                      {isLoadingOlder ? "Carregando..." : "Carregar mensagens anteriores"}
                    </button>
                  </div>
                ) : null}

                {isLoadingMessages ? (
                  <StatusLine icon="loading" text="Carregando mensagens..." />
                ) : messagesError ? (
                  <p className="text-sm text-[var(--orion-danger)]" role="alert">
                    {messagesError}
                  </p>
                ) : messages.length === 0 ? (
                  <div className="flex min-h-72 items-center justify-center text-center">
                    <div>
                      <MessageCircle className="mx-auto text-[var(--orion-accent)]" size={30} />
                      <p className="mt-3 font-semibold">Comece a conversa</p>
                      <p className="mt-1 text-sm text-[var(--orion-muted)]">
                        Envie a primeira mensagem para este colaborador.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((message) => (
                      <article className="flex gap-3" key={message.id}>
                        <Avatar name={message.author.name} small />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-sm font-semibold">
                              {message.author.id === currentUser.id ? "Você" : message.author.name}
                            </span>
                            <time className="text-xs text-[var(--orion-muted)]">
                              {formatTime(message.createdAt)}
                            </time>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                            {message.content}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-[var(--orion-border)] p-4 sm:p-5">
                <div className="flex items-end gap-2 border border-[var(--orion-border-strong)] bg-[var(--orion-panel)] p-2 focus-within:ring-2 focus-within:ring-[var(--orion-focus)]">
                  <textarea
                    aria-label="Mensagem"
                    className="max-h-40 min-h-11 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[var(--orion-muted)]"
                    maxLength={4000}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder={`Mensagem para ${privateConversationLabel(selectedConversation)}`}
                    rows={2}
                    value={draft}
                  />
                  <button
                    aria-label="Enviar mensagem"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--orion-accent)] text-[var(--orion-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                    disabled={!draft.trim() || isSending}
                    onClick={() => void handleSendMessage()}
                    title="Enviar mensagem"
                    type="button"
                  >
                    {isSending ? (
                      <LoaderCircle className="animate-spin" size={17} />
                    ) : (
                      <Send aria-hidden="true" size={17} />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex justify-between gap-3 text-xs text-[var(--orion-muted)]">
                  <span>Enter envia · Shift+Enter quebra a linha</span>
                  <span>{draft.trim().length}/4000</span>
                </div>
                {sendError ? (
                  <p className="mt-2 text-sm text-[var(--orion-danger)]" role="alert">
                    {sendError}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
              <div>
                <UserRound className="mx-auto text-[var(--orion-accent)]" size={32} />
                <p className="mt-4 font-semibold">Selecione ou inicie uma conversa</p>
                <button
                  className="mt-3 text-sm font-medium text-[var(--orion-accent)] underline"
                  onClick={() => setIsNewConversationOpen(true)}
                  type="button"
                >
                  Procurar colaborador
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {isNewConversationOpen ? (
        <div
          aria-labelledby="new-private-conversation-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col border border-[var(--orion-border)] bg-[var(--orion-panel)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--orion-border)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold" id="new-private-conversation-title">
                  Nova conversa
                </h2>
                <p className="mt-1 text-sm text-[var(--orion-muted)]">
                  Encontre um colaborador por nome ou e-mail.
                </p>
              </div>
              <button
                aria-label="Fechar"
                className="p-2 text-[var(--orion-muted)] hover:text-[var(--orion-text)] focus:outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                onClick={() => setIsNewConversationOpen(false)}
                title="Fechar"
                type="button"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </div>

            <div className="border-b border-[var(--orion-border)] p-4">
              <label className="flex h-11 items-center gap-2 border border-[var(--orion-border-strong)] px-3 focus-within:ring-2 focus-within:ring-[var(--orion-focus)]">
                <Search aria-hidden="true" className="text-[var(--orion-muted)]" size={17} />
                <span className="sr-only">Pesquisar colaborador</span>
                <input
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Nome ou e-mail"
                  value={userSearch}
                />
              </label>
            </div>

            <div className="min-h-48 overflow-y-auto p-3">
              {isSearchingUsers ? (
                <StatusLine icon="loading" text="Procurando colaboradores..." />
              ) : userSearchError ? (
                <p className="p-2 text-sm text-[var(--orion-danger)]" role="alert">
                  {userSearchError}
                </p>
              ) : userResults.length === 0 ? (
                <p className="p-6 text-center text-sm text-[var(--orion-muted)]">
                  Nenhum colaborador encontrado.
                </p>
              ) : (
                <div className="space-y-1">
                  {userResults.map((user) => (
                    <button
                      className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-[var(--orion-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--orion-focus)] disabled:opacity-50"
                      disabled={Boolean(startingUserId)}
                      key={user.id}
                      onClick={() => void handleStartConversation(user.id)}
                      type="button"
                    >
                      <Avatar name={user.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{user.name}</span>
                        <span className="mt-1 block truncate text-xs text-[var(--orion-muted)]">
                          {user.email}
                          {user.sector ? ` · ${user.sector.name}` : ""}
                        </span>
                      </span>
                      {startingUserId === user.id ? (
                        <LoaderCircle className="animate-spin" size={17} />
                      ) : (
                        <MessageCircle className="text-[var(--orion-accent)]" size={18} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-[var(--orion-accent)] font-semibold text-[var(--orion-accent-contrast)] ${
        small ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm"
      }`}
    >
      {initials(name)}
    </span>
  );
}

function RealtimeIndicator({ status }: { status: RealtimeStatus }) {
  const labels: Record<RealtimeStatus, string> = {
    connected: "Tempo real ativo",
    connecting: "Conectando",
    disconnected: "Reconectando",
  };

  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-xs text-[var(--orion-muted)]">
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${
          status === "connected" ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      <span className="hidden sm:inline">{labels[status]}</span>
    </span>
  );
}

function StatusLine({ icon, text }: { icon: "loading"; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-[var(--orion-muted)]">
      {icon === "loading" ? <LoaderCircle className="animate-spin" size={17} /> : null}
      <span>{text}</span>
    </div>
  );
}

function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return `${words[0]?.[0] ?? "?"}${words.length > 1 ? (words.at(-1)?.[0] ?? "") : ""}`.toUpperCase();
}

function isNearBottom(element: HTMLDivElement | null) {
  if (!element) return true;
  return element.scrollHeight - element.scrollTop - element.clientHeight < 120;
}
