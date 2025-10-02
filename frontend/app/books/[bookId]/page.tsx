'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getBook, listPages, deletePage, updateBook, Book, Page } from '@/lib/api';

interface BookDetailProps {
  params: {
    bookId: string;
  };
}

export default function BookDetailPage({ params }: BookDetailProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookData, pagesData] = await Promise.all([
          getBook(params.bookId),
          listPages(params.bookId)
        ]);
        setBook(bookData);
        setPages(pagesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        alert('Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.bookId]);

  const handleDeletePage = async (pageId: number, pageTitle: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la pagina "${pageTitle}"? Verranno eliminate anche tutte le carte associate.`)) {
      return;
    }

    try {
      await deletePage(pageId);
      setPages(pages.filter(page => page.id !== pageId));
      alert('Pagina eliminata con successo');
    } catch (err) {
      console.error('Error deleting page:', err);
      alert('Errore nell\'eliminazione della pagina');
    }
  };

  const setAsHome = async (bookId: number, pageId: number) => {
    try {
      await updateBook(bookId, { home_page_id: pageId });
      setBook(prev => prev ? { ...prev, home_page_id: pageId } : prev);
      alert("Home Page impostata.");
    } catch (e: any) {
      alert(e?.message || "Errore nel settaggio Home Page");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar
          brand="Book Picto"
          breadcrumbs={[
            { label: 'Libri', href: '/books' },
            { label: 'Caricamento...' }
          ]}
          right={null}
        />
        <main style={{ padding: '20px' }}>
          <div>Caricamento...</div>
        </main>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <Navbar
          brand="Book Picto"
          breadcrumbs={[
            { label: 'Libri', href: '/books' },
            { label: 'Non trovato' }
          ]}
          right={null}
        />
        <main style={{ padding: '20px' }}>
          <div>Libro non trovato</div>
          <Link href="/books" style={btnStyle()}>
            Torna ai libri
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar
        brand="Book Picto"
        breadcrumbs={[
          { label: 'Libri', href: '/books' },
          { label: book.title }
        ]}
        right={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/books/${book.id}/pages/new`} style={btnStyle('primary')}>
              Nuova Pagina
            </Link>
            <Link href={`/books/${book.id}/edit`} style={btnStyle()}>
              Modifica Libro
            </Link>
            {book.home_page_id && (
              <>
                <Link href={`/books/${book.id}/pages/${book.home_page_id}`} style={btnStyle()}>
                  Vai a Runtime
                </Link>
                <Link href={`/builder/books/${book.id}/pages/${book.home_page_id}`} style={btnStyle()}>
                  Vai a Builder
                </Link>
              </>
            )}
          </div>
        }
      />
      <main style={{ padding: '20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1>{book.title}</h1>
          <div style={{ color: '#666', marginTop: '8px' }}>
            <strong>Lingua:</strong> {book.locale} | 
            <strong> Home Page:</strong> {book.home_page_id ? `Pagina ${book.home_page_id}` : 'Non impostata'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Pagine del Libro ({pages.length})</h2>
        </div>

        {pages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Nessuna pagina presente in questo libro.</p>
            <Link href={`/books/${book.id}/pages/new`} style={btnStyle('primary')}>
              Crea la prima pagina
            </Link>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Titolo</th>
                  <th style={thStyle}>Griglia</th>
                  <th style={thStyle}>Link</th>
                  <th style={thStyle}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {pages
                  .sort((a, b) => a.order - b.order)
                  .map(page => {
                    const isHome = book?.home_page_id === page.id;
                    return (
                      <tr key={page.id} style={{ 
                        ...trStyle, 
                        background: isHome ? "rgba(110,168,254,.08)" : "transparent" 
                      }}>
                        <td style={tdStyle}>
                          <strong>{page.order}</strong>
                        </td>
                        <td style={tdStyle}>
                          {page.title}
                          {isHome && <span style={{marginLeft:8, fontSize:12, opacity:.8}}>🏠 Home</span>}
                        </td>
                        <td style={tdStyle}>{page.grid_cols}×{page.grid_rows}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link href={`/books/${book.id}/pages/${page.id}`} style={btnStyle()}>
                              Runtime
                            </Link>
                            <Link href={`/builder/books/${book.id}/pages/${page.id}`} style={btnStyle()}>
                              Builder
                            </Link>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setAsHome(Number(params.bookId), page.id)}
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
                            <Link href={`/books/${book.id}/pages/${page.id}/edit`} style={btnStyle()}>
                              Modifica
                            </Link>
                            <button
                              onClick={() => handleDeletePage(page.id, page.title)}
                              style={{ ...btnStyle('danger'), border: 'none' }}
                            >
                              Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

// Utility styles
function btnStyle(variant?: 'primary' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'inline-block',
    textAlign: 'center',
    border: '1px solid #ddd',
    background: '#f8f9fa',
    color: '#333'
  };

  if (variant === 'primary') {
    return { ...base, background: '#007bff', color: 'white', border: '1px solid #007bff' };
  }
  if (variant === 'danger') {
    return { ...base, background: '#dc3545', color: 'white', border: '1px solid #dc3545' };
  }
  return base;
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  border: '1px solid #ddd',
  borderRadius: '8px',
  overflow: 'hidden'
};

const thStyle: React.CSSProperties = {
  background: '#f8f9fa',
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
  borderBottom: '1px solid #ddd'
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid #eee'
};

const trStyle: React.CSSProperties = {
  borderBottom: '1px solid #eee'
};