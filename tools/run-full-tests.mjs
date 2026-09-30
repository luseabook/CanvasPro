/** Complete offline unit sweep in a clean copy, excluding all normal profiles/data. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ROOT, createTestEnvironment, resolveTestPython } from './test-runtime.mjs';
const only = process.argv.includes('--python-only') ? 'python' : process.argv.includes('--js-only') ? 'js' : 'all';
const args = process.argv.slice(2);
const filterIndex = args.indexOf('--filter');
const filter = filterIndex < 0 ? null : new RegExp(args[filterIndex+1]);
const artifactRoot = path.join(ROOT,'test-artifacts','full-review');
fs.mkdirSync(artifactRoot,{recursive:true});
const resultRoot = fs.mkdtempSync(path.join(artifactRoot,'run-'));
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(),'canvaspro-full-review-'));
const workspace = path.join(sandbox,'workspace');
fs.mkdirSync(workspace,{recursive:true});
const skipped = new Set(['.git','__pycache__','.pytest_cache','.cache','coverage','dist','test-results','playwright-report']);
const copiedRoots = ['src','api','electron','backend','styles','db','tools','tests','test','e2e','vendor','assets','images','native','build','docs','.github'];
function copy(source, target, dependency = false) {
  fs.cpSync(source,target,{recursive:true,mode:fs.constants.COPYFILE_FICLONE,filter:entry=> {
    const stat=fs.lstatSync(entry);
    if (stat.isSymbolicLink()) return false;
    const name=path.basename(entry);
    return (dependency || entry === source || !skipped.has(name)) && !entry.replace(/\\/g,'/').includes('/docs/tracking/') && !/^\.env(?:\.|$)/.test(name) && name!=='.npmrc' && name!=='.git-credentials';
  }});
}
const manifest = [];
function inventory(directory) {
  for (const item of fs.readdirSync(directory,{withFileTypes:true})) {
    const file=path.join(directory,item.name);
    if (item.isDirectory()) { if (!['node_modules','build','.git','__pycache__'].includes(item.name)) inventory(file); }
    else if (/\.(?:test|spec)\.(?:js|mjs|cjs)$|(?:^|[\\/])test_[^\\/]+\.py$|(?:^|[\\/])[^\\/]+_test\.py$/.test(file)) manifest.push(path.relative(workspace,file));
  }
}
const summary={startedAt:new Date().toISOString(),resultRoot,scope:'All discovered Node and Python unit files, excluding Playwright specs; isolated copy, credentials removed, real networking blocked',batches:[],failures:[],counts:{tests:0,pass:0,fail:0,skipped:0,cancelled:0}};
let fixture;
try {
  for (const directory of copiedRoots) if(fs.existsSync(path.join(ROOT,directory))) copy(path.join(ROOT,directory),path.join(workspace,directory));
  for (const name of ['main.js','server.py','style.css','index.html','package.json','package-lock.json','knexfile.cjs','electron-builder.win.cjs','playwright.config.js','playwright.desktop.config.js','requirements.txt','README.md','AGENTS.md','CLAUDE.md','LICENSE','COMMERCIAL-LICENSE.md','release_notes.txt','TESTING.md']) {
    if (fs.existsSync(path.join(ROOT,name))) copy(path.join(ROOT,name),path.join(workspace,name));
  }
  // Physical copies: tests cannot mutate the real repository/dependency files through links.
  copy(path.join(ROOT,'node_modules'),path.join(workspace,'node_modules'),true);
  for (const directory of ['src','api','electron','backend','tools','e2e','tests','test']) if(fs.existsSync(path.join(workspace,directory))) inventory(path.join(workspace,directory));
  const unitFiles = manifest.filter(p=>!p.startsWith('e2e'+path.sep)).filter(p=>!filter||filter.test(p.replace(/\\/g,'/'))).sort();
  fs.writeFileSync(path.join(resultRoot,'test-manifest.json'),JSON.stringify(unitFiles,null,2));
  fixture=createTestEnvironment(18783);
  const temp=path.join(sandbox,'temp'); fs.mkdirSync(temp,{recursive:true});
  // Move the generated empty profile under the sandbox so the write guard covers every fixture.
  const profile=path.join(sandbox,'profile'); fs.renameSync(fixture.directory,profile);
  const env=Object.fromEntries(Object.entries(fixture.env).map(([key,value])=>[key,typeof value==='string'?value.replaceAll(fixture.directory,profile):value]));
  Object.assign(env,{TEMP:temp,TMP:temp,TMPDIR:temp,AIC_TEST_SANDBOX_ROOT:sandbox,NO_COLOR:'1',FORCE_COLOR:'0'});
  const guard=path.join(workspace,'tools/offline-unit-guard.cjs');
  const tests=unitFiles.filter(p=>/\.(?:js|mjs|cjs)$/.test(p));
  console.log(JSON.stringify({type:'start',resultRoot,unitFiles:unitFiles.length,nodeFiles:tests.length,pythonFiles:unitFiles.length-tests.length}));
  if(only!=='python') for (let index=0;index<tests.length;index+=60) {
    const batch=tests.slice(index,index+60), name=`node-${String(index/60+1).padStart(2,'0')}`;
    const logFile=path.join(resultRoot,name+'.tap');const fd=fs.openSync(logFile,'w');
    const start=Date.now();
    const result=spawnSync(process.execPath,['--require',guard,'--test','--test-concurrency=2','--test-reporter=tap','--test-timeout=30000',...batch],{cwd:workspace,env,stdio:['ignore',fd,fd],timeout:600000,windowsHide:true});
    fs.closeSync(fd);
    const text=fs.readFileSync(logFile,'utf8');const counts={};for(const key of Object.keys(summary.counts)){const matches=[...text.matchAll(new RegExp('^# '+key+' (\\d+)','gm'))];counts[key]=Number(matches.at(-1)?.[1]||0);summary.counts[key]+=counts[key];}
    const failures=[...text.matchAll(/^not ok \d+ - (.+)$/gm)].map(match=>match[1]);
    const record={name,files:batch.length,exitCode:result.status,signal:result.signal,error:result.error?.code,elapsedMs:Date.now()-start,...counts,failures};
    summary.batches.push(record);summary.failures.push(...failures.map(test=>({batch:name,test})));
    console.log(JSON.stringify(record));fs.writeFileSync(path.join(resultRoot,'summary.json'),JSON.stringify(summary,null,2));
  }
  if(only!=='js') {
    const py=unitFiles.filter(p=>p.endsWith('.py')).map(p=>p.replace(/\\/g,'/').replace(/\.py$/,'').replaceAll('/','.'));
    const logFile=path.join(resultRoot,'python.txt'),fd=fs.openSync(logFile,'w');
    const result=spawnSync(resolveTestPython(),['-B','-m','unittest','-v',...py],{cwd:workspace,env,stdio:['ignore',fd,fd],timeout:180000,windowsHide:true});fs.closeSync(fd);
    const text=fs.readFileSync(logFile,'utf8');summary.python={files:py.length,tests:Number(text.match(/Ran (\d+) tests?/)?.[1]||0),exitCode:result.status,signal:result.signal,error:result.error?.code,summary:text.trim().split(/\r?\n/).slice(-5)};
    console.log(JSON.stringify({type:'python',...summary.python}));
  }
  summary.success=summary.batches.every(batch=>batch.exitCode===0)&&(!summary.python||summary.python.exitCode===0);
  summary.finishedAt=new Date().toISOString();
  const protectedPath=path.join(ROOT,'api/freeImageHostApi.js');summary.protectedMd5=createHash('md5').update(fs.readFileSync(protectedPath)).digest('hex');
  if(summary.protectedMd5!=='1e0458013f5341c99f21faefc1d34d3f')throw new Error('Protected source fingerprint changed');
  fs.writeFileSync(path.join(resultRoot,'summary.json'),JSON.stringify(summary,null,2));
  console.log(JSON.stringify({type:'complete',success:summary.success,resultRoot,counts:summary.counts,python:summary.python,failed:summary.failures.length}));
  process.exitCode=summary.success?0:1;
} finally {
  if(fixture) fixture.dispose();
  // Only this exact mkdtemp directory is removed, never the actual workspace or a normal profile.
  fs.rmSync(sandbox,{recursive:true,force:true,maxRetries:5,retryDelay:250});
}
