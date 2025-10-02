Contesto

Next.js (App Router) – frontend.

API già esistenti:
GET /api/pages?book_id=:id → elenco pagine del libro
PATCH /api/cards/:id { target_page_id?: number|null } → set link interno

Nel runtime/builder alcune card usano navigate_to, altre target_page_id. Normalizziamo.

0) Tipi e normalizzazione (importante)

Nel file del builder frontend/app/builder/books/[bookId]/pages/[pageId]/page.tsx:

0.1 Aggiungi tipi e funzione di normalizzazione
type CardRaw = {
  id: number;
  label: string;
  image?: { url: string|null; alt: string|null } | null;
  // shape v4
  slot_row?: number; slot_col?: number; row_span?: number; col_span?: number; target_page_id?: number|null;
  // shape v5
  pos?: { row:number; col:number; row_span:number; col_span:number };
  navigate_to?: number|null;
};

type CardUI = {
  id: number;
  label: string;
  image?: { url: string|null; alt: string|null } | null;
  pos: { row:number; col:number; row_span:number; col_span:number };
  navigate_to: number|null;
  image_id?: number|null;
};

function normalizeCard(c: CardRaw): CardUI {
  const pos = c.pos
    ? c.pos
    : { row: c.slot_row ?? 1, col: c.slot_col ?? 1, row_span: c.row_span ?? 1, col_span: c.col_span ?? 1 };
  return {
    id: c.id,
    label: c.label,
    image: c.image ?? null,
    pos,
    navigate_to: (c.navigate_to ?? c.target_page_id ?? null),
    image_id: undefined,
  };
}

0.2 Normalizza subito quando carichi i dati

Dove fai setData(...) dopo il fetch, avvolgi le card:

// Esempio di shape di stato
type PageState = {
  book_id: number;
  page: { id:number; title:string; grid_cols:number; grid_rows:number };
  cards: CardUI[];
};

const [data, setData] = useState<PageState|null>(null);

// dopo fetch:
const normalized: PageState = {
  book_id: raw.book_id,
  page: raw.page,
  cards: raw.cards.map(normalizeCard),
};
setData(normalized);

1) Stili del pannello (CSS Module)

Crea frontend/app/builder/books/[bookId]/pages/[pageId]/panel.module.css

.panel {
  background: rgba(255,255,255,0.03);
  border-left: 1px solid rgba(255,255,255,0.08);
  height: calc(100vh - var(--nav-h, 64px));
  padding: 16px 16px 24px;
  overflow: auto;
}
.title {
  font-size: 22px; font-weight: 800; letter-spacing: .2px; margin: 4px 0 16px;
}
.form { display: grid; grid-template-columns: 1fr; gap: 12px; }
.group { display: grid; gap: 6px; }
.label { font-size: 13px; font-weight: 700; color: #cbd5e1; }
.input, .select {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px; padding: 10px 12px; color: #e5e7eb; outline: none;
  transition: box-shadow .15s ease, border-color .15s ease, background .15s;
}
.input:focus, .select:focus {
  border-color: rgba(110,168,254,0.45); box-shadow: 0 0 0 3px rgba(110,168,254,0.25);
}
.inline { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
.help { font-size: 12px; color: #9aa4b2; }
.actions { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.btn {
  padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06); color: #e5e7eb; font-weight: 700; cursor: pointer;
  transition: transform .06s, box-shadow .15s, background .15s, border-color .15s;
}
.btn:hover { transform: translateY(-1px); }
.primary {
  border-color: rgba(110,168,254,0.35);
  background: linear-gradient(180deg, rgba(110,168,254,0.18), rgba(110,168,254,0.10)); color: #fff;
}
.danger {
  border-color: rgba(244,63,94,0.35);
  background: linear-gradient(180deg, rgba(244,63,94,0.18), rgba(244,63,94,0.10));
}
.badge {
  display:inline-block; padding:4px 8px; border-radius:999px;
  border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.06);
  font-size:12px; color:#cbd5e1;
}

2) Caricamento elenco pagine del libro (per “Link Pagina”)

Nel builder page.tsx:

import panel from "./panel.module.css";
import { listPages, patchCard } from "@/lib/api"; // assicurati esistano

const [pages, setPages] = useState<{id:number; title:string}[]>([]);

useEffect(() => {
  let ok = true;
  (async () => {
    try {
      const arr = await listPages(params.bookId);
      if (!ok) return;
      setPages(arr.map((p:any) => ({ id: p.id, title: p.title })));
    } catch (e) {
      console.error("listPages failed", e);
    }
  })();
  return () => { ok = false; };
}, [params.bookId]);

3) Fix menu “Link Pagina” (parsing, stato, PATCH)
3.1 Handler robusto
async function onTargetChange(value: string) {
  if (!selected) return;
  // "" => null, altrimenti numero
  const pageId = value === "" ? null : Number(value);
  // update ottimistico nello stato locale
  setData(d => d ? ({
    ...d,
    cards: d.cards.map(c => c.id === selected.id ? { ...c, navigate_to: pageId } : c)
  }) : d);
  // PATCH corretta al backend (campo atteso: target_page_id)
  try {
    await patchCard(selected.id, { target_page_id: pageId });
  } catch (e) {
    console.error("patchCard target_page_id failed", e);
    alert("Errore salvataggio link pagina");
  }
}

3.2 Select controllata (valori sempre string)
<label className={panel.label} htmlFor="link">Link Pagina</label>
<select
  id="link"
  className={panel.select}
  value={selected?.navigate_to != null ? String(selected.navigate_to) : ""}   // "" per nessun link
  onChange={(e) => onTargetChange(e.target.value)}
  disabled={!selected}
>
  <option value="">— Nessun link —</option>
  {pages.map(p => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
</select>
<div className={panel.help}>Scegli una pagina del libro da aprire quando si preme la card.</div>


Perché prima non funzionava spesso:

mismatch tipo (select value string vs navigate_to number);

PATCH al campo sbagliato (navigate_to invece di target_page_id);

elenco pagine non caricato (endpoint o state non inizializzato).

4) Restyle completo pannello (markup)

Sostituisci il blocco pannello con:

<aside className={panel.panel} aria-label="Proprietà Card">
  <div className={panel.title}>Proprietà Card</div>

  {!selected && (
    <div className={panel.help}>
      Seleziona una card nella griglia a sinistra per modificarne le proprietà.
    </div>
  )}

  {selected && (
    <form className={panel.form} onSubmit={(e) => e.preventDefault()}>
      {/* Etichetta */}
      <div className={panel.group}>
        <label className={panel.label} htmlFor="label">Etichetta</label>
        <input
          id="label"
          className={panel.input}
          value={selected.label ?? ""}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Inserisci un titolo breve"
        />
        <div className={panel.help}>Testo mostrato sotto l'immagine e pronunciato nel runtime.</div>
      </div>

      {/* Link Pagina */}
      <div className={panel.group}>
        <label className={panel.label} htmlFor="link">Link Pagina</label>
        <select
          id="link"
          className={panel.select}
          value={selected.navigate_to != null ? String(selected.navigate_to) : ""}
          onChange={(e) => onTargetChange(e.target.value)}
        >
          <option value="">— Nessun link —</option>
          {pages.map(p => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
        </select>
        <div className={panel.help}>Se impostato, la card aprirà la pagina scelta.</div>
      </div>

      {/* Span */}
      <div className={`${panel.group} ${panel.inline}`}>
        <div>
          <label className={panel.label} htmlFor="rowspan">Row Span</label>
          <input id="rowspan" className={panel.input}
                 value={selected.pos.row_span}
                 onChange={(e) => updateSpan('row', Number(e.target.value) || 1)} />
        </div>
        <div>
          <label className={panel.label} htmlFor="colspan">Col Span</label>
          <input id="colspan" className={panel.input}
                 value={selected.pos.col_span}
                 onChange={(e) => updateSpan('col', Number(e.target.value) || 1)} />
        </div>
      </div>

      {/* Azioni */}
      <div className={panel.actions}>
        <button type="button" className={`${panel.btn} ${panel.danger}`} onClick={removeCard}>
          Elimina Card
        </button>
      </div>
    </form>
  )}
</aside>


(Assumo che onLabelChange, updateSpan, removeCard esistano; se no, riutilizza quelli che avevamo già impostato.)

5) In-card jump (opzionale ma utile nel Builder)

Mostra una piccola icona ↗ nelle card che hanno navigate_to:

// Quando renderizzi ogni DraggableCard:
<DraggableCard
  ...
  navigateTo={c.navigate_to}
/>

// Dentro DraggableCard (overlay in alto a destra):
{navigateTo && (
  <a
    href={`/builder/books/${params.bookId}/pages/${navigateTo}`}
    onClick={(e) => e.stopPropagation()}
    title="Apri pagina linkata"
    style={{
      position:"absolute", top:8, right:8, fontSize:12,
      padding:"4px 8px", borderRadius:8,
      border:"1px solid rgba(110,168,254,0.35)",
      background:"linear-gradient(180deg, rgba(110,168,254,0.18), rgba(110,168,254,0.10))",
      color:"#fff", textDecoration:"none"
    }}
  >↗</a>
)}

6) API client (se mancano le funzioni)

frontend/lib/api.ts

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function listPages(bookId: number|string) {
  const r = await fetch(`${API}/api/pages?book_id=${bookId}`, { cache: "no-store" });
  if (!r.ok) throw new Error("listPages failed");
  return r.json();
}

export async function patchCard(cardId: number, patch: any) {
  const r = await fetch(`${API}/api/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error("patchCard failed");
  return r.json();
}

7) Verifica rapida

Ricarica http://localhost:3000/builder/books/1/pages/1.

Seleziona una card → nel menu “Link Pagina” scegli una pagina:

Network: vedi PATCH /api/cards/:id con body {"target_page_id":<ID>} e 200 OK.

Stato locale: la card mostra l’icona ↗ (se hai attivato l’overlay).

Vai in Runtime della stessa pagina e clicca la card: pronuncia + naviga alla pagina scelta.

Cambia di nuovo il link ⇒ select aggiorna (valore string ↔ number gestito) e PATCH 200.

8) Commit suggerito
git checkout -b fix/panel-style-link-target
git add frontend/app/builder/books/[bookId]/pages/[pageId]/panel.module.css \
        frontend/app/builder/books/[bookId]/pages/[pageId]/page.tsx \
        frontend/lib/api.ts
git commit -m "style(builder): modern panel UI + fix Link Pagina (normalize navigate_to/target_page_id, robust select & PATCH)"
git push -u origin fix/panel-style-link-target