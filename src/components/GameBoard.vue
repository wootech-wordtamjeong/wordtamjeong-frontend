<template>
  <div class="game-board">
    <!-- Header -->
    <header class="game-header">
      <h1 class="game-title">워드탐정</h1>
      <p class="game-subtitle">한국어 의미 유사도 게임</p>
      <div class="game-info">
        <span class="quiz-date">{{ quizDate }}</span>
        <span class="quiz-number">Quiz #{{ quizId }}</span>
      </div>
    </header>

    <!-- Game Stats -->
    <div class="game-stats">
      <div class="stat-item">
        <span class="stat-label">시도 횟수</span>
        <span class="stat-value">{{ guesses.length }}</span>
      </div>
      <div class="stat-item" v-if="bestSimilarity > 0">
        <span class="stat-label">최고 유사도</span>
        <span class="stat-value">{{ (bestSimilarity * 100).toFixed(2) }}%</span>
        <span class="stat-hint" v-if="bestGuess">
          {{ bestGuess.word }}
          <span v-if="bestGuess.rank" class="mini-rank-badge">{{ bestGuess.rank }}위</span>
        </span>
      </div>
      <div class="stat-item" v-if="top100Hint > 0">
        <span class="stat-label">🎯 Top 100 기준선</span>
        <span class="stat-value reference-line">{{ (top100Hint * 100).toFixed(2) }}%</span>
        <span class="stat-hint">100위의 유사도</span>
      </div>
    </div>

    <!-- Input Section -->
    <div class="input-section">
      <input
        v-model="inputWord"
        @keyup.enter="submitGuess"
        type="text"
        class="word-input"
        placeholder="단어를 입력하세요"
        :disabled="isLoading"
      />
      <button @click="submitGuess" class="submit-button" :disabled="isLoading || !inputWord.trim()">
        {{ isLoading ? '확인 중...' : '추측하기' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- Success Modal -->
    <div v-if="isSuccess" class="success-modal-overlay" @click="closeSuccessModal">
      <div class="success-modal" @click.stop>
        <div class="success-icon">🎯</div>
        <h2 class="success-title">Case Solved!</h2>
        <p class="success-subtitle">탐정님의 추리력이 빛났습니다!</p>

        <div class="success-stats">
          <div class="success-stat-item">
            <div class="success-stat-value">{{ guesses.length }}</div>
            <div class="success-stat-label">번째 시도</div>
          </div>
          <div class="success-stat-divider"></div>
          <div class="success-stat-item">
            <div class="success-stat-value">상위 1%</div>
            <div class="success-stat-label">추리 능력</div>
          </div>
        </div>

        <div class="success-message-text">
          당신의 탐정 추리 능력은 상위 <span class="highlight-percent">1%</span>입니다!
        </div>

        <button @click="closeSuccessModal" class="success-close-btn">
          계속하기
        </button>
      </div>
    </div>

    <!-- Results Table -->
    <div class="results-section" v-if="guesses.length > 0">
      <h2 class="results-title">추측 결과</h2>
      <div class="table-container">
        <table class="results-table">
          <thead>
            <tr>
              <th>단어</th>
              <th>유사도</th>
              <th>순위</th>
              <th>Top100과 비교</th>
              <th>그래프</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(guess, index) in sortedGuesses" :key="index" :class="{ 'highlight': guess.rank && guess.rank <= 10, 'correct-answer': guess.isCorrect }">
              <td class="word-cell">
                {{ guess.word }}
                <span v-if="guess.isCorrect" class="answer-badge">정답!</span>
              </td>
              <td class="similarity-cell">{{ (guess.similarity * 100).toFixed(2) }}%</td>
              <td class="rank-cell">
                <span v-if="guess.rank" class="rank-badge">{{ guess.rank }}</span>
                <span v-else class="rank-unknown">?????</span>
              </td>
              <td class="comparison-cell">
                <span v-if="top100Hint > 0" :class="getComparisonClass(guess.similarity)">
                  {{ getComparisonText(guess.similarity) }}
                </span>
              </td>
              <td class="graph-cell">
                <div class="similarity-bar-container">
                  <!-- Similarity bar -->
                  <div
                    class="similarity-bar"
                    :style="{ width: (guess.similarity * 100) + '%', backgroundColor: getSimilarityColor(guess.similarity) }"
                  ></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Reset Button -->
      <div class="reset-section">
        <button @click="resetGame" class="reset-button">
          🔄 기록 초기화
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>단어를 입력하고 추측을 시작하세요!</p>
      <p class="help-text">입력한 단어와 정답 단어의 의미 유사도를 확인할 수 있습니다.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameBoard',
  props: {
    quizId: {
      type: Number,
      required: true,
    },
    quizDate: {
      type: String,
      required: true,
    },
    top100Hint: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  data() {
    return {
      inputWord: '',
      guesses: [],
      isLoading: false,
      errorMessage: '',
      isSuccess: false,
    }
  },
  computed: {
    sortedGuesses() {
      return [...this.guesses].sort((a, b) => {
        // Sort by similarity descending
        return b.similarity - a.similarity
      })
    },
    bestSimilarity() {
      if (this.guesses.length === 0) return 0
      return Math.max(...this.guesses.map(g => g.similarity))
    },
    bestGuess() {
      if (this.guesses.length === 0) return null
      return this.guesses.reduce((best, current) =>
        current.similarity > best.similarity ? current : best
      )
    },
  },
  methods: {
    async submitGuess() {
      if (!this.inputWord.trim() || this.isLoading) return

      const word = this.inputWord.trim()

      // Check if already guessed
      if (this.guesses.some(g => g.word === word)) {
        this.errorMessage = '이미 추측한 단어입니다.'
        setTimeout(() => this.errorMessage = '', 3000)
        return
      }

      this.isLoading = true
      this.errorMessage = ''

      this.$emit('guess', word)
    },
    addGuess(guess) {
      this.guesses.push(guess)
      this.inputWord = ''
      this.isLoading = false

      // Check for success using isCorrect flag
      if (guess.isCorrect) {
        this.isSuccess = true
      }

      // Save to localStorage
      this.saveGuesses()
    },
    setError(message) {
      this.errorMessage = message
      this.isLoading = false
      setTimeout(() => this.errorMessage = '', 5000)
    },
    resetLoading() {
      this.isLoading = false
    },
    getSimilarityColor(similarity) {
      // Color gradient from red to green
      if (similarity >= 0.8) return '#22c55e' // green
      if (similarity >= 0.6) return '#84cc16' // lime
      if (similarity >= 0.4) return '#eab308' // yellow
      if (similarity >= 0.2) return '#f97316' // orange
      return '#ef4444' // red
    },
    getComparisonText(similarity) {
      if (!this.top100Hint || this.top100Hint === 0) return '-'
      const diff = similarity - this.top100Hint
      const diffPercent = (diff * 100).toFixed(2)
      if (diff > 0) {
        return `+${diffPercent}%`
      } else if (diff < 0) {
        return `${diffPercent}%`
      } else {
        return '동일'
      }
    },
    getComparisonClass(similarity) {
      if (!this.top100Hint || this.top100Hint === 0) return ''
      const diff = similarity - this.top100Hint
      if (diff > 0.05) return 'comparison-above'
      if (diff < -0.05) return 'comparison-below'
      return 'comparison-near'
    },
    saveGuesses() {
      const key = `kkomantl_guesses_${this.quizId}`
      localStorage.setItem(key, JSON.stringify(this.guesses))
    },
    loadGuesses() {
      const key = `kkomantl_guesses_${this.quizId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          this.guesses = JSON.parse(saved)
        } catch (e) {
          console.error('Failed to load guesses:', e)
        }
      }
    },
    resetGame() {
      if (confirm('정말로 지금까지의 추측 기록을 모두 초기화하시겠습니까?')) {
        this.guesses = []
        this.isSuccess = false
        const key = `kkomantl_guesses_${this.quizId}`
        localStorage.removeItem(key)
      }
    },
    closeSuccessModal() {
      this.isSuccess = false
    },
  },
  mounted() {
    this.loadGuesses()
  },
  watch: {
    quizId() {
      // Reset when quiz changes
      this.guesses = []
      this.isSuccess = false
      this.loadGuesses()
    }
  }
}
</script>

<style scoped>
.game-board {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: var(--font-body);
  animation: fadeInUp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.game-header {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeIn 0.8s ease-out 0.2s both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.game-title {
  font-size: 4.5rem;
  font-weight: 800;
  font-family: var(--font-display);
  background: linear-gradient(135deg, var(--color-accent-gold) 0%, var(--color-accent-cyan) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -2px;
  text-shadow: 0 0 40px rgba(251, 191, 36, 0.3);
  animation: titlePulse 3s ease-in-out infinite;
}

@keyframes titlePulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
}

.game-subtitle {
  font-size: 1.2rem;
  font-family: var(--font-heading);
  color: var(--color-text-secondary);
  margin: 15px 0;
  font-weight: 300;
  letter-spacing: 0.5px;
}

.game-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
  font-size: 0.95rem;
  font-family: var(--font-heading);
  color: var(--color-text-muted);
  font-weight: 500;
}

.game-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  padding: 0;
  animation: fadeIn 0.8s ease-out 0.4s both;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 32px;
  background: rgba(26, 31, 58, 0.6);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(34, 211, 238, 0.05));
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-item:hover {
  transform: translateY(-4px);
  border-color: var(--color-accent-gold);
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.2);
}

.stat-item:hover::before {
  opacity: 1;
}

.stat-label {
  font-size: 0.8rem;
  font-family: var(--font-heading);
  color: var(--color-text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  font-family: var(--font-display);
  background: linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.stat-value.reference-line {
  background: linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-hint {
  font-size: 0.75rem;
  font-family: var(--font-heading);
  color: var(--color-text-muted);
  margin-top: 6px;
  font-weight: 400;
}

.mini-rank-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 3px 10px;
  background: linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal));
  color: var(--color-bg-primary);
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: var(--font-heading);
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.3);
}

.input-section {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  animation: fadeIn 0.8s ease-out 0.6s both;
}

.word-input {
  flex: 1;
  padding: 18px 24px;
  font-size: 1.1rem;
  font-family: var(--font-body);
  color: var(--color-text-primary);
  background: rgba(26, 31, 58, 0.6);
  border: 2px solid rgba(251, 191, 36, 0.3);
  border-radius: 16px;
  outline: none;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  backdrop-filter: blur(10px);
}

.word-input::placeholder {
  color: var(--color-text-muted);
}

.word-input:focus {
  border-color: var(--color-accent-gold);
  box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1), 0 0 20px rgba(251, 191, 36, 0.2);
  transform: translateY(-2px);
}

.word-input:disabled {
  background: rgba(26, 31, 58, 0.3);
  border-color: rgba(251, 191, 36, 0.1);
  cursor: not-allowed;
  opacity: 0.6;
}

.submit-button {
  padding: 18px 40px;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: var(--font-heading);
  color: var(--color-bg-primary);
  background: linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-amber));
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.3);
  position: relative;
  overflow: hidden;
}

.submit-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.5);
}

.submit-button:hover:not(:disabled)::before {
  left: 100%;
}

.submit-button:active:not(:disabled) {
  transform: translateY(-1px) scale(0.98);
}

.submit-button:disabled {
  background: rgba(156, 163, 175, 0.3);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.5;
}

.error-message {
  padding: 16px 24px;
  margin-bottom: 24px;
  background: rgba(244, 63, 94, 0.1);
  border: 2px solid rgba(244, 63, 94, 0.3);
  border-radius: 12px;
  color: #fecaca;
  text-align: center;
  font-family: var(--font-heading);
  font-weight: 500;
  backdrop-filter: blur(10px);
  animation: shake 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

/* Success Modal */
.success-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.success-modal {
  background: linear-gradient(135deg, rgba(26, 31, 58, 0.95), rgba(37, 45, 74, 0.95));
  border: 2px solid var(--color-accent-gold);
  border-radius: 24px;
  padding: 50px 60px;
  max-width: 500px;
  width: 90%;
  box-shadow:
    0 0 60px rgba(251, 191, 36, 0.4),
    0 20px 60px rgba(0, 0, 0, 0.6);
  animation: modalBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
  overflow: hidden;
}

.success-modal::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%);
  animation: rotate 10s linear infinite;
}

@keyframes modalBounce {
  0% {
    transform: scale(0.5) rotate(-5deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.05) rotate(2deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.success-icon {
  font-size: 5rem;
  text-align: center;
  margin-bottom: 20px;
  animation: iconBounce 1s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.6));
}

@keyframes iconBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.1); }
}

.success-title {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 800;
  text-align: center;
  background: linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
  letter-spacing: -1px;
  position: relative;
  z-index: 1;
}

.success-subtitle {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 400;
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 35px;
  position: relative;
  z-index: 1;
}

.success-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin: 35px 0;
  position: relative;
  z-index: 1;
}

.success-stat-item {
  text-align: center;
}

.success-stat-value {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-amber));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 10px;
}

.success-stat-label {
  font-family: var(--font-heading);
  font-size: 0.9rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
}

.success-stat-divider {
  width: 2px;
  height: 60px;
  background: linear-gradient(to bottom, transparent, var(--color-accent-gold), transparent);
}

.success-message-text {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  text-align: center;
  color: var(--color-text-secondary);
  margin: 30px 0;
  line-height: 1.6;
  position: relative;
  z-index: 1;
}

.highlight-percent {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding: 0 5px;
}

.success-close-btn {
  width: 100%;
  padding: 16px 32px;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-bg-primary);
  background: linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-amber));
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 4px 20px rgba(251, 191, 36, 0.4);
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.success-close-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.success-close-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 30px rgba(251, 191, 36, 0.6);
}

.success-close-btn:hover::before {
  left: 100%;
}

.success-close-btn:active {
  transform: translateY(-1px) scale(0.98);
}

.results-section {
  margin-top: 40px;
  animation: fadeIn 0.8s ease-out 0.8s both;
}

.results-title {
  font-size: 1.8rem;
  font-weight: 700;
  font-family: var(--font-display);
  background: linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 24px;
  letter-spacing: -0.5px;
}

.reset-section {
  margin-top: 30px;
  text-align: center;
}

.reset-button {
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-heading);
  color: #fca5a5;
  background: rgba(26, 31, 58, 0.6);
  border: 2px solid rgba(244, 63, 94, 0.4);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  backdrop-filter: blur(10px);
}

.reset-button:hover {
  background: rgba(244, 63, 94, 0.2);
  border-color: var(--color-danger);
  color: #fecaca;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(244, 63, 94, 0.3);
}

.reset-button:active {
  transform: translateY(0);
}

.table-container {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid rgba(251, 191, 36, 0.2);
  background: rgba(26, 31, 58, 0.4);
  backdrop-filter: blur(10px);
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}

.results-table th {
  background: rgba(26, 31, 58, 0.8);
  padding: 16px;
  text-align: left;
  font-weight: 700;
  font-family: var(--font-heading);
  color: var(--color-text-secondary);
  border-bottom: 2px solid rgba(251, 191, 36, 0.3);
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.results-table td {
  padding: 16px;
  border-bottom: 1px solid rgba(251, 191, 36, 0.1);
  font-family: var(--font-body);
  color: var(--color-text-primary);
}

.results-table tr {
  transition: all 0.3s;
}

.results-table tbody tr:hover {
  background: rgba(251, 191, 36, 0.05);
  transform: scale(1.01);
}

.results-table tr:last-child td {
  border-bottom: none;
}

.results-table tr.highlight {
  background: rgba(251, 191, 36, 0.15);
  box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.3);
}

.results-table tr.correct-answer {
  background: rgba(16, 185, 129, 0.2);
  box-shadow: inset 0 0 0 2px rgba(16, 185, 129, 0.4);
  font-weight: 700;
}

.results-table tr.correct-answer td {
  color: #6ee7b7;
}

.word-cell {
  font-weight: 600;
  font-family: var(--font-heading);
  color: var(--color-text-primary);
  font-size: 1.05rem;
}

.answer-badge {
  display: inline-block;
  margin-left: 10px;
  padding: 4px 12px;
  background: linear-gradient(135deg, var(--color-success), #34d399);
  color: var(--color-bg-primary);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 800;
  font-family: var(--font-heading);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
  animation: badgePulse 1.5s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.similarity-cell {
  color: var(--color-accent-gold);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-family: var(--font-heading);
  font-size: 1.05rem;
}

.rank-cell {
  text-align: center;
}

.rank-badge {
  display: inline-block;
  padding: 6px 14px;
  background: linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal));
  color: var(--color-bg-primary);
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: var(--font-heading);
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.4);
}

.rank-unknown {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  font-family: var(--font-heading);
  font-weight: 500;
}

.comparison-cell {
  text-align: center;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: var(--font-heading);
}

.comparison-above {
  color: #6ee7b7;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.comparison-below {
  color: #fca5a5;
  text-shadow: 0 0 10px rgba(244, 63, 94, 0.5);
}

.comparison-near {
  color: var(--color-accent-gold);
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

.graph-cell {
  width: 220px;
}

.similarity-bar-container {
  position: relative;
  width: 100%;
  height: 24px;
  background: rgba(10, 14, 39, 0.6);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
}

.similarity-bar {
  height: 100%;
  transition: width 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  border-radius: 12px;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 15px currentColor;
  animation: barGlow 2s ease-in-out infinite;
}

@keyframes barGlow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
}

.reference-line-marker {
  position: absolute;
  top: -5px;
  height: 30px;
  width: 2px;
  background: #3b82f6;
  z-index: 2;
  transform: translateX(-1px);
}

.reference-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.65rem;
  color: #3b82f6;
  font-weight: 600;
  white-space: nowrap;
  background: white;
  padding: 0 4px;
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--color-text-secondary);
  animation: fadeIn 0.8s ease-out;
}

.empty-state p {
  margin: 15px 0;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 500;
}

.help-text {
  font-size: 1rem;
  color: var(--color-text-muted);
  font-weight: 300;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .game-board {
    padding: 15px;
  }

  .game-title {
    font-size: 3rem;
  }

  .game-subtitle {
    font-size: 1rem;
  }

  .game-stats {
    flex-direction: column;
    gap: 15px;
  }

  .stat-item {
    width: 100%;
    padding: 20px;
  }

  .input-section {
    flex-direction: column;
  }

  .submit-button {
    width: 100%;
    padding: 16px;
  }

  .results-table th,
  .results-table td {
    padding: 12px 8px;
    font-size: 0.9rem;
  }

  .word-cell {
    font-size: 1rem;
  }

  .similarity-cell {
    font-size: 0.95rem;
  }

  .graph-cell {
    width: 120px;
  }

  .similarity-bar-container {
    height: 20px;
  }
}

@media (max-width: 480px) {
  .game-title {
    font-size: 2.5rem;
    letter-spacing: -1px;
  }

  .stat-value {
    font-size: 1.6rem;
  }

  .results-table {
    font-size: 0.85rem;
  }

  .graph-cell {
    display: none;
  }
}
</style>
