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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.loading,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container h2 {
  margin-bottom: 15px;
  font-size: 1.8rem;
}

.error-container p {
  margin-bottom: 20px;
  font-size: 1.1rem;
}

.retry-button {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
  background: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.retry-button:hover {
  transform: scale(1.05);
}

.app-footer {
  margin-top: 40px;
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.app-footer p {
  margin: 5px 0;
}

.footer-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Korean text optimization */
body {
  word-break: keep-all;
  line-break: strict;
}
</style>
