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
  Award
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

  // Timer Configuration & State (Options: 3 min, 5 min, 7 min)
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(3);
  const [timeRemaining, setTimeRemaining] = useState<number>(3 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Answering & Evaluation State
  const [answersHistory, setAnswersHistory] = useState<Record<string, AnswerRecord>>({});
  const [showOfficialAnswer, setShowOfficialAnswer] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

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

  // Select format duration (3, 5, or 7 minutes) - does NOT start countdown if not yet playing
  const handleSelectDuration = (durationMins: number) => {
    sound.playClick();
    setSelectedDurationMinutes(durationMins);
    setTimeRemaining(durationMins * 60);
    if (hasGameStarted) {
      // If already playing and user clicks a duration, restart with that format
      handleStartGame(durationMins);
    } else {
      // If not yet started, keep timer waiting until user presses Play
      setIsTimerRunning(false);
    }
  };

  // Start Game explicitly on Play button
  const handleStartGame = (durationMins: number = selectedDurationMinutes) => {
    sound.playClick();
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setAnswersHistory({});
    setShowOfficialAnswer(false);
    setIsGameOver(false);
    setSelectedDurationMinutes(durationMins);
    setTimeRemaining(durationMins * 60);
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
      handleStartGame(selectedDurationMinutes);
    } else {
      setIsTimerRunning((prev) => !prev);
    }
  };

  // Reset Game back to setup / waiting state
  const handleResetGame = () => {
    sound.playClick();
    setHasGameStarted(false);
    setIsTimerRunning(false);
    setTimeRemaining(selectedDurationMinutes * 60);
    setCurrentIndex(0);
    setAnswersHistory({});
    setShowOfficialAnswer(false);
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

    // Margen de tolerancia: si la carta no especifica o es 0, otorgar al menos un 15% o 1 unidad
    const margin = typeof activeCard.toleranceMargin === 'number' && activeCard.toleranceMargin > 0
      ? activeCard.toleranceMargin
      : Math.max(1, Math.round(target * 0.15));

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
      desc += ` (¡Acierto por aproximación válida! Margen ±${margin})`;
    } else if (isOverClose) {
      earnedPoints = activeCard.points;
      desc += ` (¡Acierto por aproximación válida! Margen ±${margin})`;
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
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsGameOver(true);
      sound.playVictory();
    }
  };

  const handlePrev = () => {
    sound.playClick();
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
    <div className="space-y-6 text-[#2d2a26]">
      {/* TOP CONTROL BAR: TIME SELECTOR, TIMER & RUNNING SCORE */}
      <div className="bg-[#f3efe6] border-2 border-[#2d2a26] p-4 shadow-bento flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Mode Title & Duration Selector with Clear Indication */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#d62828] text-white font-sans font-black text-xs uppercase tracking-widest px-3 py-1.5 border-2 border-[#2d2a26] flex items-center gap-1.5 shadow-bento-sm">
              <Shuffle className="w-4 h-4 text-amber-300" />
              MODO MIXTO
            </span>

            {/* Clear indication that the player can choose the minutes */}
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#1d3557] bg-white px-3 py-1 border-2 border-[#2d2a26] shadow-bento-sm">
              <Timer className="w-4 h-4 text-[#d62828]" />
              <span>Elegí la cantidad de minutos para jugar:</span>
            </div>
          </div>

          {/* Time Selector: 3 Min first, 5 Min second, 7 Min third. NO MODO LIBRE! */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white p-1 border-2 border-[#2d2a26] shadow-bento-sm text-xs font-bold">
              {/* 3 Min (Primero) */}
              <button
                onClick={() => handleSelectDuration(3)}
                className={`px-3 py-1.5 uppercase text-xs font-black transition-all flex items-center gap-1 ${
                  selectedDurationMinutes === 3
                    ? 'bg-[#1d3557] text-white shadow-sm'
                    : 'text-[#2d2a26] hover:bg-[#f3efe6]'
                }`}
                title="Elegir partida de 3 minutos"
              >
                <span>3 Min</span>
                {selectedDurationMinutes === 3 && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
              </button>

              {/* 5 Min (Segundo) */}
              <button
                onClick={() => handleSelectDuration(5)}
                className={`px-3 py-1.5 uppercase text-xs font-black transition-all flex items-center gap-1 ${
                  selectedDurationMinutes === 5
                    ? 'bg-[#1d3557] text-white shadow-sm'
                    : 'text-[#2d2a26] hover:bg-[#f3efe6]'
                }`}
                title="Elegir partida de 5 minutos"
              >
                <span>5 Min</span>
                {selectedDurationMinutes === 5 && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
              </button>

              {/* 7 Min (Por último) */}
              <button
                onClick={() => handleSelectDuration(7)}
                className={`px-3 py-1.5 uppercase text-xs font-black transition-all flex items-center gap-1 ${
                  selectedDurationMinutes === 7
                    ? 'bg-[#1d3557] text-white shadow-sm'
                    : 'text-[#2d2a26] hover:bg-[#f3efe6]'
                }`}
                title="Elegir partida de 7 minutos"
              >
                <span>7 Min</span>
                {selectedDurationMinutes === 7 && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
              </button>
            </div>

            {!hasGameStarted ? (
              <span className="text-[11px] font-black uppercase text-amber-900 bg-amber-200/90 px-2.5 py-1 border border-amber-600 shadow-bento-sm flex items-center gap-1">
                <Play className="w-3.5 h-3.5 fill-current text-amber-800" />
                Ninguno comenzará hasta presionar PLAY
              </span>
            ) : isTimerRunning ? (
              <span className="text-[11px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-1 border border-emerald-600 shadow-bento-sm flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                Partida en curso ({selectedDurationMinutes} min)
              </span>
            ) : (
              <span className="text-[11px] font-black uppercase text-amber-900 bg-amber-100 px-2.5 py-1 border border-amber-600 shadow-bento-sm flex items-center gap-1">
                <Pause className="w-3.5 h-3.5 text-amber-800" />
                Partida pausada
              </span>
            )}
          </div>
        </div>

        {/* Center: Live Timer Box */}
        <div
          className={`flex items-center gap-3 px-4 py-2 border-2 border-[#2d2a26] shadow-bento-sm transition-all ${
            !hasGameStarted
              ? 'bg-amber-100 border-amber-700 text-[#2d2a26]'
              : isTimerRunning && timeRemaining < 60
              ? 'bg-red-500 text-white animate-pulse'
              : !isTimerRunning
              ? 'bg-amber-50 text-[#2d2a26]'
              : 'bg-white text-[#2d2a26]'
          }`}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-mono text-2xl sm:text-3xl font-black tracking-tight">
              <Clock
                className={`w-6 h-6 ${
                  timeRemaining < 60 && hasGameStarted && isTimerRunning
                    ? 'text-white'
                    : 'text-[#d62828]'
                }`}
              />
              <span>{formatTime(timeRemaining)}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-600">
              {!hasGameStarted
                ? `Formato: ${selectedDurationMinutes} min (en espera)`
                : isTimerRunning
                ? 'Tiempo restante'
                : 'En pausa'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTogglePlayPause}
              className={`px-3 py-2 border-2 border-[#2d2a26] text-xs font-black uppercase flex items-center gap-1.5 shadow-bento-sm transition-all active:translate-y-0.5 ${
                !hasGameStarted
                  ? 'bg-[#2a9d8f] hover:bg-[#21867a] text-white animate-bounce'
                  : isTimerRunning
                  ? 'bg-amber-400 hover:bg-amber-300 text-stone-900'
                  : 'bg-[#2a9d8f] hover:bg-[#21867a] text-white'
              }`}
              title={
                !hasGameStarted
                  ? `Iniciar partida de ${selectedDurationMinutes} minutos`
                  : isTimerRunning
                  ? 'Pausar Tiempo'
                  : 'Reanudar Tiempo'
              }
            >
              {!hasGameStarted ? (
                <>
                  <Play className="w-4 h-4 fill-current text-white" />
                  <span>PLAY</span>
                </>
              ) : isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="hidden sm:inline">Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span className="hidden sm:inline">Reanudar</span>
                </>
              )}
            </button>

            {hasGameStarted && (
              <button
                onClick={handleResetGame}
                className="p-2 bg-[#f3efe6] hover:bg-[#2d2a26] hover:text-white text-[#2d2a26] border-2 border-[#2d2a26] shadow-bento-sm transition-colors"
                title="Reiniciar y volver a configuración de inicio"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Running Score Counters */}
        <div className="flex items-center gap-2">
          <div className="bg-white px-3.5 py-1.5 border-2 border-[#2d2a26] shadow-bento-sm text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Puntaje</span>
            <span className="text-base font-mono font-black text-[#1d3557]">{totalScoreEarned} pts</span>
          </div>

          <div className="bg-emerald-50 px-3 py-1.5 border-2 border-[#2d2a26] shadow-bento-sm text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Aciertos</span>
            <span className="text-base font-mono font-black text-emerald-700 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {totalCorrect}
            </span>
          </div>

          <div className="bg-rose-50 px-3 py-1.5 border-2 border-[#2d2a26] shadow-bento-sm text-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Errores</span>
            <span className="text-base font-mono font-black text-rose-700 flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {totalIncorrect}
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setIsGameOver(true);
            }}
            className="px-3 py-2 bg-[#1d3557] hover:bg-[#d62828] text-white text-xs font-black uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento-sm flex items-center gap-1 transition-colors"
            title="Ver resumen y balance general de la partida"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Puntaje Final</span>
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
              <span className="text-xs font-black uppercase text-stone-600 block sm:inline">
                Jugar de Nuevo:
              </span>
              <button
                onClick={() => handleStartGame(3)}
                className="px-4 py-2.5 bg-[#d62828] hover:bg-[#1d3557] text-white font-extrabold text-xs uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento flex items-center gap-1.5 transition-all active:translate-y-0.5"
                title="Partida de 3 minutos"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-300" />
                3 Min
              </button>

              <button
                onClick={() => handleStartGame(5)}
                className="px-4 py-2.5 bg-[#d62828] hover:bg-[#1d3557] text-white font-extrabold text-xs uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento flex items-center gap-1.5 transition-all active:translate-y-0.5"
                title="Partida de 5 minutos"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-300" />
                5 Min
              </button>

              <button
                onClick={() => handleStartGame(7)}
                className="px-4 py-2.5 bg-[#d62828] hover:bg-[#1d3557] text-white font-extrabold text-xs uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento flex items-center gap-1.5 transition-all active:translate-y-0.5"
                title="Partida de 7 minutos"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-300" />
                7 Min
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setIsGameOver(false);
                }}
                className="px-4 py-2.5 bg-white hover:bg-[#e8e4d8] text-[#2d2a26] font-bold text-xs uppercase tracking-wider border-2 border-[#2d2a26] shadow-bento-sm"
              >
                Ver Preguntas
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
        /* PRESENTACIÓN DE PREGUNTA ACTIVA */
        <div className="space-y-6">
          {/* NOTICE BEFORE STARTING GAME: FORMAT CHOSEN & PLAY PROMPT */}
          {!hasGameStarted && (
            <div className="bg-amber-100 border-2 border-amber-700 p-4 shadow-bento flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-[#2d2a26] flex items-center justify-center shrink-0 shadow-bento-sm">
                  <Timer className="w-5 h-5 text-[#2d2a26]" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-sm uppercase text-[#2d2a26]">
                    Elegí el formato (3, 5 o 7 min) y dale PLAY para comenzar
                  </h4>
                  <p className="text-xs text-stone-700 font-medium">
                    Tenés disponible <strong>3 min</strong>, <strong>5 min</strong> o <strong>7 min</strong>. Ninguno comenzará hasta presionar Play.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleStartGame(selectedDurationMinutes)}
                className="w-full md:w-auto px-6 py-3 bg-[#2a9d8f] hover:bg-[#21867a] text-white font-black text-xs uppercase tracking-widest border-2 border-[#2d2a26] shadow-bento flex items-center justify-center gap-2 transition-all active:translate-y-0.5 shrink-0 animate-pulse"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                <span>INICIAR PARTIDA ({selectedDurationMinutes} MIN)</span>
              </button>
            </div>
          )}

          {/* Card Progress & Nav Bar */}
          <div className="bg-white border-2 border-[#2d2a26] p-4 shadow-bento flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-[#1d3557] text-white font-mono font-black text-sm px-3 py-1 border-2 border-[#2d2a26] shadow-bento-sm">
                Pregunta {currentIndex + 1} / {deck.length}
              </span>
              <span className="text-xs font-extrabold text-[#2d2a26] uppercase tracking-wider">
                {activeCard.categoryName}
              </span>
              {currentRecord && (
                <span
                  className={`text-[11px] font-black uppercase px-2 py-0.5 border border-[#2d2a26] flex items-center gap-1 ${
                    currentRecord.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {currentRecord.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {currentRecord.isCorrect ? 'Respondida Correcta' : 'Respondida Incorrecta'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3.5 py-2 bg-[#f3efe6] hover:bg-[#2d2a26] hover:text-white disabled:opacity-40 border-2 border-[#2d2a26] text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>

              <button
                onClick={handleNext}
                className="px-4 py-2 bg-[#d62828] hover:bg-[#1d3557] text-white border-2 border-[#2d2a26] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-bento-sm transition-colors"
              >
                {currentIndex === deck.length - 1 ? (
                  <>
                    Finalizar Partida <Trophy className="w-4 h-4 text-amber-300" />
                  </>
                ) : (
                  <>
                    Siguiente Pregunta <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card Content Display Container */}
          <div className="bg-white border-2 border-[#2d2a26] p-6 shadow-bento space-y-6">
            {/* Top Card Badge Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#2d2a26] pb-4">
              <div className="flex items-center gap-2">
                <span className="uppercase font-mono font-bold text-xs tracking-widest bg-[#e8e4d8] px-2.5 py-1 border border-[#2d2a26] flex items-center gap-1.5">
                  {currentCategory === 'aproximacion' && <Dices className="w-4 h-4 text-[#1d3557]" />}
                  {currentCategory === 'secuencia' && <Clock className="w-4 h-4 text-[#1d3557]" />}
                  {currentCategory === 'verdaderofalso' && <CheckSquare className="w-4 h-4 text-[#2a9d8f]" />}
                  {currentCategory === 'multiplechoice' && <HelpCircle className="w-4 h-4 text-[#9c6644]" />}
                  Nº {activeCard.numberId} • {currentCategory.toUpperCase()}
                </span>
                <span className="bg-[#1d3557] text-white text-xs font-bold px-2.5 py-1 uppercase border border-[#2d2a26]">
                  Dificultad: {activeCard.difficulty} ({activeCard.points} Pts)
                </span>
              </div>

              {activeCard.characteristics?.yearOrEpoch && currentCategory !== 'secuencia' && (
                <span className="text-xs font-mono font-bold text-[#1d3557] bg-[#f3efe6] px-2.5 py-1 border border-[#2d2a26]">
                  Época: {activeCard.characteristics.yearOrEpoch}
                </span>
              )}
            </div>

            {/* Question Title & Image Banner */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 relative h-52 border-2 border-[#2d2a26] overflow-hidden bg-[#2d2a26] shadow-bento-sm">
                <img
                  src={activeCard.imageUrl}
                  alt={activeCard.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d2a26]/90 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 font-serif font-black text-lg text-white uppercase tracking-tight drop-shadow">
                  {activeCard.title}
                </div>
              </div>

              <div className="md:col-span-8 space-y-4">
                <div className="bg-[#f3efe6] p-5 border-2 border-[#2d2a26] shadow-bento-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1d3557] block mb-1">
                    Pregunta / Consigna:
                  </span>
                  <p className="text-xl sm:text-2xl font-sans font-bold text-[#2d2a26] leading-snug">
                    "{activeCard.question}"
                  </p>
                </div>

                {activeCard.unit && (
                  <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 border-2 border-[#2d2a26] text-xs font-bold text-[#1d3557] shadow-bento-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Unidad de medida:</span>
                    <span className="font-mono text-sm font-black uppercase text-[#d62828]">
                      {activeCard.unit}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* INTERACTIVE CATEGORY INPUT SECTION */}
            <div className="pt-2">
              {/* 1. MULTIPLE CHOICE */}
              {currentCategory === 'multiplechoice' && options.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b-2 border-[#2d2a26] pb-2">
                    <HelpCircle className="w-5 h-5 text-[#9c6644]" />
                    <h3 className="font-serif font-black text-lg uppercase text-[#2d2a26]">
                      Selecciona una opción de respuesta:
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className={`p-4 border-2 border-[#2d2a26] shadow-bento-sm flex items-center gap-3 text-left transition-all ${btnStyle}`}
                        >
                          <span
                            className={`w-8 h-8 font-mono font-black text-sm flex items-center justify-center border-2 border-[#2d2a26] shrink-0 ${
                              showResult && isCorrect
                                ? 'bg-emerald-600 text-white'
                                : showResult && isChosen
                                ? 'bg-rose-600 text-white'
                                : 'bg-[#9c6644] text-white'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="font-bold text-sm leading-snug flex-1">{opt}</span>
                          {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />}
                          {showResult && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-rose-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. VERDADERO O FALSO */}
              {currentCategory === 'verdaderofalso' && (
                <div className="space-y-4 text-center">
                  <div className="flex items-center justify-center gap-2 border-b-2 border-[#2d2a26] pb-2">
                    <CheckSquare className="w-5 h-5 text-[#2a9d8f]" />
                    <h3 className="font-serif font-black text-lg uppercase text-[#2d2a26]">
                      ¿Es la afirmación VERDADERA o FALSA?
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                    <button
                      disabled={!hasGameStarted || Boolean(currentRecord)}
                      onClick={() => handleSelectTF(true)}
                      className={`p-5 border-2 border-[#2d2a26] font-serif font-black text-xl uppercase tracking-wider shadow-bento flex items-center justify-center gap-3 transition-all ${
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
                      <CheckCircle2 className="w-6 h-6" />
                      <span>Verdadero</span>
                    </button>

                    <button
                      disabled={!hasGameStarted || Boolean(currentRecord)}
                      onClick={() => handleSelectTF(false)}
                      className={`p-5 border-2 border-[#2d2a26] font-serif font-black text-xl uppercase tracking-wider shadow-bento flex items-center justify-center gap-3 transition-all ${
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
                      <XCircle className="w-6 h-6" />
                      <span>Falso</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. APROXIMACIÓN NUMÉRICA (REGLA MENOR O IGUAL MÁS CERCANA) */}
              {currentCategory === 'aproximacion' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#2d2a26] pb-2">
                    <div className="flex items-center gap-2">
                      <Dices className="w-5 h-5 text-[#1d3557]" />
                      <h3 className="font-serif font-black text-lg uppercase text-[#2d2a26]">
                        Estimación Numérica ({activeCard.unit || 'unidades'})
                      </h3>
                    </div>

                    <div className="bg-amber-100 border border-amber-600 px-2.5 py-1 text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                      <span>
                        Regla: Ingresa un valor numérico aproximado o exacto. (Margen de tolerancia válido: ±{activeCard.toleranceMargin || Math.max(1, Math.round((activeCard.numericAnswer || 0) * 0.15))})
                      </span>
                    </div>
                  </div>

                  {/* Single Player Numeric Input Box */}
                  <div className="bg-[#fdfaf5] p-5 border-2 border-[#2d2a26] shadow-bento-sm flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                      <input
                        type="number"
                        disabled={!hasGameStarted || Boolean(currentRecord)}
                        placeholder={!hasGameStarted ? 'Presiona Play para comenzar...' : `Ingresa tu valor en ${activeCard.unit || 'número'}...`}
                        value={userNumericInput}
                        onChange={(e) => setUserNumericInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEvaluateNumeric();
                        }}
                        className="w-full bg-white border-2 border-[#2d2a26] px-4 py-3 text-lg font-mono font-bold text-[#2d2a26] focus:outline-none shadow-bento-sm disabled:bg-stone-100"
                      />
                    </div>

                    <button
                      disabled={!hasGameStarted || Boolean(currentRecord) || !userNumericInput}
                      onClick={handleEvaluateNumeric}
                      className="w-full sm:w-auto px-6 py-3 bg-[#1d3557] hover:bg-[#2a9d8f] disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-widest border-2 border-[#2d2a26] shadow-bento transition-all"
                    >
                      Comprobar Estimación
                    </button>
                  </div>
                </div>
              )}

              {/* 4. SECUENCIAS CRONOLÓGICAS */}
              {currentCategory === 'secuencia' && sequenceItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-[#2d2a26] pb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#1d3557]" />
                      <h3 className="font-serif font-black text-lg uppercase text-[#2d2a26]">
                        Ordena los hitos (de más antiguo a más reciente):
                      </h3>
                    </div>

                    {userSequenceOrder.length > 0 && !currentRecord && (
                      <button
                        onClick={() => setUserSequenceOrder([])}
                        className="text-xs font-bold text-[#d62828] hover:underline uppercase"
                      >
                        Limpiar Orden
                      </button>
                    )}
                  </div>

                  {/* Available Sequence Cards to Click in Order */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sequenceItems.map((item) => {
                      const orderPosition = userSequenceOrder.indexOf(item.letter);
                      const isSelected = orderPosition !== -1;

                      return (
                        <button
                          key={item.id}
                          disabled={!hasGameStarted || Boolean(currentRecord)}
                          onClick={() => handleToggleSequenceLetter(item.letter)}
                          className={`p-4 border-2 border-[#2d2a26] shadow-bento-sm flex items-start gap-3 text-left transition-all ${
                            isSelected
                              ? 'bg-amber-100 border-amber-600'
                              : 'bg-[#fdfaf5] hover:bg-white text-[#2d2a26]'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <span className="w-7 h-7 bg-[#1d3557] text-white font-mono font-black text-sm flex items-center justify-center border border-[#2d2a26]">
                              {item.letter}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-black bg-[#d62828] text-white px-1.5 py-0.2 rounded-full">
                                {orderPosition + 1}º
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#2d2a26]">{item.text}</p>
                            {item.detail && (
                              <p className="text-xs text-stone-600 mt-0.5">{item.detail}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Sequence Preview & Submit */}
                  <div className="bg-[#f3efe6] p-4 border-2 border-[#2d2a26] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        Secuencia Elegida:
                      </span>
                      <div className="flex items-center gap-1.5 font-mono font-black text-base text-[#1d3557]">
                        {userSequenceOrder.length === 0 ? (
                          <span className="text-xs font-normal italic text-stone-500">
                            (Haz clic en las opciones en el orden cronológico)
                          </span>
                        ) : (
                          userSequenceOrder.map((l, i) => (
                            <React.Fragment key={l}>
                              <span className="bg-white px-2.5 py-0.5 border border-[#2d2a26]">{l}</span>
                              {i < userSequenceOrder.length - 1 && <span>➔</span>}
                            </React.Fragment>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      disabled={!hasGameStarted || Boolean(currentRecord) || userSequenceOrder.length !== sequenceItems.length}
                      onClick={handleEvaluateSequence}
                      className="px-5 py-2.5 bg-[#1d3557] hover:bg-[#2a9d8f] disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-widest border-2 border-[#2d2a26] shadow-bento"
                    >
                      Comprobar Secuencia
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* EVALUATION & REVEAL CONTROLS */}
            <div className="pt-4 border-t-2 border-[#2d2a26] space-y-4">
              <div className="bg-[#f3efe6] p-4 border-2 border-[#2d2a26] shadow-bento-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#1d3557]">
                    Evaluación Directa:
                  </span>
                  <span className="text-xs font-medium text-stone-600">
                    (Puedes registrar el resultado manualmente)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={!hasGameStarted || Boolean(currentRecord)}
                    onClick={() => handleRecordAnswer(true, activeCard.points)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider border border-[#2d2a26] shadow-bento-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Correcta (+{activeCard.points} pts)
                  </button>

                  <button
                    disabled={!hasGameStarted || Boolean(currentRecord)}
                    onClick={() => handleRecordAnswer(false, 0)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider border border-[#2d2a26] shadow-bento-sm flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" /> Incorrecta (0 pts)
                  </button>
                </div>
              </div>

              {/* Reveal Official Answer & Explanation - ONLY accessible after answering and verifying */}
              <div className="flex items-center justify-between">
                {currentRecord ? (
                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowOfficialAnswer(!showOfficialAnswer);
                    }}
                    className="px-4 py-2 bg-white hover:bg-[#f3efe6] border-2 border-[#2d2a26] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-bento-sm"
                  >
                    {showOfficialAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#1d3557]" />}
                    <span>{showOfficialAnswer ? 'Ocultar Explicación Histórica' : 'Ver Explicación Histórica y Detalles'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-500 bg-[#f3efe6] px-3.5 py-2 border border-dashed border-[#2d2a26]/40">
                    <EyeOff className="w-4 h-4 text-stone-400" />
                    <span>Responde y comprueba la pregunta para ver la respuesta oficial y explicación.</span>
                  </div>
                )}

                {currentRecord && (
                  <span className="text-xs font-black text-[#1d3557] uppercase tracking-wide">
                    Registrado: {currentRecord.pointsEarned} Pts ganados
                  </span>
                )}
              </div>

              {/* Official Answer & Historical Explanation Box - ONLY shown after submitting/verifying and when toggled on */}
              {Boolean(currentRecord && showOfficialAnswer) && (
                <div className="bg-[#1d3557] text-white p-5 border-2 border-[#2d2a26] shadow-bento space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      RESPUESTA Y EXPLICACIÓN HISTÓRICA OFICIAL
                    </span>
                    <span className="text-xs font-mono font-black text-amber-300">
                      {activeCard.points} PUNTOS
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-lg font-serif font-black text-white">
                      Respuesta:{' '}
                      <span className="text-amber-300 underline underline-offset-4">
                        {activeCard.answer}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
                      {activeCard.explanation}
                    </p>

                    {activeCard.historicalContext && (
                      <div className="bg-[#264653] p-3 border border-white/20 text-xs text-stone-300 italic font-serif mt-2">
                        <strong>Contexto de la Campaña:</strong> {activeCard.historicalContext}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
