Backend (già pronto, nessuna modifica)

Set Home Page libro: PATCH /api/books/{book_id} { "home_page_id": <pageId> }

Link card → pagina: PATCH /api/cards/{card_id} { "target_page_id": <pageId|null> }

Runtime usa navigate_to/target_page_id.

A) Vista “Pagine del Libro”: bottone Imposta come Home

File: frontend/app/books/[bookId]/page.tsx
(Aggiungi funzioni API se mancano in lib/api.ts → updateBook.)

Handler

import { updateBook } from "@/lib/api";

async function setAsHome(bookId: number, pageId: number) {
  try {
    await updateBook(bookId, { home_page_id: pageId });
    alert("Home Page impostata.");
    // opzionale: aggiorna stato locale se lo mantieni in pagina
    // setBook(b => ({...b, home_page_id: pageId}));
  } catch (e:any) {
    alert(e?.message || "Errore nel settaggio Home Page");
  }
}


Pulsante in tabella (per ogni riga)
Nella riga pagina, accanto a “Runtime/Builder/Modifica/Elimina” aggiungi:

<button
  onClick={() => setAsHome(Number(params.bookId), p.id)}
  title="Imposta come Home Page di questo libro"
  style={{
    padding:"8px 10px", borderRadius:10,
    border:"1px solid rgba(110,168,254,.35)",
    background:"linear-gradient(180deg, rgba(110,168,254,.18), rgba(110,168,254,.10))",
    color:"#fff", fontWeight:600, cursor:"pointer", marginRight:8
  }}
>
  Imposta Home
</button>


Indicatore home
Evidenzia la riga che è Home:

const isHome = book?.home_page_id === p.id;
// in <tr> o cella:
style={{ background: isHome ? "rgba(110,168,254,.08)" : "transparent" }}
// oppure aggiungi un badge:
{isHome && <span style={{marginLeft:8, fontSize:12, opacity:.8}}>🏠 Home</span>}


Criteri di accettazione

Click su Imposta Home → PATCH /api/books/{id} 200.

La riga selezionata mostra “🏠 Home”.

La Navbar del runtime/builder usa subito la nuova Home (se recuperi book a ogni render già avviene).

B) Builder: “Link a pagina” per ogni Card + bottone in-card

File: frontend/app/builder/books/[bookId]/pages/[pageId]/page.tsx
(Assumo esistano listPages, patchCard in lib/api.ts.)

1) UI nel pannello “Proprietà Card”

Nel pannello a destra (quando selected non è null), aggiungi una select con le pagine del libro:

const [pages, setPages] = useState<{id:number; title:string}[]>([]);

useEffect(() => {
  (async () => {
    const arr = await listPages(params.bookId);
    setPages(arr);
  })();
}, [params.bookId]);

async function onTargetChange(pageId: number | null) {
  if (!selected) return;
  // update ottimistico
  setData(d => d ? ({ ...d, cards: d.cards.map(c =>
    c.id === selected.id ? { ...c, navigate_to: pageId } : c
  ) }) : d);
  await patchCard(selected.id, { target_page_id: pageId });
}


Render nel pannello:

<label style={{display:"block", fontWeight:600, marginTop:12}}>Link a pagina</label>
<select
  value={selected?.navigate_to ?? ""}
  onChange={(e) => onTargetChange(e.target.value ? Number(e.target.value) : null)}
  disabled={!selected}
  style={{width:"100%", padding:"8px", borderRadius:8}}
>
  <option value="">— Nessun link —</option>
  {pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
</select>

2) Bottone in-card (Builder) per aprire la pagina linkata

Nel componente DraggableCard (la card che mostri nella griglia), aggiungi un piccolo pulsante in overlay solo se navigate_to è impostato.
Passa navigate_to come prop:

<DraggableCard
  ...
  navigateTo={c.navigate_to ?? undefined}
/>


Aggiorna la firma del componente:

function DraggableCard({
  id, label, imageUrl, selected, onSelect, gridPos, onUploadFile, navigateTo
}:{
  id:number; label:string; imageUrl?:string; selected?:boolean;
  onSelect: () => void; gridPos:any; onUploadFile?: (f:File)=>Promise<void>;
  navigateTo?: number;
}) { ... }


Dentro la card, aggiungi il bottone in alto a destra:

{navigateTo && (
  <a
    href={`/builder/books/${params.bookId}/pages/${navigateTo}`}
    onClick={(e) => e.stopPropagation()}
    title="Apri pagina linkata"
    style={{
      position:"absolute", top:8, right:8,
      padding:"4px 8px", borderRadius:8, fontSize:12,
      border:"1px solid rgba(110,168,254,.35)",
      background:"linear-gradient(180deg, rgba(110,168,254,.18), rgba(110,168,254,.10))",
      color:"#fff", textDecoration:"none"
    }}
  >
    ↗
  </a>
)}


In Runtime, il link è già effettivo cliccando la card. Questo bottone serve al Builder per una navigazione rapida tra pagine linkate.

3) (Se necessario) Normalizzazione stato

Se nel tuo stato card usi pos (v5), mantiene navigate_to nel modello. Se usi target_page_id, normalizza in load.

Criteri di accettazione

Nel pannello, scegli una pagina → PATCH /api/cards/{id} con target_page_id 200.

La card in builder mostra l’icona ↗ quando c’è un link; il click apre la pagina target senza rompere la selezione della card corrente (usiamo e.stopPropagation()).

Nel Runtime, clic sulla card pronuncia e naviga alla pagina settata.

C) Navbar: pulsante “Imposta Home” (opzionale)

Se vuoi anche nel Builder (in alto a destra) un’azione per impostare come Home la pagina aperta, nella Navbar del Builder aggiungi:

const RightButtons = data ? (
  <>
    <button onClick={() => updateBook(Number(params.bookId), { home_page_id: data.page.id })} style={btn()}>
      Imposta Home
    </button>
    <button onClick={doExport} style={btn("primary")}>Export ZIP</button>
  </>
) : null;

Test rapido

Vai su http://localhost:3000/books/1: prova Imposta Home su varie pagine → controlla che il badge “🏠” cambi.

Apri http://localhost:3000/builder/books/1/pages/1: nel pannello seleziona una card e imposta Link a pagina → verifica comparsa dell’icona ↗; click sull’icona ti porta alla pagina target.

In Runtime, clic sulla stessa card → pronuncia + navigazione verso la pagina scelta.