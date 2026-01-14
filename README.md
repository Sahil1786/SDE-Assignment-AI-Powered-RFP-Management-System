# AI-Powered RFP Management System

An intelligent Request for Proposal (RFP) management platform built with React, TypeScript, and Supabase. This system streamlines the RFP process by providing AI-powered proposal parsing, automated comparisons, and comprehensive vendor management.

## Features

### 🔐 Authentication
- Secure user authentication via Supabase
- Protected routes and user sessions

### 📋 RFP Management
- Create and manage RFPs (Request for Proposals)
- AI-powered RFP parsing and analysis
- Detailed RFP tracking and status management

### 🏢 Vendor Management
- Comprehensive vendor database
- Vendor profile management
- Proposal submission tracking

### 🤖 AI-Powered Analysis
- Automatic proposal parsing using AI
- Intelligent proposal comparison
- Smart scoring and evaluation metrics

### 📊 Comparisons & Analytics
- Side-by-side proposal comparisons
- Detailed comparison reports
- Data-driven decision making

### 💬 Interactive Chat
- RFP-specific chat functionality
- Real-time collaboration features

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router
- **Testing**: Vitest
- **Linting**: ESLint

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd express-love-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Supabase Setup**
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/`
   - Deploy the edge functions in `supabase/functions/`

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   ├── proposal/       # Proposal-related components
│   ├── rfp/           # RFP components
│   └── vendor/        # Vendor components
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/      # Supabase client and types
├── lib/                # Utility functions and types
├── pages/              # Page components
└── test/               # Test files
```

## Database Schema

The application uses Supabase with the following main tables:
- `rfps` - Request for Proposals
- `proposals` - Vendor proposals
- `vendors` - Vendor information
- `comparisons` - Proposal comparisons
- `users` - User accounts (managed by Supabase Auth)

## API Endpoints

### Supabase Edge Functions
- `parse-rfp` - AI-powered RFP parsing
- `parse-proposal` - AI-powered proposal parsing
- `compare-proposals` - Automated proposal comparison

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```




### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Support

For support, please contact the development team or create an issue in the repository.

## License

This project is licensed under the MIT License.
