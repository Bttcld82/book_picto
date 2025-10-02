'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { createPage, getBook, listPages, Book } from '@/lib/api';

interface NewPageProps {
  params: {
    bookId: string;
  };
}

export default function NewPagePage({ params }: NewPageProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [title, setTitle] = useState('');
  const [gridCols, setGridCols] = useState(3);
  const [gridRows, setGridRows] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const bookData = await getBook(params.bookId);
        setBook(bookData);
      } catch (err) {
        console.error('Error fetching book:', err);
        alert('Errore nel caricamento del libro');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [params.bookId]);

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

    setSaving(true);
    try {
      // Get next order number
      const pages = await listPages(params.bookId);
      const nextOrder = pages.length > 0 ? Math.max(...pages.map((p: any) => p.order)) + 1 : 1;

      const newPage = await createPage({
        book_id: parseInt(params.bookId),
        title: title.trim(),
        grid_cols: gridCols,
        grid_rows: gridRows,
        order: nextOrder
      });
      
      alert('Pagina creata con successo');
      router.push(`/books/${params.bookId}`);
    } catch (err) {
      console.error('Error creating page:', err);
      alert('Errore nella creazione della pagina');
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
          { label: 'Nuova Pagina' }
        ]}
        right={null}
      />
      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Crea Nuova Pagina</h1>
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
              placeholder="Inserisci il titolo della pagina"
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
            <strong>Anteprima Griglia: {gridCols}×{gridRows}</strong>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gap: '2px',
              marginTop: '8px',
              maxWidth: '200px'
            }}>
              {Array.from({ length: gridCols * gridRows }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '20px',
                    height: '20px',
                    background: '#007bff',
                    borderRadius: '2px'
                  }}
                />
              ))}
            </div>
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
              {saving ? 'Creazione...' : 'Crea Pagina'}
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