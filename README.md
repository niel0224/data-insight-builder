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
   - 최신 `google-genai` SDK 기반 `gemini-3.5-flash-lite` (또는 `gemini-2.5-flash`) 모델 연동
   - 사용자 맞춤형 추가 질문 및 심층 분석 요청 지원
   - 데이터 품질 진단, 핵심 패턴/트렌드, 특이점 및 잠재 리스크, 실천 권고사항(Actionable items) 도출
4. **모던 UI/UX**
   - 드래그 앤 드롭 파일 업로드 & 샘플 데이터 원클릭 체험 버튼
   - 반응형 디자인, 마크다운 렌더링, 클립보드 복사 및 인쇄 지원

---

## 🛠️ 기술 스택

- **Backend**: Python 3.x, Flask, Pandas, google-genai, python-dotenv
- **Frontend**: HTML5, Modern CSS, Vanilla JavaScript, Marked.js, FontAwesome
- **AI Model**: Google Gemini (gemini-3.5-flash-lite / gemini-2.5-flash)

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
GEMINI_MODEL=gemini-3.5-flash-lite
FLASK_DEBUG=true
MAX_UPLOAD_MB=15
```

### 3. Flask 서버 실행
```bash
python app.py
```
브라우저에서 `http://localhost:5000`으로 접속하여 서비스를 이용할 수 있습니다.
