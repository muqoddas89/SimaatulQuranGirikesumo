'use strict';
/* Website publik read-only: tidak pernah menampilkan transaksi yang belum terverifikasi. */
const $ = id => document.getElementById(id);
const cfg = window.DONATION_CONFIG || {};
const TYPES = {aghniya:'Aghniya (Umum)',air:'Air Mineral',warga:'Donasi Warga/RT'};
const EMPTY = {ok:true,updatedAt:'',rts:[],donations:[]};
const state = {data:EMPTY,filtered:[],page:1,mode:'unconfigured'};
const rupiah = n => 'Rp '+new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(n);
const number = n => new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(n);
const safe = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canonical = (value,prefix) => {const s=String(value??'').trim().toUpperCase();const m=s.match(new RegExp(`^(?:${prefix}\\s*)?0*([0-9]+)$`));return m?`${prefix} ${String(Number(m[1])).padStart(2,'0')}`:''};
const unitLabel = u => String(u||'').trim() || 'Unit';
const isDus = u => unitLabel(u).toLocaleLowerCase('id-ID')==='dus';
function jsonp(url, timeoutMs=15000){
  return new Promise((resolve,reject)=>{
    const cb='girikesumoCallback_'+Math.random().toString(36).slice(2,12);
    const script=document.createElement('script'); let timer, finished=false;
    function cleanup(){if(finished)return;finished=true;clearTimeout(timer);delete window[cb];script.remove()}
    window[cb]=data=>{cleanup();resolve(data)};
    script.onerror=()=>{cleanup();reject(Error('API tidak dapat diakses'))};
    timer=setTimeout(()=>{cleanup();reject(Error('Permintaan API melewati batas waktu'))},timeoutMs);
    try {const u=new URL(url);if(u.protocol!=='https:')throw Error('Alamat API wajib HTTPS');u.searchParams.set('callback',cb);u.searchParams.set('t',Date.now());script.src=u.toString();document.head.appendChild(script)}
    catch(e){cleanup();reject(e)}
  });
}
function normalize(raw){
  if(!raw||raw.ok===false||!Array.isArray(raw.donations)||!Array.isArray(raw.rts))throw Error(raw?.error||'Format data API tidak sesuai');
  const rts=raw.rts.map(r=>({rw:canonical(r.rw,'RW'),rt:canonical(r.rt,'RT'),name:String(r.name||'')})).filter(r=>r.rw&&r.rt);
  const donations=raw.donations.map(d=>({
    id:String(d.id||''),date:String(d.date||''),name:String(d.name||'Hamba Allah'),rw:canonical(d.rw,'RW'),
    rt:canonical(d.rt,'RT'),type:String(d.type||''),amount:Number(d.amount),unit:String(d.unit|| (d.type==='air'?'Dus':'rupiah'))
  })).filter(d=>TYPES[d.type]&&Number.isFinite(d.amount)&&d.amount>0&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&(d.type!=='warga'||(d.rw&&d.rt)))
    .sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
  return {updatedAt:String(raw.updatedAt||''),rts,donations};
}
function dateFormat(s){const d=new Date(`${s}T12:00:00+07:00`);return Number.isNaN(d.getTime())?s:new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}).format(d)}
function render(){
  const all=state.data.donations;
  const sum=type=>all.filter(d=>d.type===type).reduce((a,d)=>a+d.amount,0);
  $('totalAghniya').textContent=rupiah(sum('aghniya'));
  $('totalAir').textContent=number(all.filter(d=>d.type==='air'&&isDus(d.unit)).reduce((a,d)=>a+d.amount,0))+' Dus';
  $('totalWarga').textContent=rupiah(sum('warga'));
  $('totalRT').textContent=number(new Set(all.filter(d=>d.type==='warga').map(d=>`${d.rw}|${d.rt}`)).size)+' RT';
  const entries=new Map(state.data.rts.map(r=>[`${r.rw}|${r.rt}`,r]));
  all.filter(d=>d.type==='warga').forEach(d=>{const key=`${d.rw}|${d.rt}`;if(!entries.has(key))entries.set(key,{rw:d.rw,rt:d.rt,name:''})});
  $('rwGrid').innerHTML=Array.from({length:6},(_,i)=>{
    const rw=`RW ${String(i+1).padStart(2,'0')}`;
    const items=[...entries.values()].filter(r=>r.rw===rw).sort((a,b)=>a.rt.localeCompare(b.rt,'id',{numeric:true}));
    const total=all.filter(d=>d.type==='warga'&&d.rw===rw).reduce((s,d)=>s+d.amount,0);
    return `<article class="rw-group"><div class="rw-heading"><strong>${rw}</strong><span>${rupiah(total)}</span></div>${items.length?`<div class="rw-entries">${items.map(r=>{const amount=all.filter(d=>d.type==='warga'&&d.rw===rw&&d.rt===r.rt).reduce((s,d)=>s+d.amount,0);return `<div class="rt-entry"><span>${safe(r.rt)}${r.name?` <small>${safe(r.name)}</small>`:''}</span><strong>${rupiah(amount)}</strong></div>`}).join('')}</div>`:'<div class="rw-empty">Daftar RT belum diisi pada MASTER_RT.</div>'}</article>`;
  }).join('');
  const rwFilter=$('rwFilter'),rtFilter=$('rtFilter');
  const prevRW=rwFilter.value;
  rwFilter.innerHTML='<option value="all">Semua RW</option>'+Array.from({length:6},(_,i)=>`<option value="RW ${String(i+1).padStart(2,'0')}">RW ${String(i+1).padStart(2,'0')}</option>`).join('');
  rwFilter.value=prevRW==='all'||Array.from({length:6},(_,i)=>`RW ${String(i+1).padStart(2,'0')}`).includes(prevRW)?prevRW:'all';
  const prevRT=rtFilter.value;
  const rts=[...new Set([...entries.values()].filter(r=>rwFilter.value==='all'||r.rw===rwFilter.value).map(r=>r.rt))].sort((a,b)=>a.localeCompare(b,'id',{numeric:true}));
  rtFilter.innerHTML='<option value="all">Semua RT</option>'+rts.map(rt=>`<option value="${safe(rt)}">${safe(rt)}</option>`).join('');
  rtFilter.value=rts.includes(prevRT)?prevRT:'all';
  renderTable();
}
function renderTable(){
  const search=$('searchInput').value.trim().toLocaleLowerCase('id-ID'),type=$('categoryFilter').value,rw=$('rwFilter').value,rt=$('rtFilter').value;
  state.filtered=state.data.donations.filter(d=>(type==='all'||d.type===type)&&(rw==='all'||d.rw===rw)&&(rt==='all'||d.rt===rt)&&(!search||`${d.name} ${d.rw} ${d.rt} ${d.id}`.toLocaleLowerCase('id-ID').includes(search)));
  const size=Math.max(1,Number(cfg.pageSize)||8),max=Math.max(1,Math.ceil(state.filtered.length/size));state.page=Math.min(state.page,max);
  const slice=state.filtered.slice((state.page-1)*size,state.page*size);
  $('donationRows').innerHTML=slice.length?slice.map(d=>`<tr><td>${safe(dateFormat(d.date))}</td><td>${safe(d.name)}</td><td>${safe([d.rw,d.rt].filter(Boolean).join(' / ')||'Umum')}</td><td><span class="type-pill ${d.type}">${safe(TYPES[d.type])}</span></td><td class="amount-cell">${d.type==='air'?number(d.amount)+' '+safe(d.unit):rupiah(d.amount)}</td></tr>`).join(''):`<tr><td colspan="5" class="empty-cell">${state.mode==='unconfigured'?'Koneksi Google Sheets belum diaktifkan.':'Belum ada donasi terverifikasi sesuai filter.'}</td></tr>`;
  $('resultCount').textContent=number(state.filtered.length)+' transaksi';$('pageInfo').textContent=`${state.page} / ${max}`;$('prevBtn').disabled=state.page<=1;$('nextBtn').disabled=state.page>=max;
}
function exportCsv(){
  const quote=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
  const rows=[['Tanggal','Nama Publik Donatur','RW','RT','Kategori','Jumlah','Satuan'],...state.filtered.map(d=>[d.date,d.name,d.rw,d.rt,TYPES[d.type],d.amount,d.unit])];
  const csv='\ufeff'+rows.map(r=>r.map(quote).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`laporan-donasi-girikesumo-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function status(mode,message,detail){
  state.mode=mode;
  $('dataStatus').textContent=message;
  $('updateText').textContent=detail;
  $('demoLabel').hidden=mode==='live';
  $('demoLabel').textContent=mode==='unconfigured'?'KONEKSI BELUM AKTIF':'PERIKSA KONEKSI';
  document.querySelector('.status-dot').classList.toggle('live',mode==='live');
}
async function refresh(){
  if(!cfg.apiUrl){status('unconfigured','Website siap — koneksi Google Sheets belum aktif','Isi URL Web App di config.js setelah melakukan deployment Apps Script.');render();return}
  try {
    const raw=await jsonp(cfg.apiUrl,cfg.apiTimeoutMs),data=normalize(raw);
    state.data=data;render();
    const dt=data.updatedAt?new Date(data.updatedAt):null;
    const stamp=dt&&!isNaN(dt)?new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(dt):'Waktu pembaruan tidak diketahui';
    status('live','Data donasi terverifikasi',`Sinkronisasi: ${stamp} WIB`);
  }catch(e){console.error('Gagal mengambil data:',e);status('error','Koneksi database gagal',`Data sebelumnya ${state.data.updatedAt?'masih ditampilkan':'tidak tersedia'}. ${e.message}`);render()}
}
function init(){
  document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',()=>{ $('nav').classList.remove('open');$('menuBtn').setAttribute('aria-expanded','false');document.querySelectorAll('.nav-link').forEach(x=>x.classList.remove('active'));a.classList.add('active');if(a.dataset.type){$('categoryFilter').value=a.dataset.type;state.page=1;renderTable()}}));
  $('menuBtn').addEventListener('click',()=>{const open=$('nav').classList.toggle('open');$('menuBtn').setAttribute('aria-expanded',String(open))});
  for(const id of ['searchInput','categoryFilter','rwFilter','rtFilter'])$(id).addEventListener(id==='searchInput'?'input':'change',()=>{state.page=1;if(id==='rwFilter')render();else renderTable()});
  $('prevBtn').addEventListener('click',()=>{state.page--;renderTable()});$('nextBtn').addEventListener('click',()=>{state.page++;renderTable()});$('downloadCsv').addEventListener('click',exportCsv);
  render();refresh();if(cfg.apiUrl&&Number(cfg.refreshMs)>0)setInterval(refresh,Math.max(30000,Number(cfg.refreshMs)));
}
init();
