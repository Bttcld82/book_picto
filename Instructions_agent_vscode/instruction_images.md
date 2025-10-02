Obiettivo

Abilitare il caricamento immagine direttamente dalla card (clic/drag&drop/incolla) nel Builder:

Le card senza immagine mostrano un invito: “Clicca / Trascina / Incolla immagine”.

Al caricamento: POST /api/assets → PATCH /api/cards/:id { image_id } → preview aggiornata.

L’immagine non è obbligatoria.

Contesto repo

Frontend: frontend/ (Next.js App Router, TS).

Builder: frontend/app/builder/books/[bookId]/pages/[pageId]/page.tsx.

Le API /api/assets e /api/cards/:id sono già presenti e funzionanti.

Requisiti e vincoli

Non modificare il backend.

Non rimuovere il caricamento dal pannello “Proprietà” (resta valido).

Accessibilità: focus visibile, aria-label, tasti standard.

DnD griglia (dnd-kit) deve continuare a funzionare.

Modifiche richieste (riassunto)

Aggiungere una helper onUploadFor(cardId) nel builder per caricare e associare l’immagine ad una card specifica.

Estendere il componente DraggableCard per mostrare l’overlay di upload quando imageUrl è assente e gestire click, drag&drop e paste (Ctrl+V).

Agganciare onUploadFor a ciascuna card renderizzata.

Passi operativi
1) Aggiungi la helper onUploadFor nel Builder

File: frontend/app/builder/books/[bookId]/pages/[pageId]/page.tsx
Azione: inserisci accanto a onUpload esistente.

// helper per associare upload a una card specifica
const onUploadFor = (cardId: number) => async (file: File) => {
  const c = data?.cards.find(x => x.id === cardId);
  if (!c) return;
  const asset = await uploadAsset(file, c.label);
  setData(d =>
    d ? ({
      ...d,
      cards: d.cards.map(k =>
        k.id === cardId
          ? { ...k, image_id: asset.id, image: { url: asset.url, alt: asset.alt } }
          : k
      )
    }) : d
  );
  await patchCard(cardId, { image_id: asset.id });
};

2) Passa onUploadFor a ogni card

Nel render delle card, aggiungi la prop onUploadFile:

<DraggableCard
  key={c.id}
  id={c.id}
  label={c.label}
  imageUrl={c.image?.url || undefined}
  selected={selected?.id === c.id}
  onSelect={() => setSelected(c)}
  onUploadFile={onUploadFor(c.id)}          // <-- nuovo
  gridPos={{
    gridColumn: `${c.pos.col} / span ${c.pos.col_span}`,
    gridRow: `${c.pos.row} / span ${c.pos.row_span}`
  }}
/>

3) Sostituisci DraggableCard con la versione “inline upload”

Nello stesso file (page.tsx), sostituisci il componente DraggableCard con questo:

import { useDraggable } from "@dnd-kit/core";
import { useRef } from "react";

function DraggableCard({
  id, label, imageUrl, selected, onSelect, gridPos, onUploadFile
}:{
  id: number;
  label: string;
  imageUrl?: string;
  selected?: boolean;
  onSelect: () => void;
  gridPos: any;
  onUploadFile?: (f: File) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    borderRadius: 12,
    border: selected ? "2px solid #4f46e5" : "1px solid #ddd",
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 8,
    userSelect: "none",
    cursor: "grab",
    position: "relative",
    ...gridPos
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
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      onDrop={handleDrop}
      onDragOver={e => onUploadFile && e.preventDefault()}
      onPaste={handlePaste}
      {...listeners}
      {...attributes}
      role="button"
      aria-label={label}
      tabIndex={0}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, objectFit: "contain" }}
          />
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            style={{
              width: "100%",
              height: "100%",
              border: "2px dashed #3b82f6",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f8fafc",
              color: "#6b7280",
              fontSize: 16,
              cursor: "pointer",
              padding: 8
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
          onChange={e => {
            const f = e.target.files?.[0];
            if (f && onUploadFile) onUploadFile(f);
          }}
        />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{label}</div>
    </div>
  );
}


Nota: l’overlay appare solo quando imageUrl è assente. Se l’immagine è già presente, resta la preview.

Criteri di accettazione

 Clic su una card senza immagine → appare il bottone “Clicca / Trascina / Incolla immagine”.

 Clic del bottone → selezione file → POST /api/assets (201) e PATCH /api/cards/:id (200).

 Drag&drop di un file sulla card → stesso risultato.

 Ctrl+V con un’immagine dagli appunti → stesso risultato.

 Dopo upload, la preview compare immediatamente nel Builder e nel Runtime.

 DnD griglia (spostamento/resize) continua a funzionare come prima.

 Accessibilità: la card ha role="button", è focusable (Tab), e il bottone di upload ha aria-label.

Test manuale (quick)

Avvia stack:

docker compose -f compose.yaml up --build
docker compose -f compose.yaml exec backend python -m app.seed


Apri http://localhost:3000/builder/books/1/pages/1.

Scegli una card senza immagine → clic e carica un file PNG/JPG → preview.

Trascina un file sulla card → preview.

Copia/Incolla uno screenshot (Ctrl+V) → preview.

Apri http://localhost:3000/books/1/pages/1 → la stessa card mostra l’immagine.

Troubleshooting

404 /media/ → backend deve montare app.mount("/media", StaticFiles(...)). Verifica NEXT_PUBLIC_API_BASE.

CORS → CORS_ORIGINS in backend deve includere http://localhost:3000.

Drag della card parte mentre trascini un file → il codice usa onDragOver(e.preventDefault()) sull’area drop quando presente onUploadFile, evitando interferenze.

PNG molto grande → per ora nessun resize server-side; considerare pipeline immagini in futuro.

Git (Windows/Powershell o Git Bash)
git checkout -b feature/inline-card-upload
git add frontend/app/builder/books/[bookId]/pages/[pageId]/page.tsx
git commit -m "feat(builder): inline image upload via click/drag&drop/paste on empty cards"
git push -u origin feature/inline-card-upload

Estensioni future (non richieste ora)

Drag&drop anche multi-file con coda.

Ritaglio/zoom (cropper) prima dell’upload.

Validazione formato/dimensione lato client.

Badge “manca immagine” nelle card senza image_id.

Stato “Publish” pagina con check di completezza.