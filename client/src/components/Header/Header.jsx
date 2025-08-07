import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import searchIcon from "../../assets/icons/searchIcon.png";

import "./Header.css";

const Header = ({ title, setSearchTerm: onSearch }) => {
  const { theme } = useTheme();

  // Conditional rendering for the header content
  const renderHeaderContent = () => {
    if (onSearch) {
      return (
        <div className="header-search-container">
          <div className="header-title-container">
            <h1 className="header-title">{title}</h1>
          </div>
          <div className={`search-bar ${theme}`}>
            <img src={searchIcon} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search forms..."
              onChange={(e) => onSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      );
    } else {
      return <h1 className="header-title">{title}</h1>;
    }
  };

  return <header className="header-component">{renderHeaderContent()}</header>;
};

export default Header;
