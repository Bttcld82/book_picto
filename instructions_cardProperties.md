Obiettivo

Clic su una card ⇒ seleziona la card (pannello a destra attivo).

I controlli Etichetta, Link pagina, Row/Col Span, Upload immagine, Elimina tornano modificabili.

Drag è possibile solo dall’handle superiore (niente conflitti con overlay di upload).

File

frontend/app/builder/books/[bookId]/pages/[pageId]/page.tsx

Passo 1 — Stato selezione robusto

Sostituisci l’attuale stato selected (se oggetto) con id:

const [selectedId, setSelectedId] = useState<number | null>(null);
const selected = useMemo(
  () => data?.cards.find(c => c.id === selectedId) ?? null,
  [data, selectedId]
);


Quando ricarichi/filtri la pagina, se la card selezionata non esiste più, azzera:

useEffect(() => {
  if (selectedId && !data?.cards.some(c => c.id === selectedId)) {
    setSelectedId(null);
  }
}, [data, selectedId]);

Passo 2 — DraggableCard con handle + selezione affidabile

Sostituisci il componente DraggableCard con questa versione (metti in coda al file, come già fai):

import { useDraggable } from "@dnd-kit/core";
import { useRef } from "react";

function DraggableCard({
  id, label, imageUrl, selected, onSelect, gridPos, onUploadFile
}:{
  id:number; label:string; imageUrl?:string; selected?:boolean;
  onSelect: () => void; gridPos:any; onUploadFile?: (f:File)=>Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const fileRef = useRef<HTMLInputElement|null>(null);

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    borderRadius: 12,
    border: selected ? "2px solid #4f46e5" : "1px solid #ddd",
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
    background: "#fff",
    display: "flex", flexDirection: "column", gap: 8, padding: 8,
    userSelect: "none", position: "relative", cursor: "default", ...gridPos
  };

  // selezione: puntiamo subito la card (prima che altri elementi intercettino l'evento)
  const selectNow: React.PointerEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    onSelect();
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    if (!onUploadFile) return;
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) await onUploadFile(f);
  };
  const handlePaste: React.ClipboardEventHandler<HTMLDivElement> = async (e) => {
    if (!onUploadFile) return;
    const f = Array.from(e.clipboardData?.files || [])[0];
    if (f) await onUploadFile(f);
  };

  return (
    <div ref={setNodeRef} style={style} role="group" aria-label={`Card ${label}`} onPointerDownCapture={selectNow}>
      {/* HANDLE: trascina solo da qui */}
      <div
        {...listeners} {...attributes}
        style={{
          height: 18, borderRadius: 6, cursor: "grab",
          background: selected ? "rgba(79,70,229,.10)" : "rgba(0,0,0,.05)"
        }}
        aria-label={`Trascina per spostare ${label}`}
        title="Trascina qui per spostare"
      />

      {/* AREA CONTENUTO (upload/preview) */}
      <div
        onDrop={handleDrop}
        onDragOver={e => onUploadFile && e.preventDefault()}
        onPaste={handlePaste}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}   // fa anche select
        style={{ flex: 1, display: "flex", flexDirection:"column", alignItems: "center", justifyContent: "center" }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={label}
               style={{ maxWidth:"100%", maxHeight:"100%", borderRadius: 8, objectFit: "contain" }} />
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(); fileRef.current?.click(); }}
            style={{
              width: "100%", height: "100%", minHeight: 120,
              border: "2px dashed #3b82f6", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#f8fafc", color: "#6b7280", fontSize: 16, cursor: "pointer", padding: 8
            }}
            aria-label={`Aggiungi immagine alla card ${label}`}
            title="Clicca / Trascina / Incolla immagine"
          >
            Clicca / Trascina / Incolla immagine
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={e => { const f = e.target.files?.[0]; if (f && onUploadFile) onUploadFile(f); }}
        />
      </div>

      {/* LABEL */}
      <div style={{ fontSize: 16, fontWeight: 600, textAlign:"center" }}>{label}</div>
    </div>
  );
}


E durante il render della griglia, passa ora setSelectedId:

<DraggableCard
  key={c.id}
  id={c.id}
  label={c.label}
  imageUrl={c.image?.url || undefined}
  selected={selectedId === c.id}
  onSelect={() => setSelectedId(c.id)}
  onUploadFile={onUploadFor(c.id)}
  gridPos={{
    gridColumn: `${c.pos.col} / span ${c.pos.col_span}`,
    gridRow: `${c.pos.row} / span ${c.pos.row_span}`
  }}
/>


Nota: mantieni nel DndContext la sensor config con activationConstraint, es.:

const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

Passo 3 — Pannello proprietà: bind sicuri

Etichetta

const onLabelChange = async (label: string) => {
  if (!selected) return;
  setData(d => d ? ({ ...d, cards: d.cards.map(c => c.id === selected.id ? { ...c, label } : c) }) : d);
  await patchCard(selected.id, { label });
};
...
<input
  value={selected?.label ?? ""}
  onChange={(e) => onLabelChange(e.target.value)}
  disabled={!selected}
/>


Link a pagina

const onTargetChange = async (target: number | null) => {
  if (!selected) return;
  setData(d => d ? ({ ...d, cards: d.cards.map(c => c.id === selected.id ? { ...c, navigate_to: target ?? null } : c) }) : d);
  await patchCard(selected.id, { target_page_id: target });
};


Span ±

const updateSpan = async (axis:'row'|'col', delta:1|-1) => {
  if (!selected || !data) return;
  const key = axis === 'row' ? 'row_span' : 'col_span';
  const pageLimit = axis === 'row' ? data.page.grid_rows : data.page.grid_cols;
  const nextVal = Math.max(1, Math.min(pageLimit, selected.pos[key] + delta));
  if (nextVal === selected.pos[key]) return;
  setData(d => d ? ({
    ...d,
    cards: d.cards.map(c => c.id === selected.id ? { ...c, pos: { ...c.pos, [key]: nextVal } } : c)
  }) : d);
  try { await patchCard(selected.id, { [key]: nextVal }); }
  catch (e) { alert("Overlap o errore salvataggio"); }
};


Upload immagine da pannello (lascia quello che avevi; è compatibile).

Elimina

const removeCard = async () => {
  if (!selected) return;
  await deleteCard(selected.id);
  setData(d => d ? ({ ...d, cards: d.cards.filter(c => c.id !== selected.id) }) : d);
  setSelectedId(null);
};

Passo 4 — Hook drag end: snap stabile (se non già fatto)

Per evitare “salti” quando cambiano dimensioni:

const onDragEnd = async (ev: DragEndEvent) => {
  if (!gridRef.current || !data) return;
  const id = Number(ev.active.id);
  const card = data.cards.find(c => c.id === id);
  if (!card) return;

  const rect = gridRef.current.getBoundingClientRect();
  const cellW = rect.width / data.page.grid_cols;
  const cellH = rect.height / data.page.grid_rows;

  // posizione puntatore a fine drag
  const p = ev.activatorEvent as PointerEvent | undefined;
  const x = p?.clientX ?? rect.left + (card.pos.col - 0.5) * cellW;
  const y = p?.clientY ?? rect.top + (card.pos.row - 0.5) * cellH;

  const targetCol = Math.max(1, Math.min(data.page.grid_cols, Math.floor((x - rect.left) / cellW) + 1));
  const targetRow = Math.max(1, Math.min(data.page.grid_rows, Math.floor((y - rect.top) / cellH) + 1));

  const next = { ...card, pos: { ...card.pos, row: targetRow, col: targetCol } };
  setData({ ...data, cards: data.cards.map(c => c.id === id ? next : c) });

  try { await patchCard(id, { slot_row: targetRow, slot_col: targetCol }); }
  catch (e) { alert("Overlap o errore salvataggio"); }
};

Criteri di accettazione

 Clic su una card ⇒ viene evidenziata e il pannello mostra i campi attivi.

 Drag funziona solo trascinando l’handle in alto.

 Etichetta editabile e persistita (PATCH 200).

 Link pagina impostabile dall’autocomplete e persistito.

 RowSpan/ColSpan ± aggiornano la griglia e passano l’overlap check.

 Upload sia dalla card sia dal pannello funziona.

 Eliminazione card azzera la selezione senza errori.

Verifica manuale

Apri http://localhost:3000/builder/books/1/pages/1.

Seleziona card → modifica Etichetta; controlla PATCH /api/cards/:id.

Trascina la card dall’handle; verifica lo snap.

RowSpan +/−, ColSpan +/−; se 400 => overlap: prova altra posizione.

Upload da card (click/drag/paste) e verifica preview.

Runtime: http://localhost:3000/books/1/pages/1 per confermare il risultato.