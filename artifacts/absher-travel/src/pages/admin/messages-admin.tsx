import { useState } from "react";
import { useListContactMessages, getListContactMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { Mail, Phone, MessageSquare, Clock, CheckCircle, Eye } from "lucide-react";

export default function MessagesAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();

  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const { data: messages, isLoading } = useListContactMessages();

  const markRead = async (id: number) => {
    await fetch(`/api/contact/messages/${id}/read`, { method: "PATCH" });
    qc.invalidateQueries({ queryKey: getListContactMessagesQueryKey() });
  };

  const filtered = messages?.filter(m => {
    if (filter === "unread") return !m.read;
    if (filter === "read") return m.read;
    return true;
  });

  if (isLoading) return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl border h-20 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 p-2 flex gap-1">
        {[
          { key: "all", ar: "جميع الرسائل", en: "All Messages" },
          { key: "unread", ar: "غير مقروءة", en: "Unread" },
          { key: "read", ar: "مقروءة", en: "Read" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${filter === f.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            {ar ? f.ar : f.en}
            {f.key === "unread" && (
              <span className="ml-2 rtl:mr-2 rtl:ml-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {messages?.filter(m => !m.read).length ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages list */}
      <div className="space-y-3">
        {!filtered?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center text-slate-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-200" />
            {ar ? "لا توجد رسائل" : "No messages"}
          </div>
        ) : (
          filtered.map((msg) => {
            const isExpanded = expanded === msg.id;
            return (
              <div
                key={msg.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${!msg.read ? "border-primary/20 bg-primary/[0.01]" : "border-slate-100"}`}
              >
                <div
                  className="flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => {
                    setExpanded(isExpanded ? null : msg.id);
                    if (!msg.read) markRead(msg.id);
                  }}
                >
                  {/* Unread indicator */}
                  <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${!msg.read ? "bg-primary" : "bg-slate-200"}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-slate-800">{msg.name}</span>
                      {msg.subject && <span className="text-slate-400 text-sm hidden md:block">— {msg.subject}</span>}
                      {!msg.read && (
                        <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                          {ar ? "جديد" : "New"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{msg.message}</p>
                  </div>

                  <div className="shrink-0 text-right rtl:text-left">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(msg.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                    </div>
                    {msg.read ? (
                      <CheckCircle className="h-4 w-4 text-green-400 mt-1 ml-auto rtl:mr-auto rtl:ml-0" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary mt-1 ml-auto rtl:mr-auto rtl:ml-0" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/30 space-y-4">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <a href={`tel:${msg.phone}`} className="hover:text-primary transition-colors">{msg.phone}</a>
                      </div>
                      {msg.email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <a href={`mailto:${msg.email}`} className="hover:text-primary transition-colors">{msg.email}</a>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={`https://wa.me/${msg.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`مرحباً ${msg.name}، شكراً لتواصلك معنا!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        {ar ? "رد عبر واتساب" : "Reply via WhatsApp"}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
