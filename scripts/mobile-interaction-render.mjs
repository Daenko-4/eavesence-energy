import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
const require=createRequire(import.meta.url),webpack=require('next/dist/compiled/webpack/webpack').webpack;
const out=mkdtempSync(join(tmpdir(),'eavesence-native-review-'));
try{
 await new Promise((done,fail)=>webpack({mode:'development',devtool:false,entry:resolve('scripts/mobile-interaction-entry.tsx'),output:{path:out,filename:'review.js'},resolve:{extensions:['.tsx','.ts','.js'],alias:{react:resolve('node_modules/react'),'react-dom':resolve('node_modules/react-dom'),'react-native$':resolve('scripts/mobile-review-native.cjs'),'react-native-safe-area-context$':resolve('scripts/mobile-review-native.cjs'),'@react-native-community/datetimepicker$':resolve('scripts/mobile-review-native.cjs'),[resolve('apps/mobile/src/reminders.ts')]:resolve('scripts/mobile-review-native.cjs')}},module:{rules:[{test:/\.tsx?$/,use:resolve('scripts/mobile-review-loader.cjs')}]},optimization:{minimize:false}},(error,stats)=>error?fail(error):stats.hasErrors()?fail(new Error(stats.toString({all:false,errors:true}))):done()));
 const script=readFileSync(join(out,'review.js'),'utf8').replaceAll('</script','<\\/script');
 console.log(JSON.stringify({script}));
}finally{rmSync(out,{recursive:true,force:true});}
