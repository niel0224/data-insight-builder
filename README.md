# Data Insight Builder 📊✨

> **CSV 데이터를 업로드하고 AI 전문 분석 리포트 & 대시보드를 즉시 생성하는 PWA 웹 애플리케이션**

데이터셋을 업로드하거나 기본 샘플 데이터를 선택하면 결측치, 데이터 규모, 주요 수치/범주 통계를 자동으로 요약하고, **Google Gemini AI**를 활용하여 데이터 건강도 진단, 트렌드 분석, 비즈니스 실행 권고사항을 담은 심층 마크다운 리포트와 인터랙티브 시각화 차트를 작성합니다.

---

## 🔒 보안 PIN 인증
서비스 보안 및 개인화 테스트를 위해 진입 시 4자리 PIN 인증 화면이 적용되어 있습니다.
- **기본 비밀번호**: `0224`
- 화면 우측 상단의 자물쇠 아이콘을 눌러 언제든 다시 잠글 수 있습니다.

---

## 🚀 주요 기능

1. **지능형 CSV 자동 파싱 & 인코딩 감지**
   - 일반 CSV뿐만 아니라 World Bank 데이터셋 등 상단 메타데이터(`skiprows`)가 포함된 파일도 자동 감지
   - UTF-8, UTF-8 BOM, CP949 등 다양한 인코딩 자동 지원
2. **기초 통계 & 데이터 건강도 요약**
   - 전체 행/열 수, 결측치 수 및 결측 비율, 수치형/범주형 컬럼 분포
   - 상위 5개 행 데이터 미리보기 테이블 제공
3. **Google Gemini 기반 AI 인사이트 리포트 생성**
   - 최신 `google-genai` SDK 기반 `gemini-3.1-flash-lite` 모델 연동
   - 사용자 맞춤형 추가 질문 및 심층 분석 요청 지원
   - 데이터 품질 진단 ➔ 핵심 패턴/트렌드 ➔ 특이점 및 잠재 리스크 ➔ 실천 권고사항(Actionable items) 도출
4. **인터랙티브 시각화 차트 대시보드 (Chart.js)**
   - 리포트 생성 완료 후 데이터 완성도(도넛), 범주형 속성 분포, 수치 지표 평균/중앙값(바) 차트 제공
   - 다크 테마 / 라이트 테마 전환 시 차트 색상 실시간 동기화
5. **📱 PWA (Progressive Web App) & 모바일 최적화**
   - **아이폰(iOS Safari)** 및 **안드로이드(Chrome)** 완벽 호환
   - 홈 화면에 앱으로 추가하여 네이티브 앱처럼 전체화면(Standalone) 구동 및 오프라인 캐싱 지원
   - 노치 및 홈 바 지원 (Safe Area Insets) 및 모바일 반응형 터치 키패드 제공
6. **모던 다크 테마 UI/UX & Vercel 배포 호환**
   - 세련된 다크 테마 기본 적용 및 라이트 모드 전환 토글 지원
   - Vercel Serverless Function 배포 완벽 지원 (`vercel.json`, `public/` 디렉터리)

---

## 📱 모바일 앱(PWA) 설치 방법

### 🍎 아이폰 (iOS Safari)
1. Safari 브라우저로 사이트 접속
2. 하단 중앙의 **[공유]** 아이콘 (네모에 위쪽 화살표) 탭
3. 메뉴를 아래로 스크롤하여 **'홈 화면에 추가'** 선택 ➔ 우측 상단 **'추가'** 클릭

### 🤖 갤럭시 / 안드로이드 (Chrome)
1. Chrome 브라우저로 사이트 접속
2. 상단 네비게이션의 **[앱 설치]** 버튼 클릭 (또는 우측 상단 점 3개 메뉴 ➔ **'홈 화면에 추가' / '앱 설치'**)

---

## 🛠️ 기술 스택

- **Backend**: Python 3.x, Flask, Pandas, Pillow, google-genai, python-dotenv
- **Frontend**: HTML5, Modern CSS, Vanilla JavaScript, Chart.js, Marked.js, FontAwesome
- **AI Model**: Google Gemini (`gemini-3.1-flash-lite`)
- **Deployment**: Vercel Serverless Functions, GitHub

---

## 🏃 로컬 개발 환경 실행 방법

### 1. 가상환경 활성화 및 패키지 설치
```bash
# 가상환경 활성화 (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# 필요한 라이브러리 설치
pip install -r requirements.txt
```

### 2. 환경변수 설정 (`.env`)
`.env` 파일에 발급받은 Gemini API 키를 입력합니다.
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
FLASK_DEBUG=true
MAX_UPLOAD_MB=15
```

### 3. Flask 서버 실행
```bash
python app.py
```
브라우저에서 `http://localhost:5000`으로 접속하여 서비스를 이용할 수 있습니다.

---

## ☁️ Vercel 배포 시 환경변수 설정
Vercel 대시보드 (`Project Settings` ➔ `Environment Variables`)에 아래 변수들을 반드시 등록해야 AI 리포트 생성이 정상 작동합니다:
- `GEMINI_API_KEY`: Google Gemini API Key
- `GEMINI_MODEL`: `gemini-3.1-flash-lite`

---

## 📁 프로젝트 구조

```plaintext
data-insight-builder/
├── .env.example              # 환경변수 예시 파일
├── .gitignore                # Git 제외 파일 설정
├── README.md                 # 프로젝트 문서
├── analyzer.py               # CSV 데이터 파싱 및 통계 분석 모듈
├── app.py                    # Flask 백엔드 서버 및 API 라우트
├── insight_generator.py      # Gemini API 연동 AI 리포트 생성 모듈
├── requirements.txt          # 파이썬 의존성 패키지 목록
├── vercel.json               # Vercel 서버리스 배포 설정
├── data/                     # 샘플 데이터셋 디렉터리
│   └── API_IT.NET.USER.ZS... # World Bank 인터넷 보급률 데이터셋
├── public/                   # Vercel CDN 정적 자원 디렉터리
│   ├── manifest.json
│   ├── sw.js
│   └── static/
├── static/                   # 로컬 정적 자원 (CSS, JS, PWA 아이콘)
│   ├── css/style.css
│   ├── js/app.js
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
└── templates/
    └── index.html            # 메인 대시보드 및 PIN 잠금 화면 HTML
```
