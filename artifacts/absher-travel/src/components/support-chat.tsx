/**
 * ABSHER TRAVEL — real in-app support chat widget.
 *
 * Replaces the old external WhatsApp redirect with a functional chat backed by
 * the support/* endpoints (generated @workspace/api-client-react hooks):
 *   • Logged-in customer  → getOrCreateSupportConversation + listSupportMessages
 *                            (5s polling) + sendSupportMessage. Conversation is
 *                            linked to the account server-side.
 *   • Guest               → name form → createGuestSupportConversation, token
 *                            stored in localStorage ('absher_support_guest_token'),
 *                            listGuestSupportMessages + sendGuestSupportMessage.
 *   • On login with a stored guest token → claimGuestSupportConversation once,
 *     then clear the token.
 *
 * Bilingual (site language), navy/gold branding, floating button with an unread
 * indicator (customerUnreadCount), responsive (full-screen sheet on mobile).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetOrCreateSupportConversation,
  useListSupportMessages,
  useSendSupportMessage,
  useCreateGuestSupportConversation,
  useListGuestSupportMessages,
  useSendGuestSupportMessage,
  useClaimGuestSupportConversation,
  getListSupportMessagesQueryKey,
  getListGuestSupportMessagesQueryKey,
} from "@workspace/api-client-react";
import type { SupportConversation, SupportMessage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, X, MessageSquare, Headphones } from "lucide-react";

const GUEST_TOKEN_KEY = "absher_support_guest_token";
const POLL_MS = 5000;
const OPEN_EVENT = "absher:open-support";

/** Programmatically open the support chat from anywhere (e.g. contact CTA). */
export function openSupportChat() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function SupportChat() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [guestToken, setGuestToken] = useState<string | null>(() => localStorage.getItem(GUEST_TOKEN_KEY));
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [guestName, setGuestName] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const firstName = (user?.firstName || "").trim();

  // Allow opening the chat from external CTAs (footer / contact page).
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  // ── mutations ──────────────────────────────────────────────────────────────
  const getOrCreate = useGetOrCreateSupportConversation();
  const createGuest = useCreateGuestSupportConversation();
  const claimGuest = useClaimGuestSupportConversation();
  const sendMsg = useSendSupportMessage();
  const sendGuestMsg = useSendGuestSupportMessage();

  // ── claim a guest conversation once, after login ─────────────────────────────
  const claimedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || claimedRef.current) return;
    const token = localStorage.getItem(GUEST_TOKEN_KEY);
    if (!token) return;
    claimedRef.current = true;
    claimGuest.mutate(
      { data: { token } },
      {
        onSettled: () => {
          localStorage.removeItem(GUEST_TOKEN_KEY);
          setGuestToken(null);
        },
      },
    );
  }, [isAuthenticated, claimGuest]);

  // ── open the panel: for logged-in users, ensure a conversation exists ────────
  useEffect(() => {
    if (!open || !isAuthenticated || conversation) return;
    getOrCreate.mutate(undefined, {
      onSuccess: (c) => setConversation(c),
      onError: () => setError(ar ? "تعذّر بدء المحادثة." : "Could not start the conversation."),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAuthenticated]);

  // ── message polling ──────────────────────────────────────────────────────────
  const authedActive = isAuthenticated && !!conversation && open;
  const guestActive = !isAuthenticated && !!guestToken && open;

  const { data: authedMessages } = useListSupportMessages(undefined, {
    query: {
      queryKey: getListSupportMessagesQueryKey(),
      enabled: authedActive,
      refetchInterval: authedActive ? POLL_MS : false,
    },
  });

  const { data: guestMessages } = useListGuestSupportMessages(
    { token: guestToken ?? "" },
    {
      query: {
        queryKey: getListGuestSupportMessagesQueryKey({ token: guestToken ?? "" }),
        enabled: guestActive,
        refetchInterval: guestActive ? POLL_MS : false,
      },
    },
  );

  // ── unread badge polling (background) ────────────────────────────────────────
  // For logged-in users, poll the conversation get-or-create to read
  // customerUnreadCount even when the panel is closed.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const tick = () => {
      getOrCreate.mutate(undefined, {
        onSuccess: (c) => { if (!cancelled) setConversation((prev) => prev ? { ...prev, ...c } : c); },
      });
    };
    tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const messages: SupportMessage[] = useMemo(
    () => (isAuthenticated ? authedMessages : guestMessages) ?? [],
    [isAuthenticated, authedMessages, guestMessages],
  );

  // Reset customer unread locally once the panel is open (server also resets on list).
  useEffect(() => {
    if (open && conversation && conversation.customerUnreadCount > 0) {
      setConversation((c) => c ? { ...c, customerUnreadCount: 0 } : c);
    }
  }, [open, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, open]);

  const unread = conversation?.customerUnreadCount ?? 0;

  // ── actions ───────────────────────────────────────────────────────────────
  const startGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = guestName.trim();
    if (!name) return;
    setError(null);
    try {
      const res = await createGuest.mutateAsync({ data: { name } });
      localStorage.setItem(GUEST_TOKEN_KEY, res.guestToken);
      setGuestToken(res.guestToken);
    } catch {
      setError(ar ? "تعذّر بدء المحادثة، حاول مرة أخرى." : "Could not start the conversation, please try again.");
    }
  };

  const invalidateMessages = () => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: getListSupportMessagesQueryKey() });
    } else if (guestToken) {
      queryClient.invalidateQueries({ queryKey: getListGuestSupportMessagesQueryKey({ token: guestToken }) });
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setError(null);
    setDraft("");
    try {
      if (isAuthenticated) {
        await sendMsg.mutateAsync({ data: { body } });
      } else if (guestToken) {
        await sendGuestMsg.mutateAsync({ data: { token: guestToken, body } });
      }
      invalidateMessages();
    } catch {
      setDraft(body);
      setError(ar ? "تعذّر إرسال الرسالة." : "Could not send the message.");
    }
  };

  const greeting = firstName
    ? (ar
        ? `مرحباً ${firstName} 👋 أهلاً بك في ABSHER TRAVEL. كيف يمكن لفريق الدعم مساعدتك اليوم؟`
        : `Hello ${firstName} 👋 Welcome to ABSHER TRAVEL. How can our support team help you today?`)
    : (ar
        ? "أهلاً بك في ABSHER TRAVEL 👋 كيف يمكن لفريق الدعم مساعدتك اليوم؟"
        : "Welcome to ABSHER TRAVEL 👋 How can our support team help you today?");

  const needsGuestName = !isAuthenticated && !guestToken;
  const sending = sendMsg.isPending || sendGuestMsg.isPending;

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(ar ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={ar ? "الدعم" : "Support"}
          className="fixed bottom-6 right-6 rtl:left-6 rtl:right-auto z-50 bg-[#0A2342] text-white p-4 rounded-full shadow-xl hover:scale-110 hover:bg-[#0A2342]/90 transition-all flex items-center justify-center ring-2 ring-[#D4AF37]/60"
          data-testid="button-support-open"
        >
          <MessageSquare className="w-6 h-6" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 rtl:-left-1 rtl:right-auto min-w-[20px] h-5 px-1 rounded-full bg-[#D4AF37] text-[#0A2342] text-[11px] font-black flex items-center justify-center border-2 border-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          dir={ar ? "rtl" : "ltr"}
          className="fixed z-50 bg-white shadow-2xl flex flex-col overflow-hidden
            inset-0 rounded-none
            sm:inset-auto sm:bottom-6 sm:right-6 sm:rtl:left-6 sm:rtl:right-auto
            sm:w-[380px] sm:h-[600px] sm:max-h-[85vh] sm:rounded-3xl sm:border sm:border-slate-200"
          data-testid="panel-support-chat"
        >
          {/* Header */}
          <div className="bg-[#0A2342] px-5 py-4 flex items-center justify-between shrink-0 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15)_0%,transparent_60%)]" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <div className="font-black text-white text-sm tracking-wide">ABSHER TRAVEL</div>
                <div className="text-[#D4AF37] text-[11px] font-bold">
                  {ar ? "الدعم الفني" : "Support Team"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={ar ? "إغلاق" : "Close"}
              className="relative z-10 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              data-testid="button-support-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {needsGuestName ? (
            <div className="flex-1 flex flex-col justify-center p-6 gap-5 bg-slate-50">
              <div className="text-center space-y-2">
                <div className="text-3xl">👋</div>
                <p className="text-base font-bold text-[#0A2342] leading-relaxed">
                  {ar ? "أهلاً بك في ABSHER TRAVEL" : "Welcome to ABSHER TRAVEL"}
                </p>
                <p className="text-sm text-slate-500">
                  {ar ? "يرجى إدخال اسمك لبدء المحادثة" : "Please provide your name to start the conversation"}
                </p>
              </div>
              <form onSubmit={startGuest} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">{ar ? "الاسم" : "Your Name"}</Label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    maxLength={120}
                    className="h-11 bg-white"
                    placeholder={ar ? "اكتب اسمك هنا" : "Enter your name"}
                    data-testid="input-support-guest-name"
                  />
                </div>
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                <Button
                  type="submit"
                  disabled={!guestName.trim() || createGuest.isPending}
                  className="w-full h-11 bg-[#0A2342] text-white hover:bg-[#0A2342]/90 font-bold rounded-xl disabled:opacity-50"
                  data-testid="button-support-guest-continue"
                >
                  {createGuest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (ar ? "متابعة" : "Continue")}
                </Button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50" data-testid="list-support-messages">
                {/* Greeting bubble */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-white border border-slate-100 rounded-2xl rounded-ss-md px-4 py-2.5 shadow-sm">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{greeting}</p>
                  </div>
                </div>

                {(isAuthenticated ? getOrCreate.isPending && !conversation : false) && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0A2342]" />
                  </div>
                )}

                {messages.map((m) => {
                  const mine = m.sender === "customer";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 shadow-sm text-sm leading-relaxed break-words ${
                        mine
                          ? "bg-[#0A2342] text-white rounded-2xl rounded-se-md"
                          : "bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-ss-md"
                      }`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <div className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-slate-400"}`} dir="ltr">
                          {fmtTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <form onSubmit={send} className="p-3 border-t border-slate-100 bg-white shrink-0">
                {error && <p className="text-xs text-red-500 font-medium mb-2 px-1">{error}</p>}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e as any); }
                    }}
                    rows={1}
                    maxLength={2000}
                    placeholder={ar ? "اكتب رسالتك..." : "Type your message..."}
                    className="flex-1 resize-none max-h-28 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#0A2342]/20"
                    data-testid="input-support-message"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="w-11 h-11 shrink-0 bg-[#D4AF37] text-[#0A2342] rounded-full flex items-center justify-center hover:bg-[#D4AF37]/90 disabled:opacity-50 transition-colors"
                    data-testid="button-support-send"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className={`w-5 h-5 ${ar ? "rotate-180" : ""}`} />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
