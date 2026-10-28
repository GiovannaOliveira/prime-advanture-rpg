'use strict';
Prime.systems.EnglishChallengeSystem = class {
  constructor(game) {
    this.game = game;
    this.scheduler = new Prime.systems.QuestionScheduler(game.store);
    this.current = null;
  }
  open(context, onSuccess, onCancel) {
    const selection = this.scheduler.next(this.game.store.state.difficulty);
    if (!selection) {
      this.game.ui.toast('No questions are available at this level yet. Please choose another level.');
      onCancel?.();
      return;
    }
    this.current = {
      ...selection,
      context,
      onSuccess,
      onCancel
    };
    this.render();
  }
  render() {
    const {
      q,
      context,
      onCancel
    } = this.current;
    const ui = this.game.ui;
    ui.open(`<div class="panel-header"><div><div class="eyebrow">A LITTLE ENGLISH MAGIC · ${q.level.toUpperCase()}</div><h1>${context}</h1><span class="type-tag">${q.topic} · ${q.skill}</span> <span class="type-tag">${this.current.mode === 'review' ? 'Review · Round ' + this.current.cycle : 'New challenge'}</span></div><button class="close" data-action="cancel" aria-label="Close challenge">×</button></div><p class="question">${q.text}</p><div class="answers">${q.options.map((o,i)=>`<button class="answer" data-answer="${i}"><span>${String.fromCharCode(65+i)}</span>${o}</button>`).join('')}</div><div id="feedback" class="feedback">Take your time. You can try again!</div><div class="challenge-footer"><span>Small steps make great explorers.</span><button id="continue-question" class="primary" hidden>Continue →</button></div>`, 'challenge', () => {
      this.current = null;
      onCancel?.();
    });
    document.querySelectorAll('[data-answer]').forEach(b => b.onclick = () => this.answer(Number(b.dataset.answer), b));
    document.getElementById('continue-question').onclick = () => {
      const next = this.current?.onSuccess;
      this.current = null;
      ui.close(true);
      next?.();
    };
  }
  answer(index, button) {
    const c = this.current;
    if (!c || c.solved || button.disabled) return;
    const f = document.getElementById('feedback');
    const result = this.scheduler.answer(c, index);
    if (!result) return;
    if (!result.correct) {
      button.classList.add('incorrect');
      button.disabled = true;
      f.className = 'feedback error';
      f.textContent = `Good try! ${c.q.explanation} Choose another answer.`;
      return;
    }
    c.solved = true;
    button.classList.add('correct');
    document.querySelectorAll('[data-answer]').forEach(b => b.disabled = true);
    f.className = 'feedback';
    f.textContent = `Well done! ${c.q.explanation} +5 XP`;
    this.game.store.state.answers++;
    this.game.store.state.playerXp += 5;
    this.game.store.save();
    this.game.ui.updateHUD();
    document.getElementById('continue-question').hidden = false;
    document.getElementById('continue-question').focus();
  }
};
