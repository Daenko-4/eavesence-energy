/* eslint-disable @typescript-eslint/no-require-imports -- Webpack loader and CommonJS native test alias. */
module.exports=function(source){return require('typescript').transpileModule(source,{fileName:this.resourcePath,compilerOptions:{module:require('typescript').ModuleKind.ESNext,jsx:require('typescript').JsxEmit.ReactJSX,target:require('typescript').ScriptTarget.ES2022}}).outputText;};
