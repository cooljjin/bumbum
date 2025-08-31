const fs = require('fs');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

/**
 * 사용법:
 *   node tools/pixelDiff.cjs shots/current.png shots/reference.png shots/diff.png
 * 종료코드:
 *   - 0: 동일(1.5% 이하)
 *   - 1: 다름(1.5% 초과) -> CI에서 실패 처리 가능
 */
const [,, curPath, refPath, outPath] = process.argv;

if (!curPath || !refPath || !outPath) {
  console.error('Usage: node tools/pixelDiff.cjs <current.png> <reference.png> <diff.png>');
  process.exit(1);
}

const cur = PNG.sync.read(fs.readFileSync(curPath));
const ref = PNG.sync.read(fs.readFileSync(refPath));

if (cur.width !== ref.width || cur.height !== ref.height) {
  console.error('Image sizes differ; make sure both are same viewport.');
  process.exit(1);
}

const { width, height } = cur;
const diff = new PNG({ width, height });

const diffCount = pixelmatch(cur.data, ref.data, diff.data, width, height, {
  threshold: 0.1,
  includeAA: true,
});
fs.writeFileSync(outPath, PNG.sync.write(diff));

const ratio = diffCount / (width * height);
console.log(JSON.stringify({ width, height, diffCount, ratio }));

process.exit(ratio <= 0.015 ? 0 : 1);
