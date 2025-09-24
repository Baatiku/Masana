# Kwararru - Knowledge through Conversation

Kwararru is a next-generation messenger that combines the simplicity of chat and calls with the depth of professional AI personas. This version of the application runs primarily in your browser but includes an optional, privacy-preserving sync feature using your own Google Drive.

---

## 🚀 Getting Started: Required API Keys

This application requires API keys from Google Cloud to function.

### Step 1: Set Your Environment Variables

In your deployment environment (like Vercel, Netlify, or AI Studio's "Secret keys" panel), you **must set the following variables.** For client-side applications built with Vite, environment variables must be prefixed with `VITE_` to be accessible in your code.

| Variable Name | Description | Example Value |
| --- | --- | --- |
| `VITE_API_KEY` | Your Google Gemini API key. This is also used for Google Drive API access. | `AIzaSy...` |
| `VITE_GOOGLE_CLIENT_ID` | Your Google Cloud OAuth 2.0 Client ID. This is required for the "Sync to Google Drive" feature. | `12345...apps.googleusercontent.com` |

**How to get these keys:**
1.  Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2.  Enable the "Gemini API" and "Google Drive API".
3.  Create an `API_KEY` under "APIs & Services" > "Credentials".
4.  Create an "OAuth 2.0 Client ID" for a "Web application". Make sure to add your app's URL to the "Authorized JavaScript origins". The value you need is the "Client ID".

### Step 2: Run the Application

Once you set the environment variables, the application is ready.

- **Local-First Data:** The app creates a private profile stored in your browser. All data (chats, recordings, settings) is saved locally on your device.
- **Optional Cloud Sync:** You can connect your Google Drive account in the Settings menu. This will create a single, private backup file that only Kwararru can see. This allows your data to be backed up and synced across your different devices. Your data remains in *your* cloud, under your control.
- **Privacy:** Your data does not touch any Kwararru servers.

---
## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Data Storage**: Browser `localStorage` and `IndexedDB`
- **AI**: Google Gemini API (Live Content API for voice)
- **Sync**: Google Drive API (via GAPI client)