Obiettivo

Schermata “Libri” con elenco + Crea/Modifica/Elimina libro e scelta Home Page.

Schermata “Pagine del libro” con elenco + Crea/Modifica/Elimina pagina (grid cols/rows).

Integrazione con Builder e Runtime esistenti.

Switcher rapido di libro nella navbar.

Backend già espone:
GET/POST /api/books, GET/PATCH/DELETE /api/books/{id},
GET/POST /api/pages?book_id=, PATCH/DELETE /api/pages/{id}
(già usati da seed e dalle viste). Non modificare il backend.

1) Routing & Struttura pagine (Next.js App Router)

Crea le nuove route:

frontend/app/
└─ books/
   ├─ page.tsx                      # LISTA LIBRI
   ├─ new/page.tsx                  # CREA LIBRO
   ├─ [bookId]/
   │  ├─ page.tsx                   # DETTAGLIO LIBRO: elenco pagine
   │  ├─ pages/
   │  │  ├─ new/page.tsx            # CREA PAGINA DEL LIBRO
   │  │  └─ [pageId]/
   │  │     └─ edit/page.tsx        # MODIFICA PAGINA (cols/rows/titolo)
   │  └─ edit/page.tsx              # MODIFICA LIBRO (titolo/locale/home)


Criteri di accettazione:

/books mostra lista con pulsante Nuovo libro e azioni Modifica / Elimina / Apri.

/books/[bookId] mostra pagine del libro con Nuova pagina, Modifica/Elimina e link a Runtime e Builder della pagina.

Conferme eliminazione con confirm() o dialog.

2) API client (estendere frontend/lib/api.ts)

Aggiungi funzioni (tutte async):

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// BOOKS
export async function listBooks() { return (await fetch(`${API}/api/books`)).json(); }
export async function createBook(payload: { title:string; locale?: string }) {
  return (await fetch(`${API}/api/books`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) })).json();
}
export async function getBook(id:number|string) { return (await fetch(`${API}/api/books/${id}`)).json(); }
export async function updateBook(id:number|string, patch: any) {
  return (await fetch(`${API}/api/books/${id}`, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(patch) })).json();
}
export async function deleteBook(id:number|string) {
  const r = await fetch(`${API}/api/books/${id}`, { method:"DELETE" }); if(!r.ok) throw new Error("delete book failed");
}

// PAGES
export async function listPages(bookId:number|string) {
  return (await fetch(`${API}/api/pages?book_id=${bookId}`)).json();
}
export async function createPage(payload: { book_id:number; title:string; grid_cols?:number; grid_rows?:number; order?:number }) {
  return (await fetch(`${API}/api/pages`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) })).json();
}
export async function getPage(id:number|string) { return (await fetch(`${API}/api/pages/${id}`)).json(); }
export async function updatePage(id:number|string, patch:any) {
  return (await fetch(`${API}/api/pages/${id}`, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(patch) })).json();
}
export async function deletePage(id:number|string) {
  const r = await fetch(`${API}/api/pages/${id}`, { method:"DELETE" }); if(!r.ok) throw new Error("delete page failed");
}

3) LISTA LIBRI — app/books/page.tsx

Funzioni:

Fetch client-side (useEffect) → listBooks()

Tabella con: Titolo, Locale, Home Page, Azioni (Apri, Modifica, Elimina)

Bottone “Nuovo libro” → /books/new

Azioni:

“Apri” → /books/[bookId]

“Modifica” → /books/[bookId]/edit

“Elimina” → deleteBook(id) con confirm(), poi refresh

4) CREA/MODIFICA LIBRO
/books/new/page.tsx

Form con:

Titolo (required)

Locale (default it-IT)

Submit → createBook({title, locale}) → redirect su /books/[id].

/books/[bookId]/edit/page.tsx

Form con:

Titolo

Locale

Home Page (select con pagine del libro) → updateBook(bookId, { home_page_id })

Accettazione:

Cambiare la Home aggiorna la navbar del runtime/builder.

5) PAGINE DEL LIBRO — app/books/[bookId]/page.tsx

Contenuti:

Header con Titolo libro + pulsanti: Nuova pagina, Modifica libro, Vai a Runtime (Home), Vai a Builder (Home)

Tabella “Pagine” con colonne:

# (order)

Titolo

Griglia (es. 3×3)

Link (Runtime/Builder per la pagina)

Azioni: Modifica, Elimina

Azioni:

“Nuova pagina” → /books/[bookId]/pages/new

“Modifica” → /books/[bookId]/pages/[pageId]/edit

“Elimina” → deletePage(pageId) con conferma + refresh

6) CREA/MODIFICA PAGINA
/books/[bookId]/pages/new/page.tsx

Form:

Titolo (required)

Grid cols (default 3, min 1)

Grid rows (default 3, min 1)

Submit → createPage({ book_id, title, grid_cols, grid_rows, order: nextIndex }) → redirect a /books/[bookId].

/books/[bookId]/pages/[pageId]/edit/page.tsx

Form:

Titolo

Grid cols/rows (aggiornano la pagina; warning: può generare overlap)

Salva → updatePage(pageId, patch) → redirect o notifica.

7) Navbar: Switcher libro (opzionale ma utile)

Aggiorna components/Navbar.tsx per supportare un piccolo dropdown a destra con i libri (ricavati da listBooks() lato client). Alla selezione → router.push('/books/[id]').
In alternativa, inserisci un link “Libri” (Home UI) sempre visibile.

8) Integrazione con Runtime/Builder esistenti

Runtime già su: /books/[bookId]/pages/[pageId].

Builder già su: /builder/books/[bookId]/pages/[pageId].

Dalla lista pagine aggiungi due link:

Runtime → /books/${bookId}/pages/${pageId}

Builder → /builder/books/${bookId}/pages/${pageId}

9) UX dettagli

Validazione client (titolo non vuoto, grid_cols/rows ≥ 1).

Ordine pagine: order crescente; quando crei, imposta order = max+1.

Disabilita “Elimina libro” se ha pagine? (opzionale) Altrimenti conferma “eliminerà anche tutte le pagine/carte”.

Toast/snackbar semplice con alert() o piccola div per feedback.

10) Criteri di accettazione (checklist)

 /books mostra l’elenco di tutti i libri e permette nuovo/modifica/elimina/apri.

 /books/[bookId] mostra l’elenco pagine del libro e permette nuova/modifica/elimina.

 Impostazione Home Page visibile in /books/[bookId]/edit e riflessa nel runtime/builder.

 Da ogni riga pagina puoi andare a Runtime e Builder di quella pagina.

 Creazione libro/pagina reindirizza correttamente.

 Eliminazioni aggiornano l’elenco senza ricarico manuale.

11) Comandi & Test
# avvio stack
docker compose -f compose.yaml up --build
# seed base (una volta)
docker compose -f compose.yaml exec backend python -m app.seed


Percorsi da provare:

http://localhost:3000/books (lista libri)

http://localhost:3000/books/new (crea libro)

http://localhost:3000/books/1 (pagine libro 1)

http://localhost:3000/books/1/pages/new (nuova pagina)

Runtime/Builder dei nuovi ID generati.

12) Commit suggeriti
git checkout -b feature/multi-books-ui
git add frontend/lib/api.ts \
        frontend/app/books/page.tsx \
        frontend/app/books/new/page.tsx \
        frontend/app/books/[bookId]/page.tsx \
        frontend/app/books/[bookId]/edit/page.tsx \
        frontend/app/books/[bookId]/pages/new/page.tsx \
        frontend/app/books/[bookId]/pages/[pageId]/edit/page.tsx \
        frontend/components/Navbar.tsx
git commit -m "feat(ui): gestione multi-libro e multi-pagina (CRUD) con integrazione runtime/builder"
git push -u origin feature/multi-books-ui
