const esbuild = require('esbuild');

const prod = process.argv.includes('--minify');
const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  outdir: 'dist',
  external: ['vscode'],
  minify: prod,
  sourcemap: !prod,
  platform: 'node',
  target: 'node18',
  logLevel: 'info',
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('[localive-vscode] watching...');
  } else {
    await esbuild.build(buildOptions);
  }
}

main().catch(() => process.exit(1));