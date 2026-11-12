(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],q=new URLSearchParams(location.search),f=$('form[data-form]'),kind=f.dataset.form;
const say=(t,c)=>{const m=$('#msg');m.className='msg '+c;m.textContent=t};
const post=async(a,d)=>{try{const r=await fetch('/api/auth?a='+a,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});return{ok:r.ok,d:await r.json().catch(()=>({}))}}catch(e){return{ok:false,d:{error:'Network problem. Check your connection and try again.'}}}};
$$('.pw').forEach(w=>{const i=$('input',w),b=$('.eye',w);b.onclick=()=>{const s=i.type==='password';i.type=s?'text':'password';b.textContent=s?'Hide':'Show';b.setAttribute('aria-label',(s?'Hide':'Show')+' password')}});
const RULES=[[/.{8,}/,'At least 8 characters'],[/[a-z]/,'A lowercase letter'],[/[A-Z]/,'An uppercase letter'],[/\d/,'A number']],ul=$('#rules'),pi=$('input[name=password]',f);
if(ul&&pi){ul.innerHTML=RULES.map(r=>'<li>'+r[1]+'</li>').join('');const lis=$$('li',ul),up=()=>RULES.forEach((r,i)=>lis[i].classList.toggle('ok',r[0].test(pi.value)));pi.addEventListener('input',up);up()}
fetch('/api/auth?a=me').then(r=>r.json()).then(d=>{if(d.user&&kind!=='reset')location.replace('/dashboard')}).catch(()=>{});
if(q.get('registered'))say('Account created. Log in with your email and password.','ok');
if(q.get('reset'))say('Password changed. Log in with your new password.','ok');
let token='';if(kind==='reset'){token=(location.hash.match(/^#t=([a-f0-9]{64})$/)||[])[1]||'';history.replaceState(null,'',location.pathname);if(!token){say('This reset link is invalid. Request a new one.','err');f.hidden=true}}
f.addEventListener('submit',async e=>{e.preventDefault();say('','');const d=Object.fromEntries(new FormData(f));d.consent=!!d.consent;
 if(!f.checkValidity())return f.reportValidity();
 if(d.confirm!==undefined&&d.password!==d.confirm)return say('The two passwords do not match.','err');
 if(d.confirm!==undefined&&!RULES.every(r=>r[0].test(d.password)))return say('Choose a stronger password. Follow the checklist.','err');
 const b=$('button[type=submit]',f),o=b.innerHTML;b.disabled=true;b.innerHTML='<span class="spin"></span>Please wait';
 if(kind==='reset')d.token=token;
 const r=await post({signup:'register',login:'login',forgot:'forgot',reset:'reset'}[kind],d);b.disabled=false;b.innerHTML=o;
 if(!r.ok)return say(r.d.error||'Something went wrong.','err');
 if(kind==='signup')location.href='/login?registered=1';
 else if(kind==='reset')location.href='/login?reset=1';
 else if(kind==='login'){const n=q.get('next');location.href=n&&/^\/[^\/\\]/.test(n)?n:'/dashboard'}
 else{say('If that email is registered, we sent a reset link. It works for 30 minutes. Check your spam folder too.','ok');f.reset()}});
})();
