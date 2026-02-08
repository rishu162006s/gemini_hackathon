# MediZen Clinical Portal Deployment Guide

Follow these steps to deploy the MediZen application to Vercel:

### 1. Repository Setup
Push the source code to a Git provider of your choice (GitHub, GitLab, or Bitbucket). Ensure all files, including `vercel.json` and `metadata.json`, are in the root directory.

### 2. Vercel Project Import
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **"New Project"**.
3. Import the repository you just created.

### 3. Environment Variable Configuration (CRITICAL)
For the AI features (Dr. Rishu, MZ-1, and Clinical Analysis) to function, you must provide your Google Gemini API Key:
1. In the Vercel project configuration screen, find the **"Environment Variables"** section.
2. Add a new variable:
   - **Key**: `API_KEY`
   - **Value**: `[YOUR_GEMINI_API_KEY]`
3. Click **Add**.

### 4. Finalize Deployment
Click **"Deploy"**. Vercel will detect the project and deploy it as a static site. The included `vercel.json` handles the SPA routing logic automatically.

---
**Note:** The application uses `process.env.API_KEY` to initialize the `@google/genai` client. If you encounter "API_KEY_MISSING" errors, double-check that the environment variable is correctly named in your Vercel settings.