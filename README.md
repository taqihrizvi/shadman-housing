# Welcome to your Shadman Housing project

## Project info

**URL**: https://Shadman Housing.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Shadman Housing**

Simply visit the [Shadman Housing Project](https://Shadman Housing.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Shadman Housing will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Shadman Housing.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment for local development
# Copy the example environment file to create your local config
Copy-Item .env.example .env.local
# Edit .env.local to point to your local backend (default: http://localhost:5000/api)

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev:local    # For local backend
# OR
npm run dev         # For production backend (testing)
```

## 🌍 Environment Configuration

This project supports multiple environments. See [ENV_SETUP.md](ENV_SETUP.md) for detailed configuration guide.

### Quick Start for Local Development

```powershell
# 1. Create local environment file
Copy-Item .env.example .env.local

# 2. Edit .env.local (it should point to http://localhost:5000/api by default)

# 3. Start development server
npm run dev:local
```

### Available Scripts

- `npm run dev:local` - Local development with local backend
- `npm run dev` - Development with production backend
- `npm run build` - Production build
- `npm run preview` - Preview production build

For more details, see [ENV_SETUP.md](ENV_SETUP.md).

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Shadman Housing](https://Shadman Housing.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Shadman Housing project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.Shadman Housing.dev/features/custom-domain#custom-domain)
