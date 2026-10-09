const test=require('node:test');const assert=require('node:assert/strict');const {randomBytes}=require('node:crypto');
// Isolated runtime configuration only; no real credentials or database connection.
process.env.AUTH_TOKEN_SECRET=randomBytes(48).toString('hex');
const about=require('../services/aboutService');const content=require('../services/adminContentService');const {hasScope}=require('../config/roleScopes');
const express=require('express');const {createApiRoutes}=require('../routes');const {errorHandler}=require('../middleware/errorHandler');const {createToken,COOKIE_NAME}=require('../middleware/authenticate');
const member={name_ar:'عضو تجريبي',name_en:'Test member',role_ar:'التنظيم',role_en:'Organizer',display_order:1,status:'draft'};
test('About rejects unsupported fields, invalid URLs, oversized/invalid lists and empty required text',()=>{
 for(const body of [null,[],{}, {id:2},{body_ar:''},{values_ar:'x'},{values_en:['']},{values_ar:Array(21).fill('x')},{image_url:'javascript:alert(1)'},{status:'invalid'},{body_en:null}])assert.throws(()=>about.validate(body),{statusCode:400});
 assert.deepEqual(about.validate({values_ar:[' قيمة '],subtitle_en:null}),{values_ar:['قيمة'],subtitle_en:null});
});
test('About locks the complete saved row before checking partial image edits',async()=>{
 const calls=[];let released=false;const client={query:async(sql)=>{calls.push(sql);return {rows:[{image_url:'https://example.invalid/image.png',image_alt_ar:'صورة',image_alt_en:'Image'}]}},release(){released=true}};
 await assert.rejects(about.update({connect:async()=>client},{image_alt_en:null}),{statusCode:400});assert.ok(calls.some(sql=>sql.includes('FOR UPDATE')));assert.ok(calls.includes('ROLLBACK'));assert.ok(!calls.some(sql=>sql.startsWith('UPDATE')));assert.ok(released);
});
test('Team validates every required field, public contacts, order and unknown keys before querying',async()=>{
 const pool={query(){assert.fail('Invalid input must not query the database')}};
 for(const field of content.resources['team-members'].required){const body={...member};delete body[field];await assert.rejects(content.create(pool,'team-members',body),{statusCode:400});await assert.rejects(content.create(pool,'team-members',{...member,[field]:null}),{statusCode:400})}
 for(const extra of [{display_order:0},{display_order:2147483648},{public_email:'invalid'},{contact_url:'data:text/html,test'},{toString:'invalid'}])await assert.rejects(content.create(pool,'team-members',{...member,...extra}),{statusCode:400});
});
test('New scopes are limited to Super Admin even with forged section permissions',()=>{
 for(const scope of ['about','team-members']){assert.ok(hasScope({role_code:'super_admin'},scope));for(const role_code of ['team_member','workshop_manager','competition_manager'])assert.equal(hasScope({role_code,permissions:[scope]},scope),false)}
});
test('HTTP routes preserve authentication, role checks and trusted Origin on all new operations',async()=>{
 let role='super_admin';const pool={async query(sql){if(sql.includes('FROM admin_users'))return {rowCount:1,rows:[{id:90000,role_code:role,permissions:[]}]};return {rowCount:0,rows:[]}}};
 const app=express();app.use(express.json());app.use((req,_res,next)=>{req.cookies=Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(p=>p.trim().split('=')));next()});app.use('/api',createApiRoutes({pool,authTokenSecret:process.env.AUTH_TOKEN_SECRET,corsOrigins:['http://localhost:5173'],isProduction:false}));app.use(errorHandler);
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/api`;const cookie=`${COOKIE_NAME}=${createToken({id:90000,role_code:'super_admin'},process.env.AUTH_TOKEN_SECRET)}`;
 try{for(const [method,path] of [['GET','about'],['PATCH','about'],['GET','team-members'],['GET','team-members/1'],['POST','team-members'],['PATCH','team-members/1'],['DELETE','team-members/1'],['POST','images/about'],['POST','images/team-members']]){
  assert.equal((await fetch(`${base}/admin/${path}`,{method})).status,401);
  for(const denied of ['team_member','competition_manager','workshop_manager']){role=denied;assert.equal((await fetch(`${base}/admin/${path}`,{method,headers:{Cookie:cookie,Origin:'http://localhost:5173'}})).status,403)}
  role='super_admin';if(method!=='GET')assert.equal((await fetch(`${base}/admin/${path}`,{method,headers:{Cookie:cookie,Origin:'https://untrusted.invalid'}})).status,403);
 }
 for(const path of ['about','team-members'])assert.equal((await fetch(`${base}/public/${path}`)).status,200);
 }finally{await new Promise(r=>server.close(r))}
});
