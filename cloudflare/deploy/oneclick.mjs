import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const token=process.env.CLOUDFLARE_API_TOKEN;
if(!token)throw Error('请先设置 CLOUDFLARE_API_TOKEN，再运行 npm run deploy:oneclick');
async function api(path,method='GET',body){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json();if(!r.ok||!j.success)throw Error(JSON.stringify(j.errors));return j.result;}
let account=process.env.CLOUDFLARE_ACCOUNT_ID;
if(!account){const accounts=await api('/accounts');if(accounts.length!==1)throw Error('账号不唯一，请设置 CLOUDFLARE_ACCOUNT_ID');account=accounts[0].id;}
const name=process.env.PAGES_PROJECT_NAME||'xiazheteng-data',prefix='/accounts/'+account;
let project=(await api(prefix+'/pages/projects')).find(p=>p.name===name);
if(!project)project=await api(prefix+'/pages/projects','POST',{name,production_branch:'main'});
const configuredKv=project.deployment_configs?.production?.kv_namespaces?.HISTORY_KV?.namespace_id||project.deployment_configs?.preview?.kv_namespaces?.HISTORY_KV?.namespace_id;
let kv=configuredKv?{id:configuredKv}:(await api(prefix+'/storage/kv/namespaces?per_page=100')).find(n=>n.title===name+'-history');
if(!kv)kv=await api(prefix+'/storage/kv/namespaces','POST',{title:name+'-history'});
let imported={};if(process.env.ENV_IMPORT_FILE)imported=JSON.parse(await readFile(resolve(process.env.ENV_IMPORT_FILE),'utf8'));
const privatePath=resolve(root,'.deploy-secrets.json');let saved={};try{saved=JSON.parse(await readFile(privatePath,'utf8'))}catch{}
const historyToken=process.env.HISTORY_TOKEN||imported.HISTORY_TOKEN||saved.HISTORY_TOKEN||randomBytes(32).toString('hex');
if(historyToken.length<24||historyToken.includes('用途')||historyToken.includes('示例'))throw Error('HISTORY_TOKEN 必须替换为真实的至少 24 位随机密钥');
const configs={};let generated=false;
for(const env of ['production','preview']){const old=project.deployment_configs?.[env]||{};const envVars={...(old.env_vars||{})};let changed=false;if(!envVars.HISTORY_TOKEN||process.env.HISTORY_TOKEN||imported.HISTORY_TOKEN){envVars.HISTORY_TOKEN={type:'secret_text',value:historyToken};generated=true;changed=true;}const origins=process.env.ALLOWED_ORIGINS??imported.ALLOWED_ORIGINS;if(origins!==undefined){if(origins.includes('用途')||origins.includes('示例'))throw Error('请填写真实 ALLOWED_ORIGINS，或从导入文件删除该项');envVars.ALLOWED_ORIGINS={type:'plain_text',value:origins};changed=true;}const existingId=old.kv_namespaces?.HISTORY_KV?.namespace_id;configs[env]={compatibility_date:'2026-11-04',kv_namespaces:{...(old.kv_namespaces||{}),HISTORY_KV:{namespace_id:existingId||kv.id}}};if(changed){if(Object.values(envVars).some(v=>v.type==='secret_text'&&!v.value))throw Error('现有项目包含不可读取的密钥，请在 Cloudflare 控制台修改变量后重新运行，脚本不会覆盖隐藏的现有密钥');configs[env].env_vars=envVars;}}
await api(prefix+'/pages/projects/'+name,'PATCH',{deployment_configs:configs});
if(generated)await writeFile(privatePath,JSON.stringify({HISTORY_TOKEN:historyToken},null,2),{mode:0o600});
const dist=resolve(root,'.pages-dist');await mkdir(dist,{recursive:true});
for(const item of await readdir(root,{withFileTypes:true})){if(item.name.startsWith('.')||['node_modules','deploy','package.json','package-lock.json','wrangler.jsonc'].includes(item.name)||item.name.endsWith('.md'))continue;await cp(resolve(root,item.name),resolve(dist,item.name),{recursive:true});}
const cli=resolve(root,'node_modules/wrangler/bin/wrangler.js');const result=spawnSync(process.execPath,[cli,'pages','deploy',dist,'--project-name',name,'--branch','main'],{cwd:root,env:{...process.env,CLOUDFLARE_ACCOUNT_ID:account},stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
console.log('发布完成：https://'+name+'.pages.dev');if(generated)console.log('云端历史密钥已保存在本机 .deploy-secrets.json；请勿上传此文件。');
