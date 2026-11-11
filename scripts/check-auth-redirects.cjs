const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

const moduleUnderTest = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/redirects.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, { module: moduleUnderTest, exports: moduleUnderTest.exports });
const { safeRedirectPath } = moduleUnderTest.exports;

// Missing or unsafe returns must open the tracker homepage, while valid deep links stay intact.
for (const value of [undefined, null, '', 'https://other.example/', '//other.example', '/\\other.example', '/\nother.example']) {
  assert.equal(safeRedirectPath(value), '/');
}
for (const value of ['/ms', '/ms/e/pas', '/dashboard', '/e/anwar-ibrahim?status=achieved', '/search?q=PKR', '/']) {
  assert.equal(safeRedirectPath(value), value);
}
console.log('Passed default homepage destinations, unsafe return rejection and preserved deep links in both languages.');
