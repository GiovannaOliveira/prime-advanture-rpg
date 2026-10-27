"""Question-history integration checks in the real desktop game.
Run with an existing local server: python3 tests/question-playtest.py
"""
import asyncio
import json
import os
from pathlib import Path
import sys
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8000'
ARTIFACTS = Path(os.environ.get('PRIME_TEST_ARTIFACTS', '/tmp/prime-question-tests'))
ARTIFACTS.mkdir(parents=True, exist_ok=True)

async def ready(page):
    await page.wait_for_function('window.Prime?.game?.english && document.getElementById("loading").hidden')

async def practice(page):
    await page.get_by_role('button', name='English club').click()
    await page.locator('#practice-btn').click()

async def saved_record(page, question_id):
    return await page.evaluate('id=>JSON.parse(localStorage.getItem(Prime.data.rules.saveKey)).questionHistory.records[id]', question_id)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=os.environ.get('PRIME_CHROMIUM','/usr/bin/chromium'), args=['--no-sandbox'])
        page = await browser.new_page(viewport={'width':1280,'height':850})
        errors=[]
        page.on('pageerror', lambda error:errors.append(str(error)))
        await page.goto(URL);await ready(page)
        assert await page.evaluate('Prime.data.questions.length')==300
        # A real v1 save, without the new field, must retain inventory and creatures.
        await page.evaluate('''()=>{
            const g=Prime.game;g.store.addStarter('emberbun');
            const legacy=JSON.parse(JSON.stringify(g.store.state));delete legacy.questionHistory;
            legacy.coins=91;legacy.orbs=17;legacy.answers=4;legacy.playerXp=30;
            localStorage.setItem(Prime.data.rules.saveKey,JSON.stringify(legacy));
            g.savePosition=()=>{};
        }''')
        await page.reload();await ready(page)
        assert await page.evaluate('Prime.game.store.state.coins')==91
        assert await page.evaluate('Prime.game.store.active().species')=='emberbun'
        assert await page.evaluate('Object.keys(Prime.game.store.state.questionHistory.records).length')==0
        await practice(page)
        question=await page.evaluate('Prime.game.english.current.q')
        record=await saved_record(page,question['id'])
        assert record['presentations']==1 and record['responses']==0
        wrong=(question['answer']+1)%3
        await page.locator(f'[data-answer="{wrong}"]').click()
        record=await saved_record(page,question['id'])
        assert record['responses']==1 and record['mistakes']==1 and record['completions']==0
        assert record['firstTryCorrect']==0
        await page.keyboard.press('Escape')
        await page.reload();await ready(page)
        assert (await saved_record(page,question['id']))==record
        assert await page.evaluate('Prime.game.store.state.answers')==4
        await practice(page)
        second=await page.evaluate('Prime.game.english.current.q')
        assert second['id']!=question['id']
        source=await page.evaluate('id=>Prime.data.questions.find(q=>q.id===id)',second['id'])
        assert second['options'][second['answer']]==source['options'][source['answer']]
        await page.locator(f'[data-answer="{second["answer"]}"]').click()
        solved=await saved_record(page,second['id'])
        assert solved['responses']==1 and solved['completions']==1 and solved['firstTryCorrect']==1
        # A second invocation of an already solved answer cannot award XP or history twice.
        await page.evaluate('''()=>{
            const c=Prime.game.english.current;
            Prime.game.english.answer(c.q.answer,document.querySelector(`[data-answer="${c.q.answer}"]`));
        }''')
        assert (await saved_record(page,second['id']))==solved
        assert await page.evaluate('Prime.game.store.state.answers')==5
        assert await page.evaluate('Prime.game.store.state.playerXp')==35
        assert await page.evaluate('Prime.game.store.state.orbs')==17
        await page.screenshot(path=str(ARTIFACTS/'01-question-feedback.png'))
        await page.locator('#continue-question').click()
        assert '2 of 150' in await page.locator('#question-journey').inner_text()
        await page.locator('#difficulty').select_option('Elementary')
        assert '0 of 100' in await page.locator('#question-journey').inner_text()
        await page.locator('#practice-btn').click()
        elementary=await page.evaluate('Prime.game.english.current.q')
        assert elementary['level']=='Elementary'
        await page.reload();await ready(page)
        assert await page.evaluate('Prime.game.store.state.difficulty')=='Elementary'
        await practice(page)
        assert await page.evaluate('Prime.game.english.current.q.id')!=elementary['id']
        await page.keyboard.press('Escape');await page.keyboard.press('Escape')
        # Exhaust a full bank through production selection, then open the real review UI.
        cycle=await page.evaluate('''()=>{
            const g=Prime.game;g.store.state.questionHistory=Prime.systems.QuestionScheduler.emptyHistory();
            g.store.state.difficulty='Beginner';const ids=[];
            for(let i=0;i<150;i++){const session=g.english.scheduler.next('Beginner');if(session.mode!=='new')throw Error('Early review');ids.push(session.q.id);}
            return ids;
        }''')
        assert len(set(cycle))==150
        await practice(page)
        review=await page.evaluate('({id:Prime.game.english.current.q.id,mode:Prime.game.english.current.mode,cycle:Prime.game.english.current.cycle})')
        assert review['mode']=='review' and review['cycle']==1
        assert review['id'] not in cycle[-12:]
        assert 'Review · Round 1' in await page.locator('.panel').inner_text()
        await page.screenshot(path=str(ARTIFACTS/'02-review.png'))
        await page.reload();await ready(page)
        assert await page.evaluate('Prime.game.store.state.questionHistory.review.Beginner.cycle')==1
        await practice(page)
        assert await page.evaluate('Prime.game.english.current.mode')=='review'
        assert await page.evaluate('Prime.game.english.current.q.id')!=review['id']
        await page.keyboard.press('Escape')
        await page.screenshot(path=str(ARTIFACTS/'03-club-progress.png'))
        await page.keyboard.press('Escape')
        # Check the longest authored question in the real panel at a smaller desktop size.
        await page.set_viewport_size({'width':1024,'height':768})
        await page.evaluate('''()=>{
            const bank=Prime.data.questions;
            const longest=bank.reduce((a,b)=>a.text.length>b.text.length?a:b);
            Prime.data.questions=[longest];Prime.game.store.state.difficulty=longest.level;
            Prime.game.english.open('A little English challenge',()=>{},()=>Prime.game.ui.close(true));
            Prime.data.questions=bank;
        }''')
        assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
        for button in await page.locator('[data-answer]').all():
            bounds=await button.bounding_box()
            assert bounds['x']>=0 and bounds['x']+bounds['width']<=1024
        await page.screenshot(path=str(ARTIFACTS/'04-long-question.png'))
        assert not errors,errors
        print(json.dumps({'status':'PASS','checks':['300 questions loaded','legacy v1 save compatibility','presentation saved before answering','wrong answer and cancellation persisted','reload avoids already seen questions','shuffled correct answer','first-try history and duplicate reward guard','level switching and progress display','complete bank exhaustion','review recency and persisted round','long-question desktop layout'],'page_errors':errors,'screenshots':str(ARTIFACTS)},indent=2))
        await browser.close()

asyncio.run(main())
