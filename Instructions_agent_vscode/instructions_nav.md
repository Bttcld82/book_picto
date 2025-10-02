Obiettivo

Aggiungere una barra di navigazione fissa in alto, responsiva, accessibile (ARIA), con:

Brand (titolo libro) → link Home.

Breadcrumb per la pagina corrente.

Azioni (es. Export ZIP nel Builder).

Stato attivo sulla voce corrente.

Vincoli: niente nuove dipendenze. CSS semplice (module + globals). Compatibile con App Router.

1) Crea gli stili globali (se non già presenti)

File: frontend/app/globals.css (aggiungi al fondo, senza rimuovere quanto esiste)

:root{
  --nav-h: 64px;
  --nav-bg: #0f1115cc;      /* semi-transparent */
  --nav-border: #1f2430;
  --nav-text: #e8e9ec;
  --nav-muted: #a7adbb;
  --nav-accent: #6ea8fe;
  --radius: 12px;
}

/* layout safe-area for fixed navbar */
body.has-fixed-nav {
  padding-top: var(--nav-h);
}

/* utility */
.container {
  max-width: 1200px; margin: 0 auto; padding: 0 16px;
}


Assicurati che globals.css sia importato in app/layout.tsx.

2) Crea il componente Navbar

File: frontend/components/Navbar.tsx

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export type NavItem = { label: string; href: string; exact?: boolean };
export type BreadcrumbItem = { label: string; href?: string };

export default function Navbar({
  brand, brandHref = "/", nav = [], breadcrumbs = [], right = null
}:{
  brand: string;
  brandHref?: string;
  nav?: NavItem[];
  breadcrumbs?: BreadcrumbItem[];
  right?: React.ReactNode;          // pulsanti azione (es. Export ZIP)
}) {
  const pathname = usePathname();
  return (
    <header role="banner" style={{
      position: "fixed", top: 0, insetInline: 0, height: "var(--nav-h)",
      backdropFilter: "saturate(180%) blur(10px)",
      background: "var(--nav-bg)", borderBottom: "1px solid var(--nav-border)", zIndex: 50
    }}>
      <div className="container" style={{
        display:"flex", alignItems:"center", height:"100%", gap: 16
      }}>
        {/* Brand */}
        <Link href={brandHref} aria-label="Home" style={{
          textDecoration:"none", color:"var(--nav-text)", fontWeight:700, fontSize:18
        }}>{brand}</Link>

        {/* Nav items */}
        <nav aria-label="Sezioni" style={{display:"flex", gap:12, marginLeft:12}}>
          {nav.map((it) => {
            const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href} href={it.href}
                aria-current={active ? "page" : undefined}
                style={{
                  color: active ? "var(--nav-accent)" : "var(--nav-muted)",
                  textDecoration:"none", fontWeight:600, padding:"6px 8px",
                  borderRadius: 8, border: active ? "1px solid #2b3446" : "1px solid transparent",
                  background: active ? "rgba(110,168,254,.08)" : "transparent"
                }}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div aria-label="Percorso" style={{
            marginLeft:12, display:"flex", gap:8, alignItems:"center", color:"var(--nav-muted)", fontSize:14
          }}>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i>0 && <span aria-hidden>›</span>}
                {b.href ? <Link href={b.href} style={{color:"var(--nav-accent)", textDecoration:"none"}}>{b.label}</Link>
                        : <span>{b.label}</span>}
              </React.Fragment>
            ))}
          </div>
        )}

        <div style={{marginLeft:"auto", display:"flex", gap:8, alignItems:"center"}}>
          {right}
        </div>
      </div>
    </header>
  );
}

3) Imposta body.has-fixed-nav nel layout

File: frontend/app/layout.tsx (aggiorna)

import "./globals.css";

export const metadata = { title: "AAC Builder", description: "Runtime e Builder AAC" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="has-fixed-nav">{children}</body>
    </html>
  );
}

4) Integra la Navbar nel Runtime

File: frontend/app/books/[bookId]/pages/[pageId]/page.tsx
Azione: importa Navbar e passagli brand/breadcrumbs. Aggiungi div.container al contenuto.

import Navbar from "@/components/Navbar";
import styles from "./runtime.module.css"; // se usi il CSS del runtime

// ...funzioni getRuntime/getBook già esistenti...

export default async function Page({ params }:{ params:{bookId:string; pageId:string} }) {
  const [data, book] = await Promise.all([getRuntime(params.bookId, params.pageId), getBook(params.bookId)]);
  const homeId = book.home_page_id ?? data.page.id;

  return (
    <>
      <Navbar
        brand={book.title || "Il mio comunicatore"}
        brandHref={`/books/${params.bookId}/pages/${homeId}`}
        nav={[
          { label: "Runtime", href: `/books/${params.bookId}/pages/${homeId}`, exact: false },
          { label: "Builder", href: `/builder/books/${params.bookId}/pages/${data.page.id}`, exact: false },
        ]}
        breadcrumbs={[
          { label: "Home", href: `/books/${params.bookId}/pages/${homeId}` },
          { label: data.page.title }
        ]}
      />

      <main className={styles?.container || "container"} style={{ paddingTop: 16 }}>
        {/* ...griglia runtime esistente... */}
      </main>
    </>
  );
}

5) Integra la Navbar nel Builder

File: frontend/app/builder/books/[bookId]/pages/[pageId]/page.tsx
Azione: importa Navbar e fornisci pulsanti Export ZIP / Set Home nella prop right.

import Navbar from "@/components/Navbar";
// ...resto import già presenti...

export default function BuilderPage({ params }:{ params:{bookId:string; pageId:string} }) {
  // ...state/effects/handlers esistenti...

  // pulsanti da mostrare a destra nella navbar
  const RightButtons = data ? (
    <>
      <button onClick={setHome} style={btn()}>
        Imposta Home
      </button>
      <button onClick={doExport} style={btn("primary")}>
        Export ZIP
      </button>
    </>
  ) : null;

  return (
    <>
      <Navbar
        brand={data?.page.title ? `${data.page.title}` : "Builder"}
        brandHref={`/books/${params.bookId}/pages/${data?.page.id || params.pageId}`}
        nav={[
          { label: "Runtime", href: `/books/${params.bookId}/pages/${data?.page.id || params.pageId}` },
          { label: "Builder", href: `/builder/books/${params.bookId}/pages/${data?.page.id || params.pageId}` },
        ]}
        breadcrumbs={[
          { label: "Libro " + params.bookId, href: `/books/${params.bookId}/pages/${data?.page.id || params.pageId}` },
          { label: data?.page.title || "Pagina" }
        ]}
        right={RightButtons}
      />

      <main style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:16, height:"calc(100vh - var(--nav-h))", padding:16 }}>
        {/* ...builder esistente (griglia a sinistra + pannello proprietà a destra)... */}
      </main>
    </>
  );
}

// piccolo helper per i bottoni navbar
function btn(variant?: "primary"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "6px 10px", borderRadius: 8, border: "1px solid #2b3446",
    background: "rgba(255,255,255,.06)", color: "var(--nav-text)", cursor: "pointer"
  };
  if (variant === "primary") {
    base.background = "linear-gradient(180deg, rgba(110,168,254,.15), rgba(110,168,254,.10))";
    base.border = "1px solid rgba(110,168,254,.35)";
    base.color = "white";
  }
  return base;
}


Nota: abbiamo ridotto l’altezza del main con height: calc(100vh - var(--nav-h)) per non farlo finire sotto la navbar fissa.

6) Criteri di accettazione

 Navbar fissa in alto, visibile su tutte le pagine runtime e builder.

 Il corpo della pagina non va sotto la navbar (padding top corretto).

 Brand cliccabile → porta alla Home del libro.

 Breadcrumb mostra “Home › Nome Pagina” (runtime) e “Libro X › Pagina” (builder).

 Tab/keyboard navigation: focus visibile sugli elementi della navbar, aria-current="page" per la voce attiva.

 In Builder compaiono i pulsanti Imposta Home e Export ZIP a destra.

 Mobile (≤ 640px): la navbar non “rompe” il layout (scroll orizzontale assente).

7) Test rapido
# se usi Docker
docker compose -f compose.yaml up --build
# popolamento dati se non già fatto
docker compose -f compose.yaml exec backend python -m app.seed


Runtime: http://localhost:3000/books/1/pages/1 → navbar con Home/Breadcrumb/Nav.

Builder: http://localhost:3000/builder/books/1/pages/1 → navbar con pulsanti azione.

8) Commit suggerito
git checkout -b feature/navbar
git add frontend/components/Navbar.tsx frontend/app/globals.css \
        frontend/app/layout.tsx \
        frontend/app/books/[bookId]/pages/[pageId]/page.tsx \
        frontend/app/builder/books/[bookId]/pages/[pageId]/page.tsx
git commit -m "feat(ui): fixed top Navbar with brand, breadcrumbs, nav, and builder actions"
git push -u origin feature/navbar