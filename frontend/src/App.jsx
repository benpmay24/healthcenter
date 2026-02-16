import { Routes, Route, NavLink } from 'react-router-dom';
import { ModalProvider } from './context/ModalContext';
import Dashboard from './pages/Dashboard';
import DayLog from './pages/DayLog';
import Trends from './pages/Trends';
import Exercises from './pages/Exercises';
import Settings from './pages/Settings';

function App() {
  return (
    <ModalProvider>
    <div className="app">
      <header className="app-header">
        <NavLink to="/" className="app-brand">
          Health Center
        </NavLink>
        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Today
          </NavLink>
          <NavLink to="/day" className={({ isActive }) => (isActive ? 'active' : '')}>
            Daily log
          </NavLink>
          <NavLink to="/trends" className={({ isActive }) => (isActive ? 'active' : '')}>
            Trends
          </NavLink>
          <NavLink to="/exercises" className={({ isActive }) => (isActive ? 'active' : '')}>
            Exercises
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
            Settings
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/day" element={<DayLog />} />
            <Route path="/day/:date" element={<DayLog />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
    </ModalProvider>
  );
}

export default App;
