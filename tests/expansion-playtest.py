"""World expansion, imported Pokemon, and legacy-save acceptance tests."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright

OUT=Path(os.environ.get('PRIME_TEST_ARTIFACTS','/tmp/prime-expansion-tests'));OUT.mkdir(exist_ok=True,parents=True)
async def ready(page):await page.wait_for_function('Prime.game.encounters && document.getElementById("loading").hidden')
async def solve(page):
 answer=await page.evaluate('Prime.game.english.current.q.answer')
 await page.locator(f'[data-answer="{answer}"]').click()
 await page.locator('#continue-question').click()
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('PRIME_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':960});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto('http://127.0.0.1:8000');await ready(page)
  assert await page.title()=='Prime Adventure · A little English, a big adventure'
  summary=await page.evaluate('''()=>({regions:Prime.data.map.islands.length,species:Object.keys(Prime.data.creatures).length,pokemon:Object.values(Prime.data.creatures).filter(d=>d.origin==='pokemon-workbook').length,missing:Prime.game.assets.missing,unplaced:Object.values(Prime.data.creatures).filter(d=>(!d.legacyOnly&&!d.regions.length)||!d.levelRange.every(Number.isFinite)).length})''')
  assert summary=={'regions':10,'species':56,'pokemon':40,'missing':[],'unplaced':0},summary
  assert await page.evaluate("Object.values(Prime.data.creatures).filter(d=>d.starter).map(d=>d.nationalDex)")==[1,4,7]
  assert not await page.evaluate("Prime.game.encounters.eligible('leaflet')")
  await page.evaluate('Prime.game.ui.collection()')
  assert await page.locator('.collection-grid .creature-card').count()==40
  assert await page.locator('#collection-count').inner_text()=='0/40'
  await page.keyboard.press('Escape')
  await page.screenshot(path=str(OUT/'01-village.png'))
  # Restore a v1 save with all original IDs and real question history, but no expansion field.
  legacy=await page.evaluate('''()=>{
   const g=Prime.game;g.english.scheduler.next('Beginner');const save=JSON.parse(JSON.stringify(g.store.state));
   save.party=['leaflet','emberbun','ripple','pebblit','skydot','frosthart'].map(id=>Prime.data.makeCreature(id,2));save.activeId=save.party[0].id;
   save.coins=321;save.orbs=100;save.answers=12;save.playerXp=50;delete save.exploration;
   localStorage.setItem(Prime.data.rules.saveKey,JSON.stringify(save));g.savePosition=()=>{};return save;
  }''')
  await page.reload();await ready(page)
  restored=await page.evaluate('Prime.game.store.state')
  for key in ['party','activeId','coins','orbs','answers','playerXp','questionHistory']:assert restored[key]==legacy[key],key
  assert 'meadow' in restored['exploration']['visited']
  await page.evaluate('Prime.game.ui.collection()')
  assert await page.locator('.collection-grid .creature-card').count()==46
  assert 'Leaflet' in await page.locator('.collection-grid').inner_text()
  assert await page.locator('#collection-count').inner_text()=='6/46'
  await page.keyboard.press('Escape')
  assert not await page.evaluate('Prime.game.world.walkable(55*32,20*32)')
  assert not await page.evaluate("Prime.game.travelTo('ember')")
  assert not await page.evaluate("Prime.game.encounters.eligible('pokemon-0146')")
  # A real interaction at the gate must enforce requirements, allow cancellation, and then unlock.
  await page.evaluate('Prime.game.player.x=53.8*32;Prime.game.player.y=20*32;Prime.game.updateInteraction()')
  await page.keyboard.press('e');assert 'Win a friendly battle' in await page.locator('.dialogue-text').inner_text();await page.keyboard.press('Escape')
  await page.evaluate('Prime.game.store.state.wins=1');await page.keyboard.press('e')
  await page.keyboard.press('Escape');assert not await page.evaluate("Prime.game.world.isOpen('ember')")
  await page.keyboard.press('e');await solve(page)
  assert await page.evaluate("Prime.game.world.isOpen('ember')&&Prime.game.world.walkable(55*32,20*32)")
  await page.keyboard.down('d');await page.wait_for_timeout(2100);await page.keyboard.up('d')
  assert await page.evaluate("Prime.game.store.state.exploration.visited.includes('ember')")
  await page.screenshot(path=str(OUT/'02-highlands.png'))
  assert await page.evaluate("Prime.game.travelTo('meadow')")
  assert await page.evaluate("Prime.game.travelTo('ember')")
  # Field-note rewards are one-time and enable their legendary encounters.
  await page.evaluate('Prime.game.player.x=75*32;Prime.game.player.y=24*32;Prime.game.updateInteraction()')
  coins=await page.evaluate('Prime.game.store.state.coins')
  await page.keyboard.press('e');await page.get_by_role('button',name='Try a discovery challenge').click();await solve(page)
  assert await page.evaluate('Prime.game.store.state.coins')==coins+15
  assert await page.evaluate("Prime.game.encounters.eligible('pokemon-0146')")
  assert not await page.evaluate("Prime.game.store.claimDiscovery('ember')")
  # Test remaining unlock predicates and real challenge flow.
  assert not await page.evaluate("Prime.game.store.unlockStatus('ruins').ready")
  await page.evaluate("Prime.game.store.state.exploration.visited=['meadow','forest','academy','shop','beach','dock','ember','caverns'];Prime.game.store.state.captures=3;Prime.game.openGate('ruins')")
  await solve(page);assert await page.evaluate("Prime.game.world.isOpen('ruins')")
  await page.evaluate("Prime.game.openGate('frost')");await solve(page)
  assert await page.evaluate("Prime.game.world.isOpen('frost')")
  # With all gates open, collision geometry must connect every arrival, post, NPC and spawn patch.
  geometry=await page.evaluate('''()=>{
   const g=Prime.game,w=g.world,start=[54,46],queue=[start],seen=new Set([start.join(',')]);
   for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&w.walkable(nx*16,ny*16)){seen.add(k);queue.push([nx,ny]);}}}
   const points=[...w.data.islands.flatMap(r=>[{id:r.id+'-arrival',x:r.arrival[0]*32,y:r.arrival[1]*32,exact:true},{id:r.id+'-note',x:r.note[0]*32,y:r.note[1]*32}]),...w.data.zones.map(z=>({id:z.id,x:(z.x+z.w/2)*32,y:(z.y+z.h/2)*32}))];
   return points.map(p=>({...p,safe:!p.exact||w.walkable(p.x,p.y),reachable:queue.some(([x,y])=>Math.hypot(x*16-p.x,y*16-p.y)<(p.exact?24:60))}));
  }''')
  assert all(p['safe'] and p['reachable'] for p in geometry),[p for p in geometry if not p['safe'] or not p['reachable']]
  # Every zone can actually spawn; levels, habitats, bounds and limits must stay valid.
  spawn=await page.evaluate('''()=>{
   const g=Prime.game;g.store.state.exploration.claimed=g.world.data.islands.map(r=>r.id);const results=[];
   for(const z of g.world.data.zones){g.encounters.wild=[];g.player.x=27*32;g.player.y=23*32;for(let n=0;n<20&&!g.encounters.wild.length;n++)g.encounters.spawn(z);results.push({zone:z.id,count:g.encounters.wild.length,valid:g.encounters.wild.every(c=>z.species.includes(c.species)&&c.level>=z.levels[0]&&c.level<=z.levels[1]&&g.world.walkable(c.x,c.y)&&g.world.regionAt(c.x,c.y).id===z.region)});}
   return results;
  }''')
  assert all(r['count'] and r['valid'] for r in spawn),spawn
  # All 40 imported portraits must work through the actual capture challenge and collection.
  ids=await page.evaluate("Object.entries(Prime.data.creatures).filter(([,d])=>d.origin==='pokemon-workbook').map(([id])=>id)")
  for index,id in enumerate(ids):
   await page.evaluate('''id=>{
    const g=Prime.game,z=g.world.data.zones.find(z=>z.species.includes(id));g.encounters.wild=[];
    const wild={...Prime.data.makeCreature(id,3),x:g.player.x+35,y:g.player.y,zone:z.id,region:z.region};g.encounters.wild.push(wild);g.battle.start(wild);
   }''',id)
   assert await page.locator('.fighter.enemy.static-sprite').count()==1
   if index==0:await page.screenshot(path=str(OUT/'03-pokemon-battle.png'))
   await page.locator('[data-battle="capture"]').click()
   answer=await page.evaluate('Prime.game.english.current.q.answer');await page.locator(f'[data-answer="{answer}"]').click()
   await page.evaluate('''()=>{const random=Math.random;try{Math.random=()=>0;document.getElementById('continue-question').click();}finally{Math.random=random;}}''')
   assert await page.evaluate('Prime.game.battle.current.ended')
   await page.locator('#return-map').click()
  assert await page.evaluate("Prime.game.store.state.party.filter(c=>Prime.data.creatures[c.species].origin==='pokemon-workbook').length")==40
  await page.get_by_role('button',name='Collection',exact=False).click()
  await page.locator('#filter-type').select_option('Electric')
  assert await page.locator('.collection-grid .creature-card:not(.unknown)').count()>=1
  assert 'Pikachu' in await page.locator('.collection-grid').inner_text()
  await page.locator('[data-active]:not(:disabled)').last.click()
  assert await page.evaluate("Prime.data.creatures[Prime.game.store.active().species].origin==='pokemon-workbook'")
  await page.screenshot(path=str(OUT/'04-collection.png'));await page.keyboard.press('Escape')
  # Check static player portrait too, not only the animated legacy player's art.
  await page.evaluate("Prime.game.battle.start({...Prime.data.makeCreature('pokemon-0025',2),region:'meadow',zone:'meadow'})")
  assert await page.locator('.fighter.friend.static-sprite').count()==1
  await page.screenshot(path=str(OUT/'05-pokemon-versus-pokemon.png'));await page.locator('[data-battle="run"]').click()
  # Discovery, gates, imported captures and active instance must survive reload.
  await page.reload();await ready(page)
  assert await page.evaluate('Prime.game.store.state.party.length')==46
  assert await page.evaluate("Prime.game.store.state.exploration.unlocked.includes('frost')&&Prime.game.store.state.exploration.claimed.includes('ember')")
  await page.evaluate("Prime.game.player.x=108*32;Prime.game.player.y=20*32;Prime.game.recordRegion();Prime.game.encounters.refresh()")
  await page.wait_for_timeout(200);await page.screenshot(path=str(OUT/'06-frost.png'))
  await page.evaluate("Prime.game.player.x=107*32;Prime.game.player.y=51*32;Prime.game.recordRegion();Prime.game.encounters.refresh()")
  await page.wait_for_timeout(200);await page.screenshot(path=str(OUT/'07-ruins.png'))
  await page.evaluate("Prime.game.travelTo('caverns')")
  await page.wait_for_timeout(200);await page.screenshot(path=str(OUT/'08-caverns.png'))
  assert await page.evaluate('Prime.game.encounters.wild.length<=8')
  await page.get_by_role('button',name='Open island map').click()
  assert await page.locator('.region-entry').count()==10
  await page.screenshot(path=str(OUT/'09-atlas.png'))
  await page.set_viewport_size({'width':1024,'height':768})
  assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
  await page.screenshot(path=str(OUT/'10-small-desktop.png'))
  assert not errors,errors
  print(json.dumps({'status':'PASS','world':summary,'geometryTargets':len(geometry),'spawnZones':len(spawn),'importedPokemonCaptured':40,'legacyCreaturesPreserved':6,'page_errors':errors,'screenshots':str(OUT)},indent=2))
  await browser.close()
asyncio.run(main())
