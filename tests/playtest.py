"""Desktop browser acceptance tests. Test-only dependency: Python Playwright + Chromium.
Run: python3 tests/playtest.py [http://127.0.0.1:8000 | file:///.../index.html]
The game itself has no package or server dependency.
"""
import asyncio
import json
import os
from pathlib import Path
import sys
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8000'
ARTIFACTS = Path(os.environ.get('PRIME_TEST_ARTIFACTS', '/tmp/prime-adveture-tests'))
ARTIFACTS.mkdir(parents=True, exist_ok=True)

async def ready(page):
    await page.wait_for_function('window.Prime?.game?.encounters && document.getElementById("loading").hidden')

async def answer(page, wrong_first=False):
    correct = await page.evaluate('Prime.game.english.current.q.answer')
    if wrong_first:
        await page.locator(f'[data-answer="{(correct + 1) % 3}"]').click()
        assert await page.locator('#feedback').inner_text() != 'Take your time. You can try again!'
        assert await page.locator('#continue-question').is_hidden()
    await page.locator(f'[data-answer="{correct}"]').click()
    assert 'Well done!' in await page.locator('#feedback').inner_text()

async def deterministic_continue(page, random_value):
    await page.evaluate('''value => {
        const old = Math.random;
        try { Math.random = () => value; document.getElementById('continue-question').click(); }
        finally { Math.random = old; }
    }''', random_value)

async def near(page, kind):
    # Arrange the player near a real world entity, then use the actual keyboard interaction.
    await page.evaluate('''kind=>{
        const g=Prime.game;
        const n=g.world.data.npcs.find(n=>n.action===kind);
        g.player.x=n?n.x*32:g.world.data.chest.x*32;
        g.player.y=n?n.y*32+28:g.world.data.chest.y*32+28;
        g.updateInteraction();
    }''', kind)
    await page.keyboard.press('e')

async def encounter(page):
    await page.evaluate('''()=>{
        const g=Prime.game;
        let c=g.encounters.wild.find(c=>c.zone==='meadow');
        if(!c){g.encounters.spawn(g.world.data.zones.find(z=>z.id==='meadow'),true);c=g.encounters.wild.find(c=>c.zone==='meadow');}
        if(!c){c=g.encounters.wild[0];}
        g.player.x=c.x;g.player.y=c.y+35;g.updateInteraction();
    }''')
    await page.keyboard.press('e')
    await page.wait_for_function('Prime.game.ui.kind === "battle"')

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=os.environ.get('PRIME_CHROMIUM','/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        page = await browser.new_page(viewport={'width':1440,'height':960})
        errors=[]
        page.on('pageerror', lambda error:errors.append(str(error)))
        await page.goto(URL)
        await ready(page)
        assert await page.evaluate('Prime.game.assets.missing.length') == 0
        assert await page.evaluate('Prime.game.world.walkable(Prime.game.player.x,Prime.game.player.y)')
        await page.screenshot(path=str(ARTIFACTS/'01-world.png'))
        # Keyboard movement and diagonal speed are real, not simulated state changes.
        start=await page.evaluate('({x:Prime.game.player.x,y:Prime.game.player.y})')
        await page.keyboard.down('d');await page.wait_for_timeout(350);await page.keyboard.up('d')
        end=await page.evaluate('({x:Prime.game.player.x,y:Prime.game.player.y})')
        assert end['x'] > start['x']+25
        # Every area and NPC can be reached from spawn with feet-level collision checks.
        connectivity=await page.evaluate('''()=>{
            const g=Prime.game,w=g.world,step=16,start=[27*2,23*2],queue=[start],seen=new Set([start.join(',')]);
            for(let i=0;i<queue.length;i++){
                const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
                    const nx=x+dx,ny=y+dy,k=nx+','+ny;
                    if(!seen.has(k)&&w.walkable(nx*step,ny*step)){seen.add(k);queue.push([nx,ny]);}
                }
            }
            const points=[...w.data.npcs.map(n=>({name:n.name,x:n.x*32,y:n.y*32})),...w.data.signs.map(n=>({name:n.title,x:n.x*32,y:n.y*32})),...w.data.zones.map(n=>({name:n.id,x:(n.x+n.w/2)*32,y:(n.y+n.h/2)*32})),{name:'chest',x:w.data.chest.x*32,y:w.data.chest.y*32}];
            return points.map(p=>({name:p.name,reachable:queue.some(([x,y])=>Math.hypot(x*step-p.x,y*step-p.y)<60)}));
        }''')
        assert all(p['reachable'] for p in connectivity), connectivity
        # Actual water collision: holding right cannot carry the player out into the sea.
        await page.evaluate('Prime.game.player.x=35*32-15;Prime.game.player.y=27*32')
        await page.keyboard.down('d');await page.wait_for_timeout(500);await page.keyboard.up('d')
        assert await page.evaluate('Prime.game.world.walkable(Prime.game.player.x,Prime.game.player.y)')
        assert await page.evaluate('Prime.game.player.x') < 36*32
        await page.keyboard.press('r')
        await page.get_by_role('button',name='Choose your first friend').click()
        await page.screenshot(path=str(ARTIFACTS/'02-starters.png'))
        await page.get_by_role('button',name='Choose Leaflet',exact=True).click()
        assert await page.evaluate('Prime.game.store.active().species')=='leaflet'
        await encounter(page)
        await page.screenshot(path=str(ARTIFACTS/'03-battle.png'))
        before=await page.evaluate('Prime.game.battle.current.wild.hp')
        await page.locator('[data-battle="attack"]').click()
        assert await page.locator('[data-battle="attack"]').is_disabled()
        await page.wait_for_function('Prime.game.battle.current && !Prime.game.battle.current.locked')
        assert await page.evaluate('Prime.game.battle.current.wild.hp') < before
        # A solved English challenge executes the real special move and effect animation.
        await page.evaluate('Prime.game.battle.current.wild.hp=Prime.game.battle.current.wild.maxHp')
        before=await page.evaluate('Prime.game.battle.current.wild.hp')
        await page.locator('[data-battle="special"]').click()
        await answer(page)
        await page.locator('#continue-question').click()
        assert await page.evaluate('Prime.game.battle.current.wild.hp') < before
        assert await page.locator('.battle-effect').count()==1
        await page.wait_for_function('Prime.game.battle.current && !Prime.game.battle.current.locked')
        # Challenge cancellation preserves the action and item count.
        await page.evaluate('Prime.game.battle.current.friend.hp=Prime.game.battle.current.friend.maxHp')
        orbs=await page.evaluate('Prime.game.store.state.orbs')
        await page.locator('[data-battle="capture"]').click()
        await page.keyboard.press('Escape')
        assert await page.evaluate('Prime.game.ui.kind')=='battle'
        assert await page.evaluate('Prime.game.store.state.orbs')==orbs
        await page.locator('[data-battle="capture"]').click()
        await answer(page,wrong_first=True)
        await page.screenshot(path=str(ARTIFACTS/'04-question.png'))
        # Deterministically exercise failure, not just the happy path.
        await deterministic_continue(page,.999)
        await page.wait_for_function('Prime.game.battle.current && !Prime.game.battle.current.locked')
        assert await page.evaluate('Prime.game.store.state.orbs')==orbs-1
        assert 'not ready yet' in await page.locator('.battle-message').inner_text()
        await page.locator('[data-battle="capture"]').click();await answer(page)
        await deterministic_continue(page,0)
        assert await page.evaluate('Prime.game.store.state.party.length')==2
        assert await page.evaluate('Prime.game.store.state.captures')==1
        assert await page.evaluate('Prime.game.battle.current.ended')
        await page.locator('#return-map').click()
        assert await page.locator('#modal-root').is_hidden()
        # Collection, potion, switching creatures.
        await page.get_by_role('button',name='Collection',exact=False).click()
        if await page.locator('[data-active]:not(:disabled)').count():
            await page.locator('[data-active]:not(:disabled)').first.click()
        await page.evaluate('Prime.game.store.active().hp=1')
        potions=await page.evaluate('Prime.game.store.state.potions')
        await page.locator('#potion-btn').click()
        assert await page.evaluate('Prime.game.store.active().hp===Prime.game.store.active().maxHp')
        assert await page.evaluate('Prime.game.store.state.potions')==potions-1
        await page.keyboard.press('Escape')
        # Daily reward must be single-claim, even after reload.
        await near(page,'chest');await answer(page);await page.locator('#continue-question').click()
        assert await page.evaluate('Prime.game.store.state.streak')==1
        last=await page.evaluate('Prime.game.store.state.lastClaim')
        await page.keyboard.press('Escape')
        await page.reload();await ready(page)
        assert await page.evaluate('Prime.game.store.state.party.length')==2
        assert await page.evaluate('Prime.game.store.state.lastClaim')==last
        await near(page,'chest')
        assert 'Come back' in await page.locator('.dialogue-text').inner_text()
        await page.keyboard.press('Escape')
        # Shop and free healing through actual entity interactions.
        coins=await page.evaluate('Prime.game.store.state.coins')
        await near(page,'shop');await page.locator('[data-buy="orbs"]').click()
        assert await page.evaluate('Prime.game.store.state.coins')==coins-15
        await page.keyboard.press('Escape')
        await page.evaluate('Prime.game.store.state.party.forEach(c=>c.hp=0)')
        await near(page,'heal')
        assert await page.evaluate('Prime.game.store.state.party.every(c=>c.hp===c.maxHp)')
        await page.keyboard.press('Escape')
        # Difficulty affects the actual question pool.
        await page.get_by_role('button',name='English club').click()
        await page.locator('#difficulty').select_option('Elementary')
        await page.locator('#practice-btn').click()
        assert await page.evaluate('Prime.game.english.current.q.level')=='Elementary'
        await answer(page);await page.locator('#continue-question').click()
        await page.keyboard.press('Escape')
        # Victory and defeat restore a usable map instead of stranding the UI.
        await encounter(page)
        await page.evaluate('Prime.game.battle.current.wild.hp=1')
        await page.locator('[data-battle="attack"]').click()
        assert await page.evaluate('Prime.game.battle.current.ended')
        assert await page.evaluate('Prime.game.store.state.wins')==1
        await page.locator('#return-map').click()
        await encounter(page)
        await page.evaluate('Prime.game.battle.current.friend.hp=1;Prime.game.battle.current.wild.hp=100;Prime.game.battle.current.wild.maxHp=100')
        await page.locator('[data-battle="attack"]').click()
        await page.wait_for_function('Prime.game.battle.current.ended')
        assert await page.evaluate('Prime.game.store.active().hp')==0
        await page.locator('#return-map').click()
        await near(page,'heal');await page.keyboard.press('Escape')
        # Creature XP actually changes level, HP, and progression.
        assert await page.evaluate('''()=>{
            const g=Prime.game,c=g.store.active(),level=c.level,maxHp=c.maxHp;
            c.xp=c.level*25-1;const levels=g.store.addXp(c,15);
            return levels===1&&c.level===level+1&&c.maxHp===maxHp+5&&c.hp<=c.maxHp;
        }''')
        # Map and guide have real, readable UI content.
        await page.get_by_role('button',name='Open island map').click()
        assert await page.locator('#island-map').is_visible()
        await page.screenshot(path=str(ARTIFACTS/'07-map.png'))
        await page.keyboard.press('Escape')
        await near(page,'academy')
        assert 'Professor Willow' in await page.locator('.dialogue-name').inner_text()
        await page.get_by_role('button',name='Visit the English club').click()
        await page.get_by_role('button',name='How to play').click()
        assert 'Ready, little explorer?' in await page.locator('.panel h1').inner_text()
        await page.keyboard.press('Escape')
        # Reset asks for confirmation and preserves progress when declined.
        await page.get_by_role('button',name='Settings',exact=True).click()
        await page.get_by_role('button',name='Reset progress',exact=True).click()
        assert await page.get_by_role('button',name='Yes, start again').is_visible()
        await page.get_by_role('button',name='Keep my adventure').click()
        assert await page.evaluate('Prime.game.store.state.party.length')>=2
        await page.keyboard.press('Escape')
        # Daily streak milestone, and normalization of malformed saves.
        assert await page.evaluate('''()=>{
            const s=Prime.game.store;s.state.lastClaim=Date.now()-86400001;s.state.streak=2;
            const r=s.claim();return r.bonus&&r.streak===3&&s.claim()===null;
        }''')
        assert await page.evaluate('''()=>{
            const s=Prime.game.store;
            const clean=s.normalize({version:1,coins:-20,orbs:'bad',party:[{species:'invented'},{species:'leaflet',level:900,hp:99999,id:'ok'}],lastClaim:Date.now()+999999});
            return clean.coins===0&&clean.orbs===0&&clean.party.length===1&&clean.party[0].level===50&&clean.party[0].hp===clean.party[0].maxHp&&clean.lastClaim===0;
        }''')
        # All random spawns remain in their zones and on walkable ground.
        valid=await page.evaluate('''()=>{
            const g=Prime.game;g.encounters.wild=[];
            for(let i=0;i<500;i++)g.encounters.update(.1);
            return g.encounters.wild.length<=8&&g.encounters.wild.every(c=>{const z=g.world.data.zones.find(z=>z.id===c.zone);return g.world.walkable(c.x,c.y)&&c.x>=z.x*32&&c.x<(z.x+z.w)*32&&c.y>=z.y*32&&c.y<(z.y+z.h)*32;});
        }''')
        assert valid
        await page.keyboard.press('r')
        await page.set_viewport_size({'width':1024,'height':768})
        await page.wait_for_timeout(100)
        assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
        await page.screenshot(path=str(ARTIFACTS/'05-small-desktop.png'))
        # Accepting reset really clears progress and restores the starting position.
        await page.get_by_role('button',name='Settings',exact=True).click()
        await page.get_by_role('button',name='Reset progress',exact=True).click()
        async with page.expect_navigation():
            await page.get_by_role('button',name='Yes, start again').click()
        await ready(page)
        assert await page.evaluate('Prime.game.store.state.party.length')==0
        assert await page.evaluate('Prime.game.player.x===27*32&&Prime.game.player.y===23*32')
        # Corrupt JSON recovery is tested on a real fresh load.
        await page.evaluate('localStorage.setItem(Prime.data.rules.saveKey,"broken JSON")')
        # Avoid pagehide writing a fresh save over the fixture.
        await page.evaluate('Prime.game.savePosition=()=>{}')
        await page.reload();await ready(page)
        assert await page.evaluate('Prime.game.store.state.party.length')==0
        fallback=await browser.new_page(viewport={'width':1280,'height':800})
        fallback.on('pageerror',lambda error:errors.append(str(error)))
        await fallback.route('**/assets/characters/player.png',lambda route:route.abort())
        await fallback.route('**/assets/creatures/leaflet*',lambda route:route.abort())
        await fallback.goto(URL);await ready(fallback)
        assert 'player' in await fallback.evaluate('Prime.game.assets.missing')
        await fallback.get_by_role('button',name='Choose your first friend').click()
        assert await fallback.locator('.sprite-image.placeholder').count()>=1
        await fallback.get_by_role('button',name='Choose Leaflet',exact=True).click()
        assert await fallback.locator('#companion-art .placeholder').count()==1
        await fallback.screenshot(path=str(ARTIFACTS/'06-missing-assets.png'))
        await fallback.close()
        assert not errors, errors
        print(json.dumps({'status':'PASS','url':URL,'checks':['boot/assets','keyboard movement','island and NPC reachability','water collision','starter choice','attack, special move and turn lock','challenge retry/cancel','failed and successful capture','collection/potion','daily reward and reload persistence','shop','healing','difficulty','victory/defeat','XP level-up','map and guide','reset confirmation and actual reset','streak bonus','save normalization','spawn validity','1024px layout','corrupt JSON recovery','missing asset fallbacks'],'reachable':connectivity,'page_errors':errors,'screenshots':str(ARTIFACTS)},indent=2))
        await browser.close()

if __name__=='__main__':
    asyncio.run(main())
