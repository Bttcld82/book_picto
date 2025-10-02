Obiettivo

Mostrare dentro la card un bottone (se attivo) con il titolo della pagina di destinazione.

Titolo preso direttamente dal backend (target_page.title) o risolto lato frontend via fetch extra.

In Builder, toggle “Mostra bottone link” per attivarlo/disattivarlo.

1) Estendere l’API (se non già fatto)

In FastAPI, quando serializzi una card con target_page_id, aggiungi anche un campo target_page_title.

Esempio in schemas.py:

class CardRead(BaseModel):
    id: int
    label: str
    row_span: int
    col_span: int
    slot_row: int
    slot_col: int
    target_page_id: Optional[int]
    target_page_title: Optional[str]  # 👈 nuovo
    image: Optional[ImageRead]

    class Config:
        orm_mode = True


In crud.py o dove monti la query:

cards = (
    db.query(Card, Page.title.label("target_page_title"))
    .outerjoin(Page, Card.target_page_id == Page.id)
    .all()
)


Così ogni card porta già con sé target_page_title.

2) Runtime — mostra il bottone con quel testo

File: frontend/app/books/[bookId]/pages/[pageId]/page.tsx

import { isLinkButtonVisible } from "@/lib/linkButtonPref";

{normCards.map((c) => {
  const targetId = c.navigate_to ?? data.page.id;
  const href = `/books/${book.id}/pages/${targetId}`;
  const showBtn = isLinkButtonVisible(c.id) && !!c.navigate_to;
  const btnLabel = c.target_page_title || "Apri"; // 👈 titolo pagina

  return (
    <div
      key={c.id}
      className={styles.card}
      onPointerDown={() => speak(c.label, book.locale)} // TTS
      style={{
        gridRow: `${c.pos.row} / span ${c.pos.row_span}`,
        gridColumn: `${c.pos.col} / span ${c.pos.col_span}`,
        position: "relative"
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
      <div className={styles.cardLabel}>{c.label} <span aria-hidden>🔊</span></div>

      {showBtn && (
        <a
          href={href}
          onClick={(e) => e.stopPropagation()}
          title={`Vai a ${btnLabel}`}
          style={{
            position: "absolute",
            right: 10, bottom: 10,
            padding: "6px 12px",
            borderRadius: 10,
            border: "1px solid rgba(110,168,254,.35)",
            background: "linear-gradient(180deg, rgba(110,168,254,.18), rgba(110,168,254,.10))",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700
          }}
        >
          {btnLabel}
        </a>
      )}
    </div>
  );
})}

3) Builder — nessuna modifica al testo

Nel pannello Builder resta solo il toggle “Mostra bottone link”.
Il testo mostrato sarà automaticamente quello del titolo pagina collegata (dal backend).

4) Casi gestiti

🔹 Card senza link → bottone non visibile.

🔹 Card con link ma toggle disattivato → bottone non visibile.

🔹 Card con link + toggle attivo → bottone visibile con testo = titolo pagina linkata.

🔹 Se l’utente rinomina la pagina linkata → dopo refresh, il bottone mostra il nuovo nome.