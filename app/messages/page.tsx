"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Message = { id: string; gig_id: string; sender_id: string; recipient_id: string; body: string; created_at: string };
type Gig = { id: string; title: string; event_date: string; location: string; client_id: string };
type DJ = { user_id: string; dj_name: string };
type Thread = { key: string; gig: Gig; partnerId: string; partnerName: string; messages: Message[] };

export default function MessagesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [djs, setDjs] = useState<DJ[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.push("/auth"); return; }
    setUserId(auth.user.id);
    const { data: msgs, error } = await supabase.from("gig_messages").select("id, gig_id, sender_id, recipient_id, body, created_at").or(`sender_id.eq.${auth.user.id},recipient_id.eq.${auth.user.id}`).order("created_at");
    if (error) { setNotice(error.message); return; }
    const messageRows = (msgs || []) as Message[];
    setMessages(messageRows);
    const gigIds = Array.from(new Set(messageRows.map((m) => m.gig_id)));
    const { data: gigRows } = gigIds.length ? await supabase.from("gigs").select("id, title, event_date, location, client_id").in("id", gigIds) : { data: [] };
    setGigs((gigRows || []) as Gig[]);
    const partnerIds = Array.from(new Set(messageRows.map((m) => m.sender_id === auth.user!.id ? m.recipient_id : m.sender_id)));
    const { data: djRows } = partnerIds.length ? await supabase.from("dj_profiles").select("user_id, dj_name").in("user_id", partnerIds) : { data: [] };
    setDjs((djRows || []) as DJ[]);
  }

  useEffect(() => { void load(); }, []);

  const threads = useMemo<Thread[]>(() => {
    const gigMap = new Map(gigs.map((g) => [g.id, g]));
    const djMap = new Map(djs.map((d) => [d.user_id, d.dj_name]));
    const grouped = new Map<string, Thread>();
    for (const msg of messages) {
      const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      const gig = gigMap.get(msg.gig_id);
      if (!gig) continue;
      const key = `${msg.gig_id}:${partnerId}`;
      const partnerName = partnerId === gig.client_id ? "Client" : (djMap.get(partnerId) || "DJ");
      const existing = grouped.get(key);
      if (existing) existing.messages.push(msg);
      else grouped.set(key, { key, gig, partnerId, partnerName, messages: [msg] });
    }
    return Array.from(grouped.values()).sort((a, b) => a.messages[a.messages.length - 1].created_at.localeCompare(b.messages[b.messages.length - 1].created_at));
  }, [messages, gigs, djs, userId]);

  useEffect(() => { if (!selectedKey && threads[0]) setSelectedKey(threads[0].key); }, [threads, selectedKey]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const thread = threads.find((t) => t.key === selectedKey);
    if (!thread || !draft.trim()) return;
    setSending(true); setNotice("");
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("gig_messages").insert({ gig_id: thread.gig.id, sender_id: userId, recipient_id: thread.partnerId, body: draft.trim() });
    if (error) setNotice(error.message); else { setDraft(""); await load(); }
    setSending(false);
  }

  const selected = threads.find((t) => t.key === selectedKey);
  return <main className="dashboard-page">
    <header className="topbar"><Link href="/dashboard" className="brand">HOVERBOARD</Link><div className="topbar-actions"><Link href="/requests" className="button">Requests</Link><Link href="/dashboard" className="button">Dashboard</Link></div></header>
    <section className="dashboard-content">
      <div className="hero-small"><p className="eyebrow">MESSAGES</p><h1>Talk it out.</h1><p>Keep gig conversations in HOVERBOARD.</p></div>
      {notice && <div className="notice">{notice}</div>}
      <section className="messages-layout">
        <div className="card message-list">{threads.length ? threads.map((thread) => <button key={thread.key} className={`message-thread-button ${selectedKey === thread.key ? "active" : ""}`} onClick={() => setSelectedKey(thread.key)}><strong>{thread.partnerName}</strong><span>{thread.gig.title}</span><small>{thread.messages[thread.messages.length - 1].body}</small></button>) : <p className="muted">No conversations yet. Send or receive a gig request to start one.</p>}</div>
        <div className="card message-panel">{selected ? <><div className="message-panel-header"><div><p className="eyebrow">{selected.gig.title}</p><h2>{selected.partnerName}</h2><p className="muted">{selected.gig.event_date} · {selected.gig.location}</p></div><Link className="button" href={`/gigs/${selected.gig.id}`}>Open gig</Link></div><div className="message-history">{selected.messages.map((msg) => <div key={msg.id} className={`message-bubble ${msg.sender_id === userId ? "mine" : "theirs"}`}><p>{msg.body}</p><small>{new Date(msg.created_at).toLocaleString()}</small></div>)}</div><form className="message-composer" onSubmit={sendMessage}><textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" maxLength={2000} /><button className="primary" disabled={sending || !draft.trim()}>{sending ? "Sending…" : "Send message"}</button></form></> : <div className="message-empty"><h2>Select a conversation</h2><p className="muted">Your gig conversations will appear here.</p></div>}</div>
      </section>
    </section>
  </main>;
}
