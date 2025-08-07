import { Link, useLocation } from "react-router-dom";

import "./Sidebar.css";
import canovaLogo from "../../assets/icons/canovaLogo.png";
import profileIcon from "../../assets/icons/profileIcon.png";
import homeIcon from "../../assets/icons/homeIcon.png";
import analysisIcon from "../../assets/icons/analysisIcon.png";
import projectIcon from "../../assets/icons/projectIcon.png";

const Sidebar = () => {
  const location = useLocation();

  const navigationItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: <img src={homeIcon} alt="home" />,
    },
    {
      name: "Analysis",
      href: "/analysis",
      icon: <img src={analysisIcon} alt="analysis" />,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: <img src={projectIcon} alt="projects" />,
    },
  ];

  // Helper function to determine if a navigation item should be active
  const isNavLinkActive = (href) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }

    return location.pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Link to="/dashboard" className="sidebar-logo-link">
          <img src={canovaLogo} alt="logo" className="sidebar-logo-img" />
          <span className="sidebar-logo-name">CANOVA</span>
        </Link>
        <nav>
          <ul className="sidebar-nav">
            {navigationItems.map((item) => (
              <li key={item.name} className="sidebar-nav-item">
                <Link
                  to={item.href}
                  className={`sidebar-nav-link ${
                    isNavLinkActive(item.href) // Use the new helper function
                      ? "sidebar-nav-link-active"
                      : ""
                  }`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-link-text">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="sidebar-bottom">
        {/* For Profile, you likely want an exact match as well */}
        <Link
          to="/profile"
          className={`sidebar-nav-link ${
            location.pathname === "/profile" ? "sidebar-nav-link-active" : ""
          }`}
        >
          <img
            src={profileIcon}
            alt="profile"
            className="sidebar-icon-img"
            width={20}
          />
          <span className="sidebar-link-text">Profile</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
