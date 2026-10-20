import os
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
logger = logging.getLogger(__name__)


def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("GEMINI_API_KEY가 .env 파일에 설정되지 않았거나 기본값입니다.")
    return genai.Client(api_key=api_key)


def generate_data_insight(summary_dict: dict, user_question: str = None) -> str:
    """
    analyzer에서 추출한 데이터 요약 정보를 바탕으로 Gemini API를 호출하여
    구조화된 데이터 인사이트 리포트를 생성합니다.
    """
    client = get_gemini_client()
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

    # 프롬프트 구성
    summary_text = summary_dict.get("summary_text", "")
    columns_info = summary_dict.get("columns", [])
    preview = summary_dict.get("preview", {})
    
    # 컬럼 상세 요약 (결측비율 및 기초통계)
    col_details = []
    for c in columns_info[:20]:
        detail = f"- {c['name']} ({c['dtype']}): 결측 {c['null_ratio']}%"
        if "mean" in c:
            detail += f", 평균={c['mean']}, 최소={c['min']}, 최대={c['max']}"
        col_details.append(detail)
    col_details_str = "\n".join(col_details)

    # 샘플 행 데이터 (미리보기)
    preview_headers = preview.get("headers", [])[:10]
    preview_rows = preview.get("rows", [])
    preview_sample_str = f"컬럼(일부): {preview_headers}\n"
    for r in preview_rows[:3]:
        preview_sample_str += f"- {r[:10]}\n"

    system_instruction = (
        "당신은 최고 수준의 시니어 데이터 분석가이자 비즈니스 전략 컨설턴트입니다.\n"
        "제공된 데이터의 통계 정보와 샘플 데이터를 면밀히 검토하여, 실무자 및 경영진이 즉시 활용할 수 있는 "
        "심도 있고 구조화된 마크다운(Markdown) 리포트를 작성하세요.\n"
        "리포트는 전문적이고 명확한 한국어로 작성하며, 다음 섹션을 반드시 포함해야 합니다:\n\n"
        "### 1. 📊 데이터 개요 및 데이터 품질 진단\n"
        "- 데이터셋 규모, 주요 컬럼 특징, 결측치/이상치에 대한 데이터 건강도 평가\n\n"
        "### 2. 🔍 핵심 패턴 및 주요 트렌드 분석\n"
        "- 수치 데이터의 분포, 시계열 또는 범주형 변화 추이 및 유의미한 패턴 도출\n\n"
        "### 3. ⚠️ 특이사항 및 주의점 (Outliers & Caveats)\n"
        "- 데이터 해석 시 왜곡될 수 있는 부분이나 비즈니스 관점의 잠재 위험 요인\n\n"
        "### 4. 💡 데이터 기반 실천 권고사항 (Actionable Recommendations)\n"
        "- 이 데이터를 바탕으로 실무/비즈니스에서 당장 취해야 할 3~4가지 구체적인 액션 플랜\n"
    )

    prompt = f"""
다음 데이터셋의 요약 정보를 바탕으로 심층 인사이트 리포트를 작성해주세요.

[데이터 기본 요약]
{summary_text}

[컬럼별 세부 사항 (상위 20개)]
{col_details_str}

[데이터 샘플 미리보기 (일부)]
{preview_sample_str}
"""

    if user_question and user_question.strip():
        prompt += f"\n[사용자 특별 분석 요청사항]\n{user_question.strip()}\n위 질문에 대한 집중 답변을 리포트에 함께 포함해주세요.\n"

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3
            )
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini API 호출 중 오류 발생: {e}")
        # fallback 시도
        if model_name != "gemini-2.5-flash":
            logger.info("gemini-2.5-flash 모델로 재시도합니다.")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3
                )
            )
            return response.text
        raise e
