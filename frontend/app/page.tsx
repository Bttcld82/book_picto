"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import BookCard from "@/components/BookCard";
import { listBooks, listPages, createBook } from "@/lib/api";

type Book = { id:number; title:string; locale:string; home_page_id?:number|null };

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const items = await listBooks();
        if (!ok) return;
        setBooks(items);
        // opzionale: carica numero pagine per card
        const entries = await Promise.all(items.map(async (b:Book) => [b.id, (await listPages(b.id)).length] as const));
        if (!ok) return;
        setCounts(Object.fromEntries(entries));
      } catch(e:any) { if (ok) setErr(e.message || "Errore caricamento"); }
    })();
    return () => { ok = false; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return books;
    return books.filter(b => b.title.toLowerCase().includes(s) || (b.locale||"").toLowerCase().includes(s));
  }, [books, q]);

  async function onCreateQuick() {
    const title = prompt("Titolo del nuovo libro?");
    if (!title) return;
    try {
      setCreating(true);
      const b = await createBook({ title, locale: "it-IT" });
      setBooks(prev => [...prev, b]);
    } catch(e:any) { alert(e.message || "Errore creazione libro"); }
    finally { setCreating(false); }
  }

  return (
    <>
      <Navbar
        brand="AAC Builder"
        brandHref="/"
        nav={[
          { label: "Home", href: "/", exact: true },
          { label: "Runtime", href: "/books/1/pages/1" },   // link di cortesia
          { label: "Builder", href: "/builder/books/1/pages/1" },
        ]}
        breadcrumbs={[]}
        right={
          <button onClick={onCreateQuick} disabled={creating} style={{
            padding:"6px 10px", borderRadius:10, border:"1px solid rgba(110,168,254,.35)",
            background:"linear-gradient(180deg, rgba(110,168,254,.18), rgba(110,168,254,.10))",
            color:"#fff", cursor:"pointer"
          }}>
            + Nuovo libro
          </button>
        }
      />

      <main className="container" style={{paddingTop:16}}>
        {/* Ricerca */}
        <div style={{display:"flex",gap:12,alignItems:"center",margin:"10px 0 16px"}}>
          <input
            value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Cerca per titolo o locale…"
            style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.12)", background:"rgba(255,255,255,.06)", color:"inherit"}}
            aria-label="Cerca libro"
          />
          <Link href="/books/new" style={{
            padding:"10px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.12)",
            background:"rgba(255,255,255,.06)",textDecoration:"none",color:"inherit",fontWeight:600
          }}>Dettagli creazione…</Link>
        </div>

        {/* Stato vuoto */}
        {filtered.length === 0 && (
          <div style={{opacity:.85, padding:24, border:"1px dashed rgba(255,255,255,.2)", borderRadius:12}}>
            {books.length === 0
              ? <>Nessun libro presente. Crea il primo con "<strong>+ Nuovo libro</strong>".</>
              : <>Nessun risultato per <strong>{q}</strong>.</>}
          </div>
        )}

        {/* Griglia libri */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:16}}>
          {filtered.map(b => (
            <BookCard key={b.id} book={b} pagesCount={counts[b.id]} />
          ))}
        </div>
      </main>
    </>
  );
}