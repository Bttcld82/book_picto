"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import styles from "./runtime.module.css";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const TOGGLE_KEY = "aac:linkButton:visible"; // localStorage map { cardId: true|false }

type CardRaw = any;
type CardUI = {
  id: number;
  label: string;
  image?: { url: string | null; alt: string | null } | null;
  pos: { row: number; col: number; row_span: number; col_span: number };
  navigate_to: number | null;
  target_page_title?: string | null;
};

function readToggle(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(TOGGLE_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function Page({ params }: { params: { bookId: string; pageId: string } }) {
  const [data, setData] = useState<any>(null);
  const [book, setBook] = useState<any>(null);
  const [pageTitles, setPageTitles] = useState<Record<number, string>>({});
  const [btnMap, setBtnMap] = useState<Record<string, boolean>>({});

  // toggle da localStorage
  useEffect(() => {
    setBtnMap(readToggle());
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOGGLE_KEY) setBtnMap(readToggle());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // carica runtime e book
  useEffect(() => {
    (async () => {
      const [r1, r2] = await Promise.all([
        fetch(`${API}/api/runtime/books/${params.bookId}/pages/${params.pageId}`, { cache: "no-store" }),
        fetch(`${API}/api/books/${params.bookId}`, { cache: "no-store" }),
      ]);
      if (r1.ok) setData(await r1.json());
      if (r2.ok) setBook(await r2.json());
    })();
  }, [params.bookId, params.pageId]);

  // normalizza cards
  const normCards: CardUI[] = useMemo(() => {
    if (!data) return [];
    return (data.cards as CardRaw[]).map((c) => ({
      id: c.id,
      label: c.label,
      image: c.image ?? null,
      pos: c.pos
        ? c.pos
        : { row: c.slot_row, col: c.slot_col, row_span: c.row_span, col_span: c.col_span },
      navigate_to: c.navigate_to ?? c.target_page_id ?? null, // 👈 normalizzazione
      target_page_title: c.target_page_title ?? null,
    }));
  }, [data]);

  // fetch titoli pagine se servono
  useEffect(() => {
    (async () => {
      if (!book) return;
      const need = normCards
        .filter((c) => c.navigate_to && !c.target_page_title)
        .map((c) => c.navigate_to!) as number[];
      if (need.length === 0) return;
      const resp = await fetch(`${API}/api/pages?book_id=${book.id}`, { cache: "no-store" });
      if (!resp.ok) return;
      const pages = await resp.json();
      const m: Record<number, string> = {};
      for (const p of pages) m[p.id] = p.title;
      setPageTitles(m);
    })();
  }, [book, normCards]);

  if (!data || !book) return <main className={styles?.container || "container"}>Caricamento…</main>;

  const speak = (text: string, locale?: string) => {
    try {
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.9;
        if (locale) utter.lang = locale;
        speechSynthesis.speak(utter);
      }
    } catch (e) {
      console.warn("TTS non disponibile", e);
    }
  };

  return (
    <>
      <Navbar
        brand={book.title || "Il mio comunicatore"}
        brandHref={`/books/${params.bookId}/pages/${book.home_page_id ?? data.page.id}`}
        nav={[
          { label: "Runtime", href: `/books/${params.bookId}/pages/${book.home_page_id ?? data.page.id}` },
          { label: "Builder", href: `/builder/books/${params.bookId}/pages/${data.page.id}` },
        ]}
        breadcrumbs={[
          { label: "Home", href: `/books/${params.bookId}/pages/${book.home_page_id ?? data.page.id}` },
          { label: data.page.title },
        ]}
      />

      <main className={styles?.container || "container"} style={{ paddingTop: 16 }}>
        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${data.page.grid_cols}, minmax(0, 1fr))` }}
        >
          {normCards.map((c) => {
            const targetId = c.navigate_to ?? data.page.id;
            const href = `/books/${book.id}/pages/${targetId}`;
            const toggle = btnMap[String(c.id)];
            const showBtn = !!c.navigate_to && (toggle === undefined ? true : !!toggle);
            const btnLabel = c.target_page_title || pageTitles[targetId] || "Apri";

            return (
              <div
                key={c.id}
                className={styles.card}
                onPointerDown={() => speak(c.label, book.locale)}
                style={{
                  gridRow: `${c.pos.row} / span ${c.pos.row_span}`,
                  gridColumn: `${c.pos.col} / span ${c.pos.col_span}`,
                  position: "relative",
                }}
                aria-label={`Pronuncia: ${c.label}`}
              >
                <div className={styles.mediaWrap}>
                  {c.image?.url ? (
                    <img src={`${API}${c.image.url}`} alt={c.image.alt ?? c.label} />
                  ) : (
                    <span aria-hidden>🖼️</span>
                  )}
                </div>

                <div className={styles.cardLabel}>
                  {c.label} <span className={styles.speakerIcon} aria-hidden>🔊</span>
                </div>

                {showBtn && (
                  <a
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    title={`Vai a ${btnLabel}`}
                    style={{
                      position: "absolute",
                      right: 10,
                      bottom: 10,
                      zIndex: 5,
                      padding: "6px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(110,168,254,.35)",
                      background:
                        "linear-gradient(180deg, rgba(110,168,254,.18), rgba(110,168,254,.10))",
                      color: "#fff",
                      textDecoration: "none",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {btnLabel}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
