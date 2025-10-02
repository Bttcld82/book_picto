'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { listBooks, deleteBook, Book } from '@/lib/api';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksData = await listBooks();
        setBooks(booksData);
      } catch (err) {
        console.error('Error fetching books:', err);
        alert('Errore nel caricamento dei libri');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il libro "${title}"? Verranno eliminate anche tutte le pagine e carte associate.`)) {
      return;
    }

    try {
      await deleteBook(id);
      setBooks(books.filter(book => book.id !== id));
      alert('Libro eliminato con successo');
    } catch (err) {
      console.error('Error deleting book:', err);
      alert('Errore nell\'eliminazione del libro');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar
          brand="Book Picto"
          breadcrumbs={[{ label: 'Libri', href: '/books' }]}
          right={null}
        />
        <main style={{ padding: '20px' }}>
          <div>Caricamento...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar
        brand="Book Picto"
        breadcrumbs={[{ label: 'Libri', href: '/books' }]}
        right={
          <Link key="new" href="/books/new" style={btnStyle('primary')}>
            Nuovo Libro
          </Link>
        }
      />
      <main style={{ padding: '20px' }}>
        <h1>Gestione Libri</h1>
        
        {books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Nessun libro presente.</p>
            <Link href="/books/new" style={btnStyle('primary')}>
              Crea il tuo primo libro
            </Link>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Titolo</th>
                  <th style={thStyle}>Locale</th>
                  <th style={thStyle}>Home Page</th>
                  <th style={thStyle}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book.id} style={trStyle}>
                    <td style={tdStyle}>
                      <strong>{book.title}</strong>
                    </td>
                    <td style={tdStyle}>{book.locale}</td>
                    <td style={tdStyle}>
                      {book.home_page_id ? `Pagina ${book.home_page_id}` : 'Non impostata'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/books/${book.id}`} style={btnStyle()}>
                          Apri
                        </Link>
                        <Link href={`/books/${book.id}/edit`} style={btnStyle()}>
                          Modifica
                        </Link>
                        <button
                          onClick={() => handleDelete(book.id, book.title)}
                          style={{ ...btnStyle('danger'), border: 'none' }}
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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