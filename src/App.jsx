import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { NavBar } from './components/NavBar';
import HomePage from './pages/HomePage';
import DummyPage from './pages/DummyPage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen transition-colors duration-300">
          <NavBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/vanilla" element={<DummyPage title="Vanilla" />} />
            <Route path="/pink" element={<DummyPage title="Pink" />} />
            <Route path="/arcade" element={<DummyPage title="Arcade" />} />
            <Route path="/cozy" element={<DummyPage title="Cozy" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
