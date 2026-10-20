document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const btnSelectFile = document.getElementById("btnSelectFile");
  const btnLoadSample = document.getElementById("btnLoadSample");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingText = document.getElementById("loadingText");
  const resultsContainer = document.getElementById("resultsContainer");

  // KPI elements
  const kpiFilename = document.getElementById("kpiFilename");
  const kpiSize = document.getElementById("kpiSize");
  const kpiMissing = document.getElementById("kpiMissing");
  const kpiCols = document.getElementById("kpiCols");

  // Table elements
  const tableHeaders = document.getElementById("tableHeaders");
  const tableBody = document.getElementById("tableBody");

  // AI Prompt & Insight
  const userQuestion = document.getElementById("userQuestion");
  const btnGenerateInsight = document.getElementById("btnGenerateInsight");
  const insightCard = document.getElementById("insightCard");
  const insightContent = document.getElementById("insightContent");
  const btnCopyReport = document.getElementById("btnCopyReport");
  const btnPrintReport = document.getElementById("btnPrintReport");

  // Theme Toggle Elements
  const btnThemeToggle = document.getElementById("btnThemeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const themeText = document.getElementById("themeText");

  // State
  let currentAnalysisData = null;
  let rawMarkdownInsight = "";

  // Theme Management (Default: Dark)
  function applyTheme(theme) {
    if (theme === "light") {
      document.body.classList.add("light-theme");
      if (themeIcon) {
        themeIcon.classList.remove("fa-moon");
        themeIcon.classList.add("fa-sun");
      }
      if (themeText) themeText.textContent = "라이트 모드";
    } else {
      document.body.classList.remove("light-theme");
      if (themeIcon) {
        themeIcon.classList.remove("fa-sun");
        themeIcon.classList.add("fa-moon");
      }
      if (themeText) themeText.textContent = "다크 모드";
    }
  }

  const savedTheme = localStorage.getItem("app-theme") || "dark";
  applyTheme(savedTheme);

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const isLight = document.body.classList.contains("light-theme");
      const nextTheme = isLight ? "dark" : "light";
      localStorage.setItem("app-theme", nextTheme);
      applyTheme(nextTheme);
    });
  }

  // 1. File Upload / Select Events
  btnSelectFile.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  });

  // Drag and Drop
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      uploadFile(dt.files[0]);
    }
  });

  // 2. Sample Data Button
  btnLoadSample.addEventListener("click", (e) => {
    e.stopPropagation();
    loadSampleData();
  });

  // Helper: Show/Hide Loading
  function showLoading(msg) {
    loadingText.textContent = msg;
    loadingOverlay.style.display = "flex";
  }

  function hideLoading() {
    loadingOverlay.style.display = "none";
  }

  // 3. API: Upload & Analyze File
  async function uploadFile(file) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("CSV 파일(.csv)만 업로드할 수 있습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    showLoading(`'${file.name}' 데이터를 분석하는 중입니다...`);
    resultsContainer.style.display = "none";
    insightCard.style.display = "none";

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "분석 요청에 실패했습니다.");
      }

      currentAnalysisData = result.data;
      renderAnalysis(currentAnalysisData);
    } catch (err) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      hideLoading();
    }
  }

  // 4. API: Load Sample Data
  async function loadSampleData() {
    showLoading("기본 샘플 데이터(World Bank 인터넷 보급률)를 로드하고 분석하는 중입니다...");
    resultsContainer.style.display = "none";
    insightCard.style.display = "none";

    try {
      const res = await fetch("/api/sample", { method: "POST" });
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "샘플 데이터를 불러오지 못했습니다.");
      }

      currentAnalysisData = result.data;
      renderAnalysis(currentAnalysisData);
    } catch (err) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      hideLoading();
    }
  }

  // 5. Render Analysis Results
  function renderAnalysis(data) {
    kpiFilename.textContent = data.filename || "업로드된 데이터";
    kpiSize.textContent = `${data.total_rows.toLocaleString()}행 × ${data.total_cols}열`;
    kpiMissing.textContent = `${data.missing_pct}% (${data.missing_cells.toLocaleString()}개)`;
    kpiCols.textContent = `수치형 ${data.numeric_cols_count} / 범주형 ${data.categorical_cols_count}`;

    // Table rendering
    tableHeaders.innerHTML = "";
    tableBody.innerHTML = "";

    const headers = data.preview.headers || [];
    headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      tableHeaders.appendChild(th);
    });

    const rows = data.preview.rows || [];
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((val) => {
        const td = document.createElement("td");
        td.textContent = val !== null && val !== undefined ? val : "-";
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    resultsContainer.style.display = "flex";
    resultsContainer.scrollIntoView({ behavior: "smooth" });
  }

  // 6. Generate AI Insight
  btnGenerateInsight.addEventListener("click", async () => {
    if (!currentAnalysisData) {
      alert("먼저 분석할 데이터를 업로드하거나 샘플 데이터를 선택해주세요.");
      return;
    }

    const question = userQuestion.value.trim();
    showLoading("Gemini AI가 데이터를 심층 분석하고 리포트를 작성하는 중입니다...");
    insightCard.style.display = "none";

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: currentAnalysisData,
          question: question,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "인사이트 생성에 실패했습니다.");
      }

      rawMarkdownInsight = result.insight;
      if (window.marked) {
        insightContent.innerHTML = marked.parse(rawMarkdownInsight);
      } else {
        insightContent.textContent = rawMarkdownInsight;
      }

      insightCard.style.display = "block";
      insightCard.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      alert(`AI 리포트 생성 오류: ${err.message}`);
    } finally {
      hideLoading();
    }
  });

  // 7. Copy & Print Action
  btnCopyReport.addEventListener("click", () => {
    if (!rawMarkdownInsight) return;
    navigator.clipboard.writeText(rawMarkdownInsight).then(() => {
      alert("리포트 마크다운이 클립보드에 복사되었습니다!");
    }).catch(() => {
      alert("클립보드 복사에 실패했습니다.");
    });
  });

  btnPrintReport.addEventListener("click", () => {
    window.print();
  });
});
