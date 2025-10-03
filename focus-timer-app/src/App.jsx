import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Plus, Trash2, Clock, History, Coffee, CheckCircle, Bell } from 'lucide-react';

export default function FocusApp() {
  const [todos, setTodos] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [newTodo, setNewTodo] = useState('');
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [showHistory, setShowHistory] = useState(false);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [selectedRingtone, setSelectedRingtone] = useState('beep');
  
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const alarmRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioRef.current) audioRef.current.pause();
      stopAlarm();
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeRemaining]);

  const playAlarm = () => {
    // Clean up any existing alarm first
    if (alarmRef.current) {
      try {
        if (alarmRef.current.interval) {
          clearInterval(alarmRef.current.interval);
        }
        if (alarmRef.current.oscillator) {
          alarmRef.current.oscillator.stop();
        }
        if (alarmRef.current.context) {
          alarmRef.current.context.close();
        }
      } catch (error) {
        console.log('Error cleaning up previous alarm:', error);
      }
      alarmRef.current = null;
    }

    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Different ringtones based on selection
      switch (selectedRingtone) {
        case 'beep':
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.3;
          break;
        case 'chime':
          oscillator.frequency.value = 523; // C5 note
          oscillator.type = 'sine';
          gainNode.gain.value = 0.4;
          break;
        case 'buzz':
          oscillator.frequency.value = 200;
          oscillator.type = 'sawtooth';
          gainNode.gain.value = 0.2;
          break;
        case 'bell':
          oscillator.frequency.value = 880; // A5 note
          oscillator.type = 'sine';
          gainNode.gain.value = 0.5;
          break;
        default:
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.3;
      }
      
      oscillator.start();
      
      const interval = setInterval(() => {
        try {
          if (selectedRingtone === 'beep' || selectedRingtone === 'buzz') {
            oscillator.frequency.value = oscillator.frequency.value === 800 ? 1000 : 800;
          } else if (selectedRingtone === 'chime') {
            oscillator.frequency.value = oscillator.frequency.value === 523 ? 659 : 523; // C5 to E5
          } else if (selectedRingtone === 'bell') {
            oscillator.frequency.value = oscillator.frequency.value === 880 ? 1047 : 880; // A5 to C6
          }
        } catch (error) {
          console.log('Error updating oscillator frequency:', error);
          clearInterval(interval);
        }
      }, 500);
      
      const alarm = { oscillator, context, interval };
      alarmRef.current = alarm;
      return alarm;
    } catch (error) {
      console.log('Error creating alarm:', error);
      return null;
    }
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    setIsAlarmRinging(true);
    
    playAlarm();
    
    if (currentTask && !isBreak) {
      const completedTask = {
        ...currentTask,
        completedAt: new Date().toISOString(),
        duration: `${customHours}h ${customMinutes}m`
      };
      setHistory(prev => [completedTask, ...prev]);
      setTodos(prev => prev.filter(t => t.id !== currentTask.id));
    }
    
    if (!isBreak && breakMinutes > 0) {
      setTimeout(() => {
        if (window.confirm('Focus session complete! Start break?')) {
          startBreak();
        }
      }, 100);
    }
  };

  const stopAlarm = () => {
    setIsAlarmRinging(false);
    
    if (alarmRef.current) {
      try {
        // Clear the interval first
        if (alarmRef.current.interval) {
          clearInterval(alarmRef.current.interval);
        }
        
        // Stop the oscillator
        if (alarmRef.current.oscillator) {
          alarmRef.current.oscillator.stop();
        }
        
        // Close the audio context
        if (alarmRef.current.context && alarmRef.current.context.state !== 'closed') {
          alarmRef.current.context.close();
        }
      } catch (error) {
        console.log('Error stopping alarm:', error);
      } finally {
        // Always clear the reference
        alarmRef.current = null;
      }
    }
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo = {
        id: Date.now(),
        text: newTodo,
        createdAt: new Date().toISOString(),
        completed: false
      };
      setTodos(prev => [...prev, todo]);
      setNewTodo('');
    }
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const startFocus = (task) => {
    if (isAlarmRinging) stopAlarm();
    setCurrentTask(task);
    setTimeRemaining((customHours * 3600) + (customMinutes * 60));
    setIsRunning(true);
    setIsBreak(false);
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const startBreak = () => {
    if (isAlarmRinging) stopAlarm();
    setIsBreak(true);
    setTimeRemaining(breakMinutes * 60);
    setIsRunning(true);
    setCurrentTask({ text: 'Break Time', id: 'break' });
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const stopTimer = () => {
    if (isAlarmRinging) stopAlarm();
    setIsRunning(false);
    setTimeRemaining(0);
    setCurrentTask(null);
    setIsBreak(false);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const clearHistory = () => {
    if (window.confirm('Clear all history?')) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">Focus Timer & To-Do</h1>
          <p className="text-purple-200">Stay focused, get things done</p>
        </header>

        {isAlarmRinging && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center animate-pulse">
              <Bell className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">
                {isBreak ? 'Break Complete!' : 'Focus Session Complete!'}
              </h2>
              <p className="text-gray-600 mb-6">Great job! Click below to stop the alarm.</p>
              <button
                onClick={stopAlarm}
                className="bg-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-600 transition"
              >
                Stop Alarm
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Timer Section */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="w-6 h-6" />
                {isBreak ? 'Break Timer' : 'Focus Timer'}
              </h2>
              {isBreak && <Coffee className="w-6 h-6 text-yellow-300" />}
            </div>

            {currentTask ? (
              <div className="space-y-4">
                <div className="bg-white bg-opacity-20 rounded-xl p-4">
                  <p className="text-sm text-purple-200 mb-1">Current Task</p>
                  <p className="text-xl font-semibold">{currentTask.text}</p>
                </div>
                
                <div className="text-center">
                  <div className="text-6xl font-mono font-bold mb-4">
                    {formatTime(timeRemaining)}
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={togglePause}
                      className="bg-green-500 hover:bg-green-600 p-4 rounded-full transition"
                    >
                      {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={stopTimer}
                      className="bg-red-500 hover:bg-red-600 p-4 rounded-full transition"
                    >
                      <Square className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={customHours}
                      onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white bg-opacity-20 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white bg-opacity-20 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Break Duration (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white bg-opacity-20 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Ringtone</label>
                  <select
                    value={selectedRingtone}
                    onChange={(e) => setSelectedRingtone(e.target.value)}
                    className="w-full bg-white bg-opacity-20 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="beep">Beep</option>
                    <option value="chime">Chime</option>
                    <option value="buzz">Buzz</option>
                    <option value="bell">Bell</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={startBreak}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Coffee className="w-5 h-5" />
                    Start Break
                  </button>
                  <button
                    onClick={() => {
                      setIsAlarmRinging(true);
                      playAlarm();
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    title="Test Alarm"
                  >
                    <Bell className="w-5 h-5" />
                    Test
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* To-Do List */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">To-Do List</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Add a new task..."
                className="flex-1 bg-white bg-opacity-20 rounded-lg px-4 py-2 text-white placeholder-purple-200"
              />
              <button
                onClick={addTodo}
                className="bg-purple-500 hover:bg-purple-600 p-2 rounded-lg transition"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {todos.length === 0 ? (
                <p className="text-center text-purple-200 py-8">No tasks yet. Add one above!</p>
              ) : (
                todos.map(todo => (
                  <div
                    key={todo.id}
                    className="bg-white bg-opacity-20 rounded-lg p-3 flex items-center justify-between hover:bg-opacity-30 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{todo.text}</p>
                      <p className="text-xs text-purple-200">
                        {new Date(todo.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!currentTask && (
                        <button
                          onClick={() => startFocus(todo)}
                          className="bg-green-500 hover:bg-green-600 p-2 rounded-lg transition"
                          title="Start Focus"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6" />
              History
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition text-sm"
              >
                {showHistory ? 'Hide' : 'Show'}
              </button>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {showHistory && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-center text-purple-200 py-4">No completed tasks yet</p>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white bg-opacity-20 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-medium">{item.text}</span>
                      </div>
                      <span className="text-sm text-purple-200">{item.duration}</span>
                    </div>
                    <p className="text-xs text-purple-200 mt-1">
                      {new Date(item.completedAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}