import { useState, useEffect, useMemo, useRef } from "react";
import {
  useListAdminSupportConversations,
  useListAdminSupportMessages,
  useReplyAdminSupportConversation,
  useUpdateAdminSupportConversation,
  getListAdminSupportConversationsQueryKey,
  getListAdminSupportMessagesQueryKey,
  type AdminSupportConversation,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import {
  MessageSquare, Send, User, Mail, Phone, Clock,
  Lock, Unlock, Loader2, Search,
} from "lucide-react";

const POLL_MS = 5000;

export default function SupportChatAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const locale = ar ? "ar-SA" : "en-US";

  const { data: conversations, isLoading: convLoading } =
    useListAdminSupportConversations({
      query: {
        queryKey: getListAdminSupportConversationsQueryKey(),
        refetchInterval: POLL_MS,
      },
    });

  const {
    data: messages,
    isLoading: msgLoading,
  } = useListAdminSupportMessages(selectedId ?? "", {
    query: {
      queryKey: getListAdminSupportMessagesQueryKey(selectedId ?? ""),
      enabled: !!selectedId,
      refetchInterval: selectedId ? POLL_MS : false,
    },
  });

  const replyMutation = useReplyAdminSupportConversation();
  const statusMutation = useUpdateAdminSupportConversation();

  const sortedConversations = useMemo(() => {
    const list = [...(conversations ?? [])];
    list.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
    return list;
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedConversations;
    return sortedConversations.filter((c) =>
      [c.customerName, c.userEmail, c.userPhone, c.lastMessagePreview]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [sortedConversations, search]);

  const selected = useMemo(
    () => sortedConversations.find((c) => c.id === selectedId) ?? null,
    [sortedConversations, selectedId]
  );

  // Opening a conversation resets its staff unread server-side; refresh the list.
  useEffect(() => {
    if (selectedId) {
      qc.invalidateQueries({ queryKey: getListAdminSupportConversationsQueryKey() });
    }
    setReply("");
  }, [selectedId, qc]);

  // Auto-scroll to newest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  const totalUnread = useMemo(
    () => (conversations ?? []).reduce((sum, c) => sum + (c.staffUnreadCount ?? 0), 0),
    [conversations]
  );

  const formatTime = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString(locale, { day: "2-digit", month: "short" });
  };

  const handleSendReply = async () => {
    const body = reply.trim();
    if (!body || !selectedId || replyMutation.isPending) return;
    await replyMutation.mutateAsync({ id: selectedId, data: { body } });
    setReply("");
    qc.invalidateQueries({ queryKey: getListAdminSupportMessagesQueryKey(selectedId) });
    qc.invalidateQueries({ queryKey: getListAdminSupportConversationsQueryKey() });
  };

  const handleToggleStatus = async () => {
    if (!selected || statusMutation.isPending) return;
    const next = selected.status === "open" ? "closed" : "open";
    await statusMutation.mutateAsync({ id: selected.id, data: { status: next } });
    qc.invalidateQueries({ queryKey: getListAdminSupportConversationsQueryKey() });
  };

  const initials = (name: string) =>
    (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex h-[calc(100vh-11rem)] gap-4">
      {/* ── Left: conversation list ── */}
      <div className="w-80 shrink-0 bg-card rounded-2xl border border-card-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-card-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">
              {ar ? "المحادثات" : "Conversations"}
            </h3>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? "بحث..." : "Search..."}
              className="w-full ps-9 pe-3 py-2 rounded-xl bg-muted/40 border border-card-border text-sm outline-none focus:border-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {convLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : !filteredConversations.length ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted" />
              {ar ? "لا توجد محادثات" : "No conversations"}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const active = c.id === selectedId;
              const unread = (c.staffUnreadCount ?? 0) > 0;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-start px-4 py-3 border-b border-card-border/60 transition-colors flex gap-3 items-start
                    ${active ? "bg-primary/10" : unread ? "bg-primary/5 hover:bg-muted/40" : "hover:bg-muted/40"}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                      {initials(c.customerName)}
                    </div>
                    {unread && (
                      <span className="absolute -top-1 -end-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                        {c.staffUnreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`truncate ${unread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                        {c.customerName}
                      </span>
                      {c.isGuest && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                          {ar ? "زائر" : "Guest"}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${unread ? "text-foreground/80" : "text-muted-foreground"}`}>
                      {c.lastMessagePreview || (ar ? "لا توجد رسائل" : "No messages")}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatTime(c.lastMessageAt)}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${c.status === "open" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {c.status === "open" ? (ar ? "مفتوحة" : "Open") : (ar ? "مغلقة" : "Closed")}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: selected conversation ── */}
      <div className="flex-1 bg-card rounded-2xl border border-card-border shadow-sm flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-14 w-14 mb-4 text-muted" />
            <p className="font-medium">
              {ar ? "اختر محادثة للبدء" : "Select a conversation to start"}
            </p>
          </div>
        ) : (
          <ConversationPane
            key={selected.id}
            conversation={selected}
            ar={ar}
            locale={locale}
            messages={messages}
            msgLoading={msgLoading}
            reply={reply}
            setReply={setReply}
            onSend={handleSendReply}
            sending={replyMutation.isPending}
            onToggleStatus={handleToggleStatus}
            togglingStatus={statusMutation.isPending}
            messagesEndRef={messagesEndRef}
          />
        )}
      </div>
    </div>
  );
}

function ConversationPane({
  conversation,
  ar,
  locale,
  messages,
  msgLoading,
  reply,
  setReply,
  onSend,
  sending,
  onToggleStatus,
  togglingStatus,
  messagesEndRef,
}: {
  conversation: AdminSupportConversation;
  ar: boolean;
  locale: string;
  messages: Array<{ id: string; sender: string; body: string; createdAt: string }> | undefined;
  msgLoading: boolean;
  reply: string;
  setReply: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  onToggleStatus: () => void;
  togglingStatus: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const c = conversation;
  const closed = c.status === "closed";

  const fullTime = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4 border-b border-card-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0">
            {(c.customerName?.trim()?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground truncate">{c.customerName}</span>
              {c.isGuest && (
                <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                  {ar ? "زائر" : "Guest"}
                </span>
              )}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${closed ? "bg-muted text-muted-foreground" : "bg-green-100 text-green-700"}`}>
                {closed ? (ar ? "مغلقة" : "Closed") : (ar ? "مفتوحة" : "Open")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {ar ? "بدأت في" : "Started"} {new Date(c.createdAt).toLocaleDateString(locale)}
            </p>
          </div>
        </div>
        <button
          onClick={onToggleStatus}
          disabled={togglingStatus}
          className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0 disabled:opacity-60
            ${closed ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-foreground hover:bg-muted/70"}`}
        >
          {togglingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : closed ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {closed ? (ar ? "إعادة فتح" : "Reopen") : (ar ? "إغلاق" : "Close")}
        </button>
      </div>

      {/* Customer account info card (linked accounts only) */}
      {!c.isGuest && (c.userEmail || c.userPhone) && (
        <div className="px-6 py-3 bg-muted/20 border-b border-card-border flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-foreground font-medium">{c.customerName}</span>
          </div>
          {c.userEmail && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 text-muted-foreground/60" />
              <a href={`mailto:${c.userEmail}`} className="hover:text-primary transition-colors">{c.userEmail}</a>
            </div>
          )}
          {c.userPhone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 text-muted-foreground/60" />
              <a href={`tel:${c.userPhone}`} className="hover:text-primary transition-colors">{c.userPhone}</a>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 space-y-4 bg-muted/10">
        {msgLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 ? "justify-start" : "justify-end"}`}>
                <div className="h-12 w-52 rounded-2xl bg-muted/50 animate-pulse" />
              </div>
            ))}
          </div>
        ) : !messages?.length ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            {ar ? "لا توجد رسائل بعد" : "No messages yet"}
          </div>
        ) : (
          messages.map((m) => {
            const staff = m.sender === "staff";
            return (
              <div key={m.id} className={`flex ${staff ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${staff ? "bg-primary text-primary-foreground rounded-ee-sm" : "bg-card border border-card-border text-foreground rounded-es-sm"}`}>
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                  <div className={`flex items-center gap-1 mt-1 text-[10px] ${staff ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`}>
                    <Clock className="h-3 w-3" />
                    {fullTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      <div className="px-4 py-3 border-t border-card-border bg-card">
        {closed ? (
          <div className="text-center text-sm text-muted-foreground py-2">
            {ar ? "هذه المحادثة مغلقة. أعد فتحها للرد." : "This conversation is closed. Reopen it to reply."}
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder={ar ? "اكتب ردك..." : "Type your reply..."}
              className="flex-1 resize-none max-h-32 px-4 py-2.5 rounded-xl bg-muted/40 border border-card-border text-sm outline-none focus:border-primary/40"
            />
            <button
              onClick={onSend}
              disabled={sending || !reply.trim()}
              className="shrink-0 inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
