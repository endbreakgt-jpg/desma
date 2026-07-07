import React from 'react';
import { GameProvider, useGameContext } from './store/GameContext';
import SetupScreen from './components/SetupScreen';
import TurnScreen from './components/TurnScreen';
import ResultScreen from './components/ResultScreen';
import { Mic2 } from 'lucide-react';
import './App.css';

const MainApp = () => {
  const { currentScreen } = useGameContext();

  return (
    <div className="container">
      <header className="flex-center" style={{ flexDirection: 'column', marginBottom: '2rem' }}>
        <div className="flex-center" style={{ gap: '1rem', marginBottom: '1rem' }}>
          <Mic2 size={48} color="var(--primary)" />
          <h1 className="title" style={{ margin: 0 }}>KARAOKE DEATHMATCH</h1>
        </div>
        <p className="text-muted">自動集計＆罰点管理システム</p>
      </header>

      <main className="animate-fade-in">
        {currentScreen === 'setup' && <SetupScreen />}
        {currentScreen === 'turn' && <TurnScreen />}
        {currentScreen === 'result' && <ResultScreen />}
      </main>
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <MainApp />
    </GameProvider>
  );
}

export default App;
