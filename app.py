import os
import logging
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

from analyzer import detect_and_load_csv, analyze_dataframe
from insight_generator import generate_data_insight

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
)
logger = logging.getLogger(__name__)

base_dir = os.path.abspath(os.path.dirname(__file__))
app = Flask(
    __name__,
    template_folder=os.path.join(base_dir, "templates"),
    static_folder=os.path.join(base_dir, "static")
)

# 최대 업로드 파일 크기 설정 (기본 15MB)
max_mb = int(os.getenv("MAX_UPLOAD_MB", "15"))
app.config["MAX_CONTENT_LENGTH"] = max_mb * 1024 * 1024

SAMPLE_DATA_PATH = os.path.join(base_dir, "data", "API_IT.NET.USER.ZS_DS2_en_csv_v2_468465.csv")


@app.route("/")
@app.route("/index")
@app.route("/api/index")
@app.route("/api/index.py")
def index():
    return render_template("index.html")


@app.route("/manifest.json")
def manifest():
    """PWA 매니페스트 서빙"""
    return app.send_static_file("manifest.json")


@app.route("/sw.js")
def service_worker():
    """PWA 서비스 워커 서빙 (루트 스코프 헤더 허용)"""
    response = app.send_static_file("sw.js")
    response.headers["Content-Type"] = "application/javascript"
    response.headers["Service-Worker-Allowed"] = "/"
    return response


@app.route("/api/analyze", methods=["POST"])
def analyze_file():
    """사용자가 업로드한 CSV 파일을 분석합니다."""
    if "file" not in request.files:
        return jsonify({"success": False, "error": "업로드된 파일이 없습니다."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "선택된 파일이 없습니다."}), 400

    if not file.filename.lower().endswith(".csv"):
        return jsonify({"success": False, "error": "CSV 파일(.csv)만 지원합니다."}), 400

    try:
        df = detect_and_load_csv(file.stream)
        analysis_result = analyze_dataframe(df)
        analysis_result["filename"] = file.filename
        return jsonify({"success": True, "data": analysis_result})
    except Exception as e:
        logger.error(f"CSV 분석 실패: {e}")
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/sample", methods=["POST"])
def analyze_sample():
    """기본 제공되는 World Bank 샘플 데이터를 분석합니다."""
    if not os.path.exists(SAMPLE_DATA_PATH):
        return jsonify({"success": False, "error": "샘플 데이터 파일을 찾을 수 없습니다."}), 404

    try:
        df = detect_and_load_csv(SAMPLE_DATA_PATH)
        analysis_result = analyze_dataframe(df)
        analysis_result["filename"] = "World_Bank_Internet_Usage.csv"
        return jsonify({"success": True, "data": analysis_result})
    except Exception as e:
        logger.error(f"샘플 분석 실패: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/generate", methods=["POST"])
def generate_insight():
    """분석된 통계 요약을 바탕으로 Gemini AI 인사이트를 생성합니다."""
    payload = request.get_json(silent=True) or {}
    summary_data = payload.get("summary")
    user_question = payload.get("question", "")

    if not summary_data:
        return jsonify({"success": False, "error": "분석 요약 정보가 전달되지 않았습니다."}), 400

    try:
        insight_markdown = generate_data_insight(summary_data, user_question)
        return jsonify({"success": True, "insight": insight_markdown})
    except Exception as e:
        logger.error(f"인사이트 생성 실패: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok", "app": "data-insight-builder"})


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
