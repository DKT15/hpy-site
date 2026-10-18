import { Link, NavLink, Outlet } from "react-router-dom";

import "../../styles/Admin.css";

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link to="/admin" className="admin-brand">
          <img src="/histopository-logo.png" alt="" />

          <div>
            <span>Histopository</span>

            <small>Admin</small>
          </div>
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/topics"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Topics
          </NavLink>

          <NavLink
            to="/admin/courses"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Courses
          </NavLink>

          <NavLink
            to="/admin/lessons"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Lessons
          </NavLink>

          <Link to="/learn" className="admin-view-site">
            View site
          </Link>
        </nav>
      </header>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
