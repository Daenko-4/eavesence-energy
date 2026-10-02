import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mobile = resolve(root, 'apps/mobile');
const json = file => JSON.parse(readFileSync(resolve(mobile, file), 'utf8'));
const { expo } = json('app.json'), pkg = json('package.json'), eas = json('eas.json');
const failures = [];
function check(condition, message) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${message}`);
  if (!condition) failures.push(message);
}
check(pkg.main === 'index.ts' && existsSync(resolve(mobile, pkg.main)), 'Explicit mobile entry point');
check(/^\d+\.\d+\.\d+$/.test(expo.version), 'App version');
check(expo.ios?.bundleIdentifier === 'com.eavesence.home', 'iPhone app identifier');
check(existsSync(resolve(mobile, expo.icon)), 'App icon asset');
check(eas.build.testflight.distribution === 'store' && !eas.build.testflight.developmentClient, 'Standalone TestFlight build');
check(eas.cli.appVersionSource === 'remote' && eas.build.testflight.autoIncrement === true, 'Unique managed build numbers');
check(eas.build.testflight.env?.EXPO_PUBLIC_PURCHASES_ENABLED === 'false', 'Free beta: purchases disabled');
const linked = typeof expo.extra?.eas?.projectId === 'string' && /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(expo.extra.eas.projectId);
if (process.argv.includes('--require-linked')) check(linked, 'Expo project linked (run eas init in apps/mobile)');
else console.log(`${linked ? 'PASS' : 'PENDING'} Expo project link${linked ? '' : ' — run eas init before a cloud build'}`);
console.log('Manual gates: Apple team/signing, App Store Connect record, real iPhone test and external beta feedback.');
process.exitCode = failures.length ? 1 : 0;
