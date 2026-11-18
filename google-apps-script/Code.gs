/**
 * API publik, hanya membaca Google Sheets dan hanya menampilkan donasi terverifikasi.
 * Spreadsheet tujuan dibuat untuk Panitia Simaatul Qur'an Girikesumo 2027.
 * Tempelkan ke Apps Script terikat pada Sheet atau proyek script.google.com.
 */
const SPREADSHEET_ID = '1bMjfQNxCt-stzNBv66nAI96ETsXLzOpnDDOUcqxrq_g';
const TZ = 'Asia/Jakarta';
const COLUMNS = {
  DONASI_AGHNIYA: ['ID Transaksi','Tanggal','Nama Donatur','Nominal (Rp)','Metode','Status','Keterangan'],
  DONASI_AIR: ['ID Transaksi','Tanggal','Nama Donatur','Jumlah','Satuan','Jenis/Kemasan','Status','Keterangan'],
  DONASI_WARGA_RT: ['ID Transaksi','Tanggal','RW','RT','Nama Penyetor/Perwakilan','Nominal (Rp)','Status','Keterangan'],
  MASTER_RT: ['RW','RT','Wilayah/Dukuh','Koordinator RT','Keterangan']
};

function doGet(e) {
  const params = (e && e.parameter) || {};
  const callback = String(params.callback || '');
  // JSONP untuk GitHub Pages: nama callback hanya karakter yang diizinkan.
  if (!/^girikesumoCallback_[a-z0-9]{5,30}$/.test(callback)) {
    return ContentService.createTextOutput('Callback tidak valid.').setMimeType(ContentService.MimeType.TEXT);
  }
  let payload;
  try { payload = publicData_(); }
  catch (err) { console.error(err); payload = {ok:false, error:'Data donasi belum dapat dibaca.'}; }
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function publicData_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Spreadsheet terikat tidak ditemukan.");
  const rows = {};
  Object.keys(COLUMNS).forEach(name => {rows[name] = records_(ss, name, COLUMNS[name]);});
  const verified_ = value => str_(value).toLowerCase() === 'terverifikasi';
  const amount_ = x => typeof x === 'number' ? x : Number(str_(x).replace(/[^\d,-]/g,'').replace(/,/g,'.'));
  const donors = rows.DONASI_AGHNIYA.filter(r => verified_(r['Status'])).map(r => ({
    id:str_(r['ID Transaksi']), date:date_(r['Tanggal']), name:str_(r['Nama Donatur']) || 'Hamba Allah',
    type:'aghniya', amount:amount_(r['Nominal (Rp)']), rw:'', rt:'', unit:'rupiah'
  }));
  const water = rows.DONASI_AIR.filter(r => verified_(r['Status'])).map(r => ({
    id:str_(r['ID Transaksi']), date:date_(r['Tanggal']), name:str_(r['Nama Donatur']) || 'Hamba Allah',
    type:'air', amount:amount_(r['Jumlah']), rw:'', rt:'', unit:str_(r['Satuan']) || 'Tidak ditentukan'
  }));
  const residents = rows.DONASI_WARGA_RT.filter(r => verified_(r['Status'])).map(r => ({
    id:str_(r['ID Transaksi']), date:date_(r['Tanggal']), name:str_(r['Nama Penyetor/Perwakilan']) || 'Warga',
    type:'warga', amount:amount_(r['Nominal (Rp)']), rw:region_(r['RW'],'RW'), rt:region_(r['RT'],'RT'), unit:'rupiah'
  }));
  const rts = rows.MASTER_RT.map(r => ({rw:region_(r['RW'],'RW'),rt:region_(r['RT'],'RT'),name:str_(r['Wilayah/Dukuh'])}))
    .filter(r => r.rw && r.rt);
  const donations = donors.concat(water,residents).filter(r => r.date && Number.isFinite(r.amount) && r.amount > 0 && (r.type !== 'warga' || (r.rw && r.rt)));
  return {ok:true, updatedAt:new Date().toISOString(), rts:rts, donations:donations};
}
function records_(ss, name, required) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Tab tidak ditemukan: '+name);
  const last = sh.getLastRow();
  if (last <= 1) return [];
  // Hanya memuat kolom yang diperlukan, bukan seluruh area format kosong.
  const heads = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(str_);
  required.forEach(h => {if (!heads.includes(h)) throw new Error('Kolom tidak ditemukan pada '+name+': '+h);});
  const data = sh.getRange(2,1,last-1,heads.length).getValues();
  return data.filter(row => row.some(x => x !== '' && x !== null)).map(row => Object.fromEntries(heads.map((h,i)=>[h,row[i]])));
}
function str_(v) {return String(v === null || v === undefined ? '' : v).trim();}
function date_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v,TZ,'yyyy-MM-dd');
  const s = str_(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {const [d,m,y]=s.split('/');return `${y}-${m}-${d}`;}
  return '';
}
function region_(value,prefix) {
  const s=str_(value).toUpperCase();
  const m=s.match(new RegExp('^(?:'+prefix+'\\s*)?0*([0-9]+)$'));
  return m ? prefix+' '+String(Number(m[1])).padStart(2,'0') : '';
}
/** Jalankan dari editor bila ingin menguji API tanpa deployment. */
function testPublicData() { const x=publicData_(); Logger.log(JSON.stringify({ok:x.ok,donations:x.donations.length,rts:x.rts.length})); }
