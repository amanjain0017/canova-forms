import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useFormContext } from "../../context/FormContext";
import formIcon from "../../assets/icons/formIcon.png";
import threedotsIcon from "../../assets/icons/threedotsIcon.png";

// Import components for Modals and Dropdown
import CardDropdown from "./../Dropdowns/CardDropdown";
import RenameModal from "./../Modals/RenameModal/RenameModal";
import DeleteModal from "./../Modals/DeleteModal/DeleteModal";
import ShareModal from "./../Modals/ShareModal/ShareModal";

// Import Chart.js components
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProjectAnalysisContent = () => {
  const { projectId } = useParams();
  const { forms, loading, error, getFormsByProject } = useFormContext();
  const navigate = useNavigate();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [modalState, setModalState] = useState(null); // Add modalState
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      getFormsByProject(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter for published forms
  const publishedForms = forms.filter((form) => form.status === "published");

  // Calculate total views for the project
  const totalViews = publishedForms.reduce(
    (sum, form) => sum + (form.totalViews || 0),
    0
  );

  // Calculate average total views
  const averageTotalViews =
    publishedForms.length > 0
      ? (totalViews / publishedForms.length).toFixed(2)
      : 0;

  // --- Chart Data Processing ---
  const processChartData = (forms) => {
    const dailyAggregatedViews = {}; // Stores { 'YYYY-MM-DD': totalViewsForThatDay }

    forms.forEach((form) => {
      form.dailyViews?.forEach((dailyEntry) => {
        const date = new Date(dailyEntry.date);
        const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD

        dailyAggregatedViews[dateString] =
          (dailyAggregatedViews[dateString] || 0) + dailyEntry.count;
      });
    });

    // Sort dates and prepare labels and data for Chart.js
    const sortedDates = Object.keys(dailyAggregatedViews).sort();

    const labels = sortedDates.map((dateString) => {
      const date = new Date(dateString);
      // Format as "MMM DD" (e.g., "Jan 01")
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      });
    });

    const dataPoints = sortedDates.map(
      (dateString) => dailyAggregatedViews[dateString]
    );

    return { labels, dataPoints };
  };

  const { labels, dataPoints } = processChartData(publishedForms);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Total Project Views",
        data: dataPoints,
        borderColor: "rgb(96, 165, 250)", // Tailwind blue-500 equivalent
        backgroundColor: "rgba(96, 165, 250, 0.5)",
        fill: false, // Don't fill area under the line
        tension: 0.3, // Adds a slight curve to the line
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow flexbox to control height
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: "Project Views Over Time",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        title: {
          display: true,
          text: "Views",
        },
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <div className="status-message">Loading forms...</div>;
  }

  if (error) {
    return <div className="status-message error-message">Error: {error}</div>;
  }

  const handleFormIconClick = (formId) => {
    navigate(`/analysis/forms/${formId}`);
  };

  const handleDropdownToggle = (item) => {
    setActiveDropdown(
      activeDropdown && activeDropdown._id === item._id ? null : item
    );
  };

  // Modified handleAction to set modalState
  const handleAction = (action, item) => {
    setActiveDropdown(null); // Close dropdown after action

    // In ProjectAnalysisContent, forms are always published for analysis,
    // so no need to check for 'draft' status for 'edit'.
    // If you ever want to allow editing draft forms from here, add the logic.

    setModalState({ type: action, item });
  };

  const closeModal = () => {
    setModalState(null);
  };

  return (
    <div className="project-analysis-container">
      <div className="summary-grid-layout">
        <div className="metrics-column">
          <div className="summary-card">
            <p className="summary-label">Total Project Views</p>
            <h3 className="summary-value">{totalViews.toLocaleString()}</h3>
          </div>
          <div className="summary-card">
            <p className="summary-label">Average Project Views</p>
            <h3 className="summary-value">{averageTotalViews}</h3>
          </div>
        </div>
        <div className="summary-card full-width chart-column">
          <div className="chart-container" style={{ height: "300px" }}>
            {dataPoints.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <p className="status-message">
                No view data available for charting.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="works-grid" ref={dropdownRef}>
        {" "}
        {/* Add ref to a common parent */}
        {publishedForms.length > 0 ? (
          publishedForms.map((form) => {
            const isDropdownOpen =
              activeDropdown && activeDropdown._id === form._id;
            return (
              <div key={form._id} className="card form-card">
                <div className="card-top-row">
                  <h3 className="card-title">{form.title}</h3>
                </div>
                <div className="form-card-icon-wrapper">
                  <img
                    src={formIcon}
                    alt="form"
                    className="card-icon"
                    width={25}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleFormIconClick(form._id)}
                  />
                </div>
                <div className="form-card-footer">
                  <Link
                    to={`/analysis/forms/${form._id}`}
                    className="view-analysis-link"
                  >
                    View Analysis
                  </Link>
                  <div
                    className="card-options-wrapper"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropdownToggle({ ...form, type: "form" });
                    }}
                  >
                    <img
                      src={threedotsIcon}
                      alt="3dots"
                      className="card-threedots-icon"
                    />
                    {isDropdownOpen && ( // Conditionally render CardDropdown
                      <CardDropdown
                        item={{ ...form, type: "form" }}
                        onAction={handleAction}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="status-message no-forms">
            No published forms to analyze.
          </p>
        )}
      </div>

      {/* Modals - Render them conditionally based on modalState */}
      {modalState && modalState.type === "rename" && (
        <RenameModal
          isOpen={true}
          onClose={closeModal}
          item={modalState.item}
        />
      )}
      {modalState && modalState.type === "delete" && (
        <DeleteModal
          isOpen={true}
          onClose={closeModal}
          item={modalState.item}
        />
      )}
      {modalState && modalState.type === "share" && (
        <ShareModal isOpen={true} onClose={closeModal} item={modalState.item} />
      )}
    </div>
  );
};

export default ProjectAnalysisContent;
