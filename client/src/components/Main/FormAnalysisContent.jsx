import React, { useState, useEffect, useRef } from "react"; // Import useRef
import { useParams } from "react-router-dom";
import { useFormContext } from "../../context/FormContext";
import { useResponseContext } from "../../context/ResponseContext";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas"; // Import html2canvas

import backIcon from "./../../assets/icons/backIcon.png";

const FormAnalysisContent = () => {
  const { formId } = useParams();
  const {
    forms,
    getFormById,
    loading: formLoading,
    error: formError,
  } = useFormContext();
  const {
    responses,
    getFormResponses,
    loading: responseLoading,
    error: responseError,
  } = useResponseContext();
  const [currentForm, setCurrentForm] = useState(null);
  const [chartDataByPage, setChartDataByPage] = useState([]);
  const [loadingState, setLoadingState] = useState({
    form: true,
    responses: true,
  });

  const navigate = useNavigate();
  const mainContentRef = useRef(null); // Create a ref for the main content div

  useEffect(() => {
    if (formId) {
      setLoadingState({ form: true, responses: true });

      const fetchData = async () => {
        try {
          let existingForm = forms?.find((f) => f._id === formId);

          if (!existingForm && getFormById) {
            // console.log("Form not in array, calling getFormById...");
            const result = await getFormById(formId);
            if (result && result.success && result.form) {
              setCurrentForm(result.form);
              setLoadingState((prev) => ({ ...prev, form: false }));
            }
          } else if (existingForm) {
            // console.log("Found existing form in array:", existingForm);
            setCurrentForm(existingForm);
            setLoadingState((prev) => ({ ...prev, form: false }));
          }

          if (getFormResponses) {
            // console.log("Calling getFormResponses...");
            await getFormResponses(formId);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setLoadingState({ form: false, responses: false });
        }
      };

      fetchData();
    }
  }, [formId]);

  // Update loading state based on context loading states
  useEffect(() => {
    setLoadingState({
      form: formLoading,
      responses: responseLoading,
    });
  }, [formLoading, responseLoading]);

  // This useEffect ensures currentForm is set if forms array updates later
  useEffect(() => {
    if (forms && forms.length > 0 && formId) {
      const form = forms.find((f) => f._id === formId);
      if (form) {
        setCurrentForm(form);
        setLoadingState((prev) => ({ ...prev, form: false }));
      }
    }
  }, [forms, formId]);

  useEffect(() => {
    if (responses !== undefined) {
      setLoadingState((prev) => ({ ...prev, responses: false }));
    }
  }, [responses]);

  useEffect(() => {
    if (currentForm && responses && responses.length > 0) {
      // console.log("Processing chart data...", { currentForm, responses });
      processChartDataByPages();
    } else {
      // console.log("Not processing chart data:", {
      //   hasForm: !!currentForm,
      //   responsesLength: responses?.length || 0,
      // });
      setChartDataByPage([]);
    }
  }, [currentForm, responses]);

  // Function to process chart data based on question types, organized by pages
  const processChartDataByPages = () => {
    if (!currentForm || !responses?.length) return;

    const pageData = [];

    currentForm.pages?.forEach((page, pageIndex) => {
      const pageCharts = [];

      page.sections?.forEach((section) => {
        section.questions?.forEach((question, questionIndex) => {
          if (
            ["multipleChoice", "checkbox", "dropdown", "rating"].includes(
              question.type
            )
          ) {
            const questionResponses = responses
              .map((response) =>
                response.answers?.find(
                  (answer) => answer.questionId === question.id
                )
              )
              .filter(Boolean);

            if (questionResponses.length === 0) return;

            const chartInfo = generateChartData(
              question,
              questionResponses,
              questionIndex + 1
            );
            if (chartInfo) {
              pageCharts.push(chartInfo);
            }
          }
        });
      });

      if (pageCharts.length > 0) {
        pageData.push({
          pageNumber: pageIndex + 1,
          pageTitle: page.title,
          charts: pageCharts,
        });
      }
    });

    setChartDataByPage(pageData);
  };

  // Generate chart data based on question type
  const generateChartData = (question, questionResponses, questionNumber) => {
    const { type, questionText, options, minRating, maxRating } = question;

    switch (type) {
      case "multipleChoice":
      case "dropdown":
        return generateMultipleChoiceChart(
          questionText,
          options,
          questionResponses,
          questionNumber
        );
      case "checkbox":
        return generateCheckboxChart(
          questionText,
          options,
          questionResponses,
          questionNumber
        );
      case "rating":
        return generateRatingChart(
          questionText,
          questionResponses,
          minRating || 1,
          maxRating || 5,
          questionNumber
        );
      default:
        return null;
    }
  };

  // Generate chart for multiple choice/dropdown questions
  const generateMultipleChoiceChart = (
    questionText,
    options,
    responses,
    questionNumber
  ) => {
    const optionCounts = {};

    options?.forEach((option) => {
      const optionText = typeof option === "string" ? option : option.text;
      optionCounts[optionText] = 0;
    });

    responses.forEach((response) => {
      if (response.value && optionCounts.hasOwnProperty(response.value)) {
        optionCounts[response.value]++;
      }
    });

    const data = Object.entries(optionCounts).map(([name, value]) => ({
      name,
      value,
      percentage:
        responses.length > 0
          ? ((value / responses.length) * 100).toFixed(1)
          : 0,
    }));

    return {
      questionNumber,
      questionText,
      chartType: "pie",
      totalResponses: responses.length,
      data,
      colors: [
        "#4F46E5",
        "#06B6D4",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#6B7280",
      ],
    };
  };

  // Generate chart for checkbox questions (can have multiple selections)
  const generateCheckboxChart = (
    questionText,
    options,
    responses,
    questionNumber
  ) => {
    const optionCounts = {};

    options?.forEach((option) => {
      const optionText = typeof option === "string" ? option : option.text;
      optionCounts[optionText] = 0;
    });

    responses.forEach((response) => {
      if (response.value) {
        const values = Array.isArray(response.value)
          ? response.value
          : [response.value];
        values.forEach((value) => {
          if (optionCounts.hasOwnProperty(value)) {
            optionCounts[value]++;
          }
        });
      }
    });

    const data = Object.entries(optionCounts).map(([name, count]) => ({
      name,
      count,
      percentage:
        responses.length > 0
          ? ((count / responses.length) * 100).toFixed(1)
          : 0,
    }));

    return {
      questionNumber,
      questionText: `${questionText} (Multiple selections allowed)`,
      chartType: "bar",
      totalResponses: responses.length,
      data,
      colors: [
        "#4F46E5",
        "#06B6D4",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#6B7280",
      ],
    };
  };

  // Generate chart for rating questions
  const generateRatingChart = (
    questionText,
    responses,
    minRating,
    maxRating,
    questionNumber
  ) => {
    const ratingCounts = {};

    for (let i = minRating; i <= maxRating; i++) {
      ratingCounts[i] = 0;
    }

    responses.forEach((response) => {
      const rating = parseInt(response.value);
      if (rating >= minRating && rating <= maxRating) {
        ratingCounts[rating]++;
      }
    });

    const data = Object.entries(ratingCounts).map(([rating, count]) => ({
      name: `${rating} Star${parseInt(rating) !== 1 ? "s" : ""}`,
      count,
      rating: parseInt(rating),
    }));

    const totalResponses = data.reduce((sum, item) => sum + item.count, 0);
    const totalRating = data.reduce(
      (sum, item) => sum + item.rating * item.count,
      0
    );
    const averageRating =
      totalResponses > 0 ? (totalRating / totalResponses).toFixed(1) : 0;

    return {
      questionNumber,
      questionText: `${questionText} (Avg: ${averageRating} stars)`,
      chartType: "bar",
      totalResponses,
      averageRating,
      data,
      colors: ["#EF4444", "#F59E0B", "#EAB308", "#22C55E", "#10B981"],
    };
  };

  // Custom Pie Chart Component (no changes needed here for download)
  const CustomPieChart = ({
    data,
    colors,
    questionText,
    totalResponses,
    questionNumber,
  }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const viewBoxSize = 240;
    const radius = 80;
    const centerX = viewBoxSize / 2;
    const centerY = viewBoxSize / 2;

    let currentAngle = 0;
    const segments = data.map((item, index) => {
      const angle =
        totalResponses > 0 ? (item.value / totalResponses) * 360 : 0;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ");

      return {
        pathData,
        color: colors[index % colors.length],
        item,
        index,
      };
    });

    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="question-title">
            <span className="question-number">0{questionNumber}</span>
            <span className="question-text">Question</span>
          </h3>
          <p className="question-full-text">{questionText}</p>
        </div>

        <div className="chart-content">
          <div className="chart-container">
            <svg
              viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              className="pie-chart"
            >
              {segments.map((segment, index) => (
                <path
                  key={index}
                  d={segment.pathData}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="3"
                  className={`pie-segment ${
                    hoveredIndex === index ? "hovered" : ""
                  }`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
            </svg>
          </div>

          <div className="chart-legend">
            {data.map((item, index) => (
              <div key={index} className="legend-item">
                <div
                  className="legend-dot"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <div className="legend-content">
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-percentage">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-footer">Total responses: {totalResponses}</div>
      </div>
    );
  };

  // Custom Bar Chart Component (no changes needed here for download)
  const CustomBarChart = ({
    data,
    colors,
    questionText,
    totalResponses,
    averageRating,
    questionNumber,
  }) => {
    const maxCount = Math.max(...data.map((d) => d.count || 0));

    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="question-title">
            <span className="question-number">0{questionNumber}</span>
            <span className="question-text">Question</span>
          </h3>
          <p className="question-full-text">{questionText}</p>
        </div>

        <div className="chart-content">
          <div className="bar-chart-container">
            {data.map((item, index) => {
              const height = maxCount > 0 ? (item.count / maxCount) * 200 : 0;
              return (
                <div key={index} className="bar-item">
                  <div className="bar-value">{item.count}</div>
                  <div
                    className="bar"
                    style={{
                      height: `${height}px`,
                      backgroundColor: colors[index % colors.length],
                    }}
                  />
                  <div className="bar-label">{item.name}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="chart-footer">
          Total responses: {totalResponses}
          {averageRating && (
            <span className="average-rating">
              | Average rating: {averageRating}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleDownload = async () => {
    if (mainContentRef.current) {
      // console.log("Attempting to download analysis report...");
      // Temporarily remove overflow-y and set a fixed height for accurate capture
      const originalOverflowY = mainContentRef.current.style.overflowY;
      const originalHeight = mainContentRef.current.style.height;
      const originalPadding = mainContentRef.current.style.padding;
      const originalMargin = mainContentRef.current.style.margin;

      const fullHeight = mainContentRef.current.scrollHeight;

      // Set styles for screenshot
      mainContentRef.current.style.overflowY = "visible";
      mainContentRef.current.style.height = `${fullHeight}px`;
      mainContentRef.current.style.padding = "20px";
      mainContentRef.current.style.margin = "0";

      try {
        const canvas = await html2canvas(mainContentRef.current, {
          scale: 2,
          scrollY: -window.scrollY,
          windowWidth: document.documentElement.offsetWidth,
          windowHeight: document.documentElement.offsetHeight,
        });

        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `${currentForm.title}_analysis.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // console.log("Analysis report downloaded successfully.");
      } catch (error) {
        console.error("Error generating image for download:", error);
        alert("Failed to generate image for download. Please try again.");
      } finally {
        // Restore original styles
        mainContentRef.current.style.overflowY = originalOverflowY;
        mainContentRef.current.style.height = originalHeight;
        mainContentRef.current.style.padding = originalPadding;
        mainContentRef.current.style.margin = originalMargin;
      }
    } else {
      console.warn("Main content ref is not available for download.");
    }
  };

  // Check if we're still loading
  const isLoading = loadingState.form || loadingState.responses;

  if (isLoading) {
    return (
      <div className="analysis-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading form analysis...</p>
          <div className="loading-details">
            {loadingState.form && <span>Loading form details...</span>}
            {loadingState.responses && <span>Loading responses...</span>}
          </div>
        </div>
      </div>
    );
  }

  if (formError || responseError) {
    return (
      <div className="analysis-page">
        <div className="error-container">
          <div className="error-message">
            Error: {formError || responseError}
            <div className="error-details">Form ID: {formId}</div>
          </div>
        </div>
      </div>
    );
  }

  // Show different messages based on what's missing
  if (!formId) {
    return (
      <div className="analysis-page">
        <div className="error-container">
          <div className="error-message">No form ID provided</div>
        </div>
      </div>
    );
  }

  if (!currentForm) {
    return (
      <div className="analysis-page">
        <div className="error-container">
          <div className="error-message">
            Form not found
            <div className="error-details">
              Form ID: {formId}
              <br />
              Available forms: {forms?.length || 0}
              {forms && forms.length > 0 && (
                <div>Form IDs: {forms.map((f) => f._id).join(", ")}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-page">
      <style jsx>{`
        .analysis-page {
          min-height: 100vh; /* Changed from max-height to min-height for full scroll if content is short */
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          display: flex; /* Added flexbox to ensure header is fixed and main-content fills space */
          flex-direction: column; /* Stack header and main-content vertically */
        }

        .header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0; /* Prevent header from shrinking */
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .header-content {
          flex: 1;
        }

        .form-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .form-meta {
          display: flex;
          gap: 2rem;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        main.main-content {
          flex-grow: 1;
          margin: 5px;
          border: 2px solid black;
          border-radius: 16px;
          background-color: #fefdfd;
          /* Adjusted for fixed viewport height and vertical scroll */
          height: calc(
            100vh - 84px - 10px
          ); /* 84px is an estimated height of your header (1.5rem top/bottom padding + content height). Adjust this value based on actual header height. 10px for the 5px top/bottom margin on main-content. */
          overflow-y: auto; /* Enable vertical scrolling */
          overflow-x: hidden; /* Prevent horizontal scrolling */
          padding: 2rem; /* Add padding here for content inside the scrollable area */
        }

        .page-section {
          margin-bottom: 3rem;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .page-number {
          background: #4f46e5;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 1rem;
        }

        .page-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .chart-card {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .chart-header {
          margin-bottom: 1.5rem;
        }

        .question-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0 0 0.5rem 0;
        }

        .question-number {
          background: #111827;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
        }

        .question-text {
          color: #111827;
          font-weight: 600;
          font-size: 1rem;
        }

        .question-full-text {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.4;
        }

        .chart-content {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 1rem;
        }

        .chart-container {
          flex-shrink: 0;
        }

        .pie-chart {
          width: 240px;
          height: 240px;
        }

        .pie-segment {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .pie-segment.hovered {
          opacity: 0.8;
          filter: brightness(1.1);
        }

        .chart-legend {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .legend-dot {
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .legend-label {
          font-weight: 500;
          color: #111827;
          font-size: 0.875rem;
        }

        .legend-percentage {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 600;
        }

        .bar-chart-container {
          display: flex;
          align-items: end;
          gap: 1rem;
          height: 240px;
          padding: 1rem 0;
          width: 100%;
        }

        .bar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .bar-value {
          font-weight: 600;
          font-size: 0.875rem;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .bar {
          width: 40px;
          border-radius: 0.25rem 0.25rem 0 0;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .bar:hover {
          opacity: 0.8;
        }

        .bar-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
          max-width: 60px;
          word-wrap: break-word;
          line-height: 1.2;
        }

        .chart-footer {
          text-align: center;
          font-size: 0.875rem;
          color: #6b7280;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
        }

        .average-rating {
          margin-left: 0.5rem;
        }

        .download-section {
          display: flex;
          justify-content: center;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
          flex-shrink: 0; /* Prevent download section from shrinking */
        }

        .download-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #111827;
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .download-button:hover {
          background: #374151;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
          padding: 2rem;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-details {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .error-message {
          font-size: 1.125rem;
          color: #dc2626;
          text-align: center;
        }

        .error-details {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .no-data-message {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          margin: 2rem 0;
        }

        .no-data-title {
          font-size: 1.125rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .no-data-subtitle {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .header {
            padding: 1rem;
          }

          main.main-content {
            /* Changed from .main-content to main.main-content for specificity */
            padding: 1rem;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .chart-content {
            flex-direction: column;
            gap: 1rem;
          }

          .form-meta {
            flex-direction: column;
            gap: 0.5rem;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>

      <header className="header">
        <img
          src={backIcon}
          alt="back"
          onClick={() => navigate("/analysis")}
          width={29}
          height={29}
          style={{ cursor: "pointer" }}
        />
        <div className="header-content">
          <h1 className="form-title">{currentForm.title}</h1>
          <div className="form-meta">
            <span>Total Responses: {responses?.length || 0}</span>
            <span>Total Views: {currentForm.totalViews || 0}</span>
          </div>
        </div>
      </header>

      {/* Attach the ref to the main.main-content div */}
      <main className="main-content" ref={mainContentRef}>
        {chartDataByPage.length > 0 ? (
          chartDataByPage.map((pageData) => (
            <div key={pageData.pageNumber} className="page-section">
              <div className="page-header">
                <span className="page-number">
                  Page{" "}
                  {pageData.pageNumber < 10
                    ? `0${pageData.pageNumber}`
                    : pageData.pageNumber}
                </span>
                <h2 className="page-title">{pageData.pageTitle}</h2>
              </div>

              <div className="charts-grid">
                {pageData.charts.map((chart, index) => (
                  <div key={index}>
                    {chart.chartType === "pie" ? (
                      <CustomPieChart
                        data={chart.data}
                        colors={chart.colors}
                        questionText={chart.questionText}
                        totalResponses={chart.totalResponses}
                        questionNumber={chart.questionNumber}
                      />
                    ) : (
                      <CustomBarChart
                        data={chart.data}
                        colors={chart.colors}
                        questionText={chart.questionText}
                        totalResponses={chart.totalResponses}
                        averageRating={chart.averageRating}
                        questionNumber={chart.questionNumber}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-data-message">
            <div className="no-data-title">
              {!responses || responses.length === 0
                ? "No responses available to analyse"
                : "No visualizable questions found in this form"}
            </div>
            <div className="no-data-subtitle">
              Visualizations are available for multiple choice, checkbox,
              dropdown, and rating questions.
            </div>
          </div>
        )}
      </main>
      <div className="download-section">
        <button className="download-button" onClick={handleDownload}>
          Download
        </button>
      </div>
    </div>
  );
};

export default FormAnalysisContent;
