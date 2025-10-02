Obiettivo

Rendere la root http://localhost:3000/ una pagina che:

elenca tutti i libri (titolo, locale, home page),

offre azioni rapide: Runtime Home / Builder Home / Gestisci pagine,

permette ricerca e creazione nuovo libro,

mostra uno stato vuoto elegante se non ci sono libri.

Non toccare il backend. Usa gli endpoint già esistenti.

1) API client (se non già fatto)

Estendi/riusa frontend/lib/api.ts:

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function listBooks() {
  const r = await fetch(`${API}/api/books`, { cache: "no-store" });
  if (!r.ok) throw new Error("listBooks failed");
  return r.json();
}
export async function listPages(bookId: number|string) {
  const r = await fetch(`${API}/api/pages?book_id=${bookId}`, { cache: "no-store" });
  if (!r.ok) throw new Error("listPages failed");
  return r.json();
}
export async function createBook(payload: { title:string; locale?:string }) {
  const r = await fetch(`${API}/api/books`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error("createBook failed");
  return r.json();
}

2) Componente riutilizzabile BookCard

File: frontend/components/BookCard.tsx

"use client";
import Link from "next/link";
import React from "react";

export default function BookCard({
  book, pagesCount
}:{
  book: { id:number; title:string; locale:string; home_page_id?:number|null };
  pagesCount?: number;
}) {
  const home = book.home_page_id ?? 1;

  const card: React.CSSProperties = {
    borderRadius: 16, border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.04)", padding: 16,
    boxShadow: "0 6px 16px rgba(0,0,0,.18)", display:"flex",
    flexDirection:"column", gap:12
  };

  const btn: React.CSSProperties = {
    padding:"8px 10px", borderRadius: 10, border:"1px solid rgba(255,255,255,.12)",
    background:"rgba(255,255,255,.06)", color:"inherit", textDecoration:"none",
    textAlign:"center", fontWeight:600
  };

  const btnPrimary: React.CSSProperties = {
    ...btn, background:"linear-gradient(180deg, rgba(110,168,254,.18), rgba(110,168,254,.10))",
    border:"1px solid rgba(110,168,254,.35)", color:"#fff"
  };

  return (
    <div style={card} role="group" aria-label={`Libro ${book.title}`}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:18,fontWeight:800}}>{book.title}</div>
          <div style={{opacity:.75,fontSize:13}}>Locale: {book.locale}{pagesCount!=null && ` • ${pagesCount} pagine`}</div>
        </div>
        <Link href={`/books/${book.id}`} style={{fontSize:13,opacity:.8}}>Gestisci pagine →</Link>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
        <Link style={btnPrimary} href={`/books/${book.id}/pages/${home}`}>Apri Runtime</Link>
        <Link style={btn} href={`/builder/books/${book.id}/pages/${home}`}>Apri Builder</Link>
        <Link style={btn} href={`/books/${book.id}`}>Dettagli</Link>
      </div>
    </div>
  );
}

3) Nuova Home (/) con lista, ricerca e “Nuovo libro”

File: frontend/app/page.tsx (client component)

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
              ? <>Nessun libro presente. Crea il primo con “<strong>+ Nuovo libro</strong>”.</>
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

4) Navbar: aggiungi una voce “Libri” dove serve

In components/Navbar.tsx, puoi sostituire i “link di cortesia” con:

nav={[
  { label: "Home", href: "/", exact: true },
  { label: "Libri", href: "/books" },
  { label: "Runtime", href: `/books/${book?.id ?? 1}/pages/${homeId ?? 1}` },
  { label: "Builder", href: `/builder/books/${book?.id ?? 1}/pages/${homeId ?? 1}` },
]}


Nelle pagine runtime/builder, lascia “Home” che porta alla /.

5) Criteri di accettazione

 Visitando / vedo elenco dei libri con titolo, locale, # pagine.

 Ogni card offre Runtime Home, Builder Home, Dettagli.

 Posso cercare per titolo/locale.

 Posso creare un nuovo libro via + Nuovo libro (prompt) o via pagina /books/new.

 Se non ci sono libri, vedo uno stato vuoto chiaro con call-to-action.

 La navbar ha “Home” attiva su /.

6) Commit suggeriti
git checkout -b feature/home-books-hub
git add frontend/app/page.tsx \
        frontend/components/BookCard.tsx \
        frontend/lib/api.ts
git commit -m "feat(ui): homepage as books hub (list/search/quick actions + create)"
git push -u origin feature/home-books-hub