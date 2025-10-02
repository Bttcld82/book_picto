'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { createBook } from '@/lib/api';

export default function NewBookPage() {
  const [title, setTitle] = useState('');
  const [locale, setLocale] = useState('it-IT');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Il titolo è obbligatorio');
      return;
    }

    setLoading(true);
    try {
      const newBook = await createBook({ title: title.trim(), locale });
      alert('Libro creato con successo');
      router.push(`/books/${newBook.id}`);
    } catch (err) {
      console.error('Error creating book:', err);
      alert('Errore nella creazione del libro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar
        brand="Book Picto"
        breadcrumbs={[
          { label: 'Libri', href: '/books' },
          { label: 'Nuovo Libro' }
        ]}
        right={null}
      />
      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Crea Nuovo Libro</h1>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div style={fieldStyle}>
            <label htmlFor="title" style={labelStyle}>
              Titolo *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Inserisci il titolo del libro"
              style={inputStyle}
              required
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="locale" style={labelStyle}>
              Lingua
            </label>
            <select
              id="locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              style={inputStyle}
            >
              <option value="it-IT">Italiano</option>
              <option value="en-US">English</option>
              <option value="es-ES">Español</option>
              <option value="fr-FR">Français</option>
              <option value="de-DE">Deutsch</option>
            </select>
          </div>

          <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={btnStyle('primary')}
            >
              {loading ? 'Creazione...' : 'Crea Libro'}
            </button>
            
            <Link href="/books" style={btnStyle()}>
              Annulla
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}

// Utility styles
function btnStyle(variant?: 'primary'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '12px 20px',
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
  return base;
}

const fieldStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: 'bold',
  color: '#333'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
  boxSizing: 'border-box'
};