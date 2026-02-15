import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { connect, type ClientHttp2Session } from "node:http2";
import { join } from "node:path";

const TMDB_IMAGE_BASE = "https://image.tmdb.org";
const IMAGE_SIZE = "w185";
const MAX_RETRIES = 1;

export interface PosterCache {
  resolve(posterPath: string | null | undefined): string | undefined;
  close(): void;
}

export async function downloadPosters(
  cacheDir: string,
  posterPaths: Array<string | null | undefined>,
): Promise<PosterCache> {
  const postersDir = join(cacheDir, "posters");
  if (!existsSync(postersDir)) {
    mkdirSync(postersDir, { recursive: true });
  }

  const unique = [
    ...new Set(posterPaths.filter((p): p is string => p != null)),
  ];

  const cached = new Map<string, string>();

  // Separate into already-cached and needs-download
  const toDownload: string[] = [];
  for (const p of unique) {
    const localPath = localPathFor(postersDir, p);
    if (existsSync(localPath)) {
      cached.set(p, localPath);
    } else {
      toDownload.push(p);
    }
  }

  if (toDownload.length > 0) {
    const downloaded = await fetchAll(postersDir, toDownload);
    for (const [p, localPath] of downloaded) {
      cached.set(p, localPath);
    }
  }

  return {
    resolve(posterPath) {
      if (!posterPath) return undefined;
      return cached.get(posterPath);
    },
    close() {},
  };
}

function localPathFor(postersDir: string, posterPath: string): string {
  // posterPath is like "/abc123.jpg" — strip leading slash for filename
  const filename = posterPath.replace(/^\//, "").replace(/\//g, "-");
  return join(postersDir, filename);
}

async function fetchAll(
  postersDir: string,
  paths: string[],
  retry = 0,
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const goawayPaths: string[] = [];

  let session: ClientHttp2Session;
  try {
    session = await connectSession();
  } catch {
    return results;
  }

  try {
    await Promise.all(
      paths.map((posterPath) =>
        fetchOne(session, postersDir, posterPath).then(
          (localPath) => {
            if (localPath) results.set(posterPath, localPath);
          },
          (err: Error & { code?: string }) => {
            if (err.code === "ERR_HTTP2_GOAWAY_SESSION") {
              goawayPaths.push(posterPath);
            }
            // Silently skip other failures
          },
        ),
      ),
    );
  } finally {
    session.close();
  }

  // Retry GOAWAY failures with a fresh session
  if (goawayPaths.length > 0 && retry < MAX_RETRIES) {
    const retried = await fetchAll(postersDir, goawayPaths, retry + 1);
    for (const [p, localPath] of retried) {
      results.set(p, localPath);
    }
  }

  return results;
}

function connectSession(): Promise<ClientHttp2Session> {
  return new Promise((resolve, reject) => {
    const session = connect(TMDB_IMAGE_BASE);
    session.once("connect", () => resolve(session));
    session.once("error", reject);
  });
}

function fetchOne(
  session: ClientHttp2Session,
  postersDir: string,
  posterPath: string,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const req = session.request({ ":path": `/t/p/${IMAGE_SIZE}${posterPath}` });

    const chunks: Buffer[] = [];
    let status = 0;

    req.on("response", (headers) => {
      status = headers[":status"] as number;
    });

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (status === 200 && chunks.length > 0) {
        const localPath = localPathFor(postersDir, posterPath);
        writeFileSync(localPath, Buffer.concat(chunks));
        resolve(localPath);
      } else {
        resolve(null);
      }
    });

    req.on("error", reject);
    req.end();
  });
}
