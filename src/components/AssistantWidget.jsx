import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, User as UserIcon, Loader2, RotateCcw, ChevronRight } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { AssistantAskAPI, AssistantSuggestionsAPI } from "./Constant/Api/Api";
import { hasPermission } from "../Utils/roleUtils";

// Answers come from the assistant's own scoped queries, so a table here shows
// exactly the rows the caller could already fetch from the API themselves.
const AnswerTable = ({ table, truncated, moreRows }) => {
  if (!table || table.rows.length === 0) return null;
  return (
    <div className="mt-2.5">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-400">
              {table.columns.map((c) => (
                <th key={c} className="py-1.5 px-2 font-semibold whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i} className="border-t border-gray-100 dark:border-slate-800">
                {row.map((cell, j) => (
                  <td key={j} className="py-1.5 px-2 text-gray-700 dark:text-slate-200 whitespace-nowrap">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated > 0 && (
        <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
          {moreRows(truncated)}
        </p>
      )}
    </div>
  );
};

const Bubble = ({ message, onAsk, moreRows, closing }) => {
  if (message.role === "user") {
    return (
      <div className="flex items-start gap-2 justify-end">
        <div className="max-w-[85%] bg-violet-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-[13px]">
          {message.text}
        </div>
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
          <UserIcon size={13} />
        </div>
      </div>
    );
  }

  if (message.closing) {
    return (
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center flex-shrink-0">
          <Sparkles size={13} />
        </div>
        <div className="max-w-[88%] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
          <p className="text-[13px] text-gray-800 dark:text-slate-100">{closing}</p>
        </div>
      </div>
    );
  }

  const d = message.data;

  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center flex-shrink-0">
        <Sparkles size={13} />
      </div>
      <div className="max-w-[88%] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
        <p className="text-[13px] text-gray-800 dark:text-slate-100">{d.answer}</p>

        {d.details?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {d.details.map((x) => (
              <span
                key={x.label}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200"
              >
                {x.label}
                <span className="font-semibold text-gray-900 dark:text-slate-50">{x.value}</span>
              </span>
            ))}
          </div>
        )}

        <AnswerTable table={d.table} truncated={d.truncated} moreRows={moreRows} />

        {/* Never a guess — only questions this user is actually allowed to ask. */}
        {d.suggestions?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {d.suggestions.map((s) => (
              <button
                key={s.text}
                onClick={() => onAsk(s.text)}
                className="text-[10px] px-2 py-1 rounded-full border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition"
              >
                {s.text}
              </button>
            ))}
          </div>
        )}

        {(d.period || d.scope) && (
          <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-100 dark:border-slate-700 text-[9px] text-gray-400 dark:text-slate-500">
            {d.period && <span>{d.period.label}</span>}
            {d.period && d.scope && <span>·</span>}
            {d.scope && <span>{d.scope}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// The full role-appropriate list, grouped. Used both as the opening screen and
// as the "ask another" picker, so the two never drift apart.
const QuestionList = ({ grouped, catLabels, onPick }) => (
  <div className="space-y-4">
    {grouped.map((g) => (
      <div key={g.name}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            {catLabels[g.name] || g.name}
          </span>
          <span className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          <span className="text-[9px] text-gray-400 dark:text-slate-500">{g.items.length}</span>
        </div>

        <div className="flex flex-col">
          {g.items.map((s) => (
            <button
              key={s.text}
              onClick={() => onPick(s.text)}
              className="group flex items-center gap-2 text-left text-[12px] w-full px-2 py-2 rounded-lg
                         text-gray-700 dark:text-slate-200
                         hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
            >
              <span className="w-0.5 self-stretch rounded-full bg-transparent group-hover:bg-violet-500 transition-colors" />
              <span className="flex-1 leading-snug">{s.text}</span>
              <ChevronRight
                size={13}
                className="flex-shrink-0 text-gray-300 dark:text-slate-600 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all"
              />
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const AssistantWidget = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  // English is the default face. It flips to Hindi only once the user
  // actually asks something in Hindi, and follows them back if they switch.
  const [lang, setLang] = useState("en");
  // After each answer the chat asks whether anything else is needed, so the user
  // never lands on a dead end with only a text box to guess at.
  const [picking, setPicking] = useState(false);
  const [ended, setEnded] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const allowed = hasPermission(user, "assistant.view");

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      try {
        const r = await ApiHit(`${AssistantSuggestionsAPI}?lang=${lang}`, "GET");
        if (r?.success) setSuggestions(r.data || []);
      } catch { /* empty state just shows fewer chips */ }
    })();
  }, [allowed, lang]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, loading, open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const reset = () => {
    setMessages([]);
    setPicking(false);
    setEnded(false);
    setInput("");
  };

  const endChat = () => {
    setPicking(false);
    setEnded(true);
    setMessages((prev) => [...prev, { role: "assistant", closing: true }]);
  };

  const ask = async (question) => {
    const text = String(question || "").trim();
    if (!text || loading) return;

    const errorCopy = lang === "en"
      ? { generic: "Something went wrong. Please try again.",
          offline: "Could not reach the server. Please try again." }
      : { generic: "Kuch gadbad ho gayi. Dobara try karein.",
          offline: "Server se connect nahi ho paya. Dobara try karein." };

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setPicking(false);
    setEnded(false);
    setLoading(true);

    try {
      const r = await ApiHit(AssistantAskAPI, "POST", { question: text });
      if (r?.data?.lang) setLang(r.data.lang);
      setMessages((prev) => [...prev, {
        role: "assistant",
        data: r?.success
          ? r.data
          : { answer: r?.message || errorCopy.generic, details: [] }
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        data: { answer: errorCopy.offline, details: [] }
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Every question this role is allowed to ask, grouped so a long list stays
  // readable. Order follows the server's, so categories keep a stable order.
  const grouped = useMemo(() => {
    const out = [];
    for (const s of suggestions) {
      const name = s.category || "Questions";
      const bucket = out.find((g) => g.name === name);
      if (bucket) bucket.items.push(s);
      else out.push({ name, items: [s] });
    }
    return out;
  }, [suggestions]);
  const firstName = (user?.name || "").split(" ")[0];
  const ui = lang === "en"
    ? {
        subtitle: "Answers from your HR data",
        greeting: firstName ? `Hi ${firstName}!` : "Hi there!",
        prompt: "Pick a question, or ask in your own words.",
        placeholder: "e.g. how many leaves this month?",
        thinking: "Looking…",
        newChat: "Start over",
        anythingElse: "Anything else you'd like to know?",
        yes: "Yes, another question",
        no: "No, that's all",
        pickNext: "Pick your next question, or type your own.",
        closing: "Glad I could help. Have a good day!",
        endedPlaceholder: "Chat ended — press ↺ to start again",
        cat: {},
        moreRows: (n) => `+ ${n} more rows — see that module's page for the full list.`
      }
    : {
        subtitle: "Aapke HR data se jawab",
        greeting: firstName ? `Namaste ${firstName}!` : "Namaste!",
        prompt: "Koi sawaal chunein, ya apne shabdon me poochein.",
        placeholder: "Jaise: is month kitni leaves hui?",
        thinking: "Dekh raha hoon…",
        newChat: "Naya sawaal",
        anythingElse: "Aur kuch jaanna hai?",
        yes: "Haan, ek aur sawaal",
        no: "Nahi, bas itna hi",
        pickNext: "Agla sawaal chunein, ya khud type karein.",
        closing: "Madad karke khushi hui. Aapka din accha rahe!",
        endedPlaceholder: "Chat khatam — ↺ dabaakar dobara shuru karein",
        cat: {
          Leaves: "Leaves",
          Attendance: "Attendance",
          People: "Employees",
          Organisation: "Organisation",
          "About me": "Mera data"
        },
        moreRows: (n) => `+ ${n} aur rows — poori list us module ke page pe.`
      };

  if (!allowed) return null;

  return (
    <>
      {/* Panel. Sits above the mobile bottom nav (h-16) and clears the launcher. */}
      {open && (
        <div
          role="dialog"
          aria-label="HR Assistant"
          className="fixed z-[60] right-3 sm:right-6 bottom-36 lg:bottom-24
                     w-[calc(100vw-1.5rem)] sm:w-[400px]
                     h-[65vh] sm:h-[540px] max-h-[calc(100vh-11rem)]
                     bg-gray-50 dark:bg-slate-900 rounded-2xl shadow-2xl
                     border border-gray-200 dark:border-slate-700
                     flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={16} className="flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight">HR Assistant</div>
                <div className="text-[10px] text-violet-200 leading-tight">{ui.subtitle}</div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  aria-label={ui.newChat}
                  title={ui.newChat}
                  className="p-1.5 rounded-lg hover:bg-white/15 transition"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="p-1.5 rounded-lg hover:bg-white/15 transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="px-1">
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center mb-2.5">
                    <Sparkles size={20} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                    {ui.greeting}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                    {ui.prompt}
                  </p>
                </div>

                {/* The server only sends questions this role is allowed to ask,
                    so an employee never sees an org-wide question here. */}
                <QuestionList grouped={grouped} catLabels={ui.cat} onPick={ask} />
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <Bubble key={i} message={m} onAsk={ask} moreRows={ui.moreRows} closing={ui.closing} />
                ))}

                {/* Asked after every answer: the panel should never leave the
                    user staring at an empty box wondering what else it knows. */}
                {!loading && !ended && !picking && (
                  <div className="pl-9">
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-1.5">{ui.anythingElse}</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPicking(true)}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition"
                      >
                        {ui.yes}
                      </button>
                      <button
                        onClick={endChat}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                      >
                        {ui.no}
                      </button>
                    </div>
                  </div>
                )}

                {picking && (
                  <div className="pl-9">
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-2">{ui.pickNext}</p>
                    <QuestionList grouped={grouped} catLabels={ui.cat} onPick={ask} />
                  </div>
                )}

              </>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-[13px]">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center">
                  <Loader2 size={13} className="animate-spin" />
                </div>
                {ui.thinking}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 flex items-center gap-2 flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={300}
              disabled={ended}
              placeholder={ended ? ui.endedPlaceholder : ui.placeholder}
              className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[13px] bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={loading || ended || !input.trim()}
              aria-label="Send"
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg p-2.5 transition flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Launcher — above the mobile bottom nav on small screens. */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close HR Assistant" : "Open HR Assistant"}
        className="fixed z-[60] right-3 sm:right-6 bottom-20 lg:bottom-6
                   w-14 h-14 rounded-full shadow-lg hover:shadow-xl
                   bg-gradient-to-br from-violet-600 to-purple-700 text-white
                   flex items-center justify-center
                   hover:scale-105 active:scale-95 transition-all"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
};

export default AssistantWidget;
