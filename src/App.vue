<template>
  <div id="app">
    <GameBoard
      v-if="quizData"
      :quiz-id="quizData.quizId"
      :quiz-date="quizData.date"
      :top100-hint="quizData.top100Hint"
      @guess="handleGuess"
      ref="gameBoard"
    />
    <div v-else-if="loading" class="loading">
      <div class="spinner"></div>
      <p>게임 로딩 중...</p>
    </div>
    <div v-else-if="error" class="error-container">
      <h2>오류 발생</h2>
      <p>{{ error }}</p>
      <button @click="loadQuizData" class="retry-button">다시 시도</button>
    </div>

    <footer class="app-footer">
      <p>Made with Vue.js + Go + AWS Bedrock</p>
      <p class="footer-hint">💡 상위 200개 단어에만 순위가 표시됩니다</p>
    </footer>
  </div>
</template>

<script>
import GameBoard from './components/GameBoard.vue'
import api from './services/api'

export default {
  name: 'App',
  components: {
    GameBoard,
  },
  data() {
    return {
      quizData: null,
      loading: true,
      error: null,
    }
  },
  async mounted() {
    await this.loadQuizData()
  },
  methods: {
    async loadQuizData() {
      this.loading = true
      this.error = null

      try {
        this.quizData = await api.getStatus()
        console.log('Quiz Data:', this.quizData)
        console.log('Top 100 Hint:', this.quizData.top100Hint)
      } catch (err) {
        console.error('Failed to load quiz data:', err)
        this.error = '퀴즈 데이터를 불러올 수 없습니다. 서버가 실행 중인지 확인하세요.'
      } finally {
        this.loading = false
      }
    },
    async handleGuess(word) {
      try {
        const result = await api.submitGuess(word)
        this.$refs.gameBoard.addGuess(result)
      } catch (err) {
        console.error('Failed to submit guess:', err)
        const message = err.response?.data?.message || '추측을 제출할 수 없습니다.'
        this.$refs.gameBoard.setError(message)
      } finally {
        this.$refs.gameBoard.resetLoading()
      }
    },
  },
}
</script>

<style>
:root {
  /* Detective Noir Theme Colors */
  --color-bg-primary: #0a0e27;
  --color-bg-secondary: #1a1f3a;
  --color-bg-tertiary: #252d4a;

  --color-accent-gold: #fbbf24;
  --color-accent-amber: #f59e0b;
  --color-accent-cyan: #22d3ee;
  --color-accent-teal: #06b6d4;

  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-text-muted: #9ca3af;

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #f43f5e;

  /* Typography */
  --font-display: 'Bricolage Grotesque', sans-serif;
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'IBM Plex Sans KR', -apple-system, sans-serif;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 20px rgba(251, 191, 36, 0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--color-bg-primary);
  min-height: 100vh;
  padding: 20px;
  position: relative;
  overflow-x: hidden;
  word-break: keep-all;
  line-break: strict;
}

/* Animated background with geometric patterns */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 20% 30%, rgba(34, 211, 238, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(251, 191, 36, 0.08) 0%, transparent 50%),
    linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
  z-index: -1;
}

/* Floating geometric shapes */
body::after {
  content: '';
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background-image:
    repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(251, 191, 36, 0.02) 100px, rgba(251, 191, 36, 0.02) 101px),
    repeating-linear-gradient(-45deg, transparent, transparent 100px, rgba(34, 211, 238, 0.02) 100px, rgba(34, 211, 238, 0.02) 101px);
  animation: slowRotate 60s linear infinite;
  z-index: -1;
  pointer-events: none;
}

@keyframes slowRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.loading,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--color-text-primary);
  text-align: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(251, 191, 36, 0.2);
  border-top-color: var(--color-accent-gold);
  border-right-color: var(--color-accent-cyan);
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  margin-bottom: 20px;
  box-shadow: var(--shadow-glow);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container h2 {
  margin-bottom: 15px;
  font-size: 2rem;
  font-family: var(--font-display);
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-container p {
  margin-bottom: 20px;
  font-size: 1.1rem;
  color: var(--color-text-secondary);
}

.retry-button {
  padding: 14px 32px;
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-heading);
  color: var(--color-bg-primary);
  background: linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-amber));
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.retry-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.retry-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.retry-button:hover::before {
  left: 100%;
}

.retry-button:active {
  transform: translateY(0) scale(0.98);
}

.app-footer {
  margin-top: 60px;
  padding: 30px 20px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  border-top: 1px solid rgba(251, 191, 36, 0.1);
  font-family: var(--font-heading);
}

.app-footer p {
  margin: 8px 0;
}

.footer-hint {
  font-size: 0.85rem;
  color: rgba(251, 191, 36, 0.5);
  font-weight: 300;
}
</style>
