import type { Probot, ProbotOctokit } from "probot";

export async function getInstallationOctokit(
  app: Probot,
  owner: string,
  repo: string,
  installationId: number | null,
): Promise<ProbotOctokit> {
  if (installationId) {
    return app.auth(installationId);
  }

  const appOctokit = await app.auth();
  const response = await appOctokit.rest.apps.getRepoInstallation({
    owner,
    repo,
  });

  return app.auth(response.data.id);
}
