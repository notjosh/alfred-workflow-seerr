# Alfred Workflow: Seerr

Search and request movies and TV shows from [Seerr](https://github.com/seerr-team/seerr) directly in Alfred.

```
seerr breaking bad      → select result → choose action → notification
```

## Install

Download the latest `.alfredworkflow` from [Releases](https://github.com/notjosh/alfred-workflow-seerr/releases) and double-click to install.

Requires Node.js 22+.

### Configuration

Open the workflow's configuration in Alfred and set:

| Variable        | Description                                          |
| --------------- | ---------------------------------------------------- |
| `seerr_url`     | Your Seerr server URL (e.g. `http://localhost:5055`) |
| `seerr_api_key` | API key from Seerr Settings > General                |

## Usage

1. **`seerr <query>`** — searches Seerr, shows results with status indicators
2. **Select a result** — shows available actions:
   - New media: "Request in [quality profile]" per profile
   - Existing: "Change quality to [profile]", status info
   - TV: "Request all unrequested seasons", individual season requests
3. **Select an action** — executes the API call and shows a macOS notification

## Development

```bash
pnpm install
pnpm run build
node dist/search.js "breaking bad"  # test search output
```

### Live development with Alfred

Symlink the project into Alfred's workflow directory, then run esbuild in watch mode:

```bash
pnpm link-workflow   # one-time: symlinks project into Alfred's workflows folder
pnpm dev             # rebuilds on every save
```

Now type `seerrdev ...` in Alfred and it runs your local code. No restart needed — just save and re-trigger.

### Testing

```bash
pnpm test            # unit tests (node:test)
pnpm typecheck       # tsc --noEmit
pnpm format:check    # prettier
```

### Releasing

```bash
./scripts/bump-version-and-push-for-release.sh patch    # or minor, major
./scripts/bump-version-and-push-for-release.sh current  # release current version as-is
```

This tags and pushes to trigger the release workflow. `patch`, `minor`, and `major` bump the version in `package.json` and `info.plist` first; `current` releases what's already there. The GitHub Action builds and attaches a `.alfredworkflow` to the release.

## License

MIT — see [LICENSE.md](LICENSE.md).

`run-node.sh` is adapted from [alfy](https://github.com/sindresorhus/alfy) (MIT).
