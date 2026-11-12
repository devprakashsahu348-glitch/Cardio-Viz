(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],root=document.documentElement;
const meta=n=>($(`meta[name=${n}]`)||{}).content||'';
const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},set=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
$('#theme').onclick=()=>{const n=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=n;set('theme',n)};
const menu=$('#menu'),nav=$('#nav');
menu.onclick=()=>{const o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',o)};
$$('#nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded',false)}));
const bar=$('#bar'),top=$('#top');
addEventListener('scroll',()=>{const h=root.scrollHeight-innerHeight;bar.style.width=(h>0?scrollY/h*100:0)+'%';top.hidden=scrollY<600},{passive:true});
top.onclick=()=>scrollTo({top:0});
// analytics only after consent
const ga=meta('ga');
function loadGA(){if(!ga||window.__ga)return;window.__ga=1;const s=document.createElement('script');s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id='+ga;document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',ga,{anonymize_ip:true})}
const ck=$('#cookie');
if(!get('consent'))ck.hidden=false;else if(get('consent')==='all')loadGA();
$$('[data-consent]').forEach(b=>b.onclick=()=>{set('consent',b.dataset.consent);ck.hidden=true;if(b.dataset.consent==='all')loadGA()});
$('#cookie-reset').onclick=()=>{ck.hidden=false};
// utm
try{const p=new URLSearchParams(location.search),u=JSON.parse(sessionStorage.getItem('utm')||'{}');['source','medium','campaign','term','content'].forEach(k=>{const v=p.get('utm_'+k);if(v)u[k]=v.slice(0,100)});sessionStorage.setItem('utm',JSON.stringify(u))}catch(e){}
// floating contact: WhatsApp if configured
const wa=meta('wa'),fl=$('#float');if(wa){fl.href='https://wa.me/'+wa+'?text='+encodeURIComponent('Hello, I have a question about CardioViz.');fl.target='_blank';fl.rel='noopener';fl.setAttribute('aria-label','Chat on WhatsApp')}
// copy
$$('[data-copy]').forEach(b=>b.onclick=async()=>{const t=b.dataset.copy,o=b.textContent;try{await navigator.clipboard.writeText(t);b.textContent='Copied'}catch(e){b.textContent='Press Ctrl+C'}setTimeout(()=>b.textContent=o,1600)});
// search
const IDX=[['Home: what CardioViz does','/','overview risk prediction 3D heart'],['How it works','/#how','model logistic regression SHAP inputs dataset'],['Safety notice and limitations','/#safety','clinical diagnosis disclaimer limitations'],['FAQ','/#faq','questions data free offline'],['Contact','/#contact','email message form whatsapp'],['Terms and conditions','/terms','payment refunds copyright liability'],['Privacy policy','/privacy','data storage neon analytics rights'],['Cookie policy','/cookies','cookies consent google analytics storage']];
const sd=$('#search'),q=$('#q'),rs=$('#results');
$('#open-search').onclick=()=>{sd.showModal();q.focus();draw()};
function draw(){const t=q.value.trim().toLowerCase(),r=IDX.filter(i=>!t||(i[0]+' '+i[2]).toLowerCase().includes(t));rs.innerHTML=r.length?r.map(i=>`<li><a href="${i[1]}">${i[0]}</a></li>`).join(''):'<li>No pages match. Try a shorter word.</li>'}
q.oninput=draw;
// contact form
const f=$('#cf');
if(f){const out=$('#cf-msg'),btn=$('#cf-btn'),cd=$('#confirm');
 const show=(c,t)=>{out.className='msg '+c;out.textContent=t;out.focus()};
 f.addEventListener('submit',e=>{e.preventDefault();out.className='msg';if(!f.checkValidity()){f.reportValidity();show('err','Check the highlighted fields and try again.');return}cd.showModal()});
 cd.addEventListener('close',async()=>{if(cd.returnValue!=='yes')return;btn.disabled=true;const o=btn.innerHTML;btn.innerHTML='<span class="spin"></span>Sending';
  try{const d=Object.fromEntries(new FormData(f));d.consent=!!d.consent;d.utm=JSON.parse(sessionStorage.getItem('utm')||'{}');d.page=location.pathname;
   const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}),j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(j.error||'Something went wrong.');f.reset();show('ok','Message sent. We will reply to the email address you gave.');if(window.gtag)gtag('event','contact_submit')}
  catch(err){show('err',err.message+' You can also email devprakashsahu348@gmail.com.')}
  btn.disabled=false;btn.innerHTML=o})}
})();
