# AG-CS02

A Next.js application with Framer Motion, GitHub integration, and Vercel deployment ready.

## 🚀 Features

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **GitHub Integration** via Octokit
- **Vercel Analytics** and **Speed Insights**
- **Utility functions** for className merging and GitHub client creation

## 📦 Installed Packages

### Core Dependencies
- `next` - React framework
- `react` & `react-dom` - React library
- `typescript` - TypeScript support

### Animation & UI
- `framer-motion` - Animation library for React

### GitHub Integration
- `@octokit/rest` - GitHub REST API client
- `@octokit/auth-app` - GitHub App authentication

### Vercel
- `@vercel/analytics` - Vercel Analytics
- `@vercel/speed-insights` - Vercel Speed Insights

### Utilities
- `zod` - Schema validation
- `clsx` - Conditional className utility
- `tailwind-merge` - Merge Tailwind classes intelligently
- `date-fns` - Date utility library

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` and add your GitHub credentials:
   - For Personal Access Token: `GITHUB_TOKEN`
   - For GitHub App: `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID`

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Start production server:**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── layout.tsx   # Root layout with Analytics
│   └── page.tsx     # Home page
└── lib/             # Utility functions
    ├── utils.ts     # cn() function for className merging
    └── github.ts    # GitHub client utilities
```

## 🎨 Usage Examples

### Using Framer Motion

```tsx
"use client";

import { motion } from "framer-motion";

export function AnimatedComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      Hello, Framer Motion!
    </motion.div>
  );
}
```

### Using GitHub Client

```tsx
import { createGitHubClient } from "@/lib/github";

// In a Server Component or API Route
const octokit = createGitHubClient();
const { data } = await octokit.repos.get({
  owner: "octocat",
  repo: "Hello-World",
});
```

### Using className Utility

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class")} />
```

## 🚢 Deployment

This project is configured for Vercel deployment. Simply:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

The `vercel.json` file is already configured for optimal Next.js deployment.

## 📝 License

MIT
