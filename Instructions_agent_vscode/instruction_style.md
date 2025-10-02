Obiettivo

Rendere il runtime leggibile, “touch-friendly”, con card moderne (ombra morbida, hover/focus chiari), tipografia solida e accessibilità (focus visibile, contrasto, area di click ampia).

A) Solo CSS (senza dipendenze)
1) Aggiungi design tokens + reset

frontend/app/globals.css (crea se manca)

/* Reset minimale e design tokens */
:root{
  --bg: #0b0b10;
  --surface: #0f1115;
  --card: #151821;
  --text: #e8e9ec;
  --muted: #a7adbb;
  --accent: #6ea8fe;
  --accent-2: #9b8cff;
  --ring: rgba(110,168,254,.45);
  --radius: 16px;
  --shadow: 0 10px 30px rgba(0,0,0,.35);
  --shadow-sm: 0 6px 16px rgba(0,0,0,.25);
}

*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0; font-family: ui-sans-serif, system-ui, Segoe UI, Roboto, Arial, sans-serif;
  background: radial-gradient(1200px 800px at 20% -10%, #121523 0%, var(--bg) 50%, #0a0b0e 100%);
  color: var(--text); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}
a{color:inherit}


Se usi Next App Router, importa globals.css in app/layout.tsx:

import "./globals.css";
export const metadata = { title:"AAC Builder", description:"Runtime e Builder AAC" };
export default function RootLayout({ children }:{children:React.ReactNode}){
  return <html lang="it"><body>{children}</body></html>;
}

2) Crea uno style module per il runtime

frontend/app/books/[bookId]/pages/[pageId]/runtime.module.css

.container{
  padding:24px; max-width:1200px; margin:0 auto;
}

.breadcrumb{
  display:flex; gap:10px; align-items:center; color:var(--muted); margin-bottom:16px;
}
.breadcrumb a{ color:var(--accent); text-decoration:none }
.breadcrumb a:hover{ text-decoration:underline }

.titleRow{
  display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px;
}
.pageTitle{ font-size:clamp(20px, 2vw, 28px); font-weight:700; letter-spacing:.2px }

.grid{
  display:grid; gap:14px;
  /* colonne dinamiche impostate via inline style dal componente */
}

.card{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01) 60%), var(--card);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: var(--radius); padding:12px; text-decoration:none; color:inherit;
  box-shadow: var(--shadow-sm);
  min-height: 140px; aspect-ratio: 1 / 1;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.card:hover{ transform: translateY(-2px); box-shadow: var(--shadow) }
.card:focus-visible{
  outline: 0; box-shadow: 0 0 0 3px var(--ring);
  border-color: rgba(110,168,254,.6);
}

.mediaWrap{
  flex:1; display:flex; align-items:center; justify-content:center; width:100%;
}
.mediaWrap img{
  max-width:100%; max-height:100%;
  filter: drop-shadow(0 6px 12px rgba(0,0,0,.35));
  border-radius: 12px;
}
.cardLabel{
  margin-top:10px; font-weight:600; letter-spacing:.2px;
  font-size: clamp(16px, 1.8vw, 20px);
  text-align:center;
}

.toolbar{
  display:flex; gap:10px; align-items:center; color:var(--muted);
}
.badge{
  padding:6px 10px; border-radius:999px; background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.08); font-size:12px;
}

/* responsive: riduci gap e padding su schermi piccoli */
@media (max-width: 640px){
  .container{ padding:16px }
  .grid{ gap:10px }
}

3) Aggiorna la pagina runtime per usare gli stili

frontend/app/books/[bookId]/pages/[pageId]/page.tsx

import styles from "./runtime.module.css";

type RuntimeCard = {
  id:number; label:string;
  image?: { url:string|null; alt:string|null };
  pos: { row:number; col:number; row_span:number; col_span:number };
  navigate_to?: number|null;
};
type RuntimePayload = {
  book_id:number;
  page:{ id:number; title:string; grid_cols:number; grid_rows:number };
  cards:RuntimeCard[];
};

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function getRuntime(bookId:string, pageId:string):Promise<RuntimePayload>{
  const res = await fetch(`${API}/api/runtime/books/${bookId}/pages/${pageId}`, { cache:"no-store" });
  if(!res.ok) throw new Error("Runtime fetch failed");
  return res.json();
}
async function getBook(bookId:string){
  const res = await fetch(`${API}/api/books/${bookId}`, { cache:"no-store" });
  if(!res.ok) throw new Error("Book fetch failed");
  return res.json();
}

export default async function Page({ params }:{ params:{bookId:string; pageId:string} }){
  const [data, book] = await Promise.all([getRuntime(params.bookId, params.pageId), getBook(params.bookId)]);
  const homeId = book.home_page_id ?? data.page.id;

  return (
    <main className={styles.container}>
      <nav className={styles.breadcrumb} aria-label="Percorso">
        <a href={`/books/${params.bookId}/pages/${homeId}`}>Home</a>
        <span>›</span><span>{data.page.title}</span>
        <div className={styles.toolbar} style={{marginLeft:"auto"}}>
          <span className={styles.badge}>Libro #{data.book_id}</span>
          <span className={styles.badge}>
            Griglia {data.page.grid_cols}×{data.page.grid_rows}
          </span>
        </div>
      </nav>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${data.page.grid_cols}, minmax(0, 1fr))` }}
      >
        {data.cards.map(c => (
          <a
            key={c.id}
            href={`/books/${data.book_id}/pages/${c.navigate_to ?? data.page.id}`}
            className={styles.card}
          >
            <div className={styles.mediaWrap}>
              {c.image?.url ? (
                <img src={c.image.url} alt={c.image.alt ?? c.label} />
              ) : (
                <span aria-hidden>🖼️</span>
              )}
            </div>
            <div className={styles.cardLabel}>{c.label}</div>
          </a>
        ))}
      </div>
    </main>
  );
}


✔️ Accessibilità: usa :focus-visible, contrasti elevati, area click a tutta card, alt dalle etichette.

B) Tailwind CSS (opzionale, se vuoi spingere lo stile)
1) Installazione
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p


tailwind.config.js

module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}","./components/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors:{
        bg:"#0b0b10", surface:"#0f1115", card:"#151821",
        text:"#e8e9ec", muted:"#a7adbb", accent:"#6ea8fe"
      },
      boxShadow:{
        md:"0 10px 30px rgba(0,0,0,.35)",
        sm:"0 6px 16px rgba(0,0,0,.25)"
      },
      borderRadius:{ xl:"16px" }
    }
  },
  plugins: [],
}


app/globals.css