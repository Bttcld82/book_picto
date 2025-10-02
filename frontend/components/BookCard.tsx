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