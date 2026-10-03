import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
const powershell=path.join(process.env.SystemRoot||process.env.SYSTEMROOT||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'installer-safety-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function put(root,name,value){const p=path.join(root,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,value);return {path:name,sha256:digest(Buffer.from(value))};}
function cleanup(root){return spawnSync(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(rootPath(),'build/uninstall-program-files.ps1'),'-InstallDir',root],{encoding:'utf8',windowsHide:true,timeout:20000});}
function rootPath(){return root;}
test('installer does not force termination, move data to temporary folders, or recursively delete the install root',()=>{
  const source=fs.readFileSync(path.join(root,'build/installer.nsh'),'utf8');
  assert.doesNotMatch(source,/taskkill|Stop-Process|CloseMainWindow|aic-preserved|RMDir\s+\/r\s+"\$INSTDIR"/i);
  assert.match(source,/ensureExistingAppClosed/);assert.match(source,/uninstall-program-files\.ps1/);
});
test('cleanup removes only unchanged manifest-owned program files and keeps data in place',{skip:process.platform!=='win32'},t=>{
  const dir=fixture(t);
  const files=[put(dir,'resources/app/main.js','program'),put(dir,'Data/work.json','work'),put(dir,'resources/app/user/settings.json','settings'),put(dir,'changed.js','original')];
  put(dir,'changed.js','user-modified');put(dir,'my-project/work.json','unknown');
  fs.writeFileSync(path.join(dir,'app-files-manifest.json'),JSON.stringify({schema:1,files}));
  const result=cleanup(dir);assert.equal(result.status,0,result.stderr);
  assert.equal(fs.existsSync(path.join(dir,'resources/app/main.js')),false);
  assert.equal(fs.readFileSync(path.join(dir,'Data/work.json'),'utf8'),'work');
  assert.equal(fs.readFileSync(path.join(dir,'resources/app/user/settings.json'),'utf8'),'settings');
  assert.equal(fs.readFileSync(path.join(dir,'changed.js'),'utf8'),'user-modified');
  assert.equal(fs.readFileSync(path.join(dir,'my-project/work.json'),'utf8'),'unknown');
});
test('legacy installs without a manifest are not recursively cleaned',{skip:process.platform!=='win32'},t=>{
  const dir=fixture(t);put(dir,'resources/webapp/user/work.json','legacy');
  assert.equal(cleanup(dir).status,0);assert.equal(fs.readFileSync(path.join(dir,'resources/webapp/user/work.json'),'utf8'),'legacy');
});
test('unsafe manifest entries abort before deleting any program file',{skip:process.platform!=='win32'},t=>{
  const dir=fixture(t);const valid=put(dir,'app.js','keep');
  fs.writeFileSync(path.join(dir,'app-files-manifest.json'),JSON.stringify({schema:1,files:[valid,{path:'../outside.txt',sha256:'a'.repeat(64)}]}));
  assert.equal(cleanup(dir).status,20);assert.equal(fs.readFileSync(path.join(dir,'app.js'),'utf8'),'keep');
});
