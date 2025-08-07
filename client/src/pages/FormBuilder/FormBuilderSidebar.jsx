import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

import canovaLogo from "./../../assets/icons/canovaLogo.png";
import profileIcon from "./../../assets/icons/profileIcon.png";
import addIcon from "./../../assets/icons/addIcon.png";

const FormBuilderSidebar = ({
  pages,
  form,
  onAddPage,
  currentPageId,
  onPageSelect,
  isConditionModeActive,
}) => {
  const { theme } = useTheme();

  // Helper function to check if a page is a true/false target of another page's condition
  const isPageTarget = (targetPageId, conditionalLogicType) => {
    return form.pages.some((page) => {
      if (page.conditionalLogic) {
        if (
          conditionalLogicType === "true" &&
          page.conditionalLogic.truePageId === targetPageId
        ) {
          return true;
        }
        if (
          conditionalLogicType === "false" &&
          page.conditionalLogic.falsePageId === targetPageId
        ) {
          return true;
        }
      }
      return false;
    });
  };

  return (
    <div className={`form-builder-sidebar ${theme}`}>
      <Link to="/dashboard" className="sidebar-header">
        <img src={canovaLogo} alt="logo" width={28} />
        <h2 className="sidebar-logo">CANOVA</h2>
      </Link>
      <div className="page-list">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`page-item page-name-with-dots ${
              page.id === currentPageId ? "active" : ""
            } ${isConditionModeActive ? "disabled" : ""}`}
            onClick={() => !isConditionModeActive && onPageSelect(page.id)}
          >
            <div>{page.name}</div>
            {/* Conditional Dots Container */}
            <div className="condition-dots-container">
              {/* True Page Dot */}
              <div
                className={`condition-dot true-dot ${
                  isPageTarget(page.id, "true") ? "active" : ""
                }`}
                title={
                  isPageTarget(page.id, "true")
                    ? "Target of a 'True' condition"
                    : ""
                }
              ></div>
              {/* False Page Dot */}
              <div
                className={`condition-dot false-dot ${
                  isPageTarget(page.id, "false") ? "active" : ""
                }`}
                title={
                  isPageTarget(page.id, "false")
                    ? "Target of a 'False' condition"
                    : ""
                }
              ></div>
            </div>
          </div>
        ))}
        <button
          className="add-page-button"
          onClick={onAddPage}
          disabled={isConditionModeActive}
        >
          <img src={addIcon} alt="add" width={22} className="plus-icon" /> Add
          new Page
        </button>
      </div>
      <div className="sidebar-footer">
        <Link to="/profile" className="profile-link">
          <img src={profileIcon} alt="profile" width={24} />
          Profile
        </Link>
      </div>
    </div>
  );
};

export default FormBuilderSidebar;
