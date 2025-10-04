import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Plus, Trash2, Clock, History, Coffee, CheckCircle, Bell, Download, Upload, Edit2, Check } from 'lucide-react';

export default function FocusApp() {
  const [todos, setTodos] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoEstimate, setNewTodoEstimate] = useState({ hours: 0, minutes: 0 });
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [showHistory, setShowHistory] = useState(false);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTime, setEditTime] = useState({ hours: 0, minutes: 0 });
  
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Load state from memory on mount
  useEffect(() => {
    audioRef.current = { alarm: null };
    loadAppState();
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioRef.current?.alarm) {
        try {
          clearInterval(audioRef.current.alarm.interval);
          audioRef.current.alarm.oscillator.stop();
          audioRef.current.alarm.context.close();
        } catch (e) {
          console.log('Cleanup audio');
        }
      }
    };
  }, []);

  // Save state to memory whenever it changes
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      saveAppState();
    }, 500);
    
    return () => clearTimeout(saveTimer);
  }, [todos, history, currentTask, timeRemaining, isRunning, isBreak, breakMinutes]);

  // Timer effect
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

  const loadAppState = () => {
    try {
      const savedTodos = localStorage.getItem('focusapp_todos');
      const savedHistory = localStorage.getItem('focusapp_history');
      const savedCurrentTask = localStorage.getItem('focusapp_currentTask');
      const savedTimeRemaining = localStorage.getItem('focusapp_timeRemaining');
      const savedIsRunning = localStorage.getItem('focusapp_isRunning');
      const savedIsBreak = localStorage.getItem('focusapp_isBreak');
      const savedBreakMinutes = localStorage.getItem('focusapp_breakMinutes');
      
      if (savedTodos) setTodos(JSON.parse(savedTodos));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedCurrentTask && savedCurrentTask !== 'null') setCurrentTask(JSON.parse(savedCurrentTask));
      if (savedTimeRemaining) setTimeRemaining(parseInt(savedTimeRemaining));
      if (savedIsRunning) setIsRunning(savedIsRunning === 'true');
      if (savedIsBreak) setIsBreak(savedIsBreak === 'true');
      if (savedBreakMinutes) setBreakMinutes(parseInt(savedBreakMinutes));
      
      console.log('✓ Data loaded from device storage');
    } catch (error) {
      console.error('Error loading app state:', error);
    }
  };

  const saveAppState = () => {
    try {
      localStorage.setItem('focusapp_todos', JSON.stringify(todos));
      localStorage.setItem('focusapp_history', JSON.stringify(history));
      localStorage.setItem('focusapp_currentTask', JSON.stringify(currentTask));
      localStorage.setItem('focusapp_timeRemaining', timeRemaining.toString());
      localStorage.setItem('focusapp_isRunning', isRunning.toString());
      localStorage.setItem('focusapp_isBreak', isBreak.toString());
      localStorage.setItem('focusapp_breakMinutes', breakMinutes.toString());
      console.log('💾 Data auto-saved');
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  };

  const playAlarm = () => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    
    const interval = setInterval(() => {
      oscillator.frequency.value = oscillator.frequency.value === 800 ? 1000 : 800;
    }, 500);
    
    return { oscillator, context, interval };
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    setIsAlarmRinging(true);
    
    const alarm = playAlarm();
    audioRef.current.alarm = alarm;
    
    if (currentTask && !isBreak) {
      const completedTask = {
        ...currentTask,
        completedAt: new Date().toISOString(),
        actualDuration: currentTask.estimatedTime
      };
      const updatedHistory = [completedTask, ...history];
      setHistory(updatedHistory);
      
      const updatedTodos = todos.filter(t => t.id !== currentTask.id);
      setTodos(updatedTodos);
      
      localStorage.setItem('focusapp_history', JSON.stringify(updatedHistory));
      localStorage.setItem('focusapp_todos', JSON.stringify(updatedTodos));
      console.log('✓ Task completed and saved to history');
    }
  };

  const stopAlarm = () => {
    setIsAlarmRinging(false);
    if (audioRef.current?.alarm) {
      clearInterval(audioRef.current.alarm.interval);
      audioRef.current.alarm.oscillator.stop();
      audioRef.current.alarm.context.close();
    }
    
    if (!isBreak && breakMinutes > 0 && currentTask) {
      setTimeout(() => {
        if (window.confirm('Would you like to start a break now?')) {
          startBreak();
        } else {
          setCurrentTask(null);
        }
      }, 500);
    } else {
      setCurrentTask(null);
    }
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo = {
        id: Date.now(),
        text: newTodo.trim(),
        createdAt: new Date().toISOString(),
        completed: false,
        estimatedTime: {
          hours: newTodoEstimate.hours,
          minutes: newTodoEstimate.minutes
        }
      };
      const updatedTodos = [...todos, todo];
      setTodos(updatedTodos);
      setNewTodo('');
      setNewTodoEstimate({ hours: 0, minutes: 0 });
      
      localStorage.setItem('focusapp_todos', JSON.stringify(updatedTodos));
      console.log('✓ Task added and saved:', todo.text);
    }
  };

  const deleteTodo = (id) => {
    const updatedTodos = todos.filter(t => t.id !== id);
    setTodos(updatedTodos);
    
    localStorage.setItem('focusapp_todos', JSON.stringify(updatedTodos));
    console.log('✓ Task deleted and saved');
  };

  const startEditTask = (task) => {
    setEditingTask(task.id);
    setEditText(task.text);
    setEditTime(task.estimatedTime);
  };

  const saveEditTask = (id) => {
    const updatedTodos = todos.map(t => 
      t.id === id 
        ? { ...t, text: editText, estimatedTime: editTime }
        : t
    );
    setTodos(updatedTodos);
    setEditingTask(null);
    
    localStorage.setItem('focusapp_todos', JSON.stringify(updatedTodos));
    console.log('✓ Task updated and saved');
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditText('');
    setEditTime({ hours: 0, minutes: 0 });
  };

  const startFocus = (task) => {
    if (isAlarmRinging) stopAlarm();
    setCurrentTask(task);
    
    const hours = task.estimatedTime?.hours || 0;
    const minutes = task.estimatedTime?.minutes || 0;

    if (hours === 0 && minutes === 0) {
        alert('Please set a time duration for this task before starting!');
        return;
      }
    
    setTimeRemaining((hours * 3600) + (minutes * 60));
    setIsRunning(true);
    setIsBreak(false);
    
    console.log(`⏱️ Timer started: ${hours}h ${minutes}m for task: ${task.text}`);
    
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

  const formatDuration = (time) => {
    if (!time) return 'N/A';
    const parts = [];
    if (time.hours > 0) parts.push(`${time.hours}h`);
    if (time.minutes > 0) parts.push(`${time.minutes}m`);
    return parts.join(' ') || '0m';
  };

  const clearHistory = () => {
    if (window.confirm('Clear all history? This cannot be undone.')) {
      setHistory([]);
      localStorage.setItem('focusapp_history', JSON.stringify([]));
      console.log('✓ History cleared');
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ 
      todos, 
      history, 
      settings: { breakMinutes },
      exportDate: new Date().toISOString()
    }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focus-timer-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    console.log('✓ Data exported');
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setTodos(data.todos || []);
          setHistory(data.history || []);
          if (data.settings) {
            setBreakMinutes(data.settings.breakMinutes || 5);
          }
          console.log('✓ Data imported successfully');
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const getTotalTimeSpent = () => {
    return history.reduce((total, item) => {
      if (item.actualDuration) {
        return total + (item.actualDuration.hours * 60) + item.actualDuration.minutes;
      }
      return total;
    }, 0);
  };

  const totalMinutes = getTotalTimeSpent();
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-6 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">Focus Timer & To-Do</h1>
          <p className="text-purple-200">Stay focused, achieve your goals</p>
        </header>

        {isAlarmRinging && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-red-500">
              <Bell className="w-20 h-20 text-red-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-3xl font-bold mb-4 text-gray-900">
                {isBreak ? 'Break Complete!' : 'Focus Session Complete!'}
              </h2>
              <p className="text-gray-700 mb-8 text-lg">Great job! Click below to stop the alarm.</p>
              <button
                onClick={stopAlarm}
                className="bg-red-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-red-600 transition transform hover:scale-105 shadow-lg w-full"
              >
                STOP ALARM
              </button>
            </div>
          </div>
        )}

        {/* Stats & Backup Bar */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={exportData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium"
              title="Export all data as JSON file"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <label className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm cursor-pointer font-medium"
              title="Import data from JSON file">
              <Upload className="w-4 h-4" />
              Import
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
          <div className="text-white text-sm flex items-center gap-4">
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-lg">
              <span className="font-semibold">{todos.length}</span> active tasks
            </div>
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-lg">
              <span className="font-semibold">{history.length}</span> completed
            </div>
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-lg">
              <span className="font-semibold">{totalHours}h {remainingMinutes}m</span> total focus time
            </div>
          </div>
        </div>

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
                  {currentTask.estimatedTime && (
                    <p className="text-xs text-purple-200 mt-2">
                      Duration: {formatDuration(currentTask.estimatedTime)}
                    </p>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="text-6xl font-mono font-bold mb-4">
                    {formatTime(timeRemaining)}
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={togglePause}
                      className="bg-green-500 hover:bg-green-600 p-4 rounded-full transition transform hover:scale-110"
                      title={isRunning ? 'Pause' : 'Resume'}
                    >
                      {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={stopTimer}
                      className="bg-red-500 hover:bg-red-600 p-4 rounded-full transition transform hover:scale-110"
                      title="Stop"
                    >
                      <Square className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                  <p className="text-purple-200 mb-2">No active timer</p>
                  <p className="text-sm text-purple-300">Start a task from your to-do list or take a break</p>
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">Break Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 5)))}
                    className="w-full bg-white bg-opacity-20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>

                <button
                  onClick={startBreak}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold transition transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Coffee className="w-5 h-5" />
                  Start {breakMinutes} Min Break
                </button>
              </div>
            )}
          </div>

          {/* To-Do List */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">To-Do List</h2>
            
            <div className="space-y-2 mb-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="What do you want to focus on?"
                className="w-full bg-white bg-opacity-20 rounded-lg px-4 py-2 text-white placeholder-purple-200 focus:ring-2 focus:ring-purple-400 outline-none"
              />
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
                  <label className="text-sm text-purple-200">Time:</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={newTodoEstimate.hours}
                    onChange={(e) => setNewTodoEstimate({...newTodoEstimate, hours: Math.max(0, parseInt(e.target.value) || 0)})}
                    placeholder="H"
                    className="w-16 bg-white bg-opacity-30 rounded px-2 py-1 text-white text-center outline-none focus:ring-1 focus:ring-purple-400"
                  />
                  <span className="text-purple-200">h</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={newTodoEstimate.minutes}
                    onChange={(e) => setNewTodoEstimate({...newTodoEstimate, minutes: Math.max(0, parseInt(e.target.value) || 0)})}
                    placeholder="M"
                    className="w-16 bg-white bg-opacity-30 rounded px-2 py-1 text-white text-center outline-none focus:ring-1 focus:ring-purple-400"
                  />
                  <span className="text-purple-200">m</span>
                </div>
                <button
                  onClick={addTodo}
                  className="bg-purple-500 hover:bg-purple-600 px-6 rounded-lg transition transform hover:scale-105 font-semibold"
                  disabled={!newTodo.trim()}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {todos.length === 0 ? (
                <div className="text-center text-purple-200 py-8">
                  <Clock className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No tasks yet</p>
                  <p className="text-sm mt-2">Add your first task above!</p>
                </div>
              ) : (
                todos.map(todo => (
                  <div
                    key={todo.id}
                    className="bg-white bg-opacity-20 rounded-lg p-3 hover:bg-opacity-30 transition"
                  >
                    {editingTask === todo.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white bg-opacity-30 rounded px-3 py-2 text-white outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={editTime.hours}
                            onChange={(e) => setEditTime({...editTime, hours: Math.max(0, parseInt(e.target.value) || 0)})}
                            className="w-16 bg-white bg-opacity-30 rounded px-2 py-1 text-white text-center outline-none"
                          />
                          <span className="text-sm">h</span>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={editTime.minutes}
                            onChange={(e) => setEditTime({...editTime, minutes: Math.max(0, parseInt(e.target.value) || 0)})}
                            className="w-16 bg-white bg-opacity-30 rounded px-2 py-1 text-white text-center outline-none"
                          />
                          <span className="text-sm">m</span>
                          <button
                            onClick={() => saveEditTask(todo.id)}
                            className="bg-green-500 hover:bg-green-600 p-2 rounded-lg transition ml-auto"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-500 hover:bg-gray-600 p-2 rounded-lg transition"
                          >
                            <Square className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{todo.text}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-purple-200">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(todo.estimatedTime)}</span>
                            <span>•</span>
                            <span>{new Date(todo.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2">
                          {!currentTask && (
                            <button
                              onClick={() => startFocus(todo)}
                              className="bg-green-500 hover:bg-green-600 p-2 rounded-lg transition transform hover:scale-110"
                              title="Start Focus"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => startEditTask(todo)}
                            className="bg-blue-500 hover:bg-blue-600 p-2 rounded-lg transition transform hover:scale-110"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition transform hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
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
              Completed Tasks ({history.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition text-sm font-medium"
              >
                {showHistory ? 'Hide' : 'Show'}
              </button>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition text-sm font-medium"
                  title="Clear all history"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {showHistory && (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center text-purple-200 py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No completed tasks yet</p>
                  <p className="text-sm mt-2">Complete your first focus session to see it here!</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white bg-opacity-20 rounded-lg p-3 hover:bg-opacity-30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium">{item.text}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-purple-200">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(item.actualDuration)}</span>
                            <span>•</span>
                            <span>{new Date(item.completedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-purple-200 text-sm space-y-1">
          <p>🔔 Alarms keep ringing until manually stopped</p>
          <p>💾 All data auto-saves to device memory</p>
          <p>⏱️ Timer uses exact duration you set for each task</p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}