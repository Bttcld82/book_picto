import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
});

// Types
export interface Book {
  id: number;
  title: string;
  locale: string;
  home_page_id?: number;
}

export interface Page {
  id: number;
  book_id: number;
  title: string;
  grid_cols: number;
  grid_rows: number;
  order: number;
}

export interface Card {
  id: number;
  page_id: number;
  slot_row: number;
  slot_col: number;
  row_span: number;
  col_span: number;
  label: string;
  image_id?: number;
  target_page_id?: number;
}

export interface Asset {
  id: number;
  kind: string;
  url: string;
  alt?: string;
}

export interface RuntimeCard extends Card {
  image?: Asset;
  target_page?: { id: number; title: string };
}

export interface RuntimeData {
  book: Book;
  page: Page;
  cards: RuntimeCard[];
}

// API functions
export const bookApi = {
  list: () => api.get<Book[]>('/api/books'),
  get: (id: number) => api.get<Book>(`/api/books/${id}`),
  create: (data: Omit<Book, 'id'>) => api.post<Book>('/api/books', data),
  update: (id: number, data: Partial<Book>) => api.patch<Book>(`/api/books/${id}`, data),
  delete: (id: number) => api.delete(`/api/books/${id}`),
};

export const pageApi = {
  list: (bookId?: number) => api.get<Page[]>('/api/pages', { params: { book_id: bookId } }),
  get: (id: number) => api.get<Page>(`/api/pages/${id}`),
  create: (data: Omit<Page, 'id'>) => api.post<Page>('/api/pages', data),
  update: (id: number, data: Partial<Page>) => api.patch<Page>(`/api/pages/${id}`, data),
  delete: (id: number) => api.delete(`/api/pages/${id}`),
};

export const cardApi = {
  list: (pageId?: number) => api.get<Card[]>('/api/cards', { params: { page_id: pageId } }),
  get: (id: number) => api.get<Card>(`/api/cards/${id}`),
  create: (data: Omit<Card, 'id'>) => api.post<Card>('/api/cards', data),
  update: (id: number, data: Partial<Card>) => api.patch<Card>(`/api/cards/${id}`, data),
  delete: (id: number) => api.delete(`/api/cards/${id}`),
};

export const assetApi = {
  list: () => api.get<Asset[]>('/api/assets'),
  get: (id: number) => api.get<Asset>(`/api/assets/${id}`),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Asset>('/api/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: number) => api.delete(`/api/assets/${id}`),
};

export const runtimeApi = {
  getPage: (bookId: number, pageId: number) => 
    api.get<RuntimeData>(`/api/runtime/books/${bookId}/pages/${pageId}`),
};

export const exportImportApi = {
  exportJson: (bookId: number) => api.get(`/api/export/${bookId}`),
  exportZip: (bookId: number) => {
    return api.get(`/api/export_zip/${bookId}`, {
      responseType: 'blob',
    });
  },
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Additional API functions as requested in instructions
const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// BOOKS - simplified direct fetch functions
export async function listBooks() { 
  const r = await fetch(`${API}/api/books`, { cache: "no-store" });
  if (!r.ok) throw new Error("listBooks failed");
  return r.json(); 
}

export async function createBook(payload: { title: string; locale?: string }) {
  const r = await fetch(`${API}/api/books`, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(payload) 
  });
  if (!r.ok) throw new Error("createBook failed");
  return r.json();
}

export async function getBook(id: number | string) { 
  return (await fetch(`${API}/api/books/${id}`)).json(); 
}

export async function updateBook(id: number | string, patch: any) {
  return (await fetch(`${API}/api/books/${id}`, { 
    method: "PATCH", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(patch) 
  })).json();
}

export async function deleteBook(id: number | string) {
  const r = await fetch(`${API}/api/books/${id}`, { method: "DELETE" }); 
  if (!r.ok) throw new Error("delete book failed");
}

// PAGES - simplified direct fetch functions
export async function listPages(bookId: number | string) {
  const r = await fetch(`${API}/api/pages?book_id=${bookId}`, { cache: "no-store" });
  if (!r.ok) throw new Error("listPages failed");
  return r.json();
}

export async function createPage(payload: { book_id: number; title: string; grid_cols?: number; grid_rows?: number; order?: number }) {
  return (await fetch(`${API}/api/pages`, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(payload) 
  })).json();
}

export async function getPage(id: number | string) { 
  return (await fetch(`${API}/api/pages/${id}`)).json(); 
}

export async function updatePage(id: number | string, patch: any) {
  return (await fetch(`${API}/api/pages/${id}`, { 
    method: "PATCH", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(patch) 
  })).json();
}

export async function deletePage(id: number | string) {
  const r = await fetch(`${API}/api/pages/${id}`, { method: "DELETE" }); 
  if (!r.ok) throw new Error("delete page failed");
}

// CARDS - simplified direct fetch functions
export async function listCards(pageId: number | string) {
  const r = await fetch(`${API}/api/cards?page_id=${pageId}`, { cache: "no-store" });
  if (!r.ok) throw new Error("listCards failed");
  return r.json();
}

export async function createCard(payload: { page_id: number; slot_row: number; slot_col: number; row_span: number; col_span: number; label: string; image_id?: number; target_page_id?: number }) {
  return (await fetch(`${API}/api/cards`, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(payload) 
  })).json();
}

export async function getCard(id: number | string) { 
  return (await fetch(`${API}/api/cards/${id}`)).json(); 
}

export async function patchCard(id: number | string, patch: any) {
  const r = await fetch(`${API}/api/cards/${id}`, { 
    method: "PATCH", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(patch) 
  });
  if (!r.ok) throw new Error("patchCard failed");
  return r.json();
}

export async function deleteCard(id: number | string) {
  const r = await fetch(`${API}/api/cards/${id}`, { method: "DELETE" }); 
  if (!r.ok) throw new Error("delete card failed");
}