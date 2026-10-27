'use strict';
// Offline, authored banks. Load this registry before the individual bank scripts.
// Add a classic script for a new bank in index.html; selection has no fixed bank size.
Prime.data.questions = [];
Prime.data.registerQuestions = function(level, questions) {
  Prime.data.questions.push(...questions.map(q => ({ ...q, level })));
};
