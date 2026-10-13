import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
const require=createRequire(import.meta.url),webpack=require('next/dist/compiled/webpack/webpack').webpack;
const out=mkdtempSync(join(tmpdir(),'eavesence-native-review-'));
try{
 const services=resolve('scripts/mobile-review-services.cjs');
 await new Promise((done,fail)=>webpack({mode:'development',devtool:false,entry:resolve(process.argv[2]==='app'?'scripts/mobile-app-review-entry.tsx':'scripts/mobile-interaction-entry.tsx'),output:{path:out,filename:'review.js'},resolve:{extensions:['.tsx','.ts','.js'],alias:{react:resolve('node_modules/react'),'react-dom':resolve('node_modules/react-dom'),'react-native$':resolve('scripts/mobile-review-native.cjs'),'react-native-safe-area-context$':resolve('scripts/mobile-review-native.cjs'),'@react-native-community/datetimepicker$':resolve('scripts/mobile-review-native.cjs'),'@react-native-async-storage/async-storage$':services,'expo-notifications$':services,'expo-status-bar$':services,'react-native-webview$':services,...Object.fromEntries(['reminders','subscriptions','backupFiles','deadlineFile'].map(file=>[resolve(`apps/mobile/src/${file}.ts`),services]))}},plugins:[new webpack.DefinePlugin({'process.env.EXPO_PUBLIC_WEB_URL':JSON.stringify('https://eavesence.com')})],module:{rules:[{test:/\.tsx?$/,use:resolve('scripts/mobile-review-loader.cjs')},{test:/\.png$/,type:'asset/inline'}]},optimization:{minimize:false}},(error,stats)=>error?fail(error):stats.hasErrors()?fail(new Error(stats.toString({all:false,errors:true}))):done()));
 const script=readFileSync(join(out,'review.js'),'utf8').replaceAll('</script','<\\/script');
 console.log(JSON.stringify({script}));
}finally{rmSync(out,{recursive:true,force:true});}
