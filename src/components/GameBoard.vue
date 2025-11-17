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

    <!-- Success Message -->
    <div v-if="isSuccess" class="success-message">
      축하합니다! 정답을 맞추셨습니다!
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
}

.game-title {
  font-size: 3rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  letter-spacing: -1px;
}

.game-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 10px 0;
}

.game-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
  font-size: 0.9rem;
  color: #9ca3af;
}

.game-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.stat-value.reference-line {
  color: #3b82f6;
}

.stat-hint {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 2px;
}

.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.word-input {
  flex: 1;
  padding: 14px 18px;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}

.word-input:focus {
  border-color: #3b82f6;
}

.word-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.submit-button {
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.submit-button:hover:not(:disabled) {
  background: #2563eb;
}

.submit-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  margin-bottom: 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  text-align: center;
}

.success-message {
  padding: 12px;
  margin-bottom: 20px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #166534;
  text-align: center;
  font-weight: 600;
}

.results-section {
  margin-top: 30px;
}

.results-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 15px;
}

.reset-section {
  margin-top: 20px;
  text-align: center;
}

.reset-button {
  padding: 12px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #dc2626;
  background: white;
  border: 2px solid #dc2626;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background: #dc2626;
  color: white;
  transform: scale(1.02);
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.results-table th {
  background: #f9fafb;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.results-table td {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.results-table tr:last-child td {
  border-bottom: none;
}

.results-table tr.highlight {
  background: #fef3c7;
}

.results-table tr.correct-answer {
  background: #d1fae5;
  font-weight: 700;
}

.word-cell {
  font-weight: 500;
  color: #1f2937;
}

.answer-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 3px 10px;
  background: #10b981;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.similarity-cell {
  color: #6b7280;
  font-variant-numeric: tabular-nums;
}

.rank-cell {
  text-align: center;
}

.rank-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #3b82f6;
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.rank-unknown {
  color: #9ca3af;
  font-size: 0.9rem;
}

.comparison-cell {
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
}

.comparison-above {
  color: #059669;
}

.comparison-below {
  color: #dc2626;
}

.comparison-near {
  color: #f59e0b;
}

.graph-cell {
  width: 200px;
}

.similarity-bar-container {
  position: relative;
  width: 100%;
  height: 20px;
  background: #f3f4f6;
  border-radius: 10px;
  overflow: visible;
}

.similarity-bar {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 10px;
  position: relative;
  z-index: 1;
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
  padding: 60px 20px;
  color: #6b7280;
}

.empty-state p {
  margin: 10px 0;
}

.help-text {
  font-size: 0.9rem;
  color: #9ca3af;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .game-board {
    padding: 15px;
  }

  .game-title {
    font-size: 2rem;
  }

  .game-subtitle {
    font-size: 1rem;
  }

  .game-stats {
    gap: 20px;
    padding: 15px;
  }

  .input-section {
    flex-direction: column;
  }

  .submit-button {
    width: 100%;
  }

  .results-table th,
  .results-table td {
    padding: 8px;
    font-size: 0.9rem;
  }

  .graph-cell {
    width: 100px;
  }

  .similarity-bar-container {
    height: 16px;
  }
}
</style>
