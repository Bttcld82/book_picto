'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getPage, updatePage, getBook, Book, Page } from '@/lib/api';

interface EditPageProps {
  params: {
    bookId: string;
    pageId: string;
  };
}

export default function EditPagePage({ params }: EditPageProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState('');
  const [gridCols, setGridCols] = useState(3);
  const [gridRows, setGridRows] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookData, pageData] = await Promise.all([
          getBook(params.bookId),
          getPage(params.pageId)
        ]);
        setBook(bookData);
        setPage(pageData);
        setTitle(pageData.title);
        setGridCols(pageData.grid_cols);
        setGridRows(pageData.grid_rows);
      } catch (err) {
        console.error('Error fetching data:', err);
        alert('Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.bookId, params.pageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Il titolo è obbligatorio');
      return;
    }

    if (gridCols < 1 || gridRows < 1) {
      alert('Le dimensioni della griglia devono essere almeno 1x1');
      return;
    }

    // Warning if grid size is reduced
    if (page && (gridCols < page.grid_cols || gridRows < page.grid_rows)) {
      if (!confirm('Riducendo le dimensioni della griglia potresti causare sovrapposizioni delle carte. Continuare?')) {
        return;
      }
    }

    setSaving(true);
    try {
      await updatePage(params.pageId, {
        title: title.trim(),
        grid_cols: gridCols,
        grid_rows: gridRows
      });
      
      alert('Pagina aggiornata con successo');
      router.push(`/books/${params.bookId}`);
    } catch (err) {
      console.error('Error updating page:', err);
      alert('Errore nell\'aggiornamento della pagina');
    } finally {
      setSaving(false);
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

  if (!book || !page) {
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
          <div>Dati non trovati</div>
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
          { label: book.title, href: `/books/${book.id}` },
          { label: `Modifica ${page.title}` }
        ]}
        right={null}
      />
      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Modifica Pagina</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Libro: <strong>{book.title}</strong>
        </p>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Titolo *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label htmlFor="gridCols" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Colonne Griglia
              </label>
              <input
                id="gridCols"
                type="number"
                min="1"
                max="10"
                value={gridCols}
                onChange={(e) => setGridCols(parseInt(e.target.value) || 1)}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>
            
            <div>
              <label htmlFor="gridRows" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Righe Griglia
              </label>
              <input
                id="gridRows"
                type="number"
                min="1"
                max="10"
                value={gridRows}
                onChange={(e) => setGridRows(parseInt(e.target.value) || 1)}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '6px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Griglia Attuale:</strong> {page.grid_cols}×{page.grid_rows} → 
              <strong> Nuova:</strong> {gridCols}×{gridRows}
            </div>
            {(gridCols < page.grid_cols || gridRows < page.grid_rows) && (
              <div style={{ color: '#dc3545', fontSize: '14px' }}>
                ⚠️ Attenzione: riducendo la griglia potresti causare sovrapposizioni delle carte
              </div>
            )}
          </div>

          <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 20px', borderRadius: '6px', background: '#007bff',
                color: 'white', border: 'none', cursor: 'pointer'
              }}
            >
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
            
            <Link
              href={`/books/${book.id}`}
              style={{
                padding: '12px 20px', borderRadius: '6px', background: '#f8f9fa',
                color: '#333', textDecoration: 'none', display: 'inline-block'
              }}
            >
              Annulla
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}