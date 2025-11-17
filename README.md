# 워드탐정 프론트엔드

Vue.js 3 기반의 한국어 의미 유사도 게임 프론트엔드

## 기술 스택

- Vue.js 3 (Composition API)
- Vite (빌드 도구)
- Axios (HTTP 클라이언트)
- CSS3 (반응형 디자인)

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   └── GameBoard.vue    # 메인 게임 보드 컴포넌트
│   ├── services/
│   │   └── api.js            # API 서비스
│   ├── App.vue               # 루트 컴포넌트
│   └── main.js               # 엔트리 포인트
├── public/                   # 정적 파일
├── index.html
├── vite.config.js
└── package.json
```

## 설치 및 실행

### 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작 (http://localhost:3000)
npm run dev
```

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 주요 기능

### 게임 보드 (`GameBoard.vue`)

- 단어 입력 및 제출
- 유사도 결과 표시 (0~100%)
- 순위 표시 (top 1000 이내)
- 유사도 그래프 바 (색상 그라데이션)
- 로컬스토리지에 게임 기록 저장
- 반응형 디자인 (모바일/태블릿/데스크탑)

### 특징

- **실시간 피드백**: 단어 제출 즉시 유사도 확인
- **로컬 저장**: 브라우저를 닫아도 게임 진행 상황 유지
- **반응형 UI**: 모든 기기에서 최적화된 경험
- **한글 최적화**: `word-break: keep-all` 적용

## API 연동

### API 서비스 (`api.js`)

```javascript
import api from './services/api'

// 퀴즈 상태 조회
const status = await api.getStatus()

// 단어 추측
const result = await api.submitGuess('사랑')

// 서버 상태 확인
const health = await api.checkHealth()
```

## 라이선스

MIT
