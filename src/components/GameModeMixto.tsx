import React, { useState, useEffect, useRef } from 'react';
import { CardItem } from '../types';
import { sound } from '../utils/sound';
import {
  Shuffle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Clock,
  Dices,
  HelpCircle,
  CheckSquare,
  Eye,
  EyeOff,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  XCircle,
  Trophy,
  Play,
  Pause,
  Medal,
  Timer,
  Info,
  Award,
  X
} from 'lucide-react';

interface GameModeMixtoProps {
  cards: CardItem[];
  playerScore?: number;
  onUpdateScore?: (score: number) => void;
}

interface AnswerRecord {
  cardId: string;
  cardTitle: string;
  categoryName: string;
  category: string;
  question: string;
  officialAnswer: string;
  explanation: string;
  pointsPossible: number;
  pointsEarned: number;
  isCorrect: boolean;
  userSelection?: string;
}

export const GameModeMixto: React.FC<GameModeMixtoProps> = ({
  cards,
  playerScore,
  onUpdateScore,
}) => {
  // Deck State
  const [deck, setDeck] = useState<CardItem[]>(() =>
    [...cards].sort(() => Math.random() - 0.5)
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // Timer Configuration & State (Partida fija de 3 minutos)
  const selectedDurationMinutes = 3;
  const [timeRemaining, setTimeRemaining] = useState<number>(3 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Answering & Evaluation State
  const [answersHistory, setAnswersHistory] = useState<Record<string, AnswerRecord>>({});
  const [showOfficialAnswer, setShowOfficialAnswer] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // Interactive user answer state per current card
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedTF, setSelectedTF] = useState<boolean | null>(null);
  const [userNumericInput, setUserNumericInput] = useState<string>('');
  const [userSequenceOrder, setUserSequenceOrder] = useState<string[]>([]);

  const activeCard = deck[currentIndex] || deck[0];
  const currentCategory = activeCard?.category || 'aproximacion';
  const sequenceItems = activeCard?.sequenceItems || [];
  const options = activeCard?.options || [];
  const currentRecord = activeCard ? answersHistory[activeCard.id] : undefined;

  // Initialize interactive answer inputs when changing card
  useEffect(() => {
    setShowOfficialAnswer(false);
    setSelectedOption(null);
    setSelectedTF(null);
    setUserNumericInput('');
    if (activeCard?.category === 'secuencia' && activeCard.sequenceItems) {
      setUserSequenceOrder([]);
    }
  }, [currentIndex, activeCard?.id]);

  // Timer Interval Effect - only ticks when game has started and timer is running
  useEffect(() => {
    if (isTimerRunning && hasGameStarted && !isGameOver) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            setIsGameOver(true);
            sound.playTimerAlarm();
            return 0;
          }
          if (prev <= 10 && prev > 1) {
            sound.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, hasGameStarted, isGameOver]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Game explicitly on Play button (3 minutes)
  const handleStartGame = () => {
    sound.playClick();
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setAnswersHistory({});
    setShowOfficialAnswer(false);
    setShowFeedbackModal(false);
    setIsGameOver(false);
    setTimeRemaining(3 * 60);
    setHasGameStarted(true);
    setIsTimerRunning(true);
    if (onUpdateScore) {
      onUpdateScore(0);
    }
  };

  // Toggle Play / Pause
  const handleTogglePlayPause = () => {
    sound.playClick();
    if (!hasGameStarted) {
      handleStartGame();
    } else {
      setIsTimerRunning((prev) => !prev);
    }
  };

  // Reset Game back to setup / waiting state
  const handleResetGame = () => {
    sound.playClick();
    setHasGameStarted(false);
    setIsTimerRunning(false);
    setTimeRemaining(3 * 60);
    setCurrentIndex(0);
    setAnswersHistory({});
    setShowOfficialAnswer(false);
    setShowFeedbackModal(false);
    setIsGameOver(false);
    if (onUpdateScore) {
      onUpdateScore(0);
    }
  };

  // Handle direct evaluation (Correct / Incorrect)
  const handleRecordAnswer = (
    isCorrect: boolean,
    customPoints?: number,
    userSelectionDesc?: string
  ) => {
    if (!hasGameStarted || !activeCard) return;

    const points = customPoints !== undefined ? customPoints : (isCorrect ? activeCard.points : 0);

    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playIncorrect();
    }

    const record: AnswerRecord = {
      cardId: activeCard.id,
      cardTitle: activeCard.title,
      categoryName: activeCard.categoryName,
      category: activeCard.category,
      question: activeCard.question,
      officialAnswer: activeCard.answer,
      explanation: activeCard.explanation,
      pointsPossible: activeCard.points,
      pointsEarned: points,
      isCorrect: isCorrect,
      userSelection: userSelectionDesc || (isCorrect ? 'Marcada como Correcta' : 'Marcada como Incorrecta')
    };

    setAnswersHistory((prev) => {
      const updated = {
        ...prev,
        [activeCard.id]: record
      };
      if (onUpdateScore) {
        const total = (Object.values(updated) as AnswerRecord[]).reduce((acc, a) => acc + a.pointsEarned, 0);
        onUpdateScore(total);
      }
      return updated;
    });

    setShowOfficialAnswer(true);
    setShowFeedbackModal(true);
  };

  // Evaluate Multiple Choice click
  const handleSelectMultipleChoiceOption = (optIndex: number) => {
    if (!hasGameStarted || currentRecord) return; // already answered or not started
    setSelectedOption(optIndex);
    const isCorrect = optIndex === activeCard.correctOptionIndex;
    const optLetter = String.fromCharCode(65 + optIndex);
    const optText = activeCard.options ? activeCard.options[optIndex] : '';
    handleRecordAnswer(isCorrect, isCorrect ? activeCard.points : 0, `Opción ${optLetter}: ${optText}`);
  };

  // Evaluate Verdadero / Falso click
  const handleSelectTF = (val: boolean) => {
    if (!hasGameStarted || currentRecord) return;
    setSelectedTF(val);
    const isCorrect = val === activeCard.isTrue;
    handleRecordAnswer(isCorrect, isCorrect ? activeCard.points : 0, val ? 'Verdadero' : 'Falso');
  };

  /**
   * Evaluate Numerical Estimation (Regla de Las Vegas / Estimación menor o igual más cercana sin pasarse)
   */
  const handleEvaluateNumeric = () => {
    if (!hasGameStarted || currentRecord || !userNumericInput) return;
    const num = parseFloat(userNumericInput);
    if (isNaN(num)) return;

    const target = activeCard.numericAnswer || 0;

    // Margen de tolerancia ampliado: si la carta no especifica o es 0, otorgar al menos un 25% o 3 unidades
    const margin = typeof activeCard.toleranceMargin === 'number' && activeCard.toleranceMargin > 0
      ? activeCard.toleranceMargin
      : Math.max(3, Math.round(target * 0.25));

    // Direct exact match
    const isExact = num === target;
    // Under or equal to target within margin
    const isUnderAndClose = num <= target && num >= (target - margin);
    // Over target within margin
    const isOverClose = num > target && num <= (target + margin);

    const isCorrect = isExact || isUnderAndClose || isOverClose;
    let earnedPoints = 0;
    let desc = `Estimación: ${num} ${activeCard.unit || ''}`;

    if (isExact) {
      earnedPoints = activeCard.points;
      desc += ' (¡Exacto!)';
    } else if (isUnderAndClose) {
      // Si está muy cerca pero por debajo o igual
      earnedPoints = activeCard.points;
      desc += ` (¡Acierto por aproximación válida! Margen amplio ±${margin})`;
    } else if (isOverClose) {
      earnedPoints = activeCard.points;
      desc += ` (¡Acierto por aproximación válida! Margen amplio ±${margin})`;
    } else if (num > target) {
      earnedPoints = 0;
      desc += ` (Se pasó del margen permitido: valor real ${target} ±${margin})`;
    } else {
      earnedPoints = 0;
      desc += ` (Quedó por debajo del margen permitido: valor real ${target} ±${margin})`;
    }

    handleRecordAnswer(isCorrect, earnedPoints, desc);
  };

  // Sequence Item Click
  const handleToggleSequenceLetter = (letter: string) => {
    if (!hasGameStarted || currentRecord) return;
    if (userSequenceOrder.includes(letter)) {
      setUserSequenceOrder((prev) => prev.filter((l) => l !== letter));
    } else {
      setUserSequenceOrder((prev) => [...prev, letter]);
    }
  };

  // Evaluate Sequence
  const handleEvaluateSequence = () => {
    if (!hasGameStarted || currentRecord || !activeCard.correctSequenceOrder) return;
    const isCorrect = JSON.stringify(userSequenceOrder) === JSON.stringify(activeCard.correctSequenceOrder);
    const orderStr = userSequenceOrder.join(' ➔ ');
    handleRecordAnswer(isCorrect, isCorrect ? activeCard.points : 0, `Secuencia: ${orderStr}`);
  };

  // Navigation
  const handleNext = () => {
    sound.playClick();
    setShowFeedbackModal(false);
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsGameOver(true);
      sound.playVictory();
    }
  };

  const handlePrev = () => {
    sound.playClick();
    setShowFeedbackModal(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Calculate Statistics
  const answeredList: AnswerRecord[] = Object.values(answersHistory);
  const totalAnswered = answeredList.length;
  const totalCorrect = answeredList.filter((a) => a.isCorrect).length;
  const totalIncorrect = totalAnswered - totalCorrect;
  const totalScoreEarned = answeredList.reduce((acc, a) => acc + a.pointsEarned, 0);
  const totalPossiblePoints = answeredList.reduce((acc, a) => acc + a.pointsPossible, 0);
  const accuracyPercentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const timeSpentSeconds = selectedDurationMinutes * 60 - timeRemaining;

  // Military Honor Rank badge
  const getRankBadge = (percentage: number) => {
    if (percentage >= 90) return { title: 'Gran Capitán de los Andes', desc: 'Conocimiento legendario digno de la Plana Mayor del Ejército Libertador.', color: 'bg-amber-400 text-stone-900 border-amber-600' };
    if (percentage >= 75) return { title: 'General de Brigada', desc: 'Excelente precisión táctica y dominio de la historia sanmartiniana.', color: 'bg-[#2a9d8f] text-white border-[#1d3557]' };
    if (percentage >= 50) return { title: 'Oficial de Granaderos', desc: 'Buen desempeño en la marcha y conocimiento del Cruce.', color: 'bg-[#1d3557] text-white border-white' };
    return { title: 'Cadete en Instrucción', desc: '¡Continúa repasando las crónicas y tácticas del Cruce!', color: 'bg-stone-600 text-white border-stone-800' };
  };

  const rank = getRankBadge(accuracyPercentage);

  return (
    <div className="space-y-2.5 text-[#2d2a26]">
      {/* TOP CONTROL BAR: TIME SELECTOR, TIMER & RUNNING SCORE */}
      <div className="bg-[#f3efe6] border-2 border-[#2d2a26] p-2 sm:p-2.5 shadow-bento flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        {/* Left: Mode Title & Fixed 3 Minutes Format */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="bg-[#d62828] text-white font-sans font-black text-xs uppercase tracking-wider px-2.5 py-1.5 border-2 border-[#2d2a26] flex items-center gap-1.5 shadow-bento-sm shrink-0">
            <Shuffle className="w-3.5 h-3.5 text-amber-300" />
            MODO MIXTO
          </span>

          {/* Formato único: 3 Minutos */}
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#1d3557] bg-white px-2.5 py-1.5 border-2 border-[#2d2a26] shadow-bento-sm">
            <Timer className="w-4 h-4 text-[#d62828]" />
            <span>Tiempo: 3 Min</span>
          </div>

          {!hasGameStarted ? (
            <span className="text-xs font-black uppercase text-amber-900 bg-amber-200/90 px-2.5 py-1.5 border-2 border-amber-600 shadow-bento-sm hidden sm:inline-flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current text-amber-800" />
              Toca PLAY para arrancar
            </span>
          ) : isTimerRunning ? (
            <span className="text-xs font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-1.5 border-2 border-emerald-600 shadow-bento-sm hidden sm:inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              En curso (3 min)
            </span>
          ) : (
            <span className="text-xs font-black uppercase text-amber-900 bg-amber-100 px-2.5 py-1.5 border-2 border-amber-600 shadow-bento-sm hidden sm:inline-flex items-center gap-1.5">
              <Pause className="w-3.5 h-3.5 text-amber-800" />
              Pausada
            </span>
          )}
        </div>

        {/* Center: Live Timer Box & Carteles de PLAY y REINICIAR */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          {/* Reloj Digital */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-[#2d2a26] shadow-bento-sm transition-all ${
              !hasGameStarted
                ? 'bg-amber-100 border-amber-700 text-[#2d2a26]'
                : isTimerRunning && timeRemaining < 60
                ? 'bg-red-500 text-white animate-pulse'
                : !isTimerRunning
                ? 'bg-amber-50 text-[#2d2a26]'
                : 'bg-white text-[#2d2a26]'
            }`}
          >
            <Clock
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                timeRemaining < 60 && hasGameStarted && isTimerRunning
                  ? 'text-white'
                  : 'text-[#d62828]'
              }`}
            />
            <span className="font-mono text-lg sm:text-xl md:text-2xl font-black tracking-tight">
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Cartel de PLAY (Único botón de play) */}
          <button
            onClick={handleTogglePlayPause}
            className={`px-4 sm:px-5 py-1.5 sm:py-2 border-2 border-[#2d2a26] text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shadow-bento transition-all active:translate-y-0.5 cursor-pointer ring-2 ring-emerald-300 ${
              !hasGameStarted
                ? 'bg-[#2a9d8f] hover:bg-[#21867a] text-white animate-bounce'
                : isTimerRunning
                ? 'bg-amber-400 hover:bg-amber-300 text-stone-900 ring-amber-300'
                : 'bg-[#2a9d8f] hover:bg-[#21867a] text-white animate-bounce'
            }`}
            title={
              !hasGameStarted
                ? 'Iniciar partida de 3 minutos'
                : isTimerRunning
                ? 'Pausar Tiempo'
                : 'Reanudar Tiempo'
            }
          >
            {!hasGameStarted ? (
              <>
                <Play className="w-4 h-4 fill-current text-amber-300" />
                <span>¡DARLE PLAY!</span>
              </>
            ) : isTimerRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>PAUSA</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-amber-300" />
                <span>REANUDAR PLAY</span>
              </>
            )}
          </button>

          {/* Cartel de REINICIAR (Con color y rebote como el de Play) */}
          <button
            onClick={handleResetGame}
            className="px-4 sm:px-5 py-1.5 sm:py-2 bg-[#d62828] hover:bg-[#b01f1f] text-white border-2 border-[#2d2a26] font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-bento transition-all active:translate-y-0.5 cursor-pointer animate-bounce ring-2 ring-rose-300"
            title="Reiniciar cronómetro a 3 minutos y volver al inicio"
          >
            <RotateCcw className="w-4 h-4 text-amber-300" />
            <span>REINICIAR</span>
          </button>
        </div>

        {/* Right: Live Running Score Counters */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="bg-white px-2.5 py-1 border border-[#2d2a26] shadow-bento-sm text-center">
            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block">Pts</span>
            <span className="text-xs sm:text-sm font-mono font-black text-[#1d3557]">{totalScoreEarned}</span>
          </div>

          <div className="bg-emerald-50 px-2.5 py-1 border border-[#2d2a26] shadow-bento-sm text-center">
            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Correctas</span>
            <span className="text-xs sm:text-sm font-mono font-black text-emerald-700 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {totalCorrect}
            </span>
          </div>

          <div className="bg-rose-50 px-2.5 py-1 border border-[#2d2a26] shadow-bento-sm text-center">
            <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider block">Errores</span>
            <span className="text-xs sm:text-sm font-mono font-black text-rose-700 flex items-center justify-center gap-1">
              <XCircle className="w-3 h-3" /> {totalIncorrect}
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setIsGameOver(true);
            }}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#1d3557] hover:bg-[#d62828] text-white text-xs font-black uppercase tracking-wider border border-[#2d2a26] shadow-bento-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ver resumen y balance general de la partida"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Final</span>
          </button>
        </div>
      </div>

      {/* VIEW SWITCH: FINAL SCORE REPORT SCREEN vs ACTIVE QUESTION */}
      {isGameOver ? (
        /* PANTALLA DE RESULTADOS Y PUNTAJE FINAL */
        <div className="bg-[#f3efe6] border-2 border-[#2d2a26] p-6 sm:p-8 shadow-bento space-y-8 animate-fade-in">
          {/* Header Banner */}
          <div className="text-center space-y-2 border-b-2 border-[#2d2a26] pb-6">
            <span className="bg-[#1d3557] text-white font-mono font-black text-xs uppercase tracking-widest px-4 py-1.5 border-2 border-[#2d2a26] inline-flex items-center gap-2 shadow-bento-sm">
              <Trophy className="w-4 h-4 text-amber-300" />
              INFORME FINAL DE CAMPAÑA • RESULTADOS
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-black uppercase text-[#2d2a26] tracking-tight">
              Puntaje y Rendimiento Final
            </h2>
            <p className="text-sm font-medium text-stone-600 max-w-xl mx-auto">
              Balance general de respuestas correctas, incorrectas y puntos tácticos acumulados durante la expedición.
            </p>
          </div>

          {/* Main Scorecards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Points */}
            <div className="bg-white p-5 border-2 border-[#2d2a26] shadow-bento text-center space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#1d3557] block">
                Puntaje Total
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-[#d62828]">
                {totalScoreEarned}
              </div>
              <span className="text-[11px] font-bold text-stone-500 block">
                de {totalPossiblePoints} pts en juego
              </span>
            </div>

            {/* Correct Answers */}
            <div className="bg-emerald-50 p-5 border-2 border-[#2d2a26] shadow-bento text-center space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Correctas
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-emerald-700">
                {totalCorrect}
              </div>
              <span className="text-[11px] font-bold text-emerald-900 block">
                {accuracyPercentage}% de efectividad
              </span>
            </div>

            {/* Incorrect Answers */}
            <div className="bg-rose-50 p-5 border-2 border-[#2d2a26] shadow-bento text-center space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-rose-800 block flex items-center justify-center gap-1">
                <XCircle className="w-4 h-4" /> Incorrectas
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-rose-700">
                {totalIncorrect}
              </div>
              <span className="text-[11px] font-bold text-rose-900 block">
                de {totalAnswered} respondidas
              </span>
            </div>

            {/* Time Record */}
            <div className="bg-white p-5 border-2 border-[#2d2a26] shadow-bento text-center space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#1d3557] block flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" /> Tiempo Empleado
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-[#1d3557]">
                {formatTime(timeSpentSeconds)}
              </div>
              <span className="text-[11px] font-bold text-stone-500 block">
                Límite: {selectedDurationMinutes} min
              </span>
            </div>
          </div>

          {/* Military Rank Honor Banner */}
          <div className="bg-white border-2 border-[#2d2a26] p-6 shadow-bento flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 shadow-bento-sm ${rank.color}`}>
                <Medal className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d62828] block">
                  Rango de Honor Militar
                </span>
                <h3 className="text-2xl font-serif font-black uppercase text-[#2d2a26]">
                  {rank.title}
                </h3>
                <p className="text-xs font-medium text-stone-600 mt-0.5">
                  {rank.desc}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleStartGame()}
                className="px-6 py-3.5 bg-[#d62828] hover:bg-[#1d3557] text-white font-black text-sm uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento flex items-center gap-2 transition-all active:translate-y-0.5"
                title="Comenzar nueva partida de 3 minutos"
              >
                <Play className="w-4 h-4 fill-current text-amber-300" />
                Jugar de Nuevo (3 Minutos)
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setIsGameOver(false);
                }}
                className="px-4 py-3.5 bg-white hover:bg-[#e8e4d8] text-[#2d2a26] font-black text-xs uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento-sm"
              >
                Revisar Preguntas
              </button>
            </div>
          </div>

          {/* Detailed Question by Question Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#2d2a26] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#1d3557]" />
                <h3 className="text-xl font-serif font-black uppercase text-[#2d2a26]">
                  Desglose Detallado de Preguntas Respondidas ({answeredList.length})
                </h3>
              </div>
              <span className="text-xs font-bold text-stone-600 uppercase">
                {totalCorrect} correctas • {totalIncorrect} incorrectas
              </span>
            </div>

            {answeredList.length === 0 ? (
              <div className="bg-white p-6 border-2 border-[#2d2a26] text-center text-stone-500 font-bold text-sm">
                No se registraron respuestas durante esta sesión. ¡Inicia una nueva partida con el botón superior!
              </div>
            ) : (
              <div className="space-y-3">
                {answeredList.map((item, idx) => (
                  <div
                    key={item.cardId}
                    className={`p-5 border-2 border-[#2d2a26] shadow-bento-sm space-y-3 transition-all ${
                      item.isCorrect ? 'bg-white' : 'bg-rose-50/50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2d2a26]/20 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 font-mono font-black text-xs flex items-center justify-center border-2 border-[#2d2a26] text-white ${
                            item.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="font-serif font-black text-lg uppercase text-[#2d2a26]">
                          {item.cardTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#e8e4d8] border border-[#2d2a26]">
                          {item.categoryName}
                        </span>
                        <span
                          className={`text-xs font-black uppercase px-2.5 py-0.5 border-2 border-[#2d2a26] ${
                            item.isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.isCorrect ? `+${item.pointsEarned} Pts (Correcto)` : '0 Pts (Incorrecto)'}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-[#2d2a26] leading-relaxed">
                      "{item.question}"
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {item.userSelection && (
                        <div className="p-2.5 bg-white border border-[#2d2a26] flex items-center gap-2">
                          <span className="font-bold text-stone-500">Tu Elección:</span>
                          <span className="font-bold text-[#2d2a26]">{item.userSelection}</span>
                        </div>
                      )}

                      <div className="p-2.5 bg-[#1d3557] text-white border border-[#2d2a26] flex items-center gap-2">
                        <span className="font-bold text-amber-300">Respuesta Oficial:</span>
                        <span className="font-black text-white">{item.officialAnswer}</span>
                      </div>
                    </div>

                    {item.explanation && (
                      <p className="text-xs text-stone-700 italic font-serif leading-relaxed border-t border-stone-200 pt-2">
                        {item.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PRESENTACIÓN DE PREGUNTA ACTIVA - ESPACIO Y TIPOGRAFÍA OPTIMIZADA PANTALLA COMPLETA */
        <div className="space-y-2.5 sm:space-y-3">
          {/* NOTICE BEFORE STARTING GAME: FORMAT 3 MIN & PLAY PROMPT (Sin botón duplicado para no marear) */}
          {!hasGameStarted && (
            <div className="bg-[#fefae0] border-2 border-[#2d2a26] p-2.5 sm:p-3 shadow-bento flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400 border-2 border-[#2d2a26] flex items-center justify-center shrink-0 shadow-bento-sm">
                  <Timer className="w-5 h-5 text-[#2d2a26]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#d62828] text-white px-2 py-0.5 border border-[#2d2a26] inline-block mb-0.5 shadow-bento-sm">
                    Partida de 3 Minutos
                  </span>
                  <div className="text-xs sm:text-sm font-serif font-black uppercase text-[#2d2a26]">
                    Presiona el botón de PLAY arriba para iniciar el cronómetro.
                  </div>
                  <span className="text-stone-700 text-xs font-semibold">
                    Tienes 3 minutos para responder la mayor cantidad de cartas didácticas posibles.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white px-3 py-1.5 border-2 border-[#2d2a26] shadow-bento-sm text-[#1d3557] shrink-0 self-start sm:self-center">
                <span className="text-emerald-700 font-black">⬆️ Toca ¡DARLE PLAY! arriba</span>
              </div>
            </div>
          )}

          {/* Card Progress & Nav Bar */}
          <div className="bg-white border-2 border-[#2d2a26] px-3.5 py-1.5 sm:py-2 shadow-bento flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#1d3557] text-white font-mono font-black text-xs px-2.5 py-0.5 border border-[#2d2a26] shadow-bento-sm">
                #{currentIndex + 1}/{deck.length}
              </span>
              <span className="text-xs sm:text-sm font-black text-[#2d2a26] uppercase tracking-wider">
                {activeCard.categoryName}
              </span>
              {currentRecord && (
                <span
                  className={`text-xs font-black uppercase px-2 py-0.5 border border-[#2d2a26] flex items-center gap-1 shadow-bento-sm ${
                    currentRecord.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {currentRecord.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {currentRecord.isCorrect ? 'Correcta' : 'Incorrecta'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3 py-1 bg-[#f3efe6] hover:bg-[#2d2a26] hover:text-white disabled:opacity-40 border border-[#2d2a26] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Volver a la pregunta anterior"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            </div>
          </div>

          {/* Card Content Display Container */}
          <div className="bg-white border-2 border-[#2d2a26] p-3 sm:p-4 md:p-5 shadow-bento space-y-2.5 sm:space-y-3.5">
            {/* Top Card Badge Header */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#2d2a26]/20 pb-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="uppercase font-mono font-bold text-xs tracking-wider bg-[#e8e4d8] px-2.5 py-0.5 border border-[#2d2a26] flex items-center gap-1 shadow-bento-sm">
                  {currentCategory === 'aproximacion' && <Dices className="w-3.5 h-3.5 text-[#1d3557]" />}
                  {currentCategory === 'secuencia' && <Clock className="w-3.5 h-3.5 text-[#1d3557]" />}
                  {currentCategory === 'verdaderofalso' && <CheckSquare className="w-3.5 h-3.5 text-[#2a9d8f]" />}
                  {currentCategory === 'multiplechoice' && <HelpCircle className="w-3.5 h-3.5 text-[#9c6644]" />}
                  Nº {activeCard.numberId} • {currentCategory.toUpperCase()}
                </span>
                <span className="bg-[#1d3557] text-white text-xs font-bold px-2.5 py-0.5 uppercase border border-[#2d2a26] shadow-bento-sm">
                  Dificultad: {activeCard.difficulty} ({activeCard.points} Pts)
                </span>
              </div>

              {activeCard.characteristics?.yearOrEpoch && currentCategory !== 'secuencia' && (
                <span className="text-xs font-mono font-bold text-[#1d3557] bg-[#f3efe6] px-2.5 py-0.5 border border-[#2d2a26] shadow-bento-sm">
                  Época: {activeCard.characteristics.yearOrEpoch}
                </span>
              )}
            </div>

            {/* Question Title & Image Banner */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
              <div className="md:col-span-4 relative h-20 sm:h-24 md:h-28 lg:h-32 border-2 border-[#2d2a26] overflow-hidden bg-[#2d2a26] shadow-bento-sm">
                <img
                  src={activeCard.imageUrl}
                  alt={activeCard.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d2a26]/90 via-[#2d2a26]/30 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2 font-serif font-black text-xs sm:text-sm md:text-base text-white uppercase tracking-tight drop-shadow-md leading-tight line-clamp-2">
                  {activeCard.title}
                </div>
              </div>

              <div className="md:col-span-8 flex flex-col justify-between gap-2">
                <div className="bg-[#f3efe6] p-2.5 sm:p-3.5 border-2 border-[#2d2a26] shadow-bento-sm flex-1 flex flex-col justify-center">
                  <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#1d3557] block mb-1">
                    {currentCategory === 'verdaderofalso'
                      ? 'Afirmación Histórica (Evaluar si es Verdadera o Falsa):'
                      : 'Pregunta / Consigna:'}
                  </span>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl font-serif font-black text-[#2d2a26] leading-snug tracking-tight">
                    {currentCategory === 'verdaderofalso'
                      ? activeCard.question.replace(/[¿?]/g, '').trim()
                      : `"${activeCard.question}"`}
                  </p>
                </div>

                {activeCard.unit && (
                  <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 border border-[#2d2a26] text-xs font-bold text-[#1d3557] shadow-bento-sm self-start">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Unidad de medida:</span>
                    <span className="font-mono text-xs sm:text-sm font-black uppercase text-[#d62828]">
                      {activeCard.unit}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* INTERACTIVE CATEGORY INPUT SECTION */}
            <div className="pt-1.5">
              {/* 1. MULTIPLE CHOICE */}
              {currentCategory === 'multiplechoice' && options.length > 0 && (
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center gap-1.5 border-b border-[#2d2a26]/20 pb-1.5">
                    <HelpCircle className="w-4 h-4 text-[#9c6644]" />
                    <h3 className="font-serif font-black text-xs sm:text-sm uppercase text-[#2d2a26]">
                      Selecciona una opción de respuesta:
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isChosen = selectedOption === idx;
                      const isCorrect = idx === activeCard.correctOptionIndex;
                      const showResult = Boolean(currentRecord || showOfficialAnswer);

                      let btnStyle = 'bg-[#fdfaf5] hover:bg-white text-[#2d2a26]';
                      if (showResult) {
                        if (isCorrect) btnStyle = 'bg-emerald-100 border-emerald-600 text-emerald-950 font-black';
                        else if (isChosen) btnStyle = 'bg-rose-100 border-rose-600 text-rose-950';
                      }

                      return (
                        <button
                          key={idx}
                          disabled={!hasGameStarted || Boolean(currentRecord)}
                          onClick={() => handleSelectMultipleChoiceOption(idx)}
                          className={`p-2.5 sm:p-3 border-2 border-[#2d2a26] shadow-bento-sm flex items-center gap-2.5 text-left transition-all ${btnStyle} cursor-pointer disabled:cursor-not-allowed`}
                        >
                          <span
                            className={`w-7 h-7 sm:w-8 sm:h-8 font-mono font-black text-xs sm:text-sm flex items-center justify-center border-2 border-[#2d2a26] shrink-0 ${
                              showResult && isCorrect
                                ? 'bg-emerald-600 text-white'
                                : showResult && isChosen
                                ? 'bg-rose-600 text-white'
                                : 'bg-[#9c6644] text-white'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="font-bold text-xs sm:text-sm md:text-base leading-snug flex-1">{opt}</span>
                          {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />}
                          {showResult && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-rose-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {currentRecord && (
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f3efe6] p-2 sm:p-2.5 border-2 border-[#2d2a26] shadow-bento-sm">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase">
                        {currentRecord.isCorrect ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> Comprobación: ¡Opción Correcta! (+{currentRecord.pointsEarned} pts)
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center gap-1">
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Comprobación: Opción Incorrecta
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setShowFeedbackModal(true)}
                          className="px-3 py-1.5 bg-amber-300 hover:bg-amber-400 text-[#2d2a26] font-black text-xs uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento-sm flex items-center gap-1 cursor-pointer"
                          title="Abrir cartel grande en pantalla"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#d62828]" />
                          <span>Ver Cartel Grande</span>
                        </button>

                        <button
                          onClick={handleNext}
                          className="px-5 sm:px-6 py-1.5 sm:py-2 bg-[#d62828] hover:bg-[#b71c1c] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento flex items-center justify-center gap-1.5 transition-all animate-bounce cursor-pointer"
                          title="Avanzar a la siguiente pregunta"
                        >
                          <span>{currentIndex === deck.length - 1 ? 'Finalizar Partida 🏆' : 'Siguiente Pregunta ➔'}</span>
                          {currentIndex === deck.length - 1 ? <Trophy className="w-3.5 h-3.5 text-amber-300" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. VERDADERO O FALSO */}
              {currentCategory === 'verdaderofalso' && (
                <div className="space-y-2 sm:space-y-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 border-b border-[#2d2a26]/20 pb-1.5">
                    <CheckSquare className="w-4 h-4 text-[#2a9d8f]" />
                    <h3 className="font-serif font-black text-xs sm:text-sm uppercase text-[#2d2a26]">
                      Indicar si la afirmación es VERDADERA o FALSA:
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-lg md:max-w-xl mx-auto my-1">
                    <button
                      disabled={!hasGameStarted || Boolean(currentRecord)}
                      onClick={() => handleSelectTF(true)}
                      className={`p-3 sm:p-4 border-2 border-[#2d2a26] font-serif font-black text-base sm:text-xl md:text-2xl uppercase tracking-wider shadow-bento flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        currentRecord || showOfficialAnswer
                          ? activeCard.isTrue
                            ? 'bg-emerald-500 text-white'
                            : selectedTF === true
                            ? 'bg-rose-500 text-white'
                            : 'bg-white text-[#2d2a26] opacity-60'
                          : !hasGameStarted
                          ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                          : 'bg-[#2a9d8f] hover:bg-[#264653] text-white active:translate-y-0.5'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Verdadero</span>
                    </button>

                    <button
                      disabled={!hasGameStarted || Boolean(currentRecord)}
                      onClick={() => handleSelectTF(false)}
                      className={`p-3 sm:p-4 border-2 border-[#2d2a26] font-serif font-black text-base sm:text-xl md:text-2xl uppercase tracking-wider shadow-bento flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        currentRecord || showOfficialAnswer
                          ? !activeCard.isTrue
                            ? 'bg-emerald-500 text-white'
                            : selectedTF === false
                            ? 'bg-rose-500 text-white'
                            : 'bg-white text-[#2d2a26] opacity-60'
                          : !hasGameStarted
                          ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                          : 'bg-[#d62828] hover:bg-[#a51d1d] text-white active:translate-y-0.5'
                      }`}
                    >
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Falso</span>
                    </button>
                  </div>

                  {currentRecord && (
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f3efe6] p-2 sm:p-2.5 border-2 border-[#2d2a26] shadow-bento-sm">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase">
                        {currentRecord.isCorrect ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> Comprobación: ¡Respuesta Correcta! (+{currentRecord.pointsEarned} pts)
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center gap-1">
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Comprobación: Respuesta Incorrecta
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setShowFeedbackModal(true)}
                          className="px-3 py-1.5 bg-amber-300 hover:bg-amber-400 text-[#2d2a26] font-black text-xs uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento-sm flex items-center gap-1 cursor-pointer"
                          title="Abrir cartel grande en pantalla"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#d62828]" />
                          <span>Ver Cartel Grande</span>
                        </button>

                        <button
                          onClick={handleNext}
                          className="px-5 sm:px-6 py-1.5 sm:py-2 bg-[#d62828] hover:bg-[#b71c1c] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento flex items-center justify-center gap-1.5 transition-all animate-bounce cursor-pointer"
                          title="Avanzar a la siguiente pregunta"
                        >
                          <span>{currentIndex === deck.length - 1 ? 'Finalizar Partida 🏆' : 'Siguiente Pregunta ➔'}</span>
                          {currentIndex === deck.length - 1 ? <Trophy className="w-3.5 h-3.5 text-amber-300" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. APROXIMACIÓN NUMÉRICA (REGLA MENOR O IGUAL MÁS CERCANA) */}
              {currentCategory === 'aproximacion' && (
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#2d2a26]/20 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Dices className="w-4 h-4 text-[#1d3557]" />
                      <h3 className="font-serif font-black text-xs sm:text-sm uppercase text-[#2d2a26]">
                        Estimación Numérica ({activeCard.unit || 'unidades'})
                      </h3>
                    </div>

                    <div className="bg-amber-100 border border-amber-600 px-2.5 py-0.5 text-xs font-bold text-amber-900 flex items-center gap-1 shadow-bento-sm">
                      <Info className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                      <span>
                        Margen de tolerancia ampliado: ±{activeCard.toleranceMargin || Math.max(3, Math.round((activeCard.numericAnswer || 0) * 0.25))}
                      </span>
                    </div>
                  </div>

                  {/* Single Player Numeric Input Box */}
                  <div className="bg-[#fdfaf5] p-2.5 sm:p-3 border-2 border-[#2d2a26] shadow-bento-sm flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <input
                        type="number"
                        disabled={!hasGameStarted || Boolean(currentRecord)}
                        placeholder={!hasGameStarted ? 'Presiona Play para comenzar...' : `Ingresa valor en ${activeCard.unit || 'número'}...`}
                        value={userNumericInput}
                        onChange={(e) => setUserNumericInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEvaluateNumeric();
                        }}
                        className="w-full bg-white border-2 border-[#2d2a26] px-3 py-2 text-base sm:text-xl font-mono font-bold text-[#2d2a26] focus:outline-none shadow-bento-sm disabled:bg-stone-100"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        disabled={!hasGameStarted || Boolean(currentRecord) || !userNumericInput}
                        onClick={handleEvaluateNumeric}
                        className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 bg-[#1d3557] hover:bg-[#2a9d8f] disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento transition-all cursor-pointer"
                      >
                        Comprobar Estimación
                      </button>

                      {currentRecord && (
                        <>
                          <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="w-full sm:w-auto px-3.5 py-2 bg-amber-300 hover:bg-amber-400 text-[#2d2a26] font-black text-xs uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento-sm flex items-center justify-center gap-1 cursor-pointer"
                            title="Abrir cartel grande en pantalla"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#d62828]" />
                            <span>Ver Cartel Grande</span>
                          </button>

                          <button
                            onClick={handleNext}
                            className="w-full sm:w-auto px-5 sm:px-6 py-2 bg-[#d62828] hover:bg-[#b71c1c] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento flex items-center justify-center gap-1.5 transition-all animate-bounce cursor-pointer"
                            title="Avanzar a la siguiente pregunta"
                          >
                            <span>{currentIndex === deck.length - 1 ? 'Finalizar Partida 🏆' : 'Siguiente Pregunta ➔'}</span>
                            {currentIndex === deck.length - 1 ? <Trophy className="w-3.5 h-3.5 text-amber-300" /> : <ArrowRight className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. SECUENCIAS CRONOLÓGICAS */}
              {currentCategory === 'secuencia' && sequenceItems.length > 0 && (
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#2d2a26]/20 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#1d3557]" />
                      <h3 className="font-serif font-black text-xs sm:text-sm uppercase text-[#2d2a26]">
                        Ordena los hitos (de más antiguo a más reciente):
                      </h3>
                    </div>

                    {userSequenceOrder.length > 0 && !currentRecord && (
                      <button
                        onClick={() => setUserSequenceOrder([])}
                        className="text-xs font-bold text-[#d62828] hover:underline uppercase cursor-pointer"
                      >
                        Limpiar Orden
                      </button>
                    )}
                  </div>

                  {/* Available Sequence Cards to Click in Order */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {sequenceItems.map((item) => {
                      const orderPosition = userSequenceOrder.indexOf(item.letter);
                      const isSelected = orderPosition !== -1;

                      return (
                        <button
                          key={item.id}
                          disabled={!hasGameStarted || Boolean(currentRecord)}
                          onClick={() => handleToggleSequenceLetter(item.letter)}
                          className={`p-2.5 sm:p-3 border-2 border-[#2d2a26] shadow-bento-sm flex items-start gap-2.5 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-100 border-amber-600'
                              : 'bg-[#fdfaf5] hover:bg-white text-[#2d2a26]'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5 shrink-0">
                            <span className="w-6 h-6 sm:w-7 sm:h-7 bg-[#1d3557] text-white font-mono font-black text-xs sm:text-sm flex items-center justify-center border border-[#2d2a26]">
                              {item.letter}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-black bg-[#d62828] text-white px-1 py-0.2 rounded-full">
                                {orderPosition + 1}º
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs sm:text-sm text-[#2d2a26] leading-snug">{item.text}</p>
                            {item.detail && (
                              <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5">{item.detail}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Sequence Preview & Submit */}
                  <div className="bg-[#f3efe6] p-2.5 sm:p-3 border-2 border-[#2d2a26] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        Secuencia:
                      </span>
                      <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm text-[#1d3557]">
                        {userSequenceOrder.length === 0 ? (
                          <span className="text-xs font-normal italic text-stone-500">
                            (Clic en orden)
                          </span>
                        ) : (
                          userSequenceOrder.map((l, i) => (
                            <React.Fragment key={l}>
                              <span className="bg-white px-1.5 py-0.5 border border-[#2d2a26]">{l}</span>
                              {i < userSequenceOrder.length - 1 && <span>➔</span>}
                            </React.Fragment>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        disabled={!hasGameStarted || Boolean(currentRecord) || userSequenceOrder.length !== sequenceItems.length}
                        onClick={handleEvaluateSequence}
                        className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-[#1d3557] hover:bg-[#2a9d8f] disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento cursor-pointer"
                      >
                        Comprobar Secuencia
                      </button>

                      {currentRecord && (
                        <>
                          <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="w-full sm:w-auto px-3.5 py-2 bg-amber-300 hover:bg-amber-400 text-[#2d2a26] font-black text-xs uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento-sm flex items-center justify-center gap-1 cursor-pointer"
                            title="Abrir cartel grande en pantalla"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#d62828]" />
                            <span>Ver Cartel Grande</span>
                          </button>

                          <button
                            onClick={handleNext}
                            className="w-full sm:w-auto px-5 sm:px-6 py-2 bg-[#d62828] hover:bg-[#b71c1c] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento flex items-center justify-center gap-1.5 transition-all animate-bounce cursor-pointer"
                            title="Avanzar a la siguiente pregunta"
                          >
                            <span>{currentIndex === deck.length - 1 ? 'Finalizar Partida 🏆' : 'Siguiente Pregunta ➔'}</span>
                            {currentIndex === deck.length - 1 ? <Trophy className="w-3.5 h-3.5 text-amber-300" /> : <ArrowRight className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* EVALUATION & REVEAL CONTROLS */}
            <div className="pt-2 border-t border-[#2d2a26]/20 space-y-2">
              <div className="bg-[#f3efe6] p-2 sm:p-2.5 border-2 border-[#2d2a26] shadow-bento-sm flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#1d3557]">
                    Evaluación Manual:
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!hasGameStarted || Boolean(currentRecord)}
                    onClick={() => handleRecordAnswer(true, activeCard.points)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-[11px] uppercase tracking-wider border border-[#2d2a26] shadow-bento-sm flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correcta (+{activeCard.points} pts)
                  </button>

                  <button
                    disabled={!hasGameStarted || Boolean(currentRecord)}
                    onClick={() => handleRecordAnswer(false, 0)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-extrabold text-[11px] uppercase tracking-wider border border-[#2d2a26] shadow-bento-sm flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Incorrecta (0 pts)
                  </button>
                </div>
              </div>

              {/* Reveal Official Answer & Explanation - ONLY accessible after answering and verifying */}
              <div className="flex items-center justify-between gap-2">
                {currentRecord ? (
                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowOfficialAnswer(!showOfficialAnswer);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-[#f3efe6] border-2 border-[#2d2a26] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-bento-sm cursor-pointer"
                  >
                    {showOfficialAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#1d3557]" />}
                    <span>{showOfficialAnswer ? 'Ocultar Explicación' : 'Ver Explicación'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 bg-[#f3efe6] px-2.5 py-1.5 border border-dashed border-[#2d2a26]/40">
                    <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                    <span>Responde y comprueba para ver detalles oficiales.</span>
                  </div>
                )}

                {currentRecord && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#1d3557] uppercase tracking-wide">
                      Registrado: {currentRecord.pointsEarned} Pts
                    </span>
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="px-2.5 py-1 bg-amber-300 hover:bg-amber-400 text-[#2d2a26] font-black text-xs uppercase tracking-wider border border-[#2d2a26] shadow-bento-sm flex items-center gap-1 cursor-pointer"
                      title="Abrir cartel grande con resultado"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#d62828]" />
                      <span>Ver Cartel</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Official Answer & Historical Explanation Box */}
              {Boolean(currentRecord && showOfficialAnswer) && (
                <div className="bg-[#1d3557] text-white p-4 sm:p-6 border-2 border-[#2d2a26] shadow-bento space-y-2.5 animate-fade-in text-sm sm:text-base">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                    <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      RESPUESTA Y EXPLICACIÓN HISTÓRICA OFICIAL
                    </span>
                    <span className="text-sm sm:text-base font-mono font-black text-amber-300">
                      {activeCard.points} PUNTOS
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-base sm:text-xl font-serif font-black text-white">
                      Respuesta:{' '}
                      <span className="text-amber-300 underline underline-offset-4">
                        {activeCard.answer}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base md:text-lg text-stone-200 leading-relaxed font-sans">
                      {activeCard.explanation}
                    </p>

                    {activeCard.historicalContext && (
                      <div className="bg-[#264653] p-2.5 sm:p-3 border border-white/20 text-xs sm:text-sm md:text-base text-stone-200 italic font-serif mt-2">
                        <strong>Contexto:</strong> {activeCard.historicalContext}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CARTEL GRANDE SOBRE LA PANTALLA: RESULTADO DE LA COMPROBACIÓN */}
      {showFeedbackModal && currentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div
            className={`relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl border-4 border-[#2d2a26] p-6 sm:p-8 md:p-10 shadow-2xl transition-all my-auto ${
              currentRecord.isCorrect
                ? 'bg-gradient-to-b from-[#ecfdf5] to-[#ffffff]'
                : 'bg-gradient-to-b from-[#fef2f2] to-[#ffffff]'
            }`}
          >
            {/* Botón Cerrar (X) para poder inspeccionar la tarjeta si el usuario lo desea */}
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 p-2 bg-white hover:bg-stone-200 border-2 border-[#2d2a26] text-[#2d2a26] shadow-bento-sm transition-transform active:scale-95 cursor-pointer"
              title="Cerrar cartel para ver la tarjeta"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Cabecera del Cartel Grande con Icono e Indicador Principal */}
            <div className="text-center space-y-5">
              {currentRecord.isCorrect ? (
                <>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-emerald-500 border-4 border-[#2d2a26] flex items-center justify-center shadow-bento animate-bounce">
                    <CheckCircle2 className="w-14 h-14 sm:w-18 sm:h-18 text-white stroke-[2.5]" />
                  </div>

                  <div className="space-y-1">
                    <span className="inline-block px-4 py-1.5 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 font-black text-xs sm:text-sm uppercase tracking-widest mb-1 shadow-bento-sm">
                      ¡Comprobación Exitosa!
                    </span>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black uppercase text-emerald-800 tracking-tight">
                      ¡CORRECTA!
                    </h2>
                  </div>

                  <div className="inline-flex items-center gap-3 bg-emerald-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-[#2d2a26] shadow-bento font-mono font-black text-xl sm:text-2xl md:text-3xl">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
                    <span>+{currentRecord.pointsEarned} PUNTOS OBTENIDOS</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-[#d62828] border-4 border-[#2d2a26] flex items-center justify-center shadow-bento animate-pulse">
                    <XCircle className="w-14 h-14 sm:w-18 sm:h-18 text-white stroke-[2.5]" />
                  </div>

                  <div className="space-y-1">
                    <span className="inline-block px-4 py-1.5 bg-rose-100 border-2 border-rose-700 text-rose-900 font-black text-xs sm:text-sm uppercase tracking-widest mb-1 shadow-bento-sm">
                      Respuesta no acertada
                    </span>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black uppercase text-[#d62828] tracking-tight">
                      ¡INCORRECTA!
                    </h2>
                  </div>

                  <div className="inline-flex items-center gap-3 bg-stone-800 text-white px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-[#2d2a26] shadow-bento font-mono font-black text-lg sm:text-xl md:text-2xl">
                    <span>0 PUNTOS OBTENIDOS</span>
                  </div>
                </>
              )}

              {/* Detalle del Hito Histórico y Respuestas */}
              <div className="bg-white border-2 border-[#2d2a26] p-4 sm:p-6 text-left space-y-3.5 shadow-bento">
                <div className="flex items-center justify-between border-b border-[#2d2a26]/20 pb-2">
                  <span className="text-xs sm:text-sm font-black uppercase text-[#1d3557] tracking-wider">
                    {currentRecord.cardTitle}
                  </span>
                  <span className="text-xs font-bold uppercase text-stone-500">
                    {currentRecord.categoryName}
                  </span>
                </div>

                <p className="text-base sm:text-xl md:text-2xl font-serif font-bold text-[#2d2a26] leading-snug">
                  {currentRecord.category === 'verdaderofalso'
                    ? currentRecord.question.replace(/[¿?]/g, '').trim()
                    : `"${currentRecord.question}"`}
                </p>

                <div className="bg-[#f3efe6] p-3.5 sm:p-4 border-2 border-[#2d2a26] text-sm sm:text-base space-y-1.5">
                  <div className="text-stone-700 font-bold">
                    <span className="text-[#1d3557] font-black">Tu respuesta:</span> {currentRecord.userSelection}
                  </div>
                  <div className="text-stone-900 font-bold">
                    <span className="text-[#d62828] font-black">Respuesta oficial:</span> {currentRecord.officialAnswer}
                  </div>
                </div>

                {currentRecord.explanation && (
                  <p className="text-sm sm:text-base text-stone-700 italic font-serif leading-relaxed border-t border-stone-200 pt-3">
                    {currentRecord.explanation}
                  </p>
                )}
              </div>

              {/* Botón Principal para Avanzar o Cerrar */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleNext}
                  className="w-full py-4 sm:py-5 px-8 sm:px-10 bg-[#d62828] hover:bg-[#b71c1c] text-white font-black text-base sm:text-xl md:text-2xl uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento flex items-center justify-center gap-3 transition-all active:translate-y-0.5 animate-bounce cursor-pointer"
                  title="Avanzar a la siguiente pregunta"
                >
                  <span>{currentIndex === deck.length - 1 ? 'Finalizar Partida 🏆' : 'Siguiente Pregunta ➔'}</span>
                  {currentIndex === deck.length - 1 ? <Trophy className="w-6 h-6 text-amber-300" /> : <ArrowRight className="w-6 h-6" />}
                </button>

                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 underline uppercase tracking-wider cursor-pointer"
                >
                  Revisar detalles en la tarjeta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
