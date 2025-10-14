# MyNotes with Ollama

An AI-powered personal knowledge management system built with Astro, featuring Ollama integration for intelligent chat, semantic search, and note management.

![MyNotes](https://img.shields.io/badge/Astro-5.14.4-FF5D01?style=flat-square&logo=astro)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=flat-square&logo=tailwind-css)
![Ollama](https://img.shields.io/badge/Ollama-AI-000000?style=flat-square)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Voice Input](https://img.shields.io/badge/Voice--to--Text-Enabled-00C851?style=flat-square&logo=speech-recognition)

## ✨ Features

### 🎤 Voice-to-Text Capabilities

- **Voice Input**: Speak your notes directly using browser speech recognition
- **Multi-Language Support**: 10+ languages including English, Spanish, French, German, and more
- **Voice Commands**: Control punctuation and formatting with voice ("period", "comma", "new line")
- **Real-time Transcription**: See your words appear as you speak
- **Smart Text Processing**: Automatic punctuation and formatting
- **Dynamic Target Detection**: Automatically switches between different text fields

### 🤖 AI-Powered Intelligence

- **Ollama Integration**: Chat with local AI models using Ollama
- **Semantic Search**: AI-powered search that understands meaning and context
- **Smart Tag Suggestions**: AI-generated tags for better note organization
- **Related Notes**: Discover connections between your notes automatically

### 📝 Note Management

- **Create & Edit Notes**: Rich text note creation with markdown support
- **Voice Note Creation**: Dictate notes hands-free for faster content creation
- **Tag System**: Organize notes with custom tags and AI suggestions
- **Search & Filter**: Find notes quickly with text and semantic search
- **CRUD Operations**: Full create, read, update, delete functionality

### 🎨 Modern Interface

- **Dark Mode**: Beautiful dark/light theme toggle
- **Responsive Design**: Works perfectly on desktop and mobile
- **Server Islands**: Interactive server-side components
- **Tailwind CSS**: Modern, utility-first styling
- **Accessibility**: WCAG AA compliant with full keyboard navigation and screen reader support
- **Semantic HTML**: Proper landmarks and ARIA attributes for assistive technologies
- **Skip Links**: Keyboard navigation shortcuts for efficient browsing

### 🔍 Advanced Search

- **Text Search**: Fast keyword matching with relevance scoring
- **AI Semantic Search**: Understands meaning and finds conceptually related content
- **Tag Filtering**: Search by tags and categories
- **Real-time Results**: Instant search feedback

### ♿ Accessibility Features

- **WCAG AA Compliance**: Meets Web Content Accessibility Guidelines standards
- **Screen Reader Support**: Proper ARIA labels and semantic HTML structure
- **Keyboard Navigation**: Full keyboard accessibility with skip links
- **High Contrast**: Optimized color schemes for better visibility
- **Voice Input**: Hands-free note creation with multi-language support
- **Focus Management**: Clear focus indicators for all interactive elements

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Ollama installed and running locally
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/randy-tarasevich/personal-wiki.git
   cd personal-wiki
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start Ollama** (in a separate terminal)

   ```bash
   ollama serve
   ```

4. **Pull a model** (e.g., Llama 2)

   ```bash
   ollama pull llama2
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:4327`

## 🛠️ Technology Stack

- **Framework**: [Astro](https://astro.build/) - Modern static site generator
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **AI Integration**: [Ollama](https://ollama.ai/) - Local AI model runner
- **Database**: SQLite with `better-sqlite3`
- **Icons**: Heroicons for beautiful SVG icons
- **Deployment**: Server-side rendering with Astro

## 📁 Project Structure

```
mynotes/
├── src/
│   ├── components/          # Reusable Astro components
│   │   ├── ChatInterface.astro
│   │   ├── DarkModeToggle.astro
│   │   ├── VoiceInput.astro
│   │   └── RelatedNotes.astro
│   ├── lib/                 # Database and utilities
│   │   └── db.js
│   ├── pages/               # Astro pages and API routes
│   │   ├── api/             # API endpoints
│   │   │   ├── chat.js
│   │   │   ├── notes.js
│   │   │   ├── search.js
│   │   │   ├── suggest-tags.js
│   │   │   └── related-notes.js
│   │   ├── note/            # Dynamic note pages
│   │   │   └── [slug]/
│   │   │       └── edit.astro
│   │   ├── index.astro       # Home page
│   │   ├── new-note.astro    # Create note page
│   │   ├── notes.astro       # All notes page
│   │   └── search.astro      # Search page
│   ├── styles/              # Global styles
│   │   └── global.css
│   └── utils/               # Server state management
│       └── serverState.js
├── public/                  # Static assets
├── astro.config.mjs        # Astro configuration
├── package.json
└── README.md
```

## 🎯 Usage

### Creating Notes

1. Click "New Note" or navigate to `/new-note`
2. Enter a title and content
3. Add tags manually or use AI suggestions
4. Save your note

### Searching Notes

1. Use the search bar in the navigation
2. Choose between text search and AI semantic search
3. View results with relevance scoring
4. Click on notes to view full content

### AI Chat

1. Use the chat interface on the home page
2. Select an AI model (requires Ollama running)
3. Chat with the AI about your notes and knowledge
4. Get intelligent responses and insights

### Voice Input

1. Click the microphone icon in the voice input controls
2. Allow microphone permissions when prompted
3. Speak clearly and naturally
4. Use voice commands for punctuation ("period", "comma", "new line")
5. Click stop when finished speaking

## 🔧 Configuration

### Ollama Models

The application works with various Ollama models. Popular choices:

- `llama3` - Latest general purpose model (default)
- `llama2` - General purpose, good for chat and analysis
- `codellama` - Specialized for code-related content
- `mistral` - Fast and efficient for general tasks
- `gemma` - Google's efficient model family
- `phi3` - Microsoft's compact model
- `neural-chat` - Conversational AI model
- `orca-mini` - Lightweight conversational model

### Database

The SQLite database is automatically created on first run. It includes:

- `notes` table for note content
- `tags` table for tag management
- `note_tags` table for many-to-many relationships

## 🚀 Deployment

### Local Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

### Deployment Options

- **Vercel**: Zero-config deployment for Astro
- **Netlify**: Static site hosting with serverless functions
- **GitHub Pages**: Free hosting for public repositories
- **Self-hosted**: Run on your own server with Node.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Astro](https://astro.build/) for the amazing framework
- [Ollama](https://ollama.ai/) for local AI capabilities
- [Tailwind CSS](https://tailwindcss.com/) for beautiful styling
- [Heroicons](https://heroicons.com/) for the icon set

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/randy-tarasevich/personal-wiki/issues) page
2. Create a new issue with detailed information
3. Make sure Ollama is running and accessible

---

**Built with ❤️ using Astro, Ollama, and modern web technologies**

---

## 🆕 Recent Updates

- **Rebranded** from "Personal Wiki" to "MyNotes" for better clarity
- **Enhanced Accessibility** with WCAG AA compliance and screen reader support
- **Improved Dark Mode** with proper text contrast and visibility
- **Added 17 AI Models** including llama3, gemma, phi3, and more
- **Voice Input Improvements** with better multi-language support
- **Semantic HTML** structure for better assistive technology compatibility
