'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useDraggable, DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import Navbar from '@/components/Navbar';
import { pageApi, cardApi, assetApi, bookApi, patchCard, listPages, updateBook, Page, Card, Asset, Book } from '../../../../../../lib/api';
import panel from "./panel.module.css";

// Card normalization types for v4/v5 compatibility
type CardRaw = {
  id: number;
  label: string;
  image?: { url: string|null; alt: string|null } | null;
  // shape v4
  slot_row?: number; slot_col?: number; row_span?: number; col_span?: number; target_page_id?: number|null;
  // shape v5
  pos?: { row:number; col:number; row_span:number; col_span:number };
  navigate_to?: number|null;
  image_id?: number|null;
};

type CardUI = {
  id: number;
  label: string;
  image?: { url: string|null; alt: string|null } | null;
  pos: { row:number; col:number; row_span:number; col_span:number };
  navigate_to: number|null;
  image_id?: number|null;
};

type PageState = {
  book_id: number;
  page: { id:number; title:string; grid_cols:number; grid_rows:number };
  cards: CardUI[];
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
    image_id: c.image_id,
  };
}

interface PageProps {
  params: {
    bookId: string;
    pageId: string;
  };
}

export default function BuilderPage({ params }: PageProps) {
  const [page, setPage] = useState<Page | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [bookPages, setBookPages] = useState<Page[]>([]);
  const [pages, setPages] = useState<{id:number; title:string}[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = useMemo(
    () => cards.find(c => c.id === selectedId) ?? null,
    [cards, selectedId]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageRes, cardsRes, bookRes, pagesRes] = await Promise.all([
          pageApi.get(parseInt(params.pageId)),
          cardApi.list(parseInt(params.pageId)),
          bookApi.get(parseInt(params.bookId)),
          pageApi.list(parseInt(params.bookId)),
        ]);
        setPage(pageRes.data);
        setCards(cardsRes.data);
        setBook(bookRes.data);
        setBookPages(pagesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.bookId, params.pageId]);

  // Reset selection if selected card no longer exists
  useEffect(() => {
    if (selectedId && !cards.some(c => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [cards, selectedId]);

  // Load pages for Link Pagina dropdown
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

  const handleCardClick = (row: number, col: number) => {
    const existingCard = cards.find(c => c.slot_row === row && c.slot_col === col);
    if (existingCard) {
      setSelectedId(existingCard.id);
    } else {
      // Create new card
      const newCard: Omit<Card, 'id'> = {
        page_id: parseInt(params.pageId),
        slot_row: row,
        slot_col: col,
        row_span: 1,
        col_span: 1,
        label: 'Nuova Card',
      };
      
      cardApi.create(newCard).then(res => {
        setCards([...cards, res.data]);
        setSelectedId(res.data.id);
      });
    }
  };

  const updateCard = async (updates: Partial<Card>) => {
    if (!selected) return;
    
    try {
      const res = await cardApi.update(selected.id, updates);
      setCards(cards.map(c => c.id === selected.id ? res.data : c));
    } catch (err) {
      console.error('Error updating card:', err);
    }
  };

  const deleteCard = async () => {
    if (!selected) return;
    
    try {
      await cardApi.delete(selected.id);
      setCards(cards.filter(c => c.id !== selected.id));
      setSelectedId(null);
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  // Fixed Link Pagina handler with robust string/number handling
  async function onTargetChange(value: string) {
    if (!selected) return;
    // "" => null, altrimenti numero
    const pageId = value === "" ? null : Number(value);
    // update ottimistico nello stato locale
    setCards(cards.map(c => 
      c.id === selected.id ? { ...c, target_page_id: pageId } : c
    ));
    // PATCH corretta al backend (campo atteso: target_page_id)
    try {
      await patchCard(selected.id, { target_page_id: pageId });
    } catch (e) {
      console.error("patchCard target_page_id failed", e);
      alert("Errore salvataggio link pagina");
    }
  }

  // Label change handler
  async function onLabelChange(value: string) {
    if (!selected) return;
    // update ottimistico
    setCards(cards.map(c => 
      c.id === selected.id ? { ...c, label: value } : c
    ));
    try {
      await patchCard(selected.id, { label: value });
    } catch (e) {
      console.error("patchCard label failed", e);
    }
  }

  // Span update handler
  async function updateSpan(type: 'row' | 'col', value: number) {
    if (!selected) return;
    const field = type === 'row' ? 'row_span' : 'col_span';
    // update ottimistico
    setCards(cards.map(c => 
      c.id === selected.id ? { ...c, [field]: value } : c
    ));
    try {
      await patchCard(selected.id, { [field]: value });
    } catch (e) {
      console.error(`patchCard ${field} failed`, e);
    }
  }

  // Remove card handler
  async function removeCard() {
    if (!selected) return;
    if (!confirm(`Elimina la card "${selected.label}"?`)) return;
    try {
      await cardApi.delete(selected.id);
      setCards(cards.filter(c => c.id !== selected.id));
      setSelectedId(null);
    } catch (e) {
      console.error("deleteCard failed", e);
    }
  }

  // helper per associare upload a una card specifica
  const onUploadFor = (cardId: number) => async (file: File) => {
    const c = cards.find(x => x.id === cardId);
    if (!c) return;
    
    try {
      const assetRes = await assetApi.upload(file);
      const asset = assetRes.data;
      
      // Aggiorna lo state locale immediatamente
      setCards(prevCards => 
        prevCards.map(k =>
          k.id === cardId
            ? { ...k, image_id: asset.id }
            : k
        )
      );
      
      // Aggiorna la card sul server
      await cardApi.update(cardId, { image_id: asset.id });
    } catch (err) {
      console.error('Error uploading image:', err);
    }
  };

  // Componente DraggableCard con handle e selezione
  function DraggableCard({
    id, label, imageUrl, selected, onSelect, gridPos, onUploadFile, navigateTo
  }: {
    id: number;
    label: string;
    imageUrl?: string;
    selected?: boolean;
    onSelect: () => void;
    gridPos: any;
    onUploadFile?: (f: File) => Promise<void>;
    navigateTo?: number;
  }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    const fileRef = useRef<HTMLInputElement | null>(null);

    const style: any = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      borderRadius: 12,
      border: selected ? "2px solid #4f46e5" : "1px solid #ddd",
      boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
      background: "#fff",
      display: "flex", flexDirection: "column", gap: 8, padding: 8,
      userSelect: "none", position: "relative", cursor: "default", ...gridPos
    };

    // selezione: puntiamo subito la card (prima che altri elementi intercettino l'evento)
    const selectNow: any = (e: any) => {
      e.stopPropagation();
      onSelect();
    };

    const handleDrop: any = async (e: any) => {
      if (!onUploadFile) return;
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0];
      if (f) await onUploadFile(f);
    };
    const handlePaste: any = async (e: any) => {
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

        {/* Navigation button in top-right corner when navigateTo is set */}
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    if (!delta || !page) return;

    const cardId = Number(active.id);
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Calcola nuova posizione con snap-to-grid
    const cellWidth = 120; // assumiamo dimensione celle della griglia
    const cellHeight = 120;
    
    const deltaRow = Math.round(delta.y / cellHeight);
    const deltaCol = Math.round(delta.x / cellWidth);
    
    let newRow = card.slot_row + deltaRow;
    let newCol = card.slot_col + deltaCol;
    
    // Limiti griglia
    newRow = Math.max(1, Math.min(newRow, page.grid_rows - card.row_span + 1));
    newCol = Math.max(1, Math.min(newCol, page.grid_cols - card.col_span + 1));
    
    // Controlla overlap con altre card
    const hasOverlap = cards.some(otherCard => {
      if (otherCard.id === cardId) return false;
      
      const rowOverlap = newRow < otherCard.slot_row + otherCard.row_span && 
                        newRow + card.row_span > otherCard.slot_row;
      const colOverlap = newCol < otherCard.slot_col + otherCard.col_span && 
                        newCol + card.col_span > otherCard.slot_col;
      
      return rowOverlap && colOverlap;
    });
    
    // Se c'è overlap, usa la posizione originale
    if (hasOverlap) {
      newRow = card.slot_row;
      newCol = card.slot_col;
    }
    
    // Aggiorna se posizione cambiata
    if (newRow !== card.slot_row || newCol !== card.slot_col) {
      updateCard({ slot_row: newRow, slot_col: newCol });
    }
  };

  const exportZip = async () => {
    try {
      window.open(`http://localhost:8000/api/export_zip/${params.bookId}`, '_blank');
    } catch (err) {
      console.error('Error exporting:', err);
    }
  };

  const setHome = async () => {
    try {
      await bookApi.update(parseInt(params.bookId), { home_page_id: parseInt(params.pageId) });
      // Aggiorna lo stato locale del libro
      if (book) {
        setBook({ ...book, home_page_id: parseInt(params.pageId) });
      }
      alert('Pagina impostata come Home');
    } catch (err) {
      console.error('Error setting home page:', err);
      alert('Errore nell\'impostazione della pagina Home');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Caricamento...</div>;
  if (!page || !book) return <div style={{ padding: '20px' }}>Dati non trovati</div>;

  const gridStyle = {
    gridTemplateColumns: `repeat(${page.grid_cols}, 1fr)`,
    gridTemplateRows: `repeat(${page.grid_rows}, 1fr)`,
  };

  const renderGrid = () => {
    // Renderizza solo le card esistenti con il nuovo componente DraggableCard
    return cards.map(card => {
      // Ottieni l'URL dell'immagine se presente
      const imageUrl = card.image_id ? `http://localhost:8000/media/${card.image_id}` : undefined;
      
      return (
        <DraggableCard
          key={card.id}
          id={card.id}
          label={card.label}
          imageUrl={imageUrl}
          selected={selectedId === card.id}
          onSelect={() => setSelectedId(card.id)}
          onUploadFile={onUploadFor(card.id)}
          navigateTo={card.target_page_id ?? undefined}
          gridPos={{
            gridColumn: `${card.slot_col + 1} / span ${card.col_span}`,
            gridRow: `${card.slot_row + 1} / span ${card.row_span}`
          }}
        />
      );
    });
  };

  // Aggiungi slot vuoti per permettere la creazione di nuove card
  const renderEmptySlots = () => {
    const slots = [];
    for (let row = 0; row < page.grid_rows; row++) {
      for (let col = 0; col < page.grid_cols; col++) {
        const hasCard = cards.some(c => c.slot_row === row && c.slot_col === col);
        if (!hasCard) {
          slots.push(
            <div
              key={`empty-${row}-${col}`}
              className="empty-slot"
              style={{
                gridRow: `${row + 1}`,
                gridColumn: `${col + 1}`,
                border: '2px dashed #ccc',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                cursor: 'pointer',
                minHeight: '100px'
              }}
              onClick={() => handleCardClick(row, col)}
            >
              Clicca per aggiungere
            </div>
          );
        }
      }
    }
    return slots;
  };

  // pulsanti da mostrare a destra nella navbar
  const RightButtons = (
    <>
      <button onClick={setHome} style={btn()}>
        Imposta Home
      </button>
      <button onClick={exportZip} style={btn("primary")}>
        Export ZIP
      </button>
    </>
  );

  return (
    <>
      <Navbar
        brand={page?.title ? `${page.title}` : "Builder"}
        brandHref={`/books/${params.bookId}/pages/${page?.id || params.pageId}`}
        nav={[
          { label: "Runtime", href: `/books/${params.bookId}/pages/${page?.id || params.pageId}` },
          { label: "Builder", href: `/builder/books/${params.bookId}/pages/${page?.id || params.pageId}` },
        ]}
        breadcrumbs={[
          { label: "Libro " + params.bookId, href: `/books/${params.bookId}/pages/${page?.id || params.pageId}` },
          { label: page?.title || "Pagina" }
        ]}
        right={RightButtons}
      />

      <main style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:16, height:"calc(100vh - var(--nav-h))", padding:16 }}>
    <DndContext onDragEnd={handleDragEnd}>
        <div className="builder-grid" style={{ flex: 1 }}>          
          <div className="aac-grid" style={gridStyle}>
            {renderGrid()}
            {renderEmptySlots()}
          </div>
        </div>

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
                value={selected.target_page_id != null ? String(selected.target_page_id) : ""}
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
                       value={selected.row_span}
                       onChange={(e) => updateSpan('row', Number(e.target.value) || 1)} />
              </div>
              <div>
                <label className={panel.label} htmlFor="colspan">Col Span</label>
                <input id="colspan" className={panel.input}
                       value={selected.col_span}
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
    </DndContext>
      </main>
    </>
  );
}

// piccolo helper per i bottoni navbar
function btn(variant?: "primary"): any {
  const base: any = {
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