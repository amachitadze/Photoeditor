
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
- **`.gitignore`**: A crucial file that tells Git to ignore specific files and folders, like `node_modules` and, most importantly, `.env.local`, to prevent secret keys from being committed.
- **`GUIDE.md`**: This guide file.

## 2. Development & Deployment

### Local Development Setup (IMPORTANT)

To run the application on your local machine and fix the "API Key must be set" error, you must provide your Gemini API key locally.

**Follow these steps:**

1.  **Create a local environment file:** In the root directory of the project (the same folder where `package.json` is), create a new file and name it **`.env.local`**.
2.  **Add your API key:** Open the new `.env.local` file and add the following line. Make sure to replace `YOUR_API_KEY_HERE` with your actual Gemini API key from the Google AI Studio dashboard.

    ```
    VITE_API_KEY=YOUR_API_KEY_HERE
    ```

3.  **Restart your server:** If the development server (`npm run dev`) is already running, you **must stop it** (press `Ctrl+C` in the terminal) and start it again by running `npm run dev`. Vite only loads environment variables on startup.

> **Security Note:** The `.env.local` file is listed in `.gitignore`, which means it will **never** be uploaded to your Git repository. This keeps your secret API key safe and private.

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
    - Before deploying, you must add your Gemini API key. Go to the **Settings > Environment Variables** section in your Vercel project.
    - Add a new variable with the following details:
      - **Name:** `VITE_API_KEY`
      - **Value:** Paste your actual Gemini API key here.
    > **Important:** The `VITE_` prefix is required. This is a security feature of Vite to prevent accidentally exposing sensitive variables to the client-side code. Only variables prefixed with `VITE_` will be available in your application.

5.  Click the **"Deploy"** button. Vercel will build and deploy your application. Once complete, you will be provided with a live URL.

### Troubleshooting

#### **Error: "An API Key must be set when running in a browser"**

This is the most common error and it means your Gemini API key is not accessible to the application. The fix depends on where you are running the app:

**1. If you see this error on your LOCAL machine (running `npm run dev`):**

*   **Did you create the `.env.local` file?** This file must be in the project's root directory (the same level as `package.json`).
*   **Is the file named correctly?** It must be exactly `.env.local`.
*   **Is the variable name correct?** Inside `.env.local`, the line must start with `VITE_`. It should be `VITE_API_KEY=your_key_here`.
*   **Did you restart the server?** After creating or changing the `.env.local` file, you **must stop** your development server (`Ctrl+C`) and restart it (`npm run dev`). Vite only loads these variables at startup.

**2. If you see this error on your live Vercel website:**

*   This means you have not set the environment variable in your Vercel project settings.
*   Go to your project on Vercel.
*   Navigate to **Settings** -> **Environment Variables**.
*   Create a **new variable**:
    *   **Name:** `VITE_API_KEY`
    *   **Value:** Paste your actual Gemini API key.
*   **Important:** After adding the variable, you must **re-deploy** your project for the change to take effect. Go to the "Deployments" tab, find your latest deployment, click the menu (...) and select "Redeploy".


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