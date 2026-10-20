import io
import pandas as pd
import numpy as np


def detect_and_load_csv(file_stream_or_path):
    """
    일반 CSV 및 World Bank 등의 메타 헤더(skiprows)가 있는 CSV를 유연하게 읽어옵니다.
    utf-8-sig, utf-8, cp949 인코딩을 순차적으로 시도합니다.
    """
    encodings = ['utf-8-sig', 'utf-8', 'cp949', 'latin-1']
    content_bytes = None

    if hasattr(file_stream_or_path, 'read'):
        content_bytes = file_stream_or_path.read()
    else:
        with open(file_stream_or_path, 'rb') as f:
            content_bytes = f.read()

    last_error = None
    for enc in encodings:
        try:
            # 먼저 텍스트 앞부분을 확인하여 헤더 메타데이터가 있는지 검사
            text_sample = content_bytes[:2048].decode(enc, errors='ignore')
            lines = [l.strip() for l in text_sample.splitlines() if l.strip()]
            
            skiprows = 0
            if lines and ("Data Source" in lines[0] or "World Development Indicators" in lines[0]):
                # 4번째 라인까지 메타데이터인 경우
                skiprows = 4

            stream = io.BytesIO(content_bytes)
            try:
                df = pd.read_csv(stream, skiprows=skiprows, encoding=enc)
            except Exception:
                # skiprows=4로 실패했거나 0으로 실패했을 때 반대로 재시도
                stream = io.BytesIO(content_bytes)
                alt_skip = 4 if skiprows == 0 else 0
                df = pd.read_csv(stream, skiprows=alt_skip, encoding=enc)

            return df
        except Exception as e:
            last_error = e
            continue

    raise ValueError(f"CSV 파일을 읽을 수 없습니다: {last_error}")


def analyze_dataframe(df: pd.DataFrame) -> dict:
    """
    DataFrame의 통계 요약 정보를 추출하여 딕셔너리로 반환합니다.
    """
    total_rows, total_cols = df.shape
    total_cells = total_rows * total_cols
    missing_cells = int(df.isna().sum().sum())
    missing_pct = round((missing_cells / total_cells * 100), 2) if total_cells > 0 else 0

    # 컬럼별 정보
    columns_info = []
    numeric_cols = []
    categorical_cols = []

    for col in df.columns:
        col_series = df[col]
        dtype = str(col_series.dtype)
        null_count = int(col_series.isna().sum())
        null_ratio = round((null_count / total_rows * 100), 2) if total_rows > 0 else 0

        info = {
            "name": str(col),
            "dtype": dtype,
            "null_count": null_count,
            "null_ratio": null_ratio
        }

        if pd.api.types.is_numeric_dtype(col_series):
            numeric_cols.append(col)
            valid_series = col_series.dropna()
            if not valid_series.empty:
                info["mean"] = round(float(valid_series.mean()), 2)
                info["min"] = round(float(valid_series.min()), 2)
                info["max"] = round(float(valid_series.max()), 2)
                info["median"] = round(float(valid_series.median()), 2)
        else:
            categorical_cols.append(col)
            valid_series = col_series.dropna()
            info["unique_count"] = int(valid_series.nunique())

        columns_info.append(info)

    # 미리보기 데이터 (상위 5행, NaN은 None으로 변환)
    preview_df = df.head(5).copy()
    preview_df = preview_df.replace({np.nan: None})
    preview_data = {
        "headers": [str(c) for c in df.columns],
        "rows": preview_df.values.tolist()
    }

    # 요약 통계 텍스트 생성 (LLM 프롬프트용)
    summary_text = f"총 행 수: {total_rows}, 총 열 수: {total_cols}\n"
    summary_text += f"결측치 총합: {missing_cells}개 ({missing_pct}%)\n"
    summary_text += f"수치형 컬럼({len(numeric_cols)}개): {', '.join([str(c) for c in numeric_cols[:15]])}\n"
    summary_text += f"범주형/문자열 컬럼({len(categorical_cols)}개): {', '.join([str(c) for c in categorical_cols[:15]])}\n"

    # 주요 수치 통계
    if numeric_cols:
        summary_text += "\n[주요 수치형 컬럼 기초 통계]:\n"
        for col in numeric_cols[:8]:
            s = df[col].dropna()
            if not s.empty:
                summary_text += f"- {col}: 평균={s.mean():.2f}, 최소={s.min():.2f}, 최대={s.max():.2f}, 중앙값={s.median():.2f}\n"

    # 시각화 차트용 데이터 구성
    # 1) 데이터 완성도 (유효 vs 결측)
    valid_cells = max(0, total_cells - missing_cells)
    chart_health = {
        "labels": ["유효 데이터", "결측치"],
        "data": [valid_cells, missing_cells],
        "percentages": [round((valid_cells / total_cells * 100), 1) if total_cells > 0 else 100, missing_pct]
    }

    # 2) 주요 수치형 변수 비교 (유효 데이터가 가장 풍부한 대표 컬럼 최대 6~8개)
    chart_numeric = {
        "labels": [],
        "means": [],
        "medians": []
    }
    
    # 각 수치형 컬럼의 유효값 개수 기준 정렬
    valid_numeric_candidates = []
    for col in numeric_cols:
        s = df[col].dropna()
        if len(s) > 0 and s.nunique() > 1:
            valid_numeric_candidates.append((col, len(s), s))
            
    # 유효 데이터가 많은 상위 6개 컬럼을 원래 컬럼 순서대로 정렬
    top_cols_set = set([x[0] for x in valid_numeric_candidates[:6]])
    ordered_cols = [c for c in numeric_cols if c in top_cols_set]
    
    for col in ordered_cols:
        s = df[col].dropna()
        chart_numeric["labels"].append(str(col))
        chart_numeric["means"].append(round(float(s.mean()), 2))
        chart_numeric["medians"].append(round(float(s.median()), 2))

    # 3) 주요 범주형 분포 (의미 있는 분포를 가진 대표 컬럼 선별)
    chart_categories = []
    valid_cat_candidates = []
    for col in categorical_cols:
        s = df[col].dropna()
        n_unique = s.nunique()
        if 2 <= n_unique <= 20:  # 너무 적거나 너무 많은 유니크값 제외
            valid_cat_candidates.append((col, n_unique, s))

    # 우선 2~8개 사이의 적절한 카테고리를 우선순위로 정렬
    valid_cat_candidates.sort(key=lambda x: (abs(x[1] - 4)))
    for col, n_unique, s in valid_cat_candidates[:2]:
        val_counts = s.value_counts().head(8)
        chart_categories.append({
            "column_name": str(col),
            "labels": [str(k) for k in val_counts.index],
            "data": [int(v) for v in val_counts.values]
        })

    chart_data = {
        "health": chart_health,
        "numeric": chart_numeric,
        "categories": chart_categories
    }

    return {
        "total_rows": total_rows,
        "total_cols": total_cols,
        "missing_cells": missing_cells,
        "missing_pct": missing_pct,
        "numeric_cols_count": len(numeric_cols),
        "categorical_cols_count": len(categorical_cols),
        "columns": columns_info,
        "preview": preview_data,
        "summary_text": summary_text,
        "chart_data": chart_data
    }
