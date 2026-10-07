import React, { useState } from 'react';
import { CardItem } from './types';
import { INITIAL_CARDS } from './data/cardsData';
import { GameModeMixto } from './components/GameModeMixto';
import { CardDeckView } from './components/CardDeckView';
import { CreateCardModal } from './components/CreateCardModal';
import { sound } from './utils/sound';
import {
  Shield,
  Trophy,
  Volume2,
  VolumeX,
  HelpCircle,
  BookOpen,
  Layers,
  RefreshCw,
  X,
  Shuffle,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function App() {
  const [cards, setCards] = useState<CardItem[]>(INITIAL_CARDS);
  const [activeTab, setActiveTab] = useState<'mixto' | 'mazo'>('mixto');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const handleToggleSound = () => {
    const newState = sound.toggleSound();
    setSoundEnabled(newState);
  };

  const handleToggleHeader = () => {
    sound.playClick();
    setIsHeaderCollapsed(!isHeaderCollapsed);
  };

  const handleToggleFullScreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsHeaderCollapsed(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsHeaderCollapsed(false);
    }
  };

  const handleAddCard = (newCard: CardItem) => {
    setCards((prev) => [newCard, ...prev]);
  };

  const handleResetScore = () => {
    sound.playClick();
    if (window.confirm('¿Deseas reiniciar la puntuación a 0?')) {
      setPlayerScore(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-[#2d2a26] flex flex-col font-sans selection:bg-[#d62828] selection:text-white">
      {/* COLLAPSIBLE MINIMAL BAR (WHEN HEADER IS HIDDEN FOR FULLSCREEN FOCUS) */}
      {isHeaderCollapsed ? (
        <div className="sticky top-0 z-50 bg-[#2d2a26] text-white px-4 py-2 flex items-center justify-between border-b-2 border-amber-500/50 shadow-bento print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-serif font-black text-sm uppercase tracking-wider text-[#fdfaf5] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400 inline" /> CRUCE DE LOS ANDES
            </span>
            <span className="px-2 py-0.5 bg-[#1d3557] text-white border border-white/20 font-extrabold uppercase text-[10px] tracking-widest truncate">
              {activeTab === 'mixto' && '🔀 Modo Mixto (3, 5 o 7 Min)'}
              {activeTab === 'mazo' && '🎴 Mazo Didáctico'}
            </span>

            <div className="bg-[#f3efe6]/10 px-2.5 py-0.5 rounded border border-white/20 font-bold text-xs flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-amber-300">Puntaje:</span>
              <span className="text-white font-mono">{playerScore} pts</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleHeader}
              className="px-3 py-1.5 bg-[#2a9d8f] hover:bg-[#264653] text-white border border-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-bento-sm active:translate-y-0.5"
              title="Mostrar título y menú de navegación"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Mostrar Menú</span>
            </button>

            <button
              onClick={handleToggleFullScreen}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/40 text-xs font-bold"
              title="Alternar Pantalla Completa"
            >
              {document.fullscreenElement ? <Minimize2 className="w-4 h-4 text-amber-300" /> : <Maximize2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* HEADER / NAVIGATION BAR */}
          <header className="sticky top-0 z-40 bg-[#fdfaf5]/95 backdrop-blur-md border-b-2 border-[#2d2a26] shadow-bento-sm print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
              {/* Logo & Title */}
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] font-sans font-bold opacity-70 text-[#2d2a26] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#1d3557] inline" />
                  EXPEDICIÓN LIBERTADORA • GESTA HISTÓRICA 1817
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tighter uppercase text-[#2d2a26]">
                    CRUCE DE LOS ANDES
                  </h1>
                  <span className="text-[10px] font-bold font-sans bg-[#1d3557] text-white border border-[#2d2a26] px-2.5 py-1 uppercase tracking-widest hidden sm:inline-block shadow-bento-sm">
                    JUEGO DE CARTAS
                  </span>
                </div>
              </div>

              {/* Game Modes Tabs */}
              <nav className="flex items-center gap-3 self-center md:self-end">
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('mixto');
                  }}
                  className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border-2 border-[#2d2a26] ${
                    activeTab === 'mixto'
                      ? 'bg-[#d62828] text-white shadow-bento -translate-y-0.5'
                      : 'bg-[#f3efe6] text-[#2d2a26] hover:bg-white'
                  }`}
                >
                  <Shuffle className="w-4 h-4 text-amber-300" />
                  <span>Modo Mixto (3 Min)</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('mazo');
                  }}
                  className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border-2 border-[#2d2a26] ${
                    activeTab === 'mazo'
                      ? 'bg-[#1d3557] text-white shadow-bento -translate-y-0.5'
                      : 'bg-[#f3efe6] text-[#2d2a26] hover:bg-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Mazo Didáctico ({cards.length})</span>
                </button>
              </nav>

              {/* Right Info & Quick Controls */}
              <div className="flex items-center gap-3 self-end md:self-end">
                <div className="hidden lg:flex gap-4 text-right text-xs uppercase font-sans font-bold border-l-2 border-[#2d2a26] pl-4">
                  <div>
                    <span className="text-[10px] opacity-70">GENERAL</span><br />
                    <span className="text-sm font-black text-[#2d2a26]">SAN MARTÍN</span>
                  </div>
                  <div className="text-[#1d3557]">
                    <span className="text-[10px] opacity-70">AÑO GESTA</span><br />
                    <span className="text-sm font-black">1817</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleHeader}
                    className="px-3 py-2 bg-[#1d3557] text-white border-2 border-[#2d2a26] text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider shadow-bento-sm hover:bg-[#2a9d8f] transition-all"
                    title="Ocultar menú para enfocar las preguntas"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span className="hidden md:inline">Ocultar Menú</span>
                  </button>

                  <button
                    onClick={handleToggleFullScreen}
                    className="px-3 py-2 bg-[#2a9d8f] text-white border-2 border-[#2d2a26] text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider shadow-bento-sm hover:bg-[#1d3557] transition-all"
                    title="Ver pantalla completa"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Pantalla Completa</span>
                  </button>

                  <button
                    onClick={() => setIsRulesModalOpen(true)}
                    className="px-3 py-2 bg-white text-[#2d2a26] border-2 border-[#2d2a26] text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider shadow-bento-sm hover:bg-[#f3efe6] transition-all"
                    title="Reglamento del juego"
                  >
                    <HelpCircle className="w-4 h-4 text-[#1d3557]" />
                    <span className="hidden sm:inline">Reglas</span>
                  </button>

                  <button
                    onClick={handleToggleSound}
                    className="p-2 bg-white text-[#2d2a26] border-2 border-[#2d2a26] shadow-bento-sm hover:bg-[#f3efe6] transition-all"
                    title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-[#1d3557]" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
                  </button>
                </div>
              </div>
            </div>
          </header>
        </>
      )}

      {/* MAIN GAME CONTENT AREA */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-2 sm:px-5 md:px-7 py-3 sm:py-5">
        {activeTab === 'mixto' && (
          <GameModeMixto
            cards={cards}
            playerScore={playerScore}
            onUpdateScore={setPlayerScore}
          />
        )}

        {activeTab === 'mazo' && (
          <CardDeckView cards={cards} onOpenCreateModal={() => setIsCreateModalOpen(true)} />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#2d2a26] text-[#fdfaf5] border-t-2 border-[#2d2a26] py-6 px-4 text-center text-xs space-y-2 print:hidden shadow-bento">
        <p className="font-serif italic text-base font-bold text-[#fdfaf5]">
          "Dividir al enemigo, desorientarlo y vencerlo en su propio terreno." — Gral. José de San Martín
        </p>
        <p className="font-sans text-[11px] uppercase tracking-widest opacity-75">
          Mendoza • Provincia de Cuyo • Ejército de los Andes • Gesta Emancipadora Suramericana
        </p>
      </footer>

      {/* CREATE CARD MODAL */}
      <CreateCardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddCard={handleAddCard}
      />

      {/* RULES MODAL */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2d2a26]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#fdfaf5] border-2 border-[#2d2a26] max-w-xl w-full p-6 space-y-4 shadow-bento relative text-[#2d2a26]">
            <div className="flex items-center justify-between border-b-2 border-[#2d2a26] pb-3">
              <h3 className="font-serif font-black text-[#2d2a26] text-xl uppercase tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#1d3557]" />
                Reglamento del Juego de Cartas
              </h3>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="p-1 text-[#2d2a26] hover:bg-[#e8e4d8] border border-[#2d2a26]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar font-sans">
              <div className="p-3.5 bg-[#f3efe6] border-2 border-[#2d2a26] shadow-bento-sm space-y-1.5">
                <div className="inline-block bg-[#d62828] text-white px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">
                  🔀 Modo Mixto (3 Minutos Contrarreloj)
                </div>
                <p className="text-[#2d2a26] leading-relaxed font-semibold">
                  • <strong>Desafío Contrarreloj de 3 Minutos:</strong> Partida de 3 minutos para responder las cartas del Cruce de los Andes. El tiempo no comenzará a correr hasta presionar el botón PLAY.<br />
                  • <strong>Puntuación y Registro:</strong> Cada acierto acumula puntos tácticos según la dificultad de la carta.<br />
                  • <strong>Informe y Puntaje Final:</strong> Al terminar el tiempo o al finalizar las cartas, se presenta el balance completo con respuestas correctas, incorrectas, porcentaje de efectividad y tu rango de honor militar.
                </p>
              </div>

              <div className="p-3.5 bg-white border-2 border-[#2d2a26] shadow-bento-sm space-y-1.5">
                <div className="inline-block bg-[#1d3557] text-white px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">
                  Categoría 1: Estimación Numérica
                </div>
                <p className="text-[#2d2a26] leading-relaxed font-medium">
                  <strong>Regla de Estimación:</strong> Se premian las respuestas <strong>menores o iguales pero más cercanas</strong> al valor histórico real (sin pasarse del objetivo).
                </p>
              </div>

              <div className="p-3.5 bg-white border-2 border-[#2d2a26] shadow-bento-sm space-y-1.5">
                <div className="inline-block bg-[#1d3557] text-white px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">
                  Categoría 2: Secuencias Cronológicas
                </div>
                <p className="text-[#2d2a26] leading-relaxed">
                  Haz clic en las opciones para ordenarlas del acontecimiento más antiguo al más reciente en la línea de tiempo.
                </p>
              </div>

              <div className="p-3.5 bg-white border-2 border-[#2d2a26] shadow-bento-sm space-y-1.5">
                <div className="inline-block bg-[#2a9d8f] text-white px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">
                  Categoría 3: Verdadero o Falso
                </div>
                <p className="text-[#2d2a26] leading-relaxed">
                  Evalúa si la afirmación histórica es Verdadera o Falsa y comprueba la justificación documentada.
                </p>
              </div>

              <div className="p-3.5 bg-white border-2 border-[#2d2a26] shadow-bento-sm space-y-1.5">
                <div className="inline-block bg-[#9c6644] text-white px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">
                  Categoría 4: Opción Múltiple
                </div>
                <p className="text-[#2d2a26] leading-relaxed">
                  Selecciona entre las cuatro opciones tácticas y biográficas propuestas.
                </p>
              </div>

              <div className="p-3.5 bg-[#2d2a26] text-white border-2 border-[#2d2a26] shadow-bento-sm space-y-1">
                <h4 className="font-serif font-bold text-sm text-[#fdfaf5] uppercase tracking-wider">
                  🎴 Modo Mazo Didáctico
                </h4>
                <p className="text-stone-300 text-xs">
                  Permite explorar el fichero completo de {cards.length} cartas, filtrar por dificultad o categoría, voltear en 3D para estudiar o imprimir fichas para el aula.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
