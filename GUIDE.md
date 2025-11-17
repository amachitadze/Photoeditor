
# avma - AI Photo Editor Guide

This guide provides an overview of the project structure, deployment instructions, and references for developers.

## 1. Project Map

Here's a breakdown of the key files and directories in this project:

- **`dist/`**: This directory is created during the build process (`npm run build`) and contains all the static assets that will be deployed.
- **`src/components/`**: Contains all reusable React components used throughout the application. Each component is in its own file.
- **`src/services/`**: This directory holds the `geminiService.ts` file, which is responsible for all interactions with the Google Gemini API.
- **`App.tsx`**: The main application component that orchestrates the entire UI and state management.
- **`index.tsx`**: The entry point of the React application, which Vite uses to start building the app.
- **`index.html`**: The main HTML template file. Vite injects the necessary scripts and assets into it during the build.
- **`package.json`**: Defines project dependencies, and scripts (like `dev`, `build`).
- **`vite.config.ts`**: The configuration file for Vite, the build tool used by this project.
- **`tsconfig.json`**: The configuration file for TypeScript.
- **`vercel.json`**: Configuration file specifically for deploying the application to Vercel.
- **`GUIDE.md`**: This guide file.

## 2. Deployment Instructions

### Deploying to Vercel

This project is configured for easy deployment to Vercel using Vite.

**Prerequisites:**
- A [Vercel](https://vercel.com) account.
- The project code pushed to a Git repository (GitHub, GitLab, or Bitbucket).

**Steps:**
1.  **Log in to Vercel** and go to your dashboard.
2.  Click the **"Add New..."** button and select **"Project"**.
3.  **Import your Git Repository** by selecting it from the list.
4.  **Configure Project:**
    - Vercel will automatically detect that you are using Vite and configure the build settings correctly:
      - **Framework Preset:** `Vite`
      - **Build Command:** `npm run build` or `vite build`
      - **Output Directory:** `dist`
    - Before deploying, you must add your Gemini API key. Go to the **"Environment Variables"** section.
    - Add a new variable with the following details:
      - **Name:** `VITE_API_KEY`
      - **Value:** Paste your actual Gemini API key here.
    > **Important Note on API Keys:** For security, Vite requires that environment variables exposed to the browser be prefixed with `VITE_`. This key will be embedded directly into your application's public code during the build process. For a production-grade application with sensitive keys, it's recommended to use a backend proxy to keep the API key secure.

5.  Click the **"Deploy"** button. Vercel will build and deploy your application. Once complete, you will be provided with a live URL.

## 3. Style Reference

The application uses Tailwind CSS. Custom colors are defined in `index.html` within the `tailwind.config` script tag.

### Primary Colors
- `primary-100`: `#DBEAFE`
- `primary-200`: `#BFDBFE`
- `primary-400`: `#60A5FA`
- `primary-500`: `#3B82F6` (Main Accent)
- `primary-600`: `#2563EB`

### Slate (Grayscale)
- `slate-50` to `slate-900` are available for various shades of gray.

### Accent Colors
- `accent-green`: `#10B981` (Used for "Apply" buttons)

## 4. Icon Reference

All icons are SVG-based React components located in `src/components/icons.tsx`.
