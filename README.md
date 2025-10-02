# Book Picto - AAC Builder

[![GitHub Repository](https://img.shields.io/badge/GitHub-book__picto-blue?logo=github)](https://github.com/Bttcld82/book_picto)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.0-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi)](https://fastapi.tiangolo.com)

**Book Picto** is a modern Augmentative and Alternative Communication (AAC) system that allows users to create, manage, and use pictorial communication boards. The system consists of a **Builder** for creating and editing communication cards and a **Runtime** for end-users to communicate using the created boards.

## 🚀 Features

### 📚 Multi-Book Management
- **Complete CRUD operations** for books and pages
- **Home page assignment** for each book
- **Book organization** with locale support
- **Search functionality** across books

### 🎨 Visual Builder
- **Drag-and-drop interface** for card arrangement
- **Grid-based layout** system with customizable dimensions
- **Image upload and management** for cards
- **Card properties panel** with real-time editing
- **Page linking system** for navigation between pages

### 🎮 Runtime Environment
- **Touch-friendly interface** for end users
- **Card pronunciation** and interaction
- **Page navigation** with linked cards
- **Responsive design** for various devices

### 🔧 Advanced Features
- **Set Home Page** functionality with visual indicators
- **Card-to-page linking** with navigation buttons
- **Breadcrumb navigation** system
- **Export/Import** functionality for books
- **Real-time updates** with optimistic UI

## 🏗️ Architecture

### Backend (FastAPI)
- **RESTful API** with comprehensive endpoints
- **SQLAlchemy ORM** with SQLite database
- **File upload handling** for images
- **Data validation** with Pydantic schemas
- **Docker containerization**

### Frontend (Next.js)
- **Server-side rendering** with Next.js 14
- **TypeScript** for type safety
- **Component-based architecture**
- **CSS Modules** for styling
- **API client** with error handling

## 🛠️ Installation & Setup

### Prerequisites
- **Docker** and **Docker Compose**
- **Git**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bttcld82/book_picto.git
   cd book_picto
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

### Development Setup

1. **Backend Development**
   ```bash
   cd backend
   pip install -e .
   uvicorn app.main:app --reload
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📖 Usage

### Creating Your First Book

1. **Navigate to Homepage** (http://localhost:3000)
2. **Click "Nuovo libro"** to create a new book
3. **Fill in book details** (title, locale)
4. **Add pages** using "Nuova Pagina" button
5. **Set a home page** using "Imposta Home" button

### Building Communication Cards

1. **Access Builder** via "Builder" button
2. **Click empty slots** to create new cards
3. **Upload images** by drag-drop or clicking upload area
4. **Edit card properties** in the right panel
5. **Link cards to pages** using the dropdown menu
6. **Use drag handles** to reposition cards

### Using Runtime Mode

1. **Access Runtime** via "Runtime" button
2. **Click cards** to hear pronunciation
3. **Navigate between pages** using linked cards
4. **Use breadcrumbs** for quick navigation

## 📁 Project Structure

```
book_picto/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── core/           # Configuration
│   └── Dockerfile
├── frontend/               # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # Reusable components
│   ├── lib/              # API client and utilities
│   └── Dockerfile
├── docker-compose.yml     # Container orchestration
└── README.md             # This file
```

## 🌐 API Endpoints

### Books
- `GET /api/books` - List all books
- `POST /api/books` - Create new book
- `GET /api/books/{id}` - Get book details
- `PATCH /api/books/{id}` - Update book (including home page)
- `DELETE /api/books/{id}` - Delete book

### Pages
- `GET /api/pages` - List pages (with book_id filter)
- `POST /api/pages` - Create new page
- `PATCH /api/pages/{id}` - Update page
- `DELETE /api/pages/{id}` - Delete page

### Cards
- `GET /api/cards` - List cards (with page_id filter)
- `POST /api/cards` - Create new card
- `PATCH /api/cards/{id}` - Update card (including target_page_id)
- `DELETE /api/cards/{id}` - Delete card

### Assets
- `POST /api/assets` - Upload image
- `GET /api/assets/{id}` - Get asset details
- `DELETE /api/assets/{id}` - Delete asset

## 🎯 Key Components

### Navbar Component
- **Dynamic breadcrumbs** based on current page
- **Brand linking** to homepage
- **Action slots** for page-specific buttons
- **Responsive navigation** tabs

### BookCard Component
- **Book information display** with page count
- **Action buttons** (Runtime, Builder, Details)
- **Reusable design** for homepage and lists

### DraggableCard Component
- **Drag handles** for repositioning
- **Image upload** via drag-drop or click
- **Selection state** management
- **Navigation buttons** for linked pages

## 🔄 Recent Updates

### Homepage Buttons Implementation
- ✅ **Set Home Page** buttons in book page lists
- ✅ **Home page indicators** with 🏠 icon
- ✅ **Link to Page** dropdown in Builder properties
- ✅ **Navigation buttons** (↗) on cards with links
- ✅ **Optimistic UI updates** for better UX

### Multi-Book System
- ✅ **Complete CRUD** for books and pages
- ✅ **Routing structure** for all operations
- ✅ **Form validation** and error handling
- ✅ **Confirmation dialogs** for destructive actions

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AAC Community** for inspiration and requirements
- **FastAPI** and **Next.js** teams for excellent frameworks
- **Docker** for containerization support

## 📞 Support

For support, issues, or feature requests, please [open an issue](https://github.com/Bttcld82/book_picto/issues) on GitHub.

---

**Made with ❤️ for the AAC community**