import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from '/opt/node-global/lib/node_modules/typescript/lib/typescript.js';

const output = process.stdout;
const started = Date.now();

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function errorText(error) {
  return String(error?.stack || error).slice(0, 900);
}

async function main() {
  const language = process.argv[2];
  const cases = JSON.parse(fs.readFileSync('/workspace/cases.json', 'utf8'));
  let source = fs.readFileSync(`/workspace/main.${language === 'typescript' ? 'ts' : 'js'}`, 'utf8');
  if (language === 'typescript') {
    source = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true });
  }

  const module = { exports: {} };
  const loadSolve = new Function('require', 'module', 'exports', `${source}\n;return typeof solve === 'function' ? solve : module.exports.solve;`);
  const solve = loadSolve(createRequire(import.meta.url), module, module.exports);
  if (typeof solve !== 'function') throw new TypeError('Define solve(input) in your file.');

  const results = [];
  for (const test of cases) {
    const caseStarted = Date.now();
    try {
      const actual = await solve(test.input);
      const encoded = JSON.stringify(actual);
      if (encoded === undefined) throw new TypeError('solve(input) must return a JSON value.');
      const jsonValue = JSON.parse(encoded);
      const passed = JSON.stringify(canonical(jsonValue)) === JSON.stringify(canonical(test.expectedOutput));
      results.push({ id: test.id, label: test.label, passed, actualOutput: jsonValue, durationMs: Date.now() - caseStarted });
    } catch (error) {
      results.push({ id: test.id, label: test.label, passed: false, error: errorText(error), durationMs: Date.now() - caseStarted });
    }
  }

  output.write('__JWS_RESULT__' + JSON.stringify({ cases: results, durationMs: Date.now() - started }) + '\n');
  process.exitCode = results.every((test) => test.passed) ? 0 : 1;
}

main().catch((error) => {
  output.write('__JWS_RESULT__' + JSON.stringify({ cases: [], message: errorText(error) }) + '\n');
  process.exitCode = 1;
});
