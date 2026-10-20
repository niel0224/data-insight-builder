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

  // Chart Instances
  const charts = {
    health: null,
    category: null,
    numeric: null,
  };

  function getThemeColors() {
    const isLight = document.body.classList.contains("light-theme");
    return {
      textColor: isLight ? "#475569" : "#94a3b8",
      gridColor: isLight ? "#e2e8f0" : "#27354c",
      cardBg: isLight ? "#ffffff" : "#1a2336",
    };
  }

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

    // 테마 변경 시 활성화된 차트들의 축/텍스트 색상도 실시간 갱신
    if (currentAnalysisData && currentAnalysisData.chart_data) {
      renderCharts(currentAnalysisData.chart_data);
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

    // Render Charts
    if (data.chart_data) {
      renderCharts(data.chart_data);
    }

    resultsContainer.style.display = "flex";
    resultsContainer.scrollIntoView({ behavior: "smooth" });
  }

  // Helper: Render Dynamic Charts using Chart.js
  function renderCharts(chartData) {
    if (!window.Chart || !chartData) return;
    const colors = getThemeColors();

    // 1. Data Health (Doughnut Chart)
    if (charts.health) charts.health.destroy();
    const ctxHealth = document.getElementById("chartDataHealth");
    if (ctxHealth && chartData.health) {
      charts.health = new Chart(ctxHealth, {
        type: "doughnut",
        data: {
          labels: chartData.health.labels,
          datasets: [{
            data: chartData.health.data,
            backgroundColor: ["#6366f1", "#f43f5e"],
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: colors.textColor, font: { family: "Pretendard" } },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const val = context.parsed.toLocaleString();
                  const pct = chartData.health.percentages[context.dataIndex];
                  return ` ${context.label}: ${val}개 (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }

    // 2. Category Distribution Chart
    if (charts.category) charts.category.destroy();
    const ctxCategory = document.getElementById("chartCategory");
    const categoryTitle = document.getElementById("categoryChartTitle");
    const categories = chartData.categories || [];

    if (ctxCategory) {
      if (categories.length > 0) {
        const cat = categories[0];
        if (categoryTitle) {
          categoryTitle.innerHTML = `<i class="fa-solid fa-chart-column"></i> '${cat.column_name}' 속성 분포`;
        }
        const palette = ["#818cf8", "#a78bfa", "#38bdf8", "#34d399", "#fbbf24", "#f87171", "#c084fc", "#93c5fd"];
        const isDoughnut = cat.labels.length <= 4;

        charts.category = new Chart(ctxCategory, {
          type: isDoughnut ? "doughnut" : "bar",
          data: {
            labels: cat.labels,
            datasets: [{
              label: "인원 / 건수",
              data: cat.data,
              backgroundColor: isDoughnut ? palette.slice(0, cat.labels.length) : "#818cf8",
              borderRadius: isDoughnut ? 0 : 6,
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: isDoughnut,
                position: "bottom",
                labels: { color: colors.textColor, font: { family: "Pretendard" } },
              },
            },
            scales: isDoughnut ? {} : {
              x: {
                ticks: { color: colors.textColor, font: { family: "Pretendard" } },
                grid: { color: colors.gridColor },
              },
              y: {
                ticks: { color: colors.textColor, font: { family: "Pretendard" } },
                grid: { color: colors.gridColor },
              },
            },
          },
        });
      } else {
        if (categoryTitle) {
          categoryTitle.innerHTML = `<i class="fa-solid fa-chart-column"></i> 범주형 속성 없음`;
        }
      }
    }

    // 3. Numeric Comparison Bar Chart
    if (charts.numeric) charts.numeric.destroy();
    const ctxNumeric = document.getElementById("chartNumericSummary");
    const numData = chartData.numeric;

    if (ctxNumeric && numData && numData.labels.length > 0) {
      charts.numeric = new Chart(ctxNumeric, {
        type: "bar",
        data: {
          labels: numData.labels,
          datasets: [
            {
              label: "평균값 (Mean)",
              data: numData.means,
              backgroundColor: "#6366f1",
              borderRadius: 6,
            },
            {
              label: "중앙값 (Median)",
              data: numData.medians,
              backgroundColor: "#a855f7",
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: { color: colors.textColor, font: { family: "Pretendard" } },
            },
          },
          scales: {
            x: {
              ticks: { color: colors.textColor, font: { family: "Pretendard" } },
              grid: { color: colors.gridColor },
            },
            y: {
              ticks: { color: colors.textColor, font: { family: "Pretendard" } },
              grid: { color: colors.gridColor },
            },
          },
        },
      });
    }
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
