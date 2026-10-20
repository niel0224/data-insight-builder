# Data Insight Builder 📊✨

> **CSV 데이터를 업로드하고 AI 전문 분석 리포트를 즉시 생성하는 웹 애플리케이션**

데이터셋을 업로드하거나 기본 샘플 데이터를 선택하면 결측치, 데이터 규모, 주요 수치/범주 통계를 자동으로 요약하고, **Google Gemini AI**를 활용하여 데이터 건강도 진단, 트렌드 분석, 비즈니스 실행 권고사항을 담은 심층 마크다운 리포트를 작성합니다.

---

## 🚀 주요 기능

1. **지능형 CSV 자동 파싱 & 인코딩 감지**
   - 일반 CSV뿐만 아니라 World Bank 데이터셋 등 상단 메타데이터(skiprows)가 포함된 파일도 자동 감지
   - UTF-8, UTF-8 BOM, CP949 등 다양한 인코딩 자동 지원
2. **기초 통계 & 데이터 건강도 요약**
   - 전체 행/열 수, 결측치 수 및 결측 비율, 수치형/범주형 컬럼 분포
   - 상위 5개 행 데이터 미리보기 테이블 제공
3. **Google Gemini 기반 AI 인사이트 리포트 생성**
   - 최신 `google-genai` SDK 기반 `gemini-3.1-flash-lite` 모델 연동
   - 사용자 맞춤형 추가 질문 및 심층 분석 요청 지원
   - 데이터 품질 진단, 핵심 패턴/트렌드, 특이점 및 잠재 리스크, 실천 권고사항(Actionable items) 도출
4. **인터랙티브 시각화 차트 대시보드 (Chart.js)**
   - 리포트 생성 완료 후 데이터 완성도(도넛), 범주형 속성 분포, 수치 지표 평균/중앙값(바) 차트 제공
5. **🔒 보안 PIN 인증 화면 (기본 비밀번호: `0224`)**
   - 모바일 터치 키패드 및 물리 키보드를 지원하는 세련된 4자리 보안 잠금 화면
6. **📱 PWA (Progressive Web App) & 모바일 최적화**
   - **아이폰(iOS Safari)** 및 **안드로이드(Chrome)** 완벽 호환
   - 홈 화면에 앱으로 추가하여 네이티브 앱처럼 전체화면(Standalone) 구동 및 오프라인 캐싱 지원
   - 노치 및 홈 바 지원 (Safe Area Insets) 및 모바일 반응형 터치 최적화
7. **모던 다크 테마 UI/UX & Vercel 배포 호환**
   - 세련된 다크 테마 기본 적용 및 라이트 모드 전환 토글 지원
   - Vercel Serverless Function 배포 완벽 지원 (`vercel.json`)

---

## 🛠️ 기술 스택

- **Backend**: Python 3.x, Flask, Pandas, google-genai, python-dotenv
- **Frontend**: HTML5, Modern CSS, Vanilla JavaScript, Marked.js, FontAwesome
- **AI Model**: Google Gemini (`gemini-3.1-flash-lite`)

---

## 🏃 실행 방법

### 1. 가상환경 활성화 및 패키지 설치
```bash
# 가상환경 활성화 (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# 필요한 라이브러리 설치 (이미 설치된 경우 생략 가능)
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
