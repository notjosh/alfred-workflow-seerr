export interface Config {
  serverUrl: string;
  apiKey: string;
}

export function getConfig(env: Record<string, string | undefined>): Config {
  const serverUrl = env.seerr_url?.replace(/\/+$/, "");
  const apiKey = env.seerr_api_key;

  if (!serverUrl) {
    throw new Error("Missing seerr_url. Set it in the workflow configuration.");
  }

  if (!apiKey) {
    throw new Error(
      "Missing seerr_api_key. Set it in the workflow configuration.",
    );
  }

  return { serverUrl, apiKey };
}
