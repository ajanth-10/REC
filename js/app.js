// js/app.js

import { trainings } from "./data-trainings.js";
import { notions } from "./data-notions.js";

const training = trainings[0];
const STORAGE_KEY = `bp23rec-progress-${training.id}`;

let state = {
  currentQuestionIndex: 0,
  answers: {},
  unlockedNotions: [],
  reviewMode: false,
  reviewQuestionIds: [],
  reduceMotion: false
};

let views;
let navButtons;
let caseStudyContainer;
let questionCard;
let correctionCard;
let currentQuestionIndicator;
let scoreIndicator;
let previousQuestionBtn;
let nextQuestionBtn;
let notionsContainer;
let notionsEmptyState;
let answeredCount;
let correctCount;
let unlockedCount;
let reviewList;
let reviewErrorsBtn;
let restartTrainingBtn;
let resetProgressBtn;
let reduceMotionToggle;
let openGraphModalBtn;
let graphModal;
let closeModalButtons;

function initSelectors() {
  views = document.querySelectorAll(".view");
  navButtons = document.querySelectorAll("[data-go-to]");
  caseStudyContainer = document.querySelector("#case-study-container");
  questionCard = document.querySelector("#question-card");
  correctionCard = document.querySelector("#correction-card");
  currentQuestionIndicator = document.querySelector("#current-question-indicator");
  scoreIndicator = document.querySelector("#score-indicator");
  previousQuestionBtn = document.querySelector("#previous-question-btn");
  nextQuestionBtn = document.querySelector("#next-question-btn");
  notionsContainer = document.querySelector("#notions-container");
  notionsEmptyState = document.querySelector("#notions-empty-state");
  answeredCount = document.querySelector("#answered-count");
  correctCount = document.querySelector("#correct-count");
  unlockedCount = document.querySelector("#unlocked-count");
  reviewList = document.querySelector("#review-list");
  reviewErrorsBtn = document.querySelector("#review-errors-btn");
  restartTrainingBtn = document.querySelector("#restart-training-btn");
  resetProgressBtn = document.querySelector("#reset-progress-btn");
  reduceMotionToggle = document.querySelector("#reduce-motion-toggle");
  openGraphModalBtn = document.querySelector("#open-graph-modal");
  graphModal = document.querySelector("#graph-modal");
  closeModalButtons = document.querySelectorAll("[data-close-modal]");
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCurrentQuestionList() {
  if (!state.reviewMode) return training.questions;
  return training.questions.filter((question) => state.reviewQuestionIds.includes(question.id));
}

function getCurrentQuestion() {
  const questions = getCurrentQuestionList();
  return questions[state.currentQuestionIndex] ?? null;
}

function getAnsweredQuestions() {
  return training.questions.filter((question) => state.answers[question.id]);
}

function getWrongQuestions() {
  return training.questions.filter((question) => {
    const answer = state.answers[question.id];
    return answer && !answer.isCorrect;
  });
}

function getCorrectAnswersCount() {
  return getAnsweredQuestions().filter((question) => state.answers[question.id]?.isCorrect).length;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Impossible de sauvegarder la progression.", error);
  }
}

function loadState() {
  try {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (!storedState) return;
    const parsedState = JSON.parse(storedState);
    state = {
      ...state,
      ...parsedState,
      answers: parsedState.answers ?? {},
      unlockedNotions: parsedState.unlockedNotions ?? [],
      reviewQuestionIds: parsedState.reviewQuestionIds ?? []
    };
  } catch (error) {
    console.warn("Impossible de charger la progression.", error);
  }
}

function resetState() {
  state = {
    currentQuestionIndex: 0,
    answers: {},
    unlockedNotions: [],
    reviewMode: false,
    reviewQuestionIds: [],
    reduceMotion: state.reduceMotion
  };
  saveState();
  renderAll();
}

function unlockNotions(notionIds = []) {
  const nextUnlocked = new Set(state.unlockedNotions);
  notionIds.forEach((notionId) => {
    if (notions[notionId]) nextUnlocked.add(notionId);
  });
  state.unlockedNotions = Array.from(nextUnlocked);
}

function setReduceMotion(value) {
  state.reduceMotion = Boolean(value);
  document.documentElement.classList.toggle("reduce-motion", state.reduceMotion);
  if (reduceMotionToggle) reduceMotionToggle.checked = state.reduceMotion;
  saveState();
}

function goToView(viewName) {
  views.forEach((view) => view.classList.toggle("view--active", view.dataset.view === viewName));
  document.querySelectorAll(".bottom-nav__item").forEach((button) => {
    button.classList.toggle("bottom-nav__item--active", button.dataset.goTo === viewName);
  });
  window.scrollTo({ top: 0, behavior: state.reduceMotion ? "auto" : "smooth" });
}

function setupNavigation() {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => goToView(button.dataset.goTo));
  });
}

function renderCaseStudy() {
  if (!caseStudyContainer) return;
  const sectionsHTML = training.caseStudy.sections.map((section) => `
    <article class="case-study__section">
      <h3>${escapeHTML(section.title)}</h3>
      <p>${escapeHTML(section.content)}</p>
    </article>
  `).join("");

  caseStudyContainer.innerHTML = `
    <article class="case-study__section">
      <h3>${escapeHTML(training.caseStudy.title)}</h3>
      <p>${escapeHTML(training.caseStudy.source)}</p>
    </article>
    ${sectionsHTML}
  `;
}

function renderQuestion() {
  const question = getCurrentQuestion();
  const currentQuestions = getCurrentQuestionList();
  if (!questionCard) return;

  if (!question) {
    questionCard.innerHTML = `
      <div class="empty-state">
        <h3>Aucune question à afficher</h3>
        <p>Il n’y a pas encore de question dans cette sélection.</p>
      </div>
    `;
    hideCorrection();
    updateIndicators();
    return;
  }

  const storedAnswer = state.answers[question.id];
  const hasAnswered = Boolean(storedAnswer);
  questionCard.dataset.selectedOption = "";
  questionCard.dataset.selectedQuestionId = "";

  questionCard.innerHTML = `
    <div class="question-card__meta">
      <span>Question ${question.number}</span>
      <span>·</span>
      <span>${escapeHTML(question.theme)}</span>
    </div>
    <h3>${escapeHTML(question.title)}</h3>
    ${renderQuestionBody(question)}
    <div class="options-list" role="list">
      ${renderOptions(question, storedAnswer)}
    </div>
    <div class="quiz-actions">
      <button id="validate-answer-btn" class="btn btn--primary" type="button" ${hasAnswered ? "disabled" : ""}>
        ${hasAnswered ? "Réponse validée" : "Valider ma réponse"}
      </button>
    </div>
  `;

  const validateAnswerBtn = document.querySelector("#validate-answer-btn");
  questionCard.querySelectorAll(".option-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.answers[question.id]) return;
      selectOption(question.id, Number(button.dataset.option));
    });
  });

  if (validateAnswerBtn) validateAnswerBtn.addEventListener("click", validateCurrentAnswer);

  if (hasAnswered) renderCorrection(question);
  else hideCorrection();

  updateQuestionNavigation(currentQuestions);
  updateIndicators();
}

function renderQuestionBody(question) {
  if (question.type === "assertion-reason") {
    return `
      <div class="question-card__statement">
        <strong>Phrase A</strong>
        <p>${escapeHTML(question.statementA)}</p>
      </div>
      <p class="question-card__because">Parce que</p>
      <div class="question-card__statement">
        <strong>Phrase B</strong>
        <p>${escapeHTML(question.statementB)}</p>
      </div>
    `;
  }
  return `<div class="question-card__statement"><p>${escapeHTML(question.prompt)}</p></div>`;
}

function renderOptions(question, storedAnswer) {
  return question.options.map((option, index) => {
    const optionNumber = index + 1;
    const letter = String.fromCharCode(65 + index);
    let optionClass = "option-btn";
    if (storedAnswer) {
      if (optionNumber === question.correctOption) optionClass += " option-btn--correct";
      else if (optionNumber === storedAnswer.selectedOption) optionClass += " option-btn--wrong";
    }
    return `
      <button class="${optionClass}" type="button" data-option="${optionNumber}" role="listitem">
        <span class="option-btn__letter">${letter}</span>
        <span class="option-btn__text">${escapeHTML(option)}</span>
      </button>
    `;
  }).join("");
}

function selectOption(questionId, selectedOption) {
  questionCard.querySelectorAll(".option-btn").forEach((button) => {
    button.classList.toggle("option-btn--selected", Number(button.dataset.option) === selectedOption);
  });
  questionCard.dataset.selectedOption = String(selectedOption);
  questionCard.dataset.selectedQuestionId = questionId;
}

function validateCurrentAnswer() {
  const question = getCurrentQuestion();
  if (!question) return;
  const selectedQuestionId = questionCard.dataset.selectedQuestionId;
  const selectedOption = Number(questionCard.dataset.selectedOption);
  if (selectedQuestionId !== question.id || !selectedOption) {
    renderTemporaryMessage("Choisis une réponse avant de valider.");
    return;
  }
  const isCorrect = selectedOption === question.correctOption;
  state.answers[question.id] = {
    selectedOption,
    correctOption: question.correctOption,
    isCorrect,
    answeredAt: new Date().toISOString()
  };
  unlockNotions(question.unlockNotions);
  saveState();
  renderQuestion();
  renderNotions();
  renderProgress();
}

function renderTemporaryMessage(message) {
  correctionCard.classList.remove("correction-card--hidden", "correction-card--success");
  correctionCard.classList.add("correction-card--error");
  correctionCard.innerHTML = `<h3>Réponse non validée</h3><p>${escapeHTML(message)}</p>`;
}

function renderCorrection(question) {
  const answer = state.answers[question.id];
  if (!answer) {
    hideCorrection();
    return;
  }
  const isCorrect = answer.isCorrect;
  correctionCard.classList.remove("correction-card--hidden");
  correctionCard.classList.toggle("correction-card--success", isCorrect);
  correctionCard.classList.toggle("correction-card--error", !isCorrect);
  const unlockedNotionsHTML = question.unlockNotions
    .filter((notionId) => notions[notionId])
    .map((notionId) => notions[notionId].title)
    .join(", ");

  correctionCard.innerHTML = `
    <h3>${isCorrect ? "Bonne réponse" : "Ce n’est pas la bonne réponse"}</h3>
    <p><strong>Réponse correcte :</strong> ${escapeHTML(question.correctOption)} — ${escapeHTML(question.correctionTitle)}</p>
    <div class="correction-block"><h4>Pourquoi ?</h4><p>${escapeHTML(question.why)}</p></div>
    <div class="correction-block"><h4>Notion à retenir</h4><p>${escapeHTML(question.takeaway)}</p></div>
    <div class="correction-block"><h4>Lien avec le cours</h4><p>${escapeHTML(question.courseLink)}</p></div>
    ${unlockedNotionsHTML ? `<div class="unlocked-alert"><strong>Notion(s) débloquée(s) :</strong> ${escapeHTML(unlockedNotionsHTML)}</div>` : ""}
  `;
}

function hideCorrection() {
  if (!correctionCard) return;
  correctionCard.classList.add("correction-card--hidden");
  correctionCard.classList.remove("correction-card--success", "correction-card--error");
  correctionCard.innerHTML = "";
}

function updateQuestionNavigation(currentQuestions) {
  if (previousQuestionBtn) previousQuestionBtn.disabled = state.currentQuestionIndex === 0;
  if (nextQuestionBtn) nextQuestionBtn.disabled = state.currentQuestionIndex >= currentQuestions.length - 1;
}

function goToPreviousQuestion() {
  if (state.currentQuestionIndex > 0) {
    state.currentQuestionIndex -= 1;
    saveState();
    renderQuestion();
  }
}

function goToNextQuestion() {
  const currentQuestions = getCurrentQuestionList();
  if (state.currentQuestionIndex < currentQuestions.length - 1) {
    state.currentQuestionIndex += 1;
    saveState();
    renderQuestion();
  } else {
    goToView("progress");
  }
}

function setupQuizNavigation() {
  if (previousQuestionBtn) previousQuestionBtn.addEventListener("click", goToPreviousQuestion);
  if (nextQuestionBtn) nextQuestionBtn.addEventListener("click", goToNextQuestion);
}

function renderNotions() {
  if (!notionsContainer || !notionsEmptyState) return;
  const unlocked = state.unlockedNotions.map((notionId) => ({ id: notionId, ...notions[notionId] })).filter((notion) => notion.title);
  notionsEmptyState.style.display = unlocked.length === 0 ? "block" : "none";
  notionsContainer.innerHTML = unlocked.map((notion) => `
    <article class="notion-card">
      <span class="notion-card__category">${escapeHTML(notion.category)}</span>
      <h3>${escapeHTML(notion.title)}</h3>
      <p><strong>Définition :</strong> ${escapeHTML(notion.definition)}</p>
      <p><strong>Exemple :</strong> ${escapeHTML(notion.example)}</p>
      <div class="notion-card__key"><strong>À retenir :</strong> ${escapeHTML(notion.keyPoint)}</div>
    </article>
  `).join("");
}

function renderProgress() {
  const answeredQuestions = getAnsweredQuestions();
  const correctAnswers = getCorrectAnswersCount();
  const wrongQuestions = getWrongQuestions();
  if (answeredCount) answeredCount.textContent = `${answeredQuestions.length} / ${training.totalQuestions}`;
  if (correctCount) correctCount.textContent = String(correctAnswers);
  if (unlockedCount) unlockedCount.textContent = String(state.unlockedNotions.length);
  if (reviewList) {
    if (wrongQuestions.length === 0 && answeredQuestions.length === 0) {
      reviewList.innerHTML = `<p class="muted">Les notions à retravailler apparaîtront après tes premières réponses.</p>`;
    } else if (wrongQuestions.length === 0) {
      reviewList.innerHTML = `<p class="muted">Aucune erreur pour l’instant.</p>`;
    } else {
      reviewList.innerHTML = `<ul>${wrongQuestions.map((question) => `<li><strong>Q${question.number}</strong> — ${escapeHTML(question.theme)}</li>`).join("")}</ul>`;
    }
  }
  if (reviewErrorsBtn) reviewErrorsBtn.disabled = wrongQuestions.length === 0;
  updateIndicators();
}

function updateIndicators() {
  const currentQuestions = getCurrentQuestionList();
  const currentQuestion = getCurrentQuestion();
  const answeredQuestions = getAnsweredQuestions();
  const correctAnswers = getCorrectAnswersCount();
  if (currentQuestionIndicator) {
    const currentNumber = currentQuestion ? state.currentQuestionIndex + 1 : 0;
    currentQuestionIndicator.textContent = `${currentNumber} / ${currentQuestions.length || training.totalQuestions}`;
  }
  if (scoreIndicator) scoreIndicator.textContent = `${correctAnswers} / ${answeredQuestions.length}`;
}

function startReviewErrors() {
  const wrongQuestions = getWrongQuestions();
  if (wrongQuestions.length === 0) return;
  state.reviewMode = true;
  state.reviewQuestionIds = wrongQuestions.map((question) => question.id);
  state.currentQuestionIndex = 0;
  saveState();
  renderQuestion();
  goToView("questions");
}

function restartTraining() {
  state.reviewMode = false;
  state.reviewQuestionIds = [];
  state.currentQuestionIndex = 0;
  saveState();
  renderQuestion();
  goToView("questions");
}

function openGraphModal() {
  if (!graphModal) return;
  graphModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeGraphModal() {
  if (!graphModal) return;
  graphModal.hidden = true;
  document.body.style.overflow = "";
}

function setupGraphModal() {
  if (openGraphModalBtn) openGraphModalBtn.addEventListener("click", openGraphModal);
  closeModalButtons.forEach((button) => button.addEventListener("click", closeGraphModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeGraphModal();
  });
}

function setupSettings() {
  if (reduceMotionToggle) reduceMotionToggle.addEventListener("change", (event) => setReduceMotion(event.target.checked));
  if (resetProgressBtn) {
    resetProgressBtn.addEventListener("click", () => {
      if (window.confirm("Veux-tu vraiment réinitialiser toute ta progression ?")) {
        resetState();
        goToView("home");
      }
    });
  }
  if (restartTrainingBtn) restartTrainingBtn.addEventListener("click", restartTraining);
  if (reviewErrorsBtn) reviewErrorsBtn.addEventListener("click", startReviewErrors);
}

function renderAll() {
  renderCaseStudy();
  renderQuestion();
  renderNotions();
  renderProgress();
  setReduceMotion(state.reduceMotion);
}

function setupApp() {
  initSelectors();
  loadState();
  setupNavigation();
  setupQuizNavigation();
  setupGraphModal();
  setupSettings();
  renderAll();
}

document.addEventListener("DOMContentLoaded", setupApp);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((registration) => {
        console.info("Service worker enregistré :", registration.scope);
      })
      .catch((error) => {
        console.warn("Service worker non enregistré :", error);
      });
  });
}
