import React, { lazy, Suspense } from 'react';
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
import PastelMonopoly from './games/sugar/monopoly/PastelMonopoly';
import TicTacToe from './games/sugar/TicTacToe';
import QuickMathsDuel from './games/sugar/QuickMathsDuel';
import WordRace from './games/sugar/WordRace';
import VerbalMemoryDuel from './games/sugar/VerbalMemoryDuel';
import CategoryBlitz from './games/sugar/CategoryBlitz';
import GamblingCorner from './games/sugar/gambling/GamblingCorner';

const ThemeScene = lazy(() => import('./components/ThemeScene'));

function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <ThemeScene />
      </Suspense>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="relative min-h-screen transition-colors duration-300" style={{ zIndex: 10 }}>
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
            <Route path="/tic-tac-toe" element={<TicTacToe />} />
            <Route path="/quick-maths" element={<QuickMathsDuel />} />
            <Route path="/word-race" element={<WordRace />} />
            <Route path="/verbal-memory" element={<VerbalMemoryDuel />} />
            <Route path="/category-blitz" element={<CategoryBlitz />} />
            <Route path="/gambling-corner" element={<GamblingCorner />} />
            <Route path="/monopoly" element={<PastelMonopoly />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
