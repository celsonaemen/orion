"use client";

import { Hash, LoaderCircle, MessageSquarePlus, Plus, RefreshCw, Send, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useAuthenticatedUser } from "@/components/app-shell/authenticated-user-context";

import { chatApiRequest } from "./api";
import {
  buildMessagesQuery,
  canManageChatChannels,
  channelLabel,
  findChannel,
  groupChannelsBySector,
  mergeMessages,
  normalizeChannelSlug,
  selectDefaultChannelId,
  shouldApplyMessageResponse,
  toCreateChannelPayload,
  validateCreateChannelForm,
} from "./chat-utils";
import type {
  ChatChannelResponse,
  ChatChannelsResponse,
  ChatMessage,
  ChatMessageResponse,
  ChatMessagesResponse,
  ChatSector,
  CreateChannelFormValues,
} from "./types";

const POLLING_INTERVAL_MS = 4000;
const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const emptyChannelForm: CreateChannelFormValues = {
  description: "",
  name: "",
  sectorId: "",
  slug: "",
};

type LoadMessagesMode = "initial" | "poll" | "retry";

type PendingScrollAction =
  | { type: "latest" }
  | {
      previousScrollHeight: number;
      previousScrollTop: number;
      type: "preserve";
    };

export function ChatWorkspace() {
  const user = useAuthenticatedUser();
  const [sectors, setSectors] = useState<ChatSector[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isChannelFormOpen, setIsChannelFormOpen] = useState(false);
  const [channelForm, setChannelForm] = useState<CreateChannelFormValues>(emptyChannelForm);
  const [channelFormErrors, setChannelFormErrors] = useState<
    Partial<Record<keyof CreateChannelFormValues, string>>
  >({});
  const [channelFormError, setChannelFormError] = useState<string | null>(null);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const selectedChannelIdRef = useRef<string | null>(null);
  const messagesAbortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const latestMessagesRequestIdRef = useRef(0);
  const messagesInFlightRef = useRef(false);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollActionRef = useRef<PendingScrollAction | null>(null);

  selectedChannelIdRef.current = selectedChannelId;

  const selected = useMemo(
    () => findChannel(sectors, selectedChannelId),
    [sectors, selectedChannelId],
  );
  const canCreateChannel = canManageChatChannels(user);

  const loadChannels = useCallback(async (preferredChannelId?: string) => {
    setIsLoadingChannels(true);
    setChannelsError(null);
    const result = await chatApiRequest<ChatChannelsResponse>("/api/chat/channels");

    if (!result.ok) {
      setChannelsError(result.message);
      setIsLoadingChannels(false);
      return;
    }

    const groupedSectors = groupChannelsBySector(result.data.sectors);
    setSectors(groupedSectors);
    setSelectedChannelId(
      selectDefaultChannelId(groupedSectors, preferredChannelId ?? selectedChannelIdRef.current),
    );
    setIsLoadingChannels(false);
  }, []);

  const loadLatestMessages = useCallback(
    async (channelId: string, mode: LoadMessagesMode = "poll") => {
      if (mode === "poll" && messagesInFlightRef.current) return;

      const requestId = ++latestMessagesRequestIdRef.current;
      const controller = new AbortController();
      messagesAbortRef.current?.abort();
      messagesAbortRef.current = controller;
      messagesInFlightRef.current = true;

      if (mode === "initial") setIsLoadingMessages(true);
      if (mode !== "poll") setMessagesError(null);

      try {
        const result = await chatApiRequest<ChatMessagesResponse>(
          `/api/chat/channels/${encodeURIComponent(channelId)}/messages?${buildMessagesQuery()}`,
          { signal: controller.signal },
        );

        if (
          !shouldApplyMessageResponse(
            requestId,
            latestMessagesRequestIdRef.current,
            channelId,
            selectedChannelIdRef.current,
          )
        ) {
          return;
        }

        if (!result.ok) {
          setMessagesError(result.message);
          return;
        }

        if (mode === "initial" || isNearMessagesEnd(messagesViewportRef.current)) {
          pendingScrollActionRef.current = { type: "latest" };
        }

        setMessages((current) => mergeMessages(current, result.data.messages));
        if (mode === "initial") setNextCursor(result.data.nextCursor);
        setMessagesError(null);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMessagesError("Nao foi possivel atualizar as mensagens.");
        }
      } finally {
        if (messagesAbortRef.current === controller) {
          messagesAbortRef.current = null;
          messagesInFlightRef.current = false;
        }
        if (mode === "initial") setIsLoadingMessages(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    messagesAbortRef.current?.abort();
    latestMessagesRequestIdRef.current += 1;
    messagesInFlightRef.current = false;
    pendingScrollActionRef.current = null;
    setMessages([]);
    setNextCursor(null);
    setMessagesError(null);
    setSendError(null);

    if (!selectedChannelId) return;

    void loadLatestMessages(selectedChannelId, "initial");

    return () => {
      messagesAbortRef.current?.abort();
    };
  }, [loadLatestMessages, selectedChannelId]);

  useLayoutEffect(() => {
    const action = pendingScrollActionRef.current;
    const viewport = messagesViewportRef.current;

    if (!action || !viewport) return;

    if (action.type === "latest") {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    } else {
      viewport.scrollTop =
        viewport.scrollHeight - action.previousScrollHeight + action.previousScrollTop;
    }

    pendingScrollActionRef.current = null;
  }, [messages]);

  useEffect(() => {
    if (!selectedChannelId) return;

    const poll = () => {
      if (document.visibilityState === "visible") {
        void loadLatestMessages(selectedChannelId, "poll");
      }
    };
    const intervalId = window.setInterval(poll, POLLING_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadLatestMessages, selectedChannelId]);

  async function handleLoadOlder() {
    if (!selectedChannelId || !nextCursor || isLoadingOlder) return;

    setIsLoadingOlder(true);
    setMessagesError(null);
    const requestId = ++latestMessagesRequestIdRef.current;
    const controller = new AbortController();
    messagesAbortRef.current?.abort();
    messagesAbortRef.current = controller;
    messagesInFlightRef.current = true;

    try {
      const result = await chatApiRequest<ChatMessagesResponse>(
        `/api/chat/channels/${encodeURIComponent(selectedChannelId)}/messages?${buildMessagesQuery(nextCursor)}`,
        { signal: controller.signal },
      );

      if (
        !shouldApplyMessageResponse(
          requestId,
          latestMessagesRequestIdRef.current,
          selectedChannelId,
          selectedChannelIdRef.current,
        )
      ) {
        return;
      }

      if (!result.ok) {
        setMessagesError(result.message);
        return;
      }

      const viewport = messagesViewportRef.current;
      if (viewport) {
        pendingScrollActionRef.current = {
          previousScrollHeight: viewport.scrollHeight,
          previousScrollTop: viewport.scrollTop,
          type: "preserve",
        };
      }
      setMessages((current) => mergeMessages(result.data.messages, current));
      setNextCursor(result.data.nextCursor);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setMessagesError("Nao foi possivel carregar mensagens anteriores.");
      }
    } finally {
      if (messagesAbortRef.current === controller) {
        messagesAbortRef.current = null;
        messagesInFlightRef.current = false;
      }
      setIsLoadingOlder(false);
    }
  }

  async function handleSendMessage() {
    const content = draft.trim();
    if (!selectedChannelId || !content || isSending) return;

    setIsSending(true);
    setSendError(null);
    const result = await chatApiRequest<ChatMessageResponse>(
      `/api/chat/channels/${encodeURIComponent(selectedChannelId)}/messages`,
      {
        body: JSON.stringify({ content }),
        method: "POST",
      },
    );

    if (!result.ok) {
      setSendError(result.message);
      setIsSending(false);
      return;
    }

    setDraft("");
    pendingScrollActionRef.current = { type: "latest" };
    setMessages((current) => mergeMessages(current, [result.data.message]));
    setIsSending(false);
    void loadLatestMessages(selectedChannelId, "poll");
  }

  function openChannelForm() {
    const defaultSectorId = selected?.sector.id ?? sectors[0]?.id ?? "";
    setChannelForm({ ...emptyChannelForm, sectorId: defaultSectorId });
    setChannelFormErrors({});
    setChannelFormError(null);
    setIsSlugEdited(false);
    setIsChannelFormOpen(true);
  }

  async function handleCreateChannel() {
    const validated = validateCreateChannelForm(channelForm);
    setChannelFormErrors(validated.errors);
    setChannelFormError(null);

    if (!validated.isValid || isCreatingChannel) return;

    setIsCreatingChannel(true);
    const result = await chatApiRequest<ChatChannelResponse>("/api/chat/channels", {
      body: JSON.stringify(toCreateChannelPayload(channelForm)),
      method: "POST",
    });

    if (!result.ok) {
      setChannelFormError(
        result.status === 409
          ? "Ja existe um canal com este slug no setor selecionado."
          : result.message,
      );
      setIsCreatingChannel(false);
      return;
    }

    setIsCreatingChannel(false);
    setIsChannelFormOpen(false);
    setSuccessMessage(`Canal ${channelLabel(result.data.channel)} criado com sucesso.`);
    await loadChannels(result.data.channel.id);
  }

  return (
    <section className="overflow-hidden border border-[var(--orion-border)] bg-[var(--orion-panel)] shadow-sm">
      {successMessage ? (
        <div
          className="flex items-center justify-between border-b border-emerald-300/50 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--orion-success)]"
          role="status"
        >
          <span>{successMessage}</span>
          <button
            aria-label="Fechar mensagem de sucesso"
            className="p-1"
            onClick={() => setSuccessMessage(null)}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      ) : null}

      <div className="grid min-h-[min(72vh,48rem)] md:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="max-h-72 overflow-y-auto border-b border-[var(--orion-border)] bg-[var(--orion-sidebar)] md:max-h-none md:border-b-0 md:border-r">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--orion-border)] bg-[var(--orion-sidebar)] px-4 py-4">
            <div>
              <p className="font-semibold text-[var(--orion-text)]">Comunicacao</p>
              <p className="text-xs text-[var(--orion-muted)]">Canais por setor</p>
            </div>
            {canCreateChannel ? (
              <button
                aria-label="Novo canal"
                className="inline-flex h-9 w-9 items-center justify-center border border-[var(--orion-border)] text-[var(--orion-accent)] outline-none transition hover:bg-[var(--orion-hover)] focus:ring-2 focus:ring-[var(--orion-focus)]"
                onClick={openChannelForm}
                title="Novo canal"
                type="button"
              >
                <Plus aria-hidden="true" size={18} />
              </button>
            ) : null}
          </div>

          <div className="p-3">
            {isLoadingChannels ? (
              <p className="flex items-center gap-2 px-2 py-4 text-sm text-[var(--orion-muted)]">
                <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
                Carregando canais...
              </p>
            ) : null}

            {channelsError ? (
              <div className="border border-rose-300/50 bg-rose-500/10 p-3 text-sm text-[var(--orion-danger)]">
                <p>{channelsError}</p>
                <button
                  className="mt-3 inline-flex items-center gap-2 border border-current px-3 py-2 text-xs font-semibold"
                  onClick={() => void loadChannels()}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={14} />
                  Tentar novamente
                </button>
              </div>
            ) : null}

            {!isLoadingChannels && !channelsError && sectors.length === 0 ? (
              <p className="px-2 py-4 text-sm leading-6 text-[var(--orion-muted)]">
                Voce nao possui um setor com canais acessiveis. Fale com um administrador se isso
                parecer incorreto.
              </p>
            ) : null}

            {sectors.map((sector) => (
              <div className="mb-4" key={sector.id}>
                <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--orion-muted)]">
                  {sector.name}
                </p>
                {sector.channels.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-[var(--orion-muted)]">Nenhum canal ativo.</p>
                ) : (
                  <ul className="space-y-1">
                    {sector.channels.map((channel) => {
                      const isSelected = channel.id === selectedChannelId;
                      return (
                        <li key={channel.id}>
                          <button
                            aria-current={isSelected ? "page" : undefined}
                            className={`flex w-full items-center gap-2 border px-3 py-2 text-left text-sm outline-none transition focus:ring-2 focus:ring-[var(--orion-focus)] ${
                              isSelected
                                ? "border-[var(--orion-accent)] bg-[var(--orion-active)] text-[var(--orion-text)]"
                                : "border-transparent text-[var(--orion-muted)] hover:bg-[var(--orion-hover)] hover:text-[var(--orion-text)]"
                            }`}
                            onClick={() => setSelectedChannelId(channel.id)}
                            type="button"
                          >
                            <Hash aria-hidden="true" size={15} />
                            <span className="truncate">{channel.slug}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-h-[32rem] min-w-0 flex-col">
          {selected ? (
            <>
              <header className="border-b border-[var(--orion-border)] px-4 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <Hash aria-hidden="true" className="text-[var(--orion-accent)]" size={19} />
                  <h1 className="truncate text-lg font-semibold">{selected.channel.slug}</h1>
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--orion-muted)]">
                  {selected.sector.name}
                </p>
                {selected.channel.description ? (
                  <p className="mt-2 text-sm text-[var(--orion-muted)]">
                    {selected.channel.description}
                  </p>
                ) : null}
              </header>

              <div
                className="min-h-0 flex-1 overflow-y-auto bg-[var(--orion-panel-muted)] px-4 py-5 sm:px-6"
                ref={messagesViewportRef}
              >
                {nextCursor ? (
                  <div className="mb-5 text-center">
                    <button
                      className="inline-flex items-center gap-2 border border-[var(--orion-border)] bg-[var(--orion-panel)] px-3 py-2 text-xs font-semibold text-[var(--orion-muted)] outline-none hover:text-[var(--orion-text)] focus:ring-2 focus:ring-[var(--orion-focus)]"
                      disabled={isLoadingOlder}
                      onClick={() => void handleLoadOlder()}
                      type="button"
                    >
                      {isLoadingOlder ? (
                        <LoaderCircle aria-hidden="true" className="animate-spin" size={14} />
                      ) : null}
                      Carregar mensagens anteriores
                    </button>
                  </div>
                ) : null}

                {isLoadingMessages && messages.length === 0 ? (
                  <p className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--orion-muted)]">
                    <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
                    Carregando mensagens...
                  </p>
                ) : null}

                {!isLoadingMessages && messages.length === 0 && !messagesError ? (
                  <div className="mx-auto max-w-md py-12 text-center">
                    <MessageSquarePlus
                      aria-hidden="true"
                      className="mx-auto text-[var(--orion-accent)]"
                      size={30}
                    />
                    <p className="mt-3 font-medium">Comece a conversa</p>
                    <p className="mt-1 text-sm text-[var(--orion-muted)]">
                      Ainda nao ha mensagens neste canal.
                    </p>
                  </div>
                ) : null}

                <ol className="space-y-5">
                  {messages.map((message) => (
                    <li className="flex gap-3" key={message.id}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--orion-avatar)] text-xs font-bold text-white">
                        {getInitials(message.author.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold">{message.author.name}</span>
                          <time
                            className="text-xs text-[var(--orion-muted)]"
                            dateTime={message.createdAt}
                          >
                            {timeFormatter.format(new Date(message.createdAt))}
                          </time>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                          {message.content}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div aria-hidden="true" ref={messagesEndRef} />

                {messagesError ? (
                  <div
                    className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-rose-300/50 bg-rose-500/10 p-3 text-sm text-[var(--orion-danger)]"
                    role="alert"
                  >
                    <span>{messagesError}</span>
                    <button
                      className="inline-flex items-center gap-2 border border-current px-3 py-2 text-xs font-semibold"
                      onClick={() => void loadLatestMessages(selected.channel.id, "retry")}
                      type="button"
                    >
                      <RefreshCw aria-hidden="true" size={14} />
                      Tentar novamente
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-[var(--orion-border)] bg-[var(--orion-panel)] p-4 sm:p-5">
                <label className="sr-only" htmlFor="chat-message">
                  Escrever mensagem em {channelLabel(selected.channel)}
                </label>
                <div className="flex items-end gap-2 border border-[var(--orion-border-strong)] bg-[var(--orion-panel)] p-2 focus-within:ring-2 focus-within:ring-[var(--orion-focus)]">
                  <textarea
                    className="max-h-40 min-h-11 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[var(--orion-muted)]"
                    id="chat-message"
                    maxLength={4000}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder={`Mensagem para ${channelLabel(selected.channel)}`}
                    rows={2}
                    value={draft}
                  />
                  <button
                    aria-label="Enviar mensagem"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--orion-accent)] text-[var(--orion-accent-contrast)] outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-[var(--orion-focus)] focus:ring-offset-2"
                    disabled={!draft.trim() || isSending}
                    onClick={() => void handleSendMessage()}
                    type="button"
                  >
                    {isSending ? (
                      <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
                    ) : (
                      <Send aria-hidden="true" size={17} />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-[var(--orion-muted)]">
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
              <div className="max-w-md">
                <Hash aria-hidden="true" className="mx-auto text-[var(--orion-accent)]" size={32} />
                <p className="mt-4 font-semibold">Nenhum canal selecionado</p>
                <p className="mt-2 text-sm leading-6 text-[var(--orion-muted)]">
                  Quando houver um canal acessivel, ele aparecera aqui automaticamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isChannelFormOpen ? (
        <div
          aria-labelledby="new-channel-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[var(--orion-border)] bg-[var(--orion-panel)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--orion-border)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold" id="new-channel-title">
                  Novo canal
                </h2>
                <p className="text-sm text-[var(--orion-muted)]">Crie um espaco para o setor.</p>
              </div>
              <button
                aria-label="Fechar formulario"
                className="p-2 text-[var(--orion-muted)] hover:text-[var(--orion-text)]"
                onClick={() => setIsChannelFormOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <Field label="Setor" error={channelFormErrors.sectorId}>
                <select
                  className="h-11 w-full border border-[var(--orion-border-strong)] bg-[var(--orion-panel)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                  onChange={(event) =>
                    setChannelForm((current) => ({ ...current, sectorId: event.target.value }))
                  }
                  value={channelForm.sectorId}
                >
                  <option value="">Selecione</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nome" error={channelFormErrors.name}>
                <input
                  className="h-11 w-full border border-[var(--orion-border-strong)] bg-[var(--orion-panel)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                  maxLength={120}
                  onChange={(event) => {
                    const name = event.target.value;
                    setChannelForm((current) => ({
                      ...current,
                      name,
                      slug: isSlugEdited ? current.slug : normalizeChannelSlug(name),
                    }));
                  }}
                  placeholder="Ex.: avisos fiscais"
                  value={channelForm.name}
                />
              </Field>

              <Field label="Slug" error={channelFormErrors.slug}>
                <div className="flex h-11 items-center border border-[var(--orion-border-strong)] bg-[var(--orion-panel)] px-3 focus-within:ring-2 focus-within:ring-[var(--orion-focus)]">
                  <Hash aria-hidden="true" className="text-[var(--orion-muted)]" size={16} />
                  <input
                    className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
                    maxLength={80}
                    onChange={(event) => {
                      setIsSlugEdited(true);
                      setChannelForm((current) => ({ ...current, slug: event.target.value }));
                    }}
                    placeholder="avisos-fiscais"
                    value={channelForm.slug}
                  />
                </div>
              </Field>

              <Field label="Descricao (opcional)" error={channelFormErrors.description}>
                <textarea
                  className="min-h-24 w-full border border-[var(--orion-border-strong)] bg-[var(--orion-panel)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                  maxLength={240}
                  onChange={(event) =>
                    setChannelForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  value={channelForm.description}
                />
              </Field>

              {channelFormError ? (
                <p
                  className="border border-rose-300/50 bg-rose-500/10 p-3 text-sm text-[var(--orion-danger)]"
                  role="alert"
                >
                  {channelFormError}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--orion-border)] px-5 py-4">
              <button
                className="border border-[var(--orion-border)] px-4 py-2 text-sm font-semibold text-[var(--orion-muted)]"
                onClick={() => setIsChannelFormOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center gap-2 bg-[var(--orion-accent)] px-4 py-2 text-sm font-semibold text-[var(--orion-accent-contrast)] disabled:opacity-50"
                disabled={isCreatingChannel}
                onClick={() => void handleCreateChannel()}
                type="button"
              >
                {isCreatingChannel ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
                ) : null}
                Criar canal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type FieldProps = {
  children: React.ReactNode;
  error?: string;
  label: string;
};

function Field({ children, error, label }: FieldProps) {
  return (
    <label className="block text-sm font-medium">
      <span>{label}</span>
      <span className="mt-1 block">{children}</span>
      {error ? (
        <span className="mt-1 block text-xs text-[var(--orion-danger)]">{error}</span>
      ) : null}
    </label>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function isNearMessagesEnd(viewport: HTMLDivElement | null) {
  if (!viewport) return true;

  return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 96;
}
