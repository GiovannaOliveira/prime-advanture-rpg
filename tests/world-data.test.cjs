'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
function load(){const ctx=vm.createContext({crypto:crypto.webcrypto,console,document:{getElementById:()=>null},localStorage:{getItem:()=>null,setItem:()=>{}}});ctx.window=ctx;for(const file of ['src/data/assets.js','src/data/creatures.js','src/data/pokemon.js','src/data/map.js','src/data/world-expansion.js','src/data/questions.js','src/data/questions/beginner.js','src/data/questions/elementary.js','src/data/questions/intermediate.js','src/systems/QuestionScheduler.js','src/systems/ProgressionSystem.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});return ctx.Prime;}
const plain=v=>JSON.parse(JSON.stringify(v));
test('56 distinct species, including 40 Gen I workbook Pokemon and six unchanged legacy IDs',()=>{
 const P=load(),entries=Object.entries(P.data.creatures),imported=entries.filter(([,d])=>d.origin==='pokemon-workbook');assert.equal(entries.length,56);assert.equal(imported.length,40);assert.equal(new Set(entries.map(([,d])=>d.name)).size,56);
 for(const [id,name,hp] of [['leaflet','Leaflet',38],['emberbun','Emberbun',35],['ripple','Ripple',40],['pebblit','Pebblit',42],['skydot','Skydot',33],['frosthart','Frosthart',46]]){assert.equal(P.data.creatures[id].name,name);assert.equal(P.data.creatures[id].hp,hp);}
 for(const [id,d] of imported){assert.equal(id,'pokemon-'+String(d.nationalDex).padStart(4,'0'));assert.ok(d.nationalDex>=1&&d.nationalDex<=151);assert.equal(d.generation,'I');assert.equal(d.assetFormat,'portrait');assert.ok(d.types.length>=1&&d.types.length<=2);}
 assert.equal(P.data.rules.saveKey,'prime-adveture-save-v1');assert.equal(new P.systems.ProgressionSystem().state.captures,0);
});
test('active species have habitats; all current and legacy species retain valid data and local artwork',()=>{
 const P=load(),regions=new Set(P.data.map.islands.map(r=>r.id));
 for(const [id,d] of Object.entries(P.data.creatures)){
  assert.equal(d.regions.length>0,!d.legacyOnly,id);assert.ok(d.regions.every(r=>regions.has(r)),id);assert.ok(d.levelRange.every(Number.isFinite));
  assert.ok(d.hp>0&&d.attack>0&&d.defense>=0);assert.ok(P.data.rules.captureBase[d.rarity]>0);assert.ok(fs.existsSync(path.join(root,P.data.assets[d.effect])));
  const bytes=fs.readFileSync(path.join(root,P.data.assets[id]));assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.ok(bytes.readUInt32BE(16)>0&&bytes.readUInt32BE(20)>0);
  if(d.assetFormat==='portrait')assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),d.imageSha256);
  else for(const pose of ['Idle','Attack','Icon'])assert.ok(fs.existsSync(path.join(root,P.data.assets[id+pose])),id+pose);
  for(const type of d.types||[d.type])assert.ok(Object.hasOwn(P.data.typeStrengths,P.data.typeAliases[type]||type),type);
 }
 for(const [id,file] of Object.entries(P.data.assets))assert.ok(fs.existsSync(path.join(root,file)),id);
});
test('reference catalog has 1,025 national species and no owner, storage, or capture history',()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/pokemon-catalog.json'),'utf8'));assert.equal(catalog.sourceRows,1391);assert.equal(catalog.speciesCount,1025);assert.equal(catalog.species.length,1025);assert.match(catalog.sourceSha256,/^[a-f0-9]{64}$/);
 const allowed=['nationalDex','name','generation','region','types','form','hasEvolution','legendary','mythical'];assert.equal(new Set(catalog.species.map(d=>d.nationalDex)).size,1025);
 for(const row of catalog.species){assert.deepEqual(Object.keys(row).sort(),allowed.slice().sort());assert.ok(row.types.length>=1&&row.types.length<=2);}
});
test('ten regions, unique zone IDs, stable original coordinates and data-driven gates',()=>{
 const P=load(),w=P.data.map;assert.equal(w.islands.length,10);assert.deepEqual(plain(w.spawn),[27,23]);assert.ok(w.width>56&&w.height>46);assert.equal(w.islands.find(r=>r.id==='meadow').x,18);
 assert.equal(new Set(w.zones.map(z=>z.id)).size,w.zones.length);
 for(const z of w.zones){assert.ok(w.islands.some(r=>r.id===z.region));assert.ok(z.species.length>0&&z.species.every(id=>P.data.creatures[id] && !P.data.creatures[id].legacyOnly));assert.ok(z.levels[0]>=1&&z.levels[1]>=z.levels[0]);}
 for(const g of w.gates)assert.ok(w.islands.find(r=>r.id===g.region).requirement);
 const s=new P.systems.ProgressionSystem();assert.ok(!s.unlockRegion('ember'));s.state.wins=1;assert.ok(s.unlockRegion('ember'));assert.ok(!s.unlockRegion('ember'));s.state.answers=8;assert.ok(s.unlockRegion('frost'));
 assert.ok(!s.unlockRegion('ruins'));s.state.captures=3;s.state.exploration.visited=w.islands.slice(0,8).map(r=>r.id);assert.ok(s.unlockRegion('ruins'));
});
test('v1 saves preserve old creatures and English history; discovery rewards and new fields normalize safely',()=>{
 const P=load(),s=new P.systems.ProgressionSystem();s.addStarter('leaflet');s.state.coins=123;new P.systems.QuestionScheduler(s).next('Beginner');
 const raw=plain(s.state);delete raw.exploration;const next=s.normalize(raw);assert.equal(next.coins,123);assert.deepEqual(plain(next.party),raw.party);assert.deepEqual(plain(next.questionHistory),raw.questionHistory);assert.deepEqual(plain(next.exploration),{visited:[],unlocked:[],claimed:[]});
 s.state=next;assert.ok(s.visit('meadow'));assert.ok(s.claimDiscovery('meadow'));assert.equal(s.state.coins,138);assert.ok(!s.claimDiscovery('meadow'));assert.ok(!s.claimDiscovery('ember'));
 const safe=s.normalize({...s.state,exploration:{visited:['meadow','meadow','unknown'],unlocked:['frost','bogus'],claimed:['meadow',null]}});assert.deepEqual(plain(safe.exploration),{visited:['meadow'],unlocked:['frost'],claimed:['meadow']});assert.equal(safe.coins,138);
});

test('only Pokémon are offered to new players; originals remain compatible with captured saves',()=>{
 const P=load(),entries=Object.entries(P.data.creatures);
 assert.equal(entries.filter(([,d])=>!d.legacyOnly).length,40);
 assert.deepEqual(entries.filter(([,d])=>d.starter).map(([id])=>id),['pokemon-0001','pokemon-0004','pokemon-0007']);
 for(const zone of P.data.map.zones)assert.ok(zone.species.length && zone.species.every(id=>P.data.creatures[id].origin==='pokemon-workbook'));
 const store=new P.systems.ProgressionSystem();store.addStarter('leaflet');const saved=plain(store.state);assert.deepEqual(plain(store.normalize(saved).party),saved.party);
});
