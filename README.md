# Metronome

A precise, web-based metronome application built with React, TypeScript, and the Web Audio API. Features accurate audio timing, offline support, and preset management.

## Features

- **Accurate Timing:** Look-ahead scheduling using Web Audio API ensures sample-accurate clicks
- **Flexible Controls:** Tempo range 30-600 BPM, full time signature support (1-99 beats per bar, all power-of-2 beat units)
- **Visual Feedback:** Beat indicator synchronized to audio with compound meter accents
- **Mobile Optimized:** Touch-friendly interface designed for phones and tablets

## Prerequisites

- **Node.js:** 20.x or higher
- **pnpm:** 9.x or higher (install with `npm install -g pnpm`)

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd metronome

# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
# Create an optimized production build
pnpm run build

# Preview the production build locally
pnpm run preview
```

## Deployment

### Deploying to Vercel

This project is configured for seamless deployment to Vercel using their GitHub integration.

#### Initial Setup

1. **Import the project in Vercel:**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Select "Import Git Repository"
   - Choose this repository from your connected GitHub account
   - Vercel will automatically detect the framework and use the configuration from [vercel.json](vercel.json)

2. **Configure the project (if needed):**
   - Framework Preset: Vite (auto-detected)
   - Build Command: `pnpm run build` (configured in vercel.json)
   - Output Directory: `dist` (configured in vercel.json)
   - Install Command: `pnpm install --frozen-lockfile` (configured in vercel.json)

3. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy your application

#### Automatic Deployments

Once set up, Vercel will automatically:

- Deploy the `main` branch to production on every push
- Create preview deployments for all pull requests
- Run the build process and quality checks

#### Verifying Deployment

After deployment:

1. Visit your Vercel project URL
2. Test the metronome functionality
3. Verify the PWA installs correctly (when PWA features are implemented in Phase 7)
4. Check that all assets load correctly

**Note:** The GitHub Actions CI workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml) runs quality checks (lint, build, format) on every push, ensuring code quality before Vercel deployment.

## Available Scripts

| Script                  | Description                           |
| ----------------------- | ------------------------------------- |
| `pnpm run dev`          | Start development server on port 5173 |
| `pnpm run build`        | Build for production                  |
| `pnpm run preview`      | Preview production build locally      |
| `pnpm run lint`         | Run ESLint to check code quality      |
| `pnpm run format`       | Format code with Prettier             |
| `pnpm run format:check` | Check if code is formatted correctly  |

## Running Quality Checks Locally

Before submitting a pull request, ensure all checks pass:

```bash
# Run all checks
pnpm run lint
pnpm run format:check
pnpm run build
```

**CI Status:** The GitHub Actions workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml) runs these same checks automatically on every push and pull request.

## Development with GitHub Codespaces

This project includes a devcontainer configuration for one-click development in the cloud:

1. Open the repository in GitHub
2. Click "Code" → "Codespaces" → "Create codespace on main"
3. Wait for the container to build (Node.js 20+ and pnpm will be installed automatically)
4. Once the container is ready, the terminal will be available
5. Install dependencies: `pnpm install`
6. Start the dev server: `pnpm run dev`
7. Codespaces will automatically forward port 5173 and provide a URL
8. Open the forwarded URL to access the application

**DevContainer Configuration:** See [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) for the complete setup.

## Local Development with VS Code DevContainer

If you have Docker installed locally, you can use the same devcontainer setup:

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code
2. Open this repository in VS Code
3. Press `F1` and select "Dev Containers: Reopen in Container"
4. VS Code will build the container and reload the workspace inside it
5. Run `pnpm install` and `pnpm run dev` in the integrated terminal

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture and component overview
- [AUDIO_ENGINE.md](docs/AUDIO_ENGINE.md) - Audio timing implementation and look-ahead scheduling
- [TIME_SIGNATURES.md](docs/TIME_SIGNATURES.md) - Time signature support and accent patterns
- [DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) - Phased development roadmap
- [CLAUDE_CODE_GUIDE.md](docs/CLAUDE_CODE_GUIDE.md) - Guide to using Claude Code with this project

## Technology Stack

- **React 18+** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite 5+** - Build tool and development server
- **Tailwind CSS v4** - Utility-first styling
- **Web Audio API** - Precise audio timing
- **Dexie.js** - IndexedDB wrapper for structured storage
- **vite-plugin-pwa** - Progressive Web App support

## Browser Support

- Chrome/Edge 90+ (Chromium)
- Firefox 88+
- Safari 14+ (iOS 14+)

All target browsers support Web Audio API, Service Workers, and IndexedDB.

## Project Structure

```text
metronome/
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # System architecture
│   ├── AUDIO_ENGINE.md      # Audio timing details
│   ├── TIME_SIGNATURES.md   # Time signature support
│   └── DEVELOPMENT_PLAN.md  # Development roadmap
├── src/                     # Source code
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── .devcontainer/           # Codespaces configuration
```

## Contributing

1. Follow the phased development plan in [DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)
2. Ensure all quality checks pass before submitting PRs
3. Update documentation when adding or modifying features
4. Keep the CI pipeline green (no failing workflows)

## License

[License information to be added]

## Acknowledgments

Audio scheduling approach inspired by Chris Wilson's "A Tale of Two Clocks" and the Web Audio API scheduling guide.
