
# avma - AI Photo Editor Guide

This guide provides an overview of the project structure, deployment instructions, and references for developers.

## 1. Project Map

Here's a breakdown of the key files and directories in this project:

- **`public/`**: This directory is created during the build process and contains all the static assets that will be deployed.
- **`src/components/`**: Contains all reusable React components used throughout the application. Each component is in its own file.
- **`src/services/`**: This directory holds the `geminiService.ts` file, which is responsible for all interactions with the Google Gemini API.
- **`App.tsx`**: The main application component that orchestrates the entire UI and state management.
- **`index.tsx`**: The entry point of the React application.
- **`index.html`**: The main HTML file, including Tailwind CSS configuration and the root element for the React app.
- **`package.json`**: Defines project dependencies, and scripts (like `build`).
- **`vercel.json`**: Configuration file specifically for deploying the application to Vercel.
- **`GUIDE.md`**: This guide file.

## 2. Deployment Instructions

### Deploying to Vercel

This project is pre-configured for easy deployment to Vercel.

**Prerequisites:**
- A [Vercel](https://vercel.com) account.
- The project code pushed to a Git repository (GitHub, GitLab, or Bitbucket).

**Steps:**
1.  **Log in to Vercel** and go to your dashboard.
2.  Click the **"Add New..."** button and select **"Project"**.
3.  **Import your Git Repository** by selecting it from the list.
4.  **Configure Project:**
    - Vercel will automatically detect the settings from your `package.json` and `vercel.json` files. You should see the following settings pre-filled:
      - **Build Command:** `npm run build`
      - **Output Directory:** `public`
    - Before deploying, you must add your Gemini API key. Go to the **"Environment Variables"** section.
    - Add a new variable with the following details:
      - **Name:** `API_KEY`
      - **Value:** Paste your actual Gemini API key here.
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

### Available Icons:

- `UploadIcon`
- `DownloadIcon`
- `UndoIcon`
- `RedoIcon`
- `EyeIcon`
- `ResetIcon`
- `MagicWandIcon`
- `PaletteIcon`
- `SunIcon`
- `BullseyeIcon`
- `WatermarkTextIcon`
- `WatermarkPhotoIcon`
- `RetouchIcon`
- `AdjustIcon`
- `FilterIcon`
- `CropIcon`
- `TextIcon`
- `WatermarkIcon`
- `PlusIcon`
- `TrashIcon`
- `PencilIcon`
- `TextAlignLeftIcon`
- `TextAlignCenterIcon`
- `TextAlignRightIcon`
- `ShadowIcon`
- `ExposureIcon`
- `ContrastIcon`
- `HighlightsIcon`
- `ShadowsIcon`
- `SaturationIcon`
- `WarmthIcon`
- `TintIcon`
- `VignetteIcon`
- `EditIcon`
- `AddIcon`
- `ZoomIcon`
- `CloseIcon`
- `LineIcon`
- `RectangleIcon`
- `TriangleIcon`
- `StarIcon`
- `EraserIcon`
- `EnhanceIcon`
- `ArrowLeftIcon`
