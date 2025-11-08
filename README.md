# Personal Cookbook App

A React-based personal cookbook application with recipe management, authentication, and GitHub Pages deployment. Inspired by [https://www.awwwards.com/inspiration/recipe-cards-agency-eats]()

## Features

- 🍳 Recipe management (add, edit, delete, pin recipes)
- 🔐 Simple admin/guest authentication system
- 📱 Responsive design with lined paper aesthetic
- 🛒 Shopping list functionality for pinned recipes
- 📊 Portion scaling with ingredient adjustment
- 🌐 Recipe scraping from URLs
- 💾 Export/import recipes as JSON
- 🎨 Custom styling with Google Fonts

## Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Open [http://localhost:3000](http://localhost:3000)

### Making Changes

When you make changes to the code:

1. **Test locally first:**
   ```bash
   npm start
   ```

2. **Build and deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

This will automatically:
- Build the production version
- Deploy to the `gh-pages` branch
- Update your live site at `https://clairehuang.github.io/cookbook`

### Authentication
- Admin password is hashed for security
- Default admin access allows recipe editing
- Guest mode provides read-only access

### Data Storage
- Recipes stored in browser localStorage
- Automatic backup system prevents data loss
- Export/import functionality for manual backups

## Deployment

The app is configured for GitHub Pages deployment:
- Homepage: `https://amidthestars.github.io/cookbook`
- Automatic deployment via `npm run deploy`
- Static files served from `gh-pages` branch

## Available Scripts

- `npm start` - Development server
- `npm run build` - Production build
- `npm run deploy` - Build and deploy to GitHub Pages
- `npm test` - Run tests

## Tech Stack

- React 19 with TypeScript
- Material-UI components
- Web Crypto API for authentication
- GitHub Pages for hosting
- localStorage for data persistence
