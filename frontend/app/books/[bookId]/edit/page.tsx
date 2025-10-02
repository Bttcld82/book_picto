'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getBook, updateBook, listPages, Book, Page } from '@/lib/api';

interface EditBookProps {
  params: {
    bookId: string;
  };
}

export default function EditBookPage({ params }: EditBookProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [title, setTitle] = useState('');
  const [locale, setLocale] = useState('it-IT');
  const [homePageId, setHomePageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setTitle(bookData.title);
        setLocale(bookData.locale);
        setHomePageId(bookData.home_page_id || null);
      } catch (err) {
        console.error('Error fetching data:', err);
        alert('Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.bookId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Il titolo è obbligatorio');
      return;
    }

    setSaving(true);
    try {
      await updateBook(params.bookId, {
        title: title.trim(),
        locale,
        home_page_id: homePageId
      });
      alert('Libro aggiornato con successo');
      router.push(`/books/${params.bookId}`);
    } catch (err) {
      console.error('Error updating book:', err);
      alert('Errore nell\'aggiornamento del libro');
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
          { label: 'Modifica' }
        ]}
        right={null}
      />
      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Modifica Libro</h1>
        
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

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="locale" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Lingua
            </label>
            <select
              id="locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
            >
              <option value="it-IT">Italiano</option>
              <option value="en-US">English</option>
              <option value="es-ES">Español</option>
              <option value="fr-FR">Français</option>
              <option value="de-DE">Deutsch</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="homePage" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Pagina Home
            </label>
            <select
              id="homePage"
              value={homePageId || ''}
              onChange={(e) => setHomePageId(e.target.value ? parseInt(e.target.value) : null)}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
            >
              <option value="">Nessuna pagina home</option>
              {pages.sort((a, b) => a.order - b.order).map(page => (
                <option key={page.id} value={page.id}>
                  {page.order}. {page.title}
                </option>
              ))}
            </select>
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