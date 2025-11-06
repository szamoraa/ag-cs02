import { Octokit } from "@octokit/rest";

/**
 * Initialize GitHub Octokit client
 * Uses environment variables for authentication
 */
export function createGitHubClient() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  return new Octokit({
    auth: token,
  });
}

/**
 * Initialize GitHub App client
 * For GitHub App authentication
 */
export async function createGitHubAppClient() {
  const { createAppAuth } = await import("@octokit/auth-app");
  
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

  if (!appId || !privateKey) {
    throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY environment variables are required");
  }

  const auth = createAppAuth({
    appId,
    privateKey,
    installationId: installationId ? parseInt(installationId, 10) : undefined,
  });

  return new Octokit({
    authStrategy: auth,
  });
}

