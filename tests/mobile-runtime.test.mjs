import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
const require = createRequire(import.meta.url);
const mobileDir = dirname(fileURLToPath(new URL('../apps/mobile/package.json', import.meta.url)));
const mobileRequire = createRequire(new URL('../apps/mobile/package.json', import.meta.url));

test('Native React matches the renderer, without changing the web React patch', () => {
  const { version } = mobileRequire('react/package.json');
  const renderer = readFileSync(mobileRequire.resolve('react-native/Libraries/Renderer/implementations/ReactFabric-dev.js'), 'utf8');
  assert.equal(version, renderer.match(/version: "(\d+\.\d+\.\d+)"/)?.[1]);
  assert.equal(require('react/package.json').version, '19.2.8');
});
test('Metro resolves every native React import to one app copy and delegates other modules', () => {
  const result = { exports: {} };
  const dependency = name => name === 'expo/metro-config' ? { getDefaultConfig: () => ({ resolver: {} }) } : require(name);
  dependency.resolve = require.resolve;
  runInNewContext(readFileSync(new URL('../apps/mobile/metro.config.js', import.meta.url), 'utf8'), { require: dependency, module: result, __dirname: mobileDir });
  const resolve = result.exports.resolver.resolveRequest;
  const context = { originModulePath: '/hoisted/shared/hook.ts', resolveRequest: (_context, name, platform) => ({ name, platform }) };
  for (const name of ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime']) {
    assert.equal(resolve(context, name, 'ios').filePath, mobileRequire.resolve(name));
  }
  assert.equal(resolve(context, '@eavesence/core', 'ios').name, '@eavesence/core');
});
