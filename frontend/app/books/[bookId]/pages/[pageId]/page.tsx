"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import styles from "./runtime.module.css";

type RuntimeCardV1 = {
  id: number; label: string;
  image?: { url: string|null; alt: string|null };
  pos: { row: number; col: number; row_span: number; col_span: number };
  navigate_to?: number|null;
};
type RuntimeCardV0 = {
  id: number; label: string;
  image?: { url: string|null; alt: string|null };
  slot_row: number; slot_col: number; row_span: number; col_span: number;
  target_page_id?: number|null;
};
type RuntimePayload = {
  book_id?: number;
  book?: { id:number; title:string; locale:string; home_page_id?:number }|null;
  page: { id:number; title:string; grid_cols:number; grid_rows:number };
  cards: Array<RuntimeCardV1 | RuntimeCardV0>;
};
type BookRead = { id:number; title:string; locale:string; home_page_id?:number|null };

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

function speak(text: string, locale?: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9; u.pitch = 1; u.volume = 1;
    if (locale) u.lang = locale;
    speechSynthesis.speak(u);
  } catch {}
}

export default function Page({ params }: { params: { bookId: string; pageId: string } }) {
  const router = useRouter();
  const [data, setData] = useState<RuntimePayload | null>(null);
  const [book, setBook] = useState<BookRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    setLoading(true); setErr(null);

    const fetchAll = async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API}/api/runtime/books/${params.bookId}/pages/${params.pageId}`, { cache: "no-store" }),
          fetch(`${API}/api/books/${params.bookId}`, { cache: "no-store" }),
        ]);
        if (!r1.ok) throw new Error(`runtime ${r1.status}`);
        if (!r2.ok) throw new Error(`book ${r2.status}`);
        const runtimeData = await r1.json() as RuntimePayload;
        const bookData = await r2.json() as BookRead;
        if (!ok) return;
        setData(runtimeData);
        setBook(bookData);
        setLoading(false);
      } catch (e:any) {
        if (!ok) return;
        setErr(e?.message || "Errore caricamento");
        setLoading(false);
      }
    };

    fetchAll();
    return () => { ok = false; };
  }, [params.bookId, params.pageId]);

  const homeId = useMemo(() => {
    if (book?.home_page_id) return book.home_page_id;
    if (data?.page?.id) return data.page.id;
    return 1;
  }, [book, data]);

  const normCards: RuntimeCardV1[] = useMemo(() => {
    if (!data) return [];
    return data.cards.map((c: any) => {
      const isV1 = !!c.pos;
      return {
        id: c.id,
        label: c.label,
        image: c.image ?? { url: null, alt: null },
        pos: isV1
          ? c.pos
          : { row: c.slot_row, col: c.slot_col, row_span: c.row_span, col_span: c.col_span },
        navigate_to: isV1 ? (c.navigate_to ?? null) : (c.target_page_id ?? null),
      } as RuntimeCardV1;
    });
  }, [data]);

  if (loading) return <main className={styles?.container || "container"}>Caricamento</main>;
  if (err || !data || !book) return <main className={styles?.container || "container"}>Errore: {err || "dati non disponibili"}</main>;

  const goTo = (targetPageId: number | null | undefined, label: string) => {
    speak(label, book.locale);
    const next = targetPageId ?? data.page.id;
    router.push(`/books/${book.id}/pages/${next}`);
  };

  return (
    <>
      <Navbar
        brand={book.title || "Il mio comunicatore"}
        brandHref={`/books/${book.id}/pages/${homeId}`}
        nav={[
          { label: "Runtime", href: `/books/${book.id}/pages/${homeId}` },
          { label: "Builder", href: `/builder/books/${book.id}/pages/${data.page.id}` },
        ]}
        breadcrumbs={[
          { label: "Home", href: `/books/${book.id}/pages/${homeId}` },
          { label: data.page.title }
        ]}
      />

      <main className={styles?.container || "container"} style={{ paddingTop: 16 }}>
        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${data.page.grid_cols}, minmax(0, 1fr))` }}
        >
          {normCards.map((c) => (
            <button
              key={c.id}
              onClick={() => goTo(c.navigate_to, c.label)}
              className={styles.card}
              style={{
                gridRow: `${c.pos.row} / span ${c.pos.row_span}`,
                gridColumn: `${c.pos.col} / span ${c.pos.col_span}`,
              }}
              aria-label={`Pronuncia: ${c.label}`}
            >
              <div className={styles.mediaWrap}>
                {c.image?.url ? (
                  <img src={`${API}${c.image.url}`} alt={c.image.alt ?? c.label} />
                ) : (
                  <span aria-hidden></span>
                )}
              </div>
              <div className={styles.cardLabel}>
                {c.label} <span aria-hidden></span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
