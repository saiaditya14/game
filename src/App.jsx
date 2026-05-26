import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { NavBar } from './components/NavBar';
import HomePage from './pages/HomePage';
import DummyPage from './pages/DummyPage';
import DrawOffHub from './games/plum/DrawOffHub';
import DrawOffSingle from './games/plum/testing/DrawOffSingle';
import DrawOffBYOK from './games/plum/testing/DrawOffBYOK';
import DrawOffCoop from './games/plum/DrawOffCoop';
import ConnectFour from './games/sugar/ConnectFour';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen transition-colors duration-300">
          <NavBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/vanilla" element={<DummyPage title="Vanilla" />} />
            <Route path="/pink" element={<DummyPage title="Pink" />} />
            <Route path="/arcade" element={<DummyPage title="Arcade" />} />
            <Route path="/cozy" element={<DummyPage title="Cozy" />} />
            <Route path="/draw-off" element={<DrawOffHub />} />
            <Route path="/draw-off-single" element={<DrawOffSingle />} />
            <Route path="/draw-off-coop" element={<DrawOffCoop />} />
            <Route path="/draw-off-byok" element={<DrawOffBYOK />} />
            <Route path="/connect-four" element={<ConnectFour />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
