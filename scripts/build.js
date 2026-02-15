import esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const rebuildLog = {
  name: "rebuild-log",
  setup(build) {
    let start;
    build.onStart(() => {
      start = Date.now();
    });
    build.onEnd((result) => {
      const ms = Date.now() - start;
      if (result.errors.length > 0) {
        console.log(`Rebuild failed (${ms}ms)`);
      } else {
        console.log(`Rebuilt (${ms}ms)`);
      }
    });
  },
};

const options = {
  entryPoints: ["src/search.ts", "src/details.ts", "src/request.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "dist",
  plugins: watch ? [rebuildLog] : [],
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(options);
}
