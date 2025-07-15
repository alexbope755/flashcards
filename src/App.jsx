// WEBAPP CREATED BY ALEXANDER BONE, HTTPS://WWW.ALEXBOPE75.COM
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Upload, FileText, Type, Lightbulb, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { generateFlashcards, generateQuiz, generatePracticeTest } from '/services/deepseekApi';
import { parseFile } from '/utils/fileParser';

const App = () => {
  const [mode, setMode] = useState('create'); // 'create', 'loading', 'study', 'quiz', 'test'
  const [content, setContent] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [testAnswers, setTestAnswers] = useState([]);
  const [testSubmitted, setTestSubmitted] = useState([]); // Nuevo estado para rastrear respuestas enviadas
  const [activeTab, setActiveTab] = useState('describe');
  const [animating, setAnimating] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setError('El archivo es demasiado grande. Máximo 10MB.');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Tipo de archivo no soportado. Solo PDF, TXT y DOCX.');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleGenerateContent = async (type) => {
    if (activeTab === 'describe' && !content.trim()) {
      setError('Por favor, describe un tema para generar el contenido.');
      return;
    }
    
    if (activeTab === 'paste' && !content.trim()) {
      setError('Por favor, pega el texto para generar el contenido.');
      return;
    }
    
    if (activeTab === 'file' && !file) {
      setError('Por favor, selecciona un archivo para subir.');
      return;
    }
    
    setMode('loading');
    setError('');
    setLoadingMessage('Iniciando procesamiento...');
    
    try {
      let textContent = content;
      
      if (activeTab === 'file' && file) {
        setLoadingMessage(`Procesando archivo ${file.name}...`);
        
        if (file.type === 'application/pdf') {
          setLoadingMessage('Procesando PDF... Esto puede tomar unos minutos.');
        }
        
        textContent = await parseFile(file);
        
        if (!textContent || textContent.trim().length < 50) {
          throw new Error('No se pudo extraer suficiente texto del archivo. Verifica que el archivo contenga texto legible.');
        }
      }
      
      setLoadingMessage(`Generando ${type === 'flashcards' ? 'flashcards' : type === 'quiz' ? 'opción múltiple' : 'prueba'} con IA...`);
      let result;
      if (type === 'flashcards') {
        result = await generateFlashcards(textContent, activeTab);
        if (!result || result.length === 0) {
          throw new Error('No se pudieron generar flashcards. Intenta con contenido diferente.');
        }
        setFlashcards(result);
      } else if (type === 'quiz') {
        result = await generateQuiz(textContent, activeTab);
        if (!result || result.length === 0) {
          throw new Error('No se pudieron generar preguntas de opción múltiple. Intenta con contenido diferente.');
        }
        setQuizQuestions(result);
      } else {
        result = await generatePracticeTest(textContent, activeTab);
        if (!result || result.length === 0) {
          throw new Error('No se pudieron generar preguntas de prueba. Intenta con contenido diferente.');
        }
        setTestQuestions(result);
        setTestAnswers(new Array(result.length).fill(null));
        setTestSubmitted(new Array(result.length).fill(false)); // Inicializar estado de respuestas enviadas
      }
      
      setCurrentIndex(0);
      setFlipped(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setMode(type === 'flashcards' ? 'study' : type === 'quiz' ? 'quiz' : 'test');
      setLoadingMessage('');
      
    } catch (error) {
      console.error(`Error al generar ${type}:`, error);
      
      let errorMessage = `Error al generar ${type === 'flashcards' ? 'flashcards' : type === 'quiz' ? 'preguntas de opción múltiple' : 'prueba'}.`;
      
      if (error.message.includes('PDF')) {
        errorMessage = 'Error procesando PDF: ' + error.message;
      } else if (error.message.includes('Word')) {
        errorMessage = 'Error procesando documento Word: ' + error.message;
      } else if (error.message.includes('API')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error.message.includes('Timeout')) {
        errorMessage = 'El archivo es muy grande. Intenta con un archivo más pequeño.';
      } else {
        errorMessage = error.message || 'Error desconocido. Intenta nuevamente.';
      }
      
      setError(errorMessage);
      setMode('create');
      setLoadingMessage('');
    }
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleSelectAnswer = (index) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(index);
      setIsCorrect(index === quizQuestions[currentIndex].correctAnswer);
    }
  };

  const handleTestAnswer = (index, answer) => {
    if (!testSubmitted[index]) {
      const newAnswers = [...testAnswers];
      newAnswers[index] = answer;
      setTestAnswers(newAnswers);
    }
  };

  const handleSubmitTestAnswer = (index) => {
    if (testAnswers[index] !== null && !testSubmitted[index]) {
      const newSubmitted = [...testSubmitted];
      newSubmitted[index] = true;
      setTestSubmitted(newSubmitted);
    }
  };

  const handleNext = () => {
    if (mode === 'study' && currentIndex < flashcards.length - 1 && !animating) {
      setAnimating(true);
      setTimeout(() => {
        setFlipped(false);
        setCurrentIndex(currentIndex + 1);
        setTimeout(() => setAnimating(false), 50);
      }, 150);
    } else if (mode === 'quiz' && currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else if (mode === 'test' && currentIndex < testQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (mode === 'study' && currentIndex > 0 && !animating) {
      setAnimating(true);
      setTimeout(() => {
        setFlipped(false);
        setCurrentIndex(currentIndex - 1);
        setTimeout(() => setAnimating(false), 50);
      }, 150);
    } else if (mode === 'quiz' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else if (mode === 'test' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleKeyPress = (e) => {
    if (mode === 'study') {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleFlip();
      }
    } else if (mode === 'quiz') {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight' && selectedAnswer !== null) handleNext();
      if (e.key >= '1' && e.key <= '4' && selectedAnswer === null) {
        handleSelectAnswer(parseInt(e.key) - 1);
      }
    } else if (mode === 'test') {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight' && testSubmitted[currentIndex]) handleNext();
      if (e.key === 'Enter' && testAnswers[currentIndex] !== null && !testSubmitted[currentIndex]) {
        handleSubmitTestAnswer(currentIndex);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [mode, currentIndex, flashcards.length, quizQuestions.length, testQuestions.length, flipped, animating, selectedAnswer, testAnswers, testSubmitted]);

  const resetApp = () => {
    setMode('create');
    setContent('');
    setFlashcards([]);
    setQuizQuestions([]);
    setTestQuestions([]);
    setFile(null);
    setError('');
    setLoadingMessage('');
    setCurrentIndex(0);
    setFlipped(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTestAnswers([]);
    setTestSubmitted([]);
  };

  const calculateTestScore = () => {
    let correct = 0;
    testQuestions.forEach((q, i) => {
      if (q.type === 'multiple' && testAnswers[i] === q.correctAnswer) correct++;
      if (q.type === 'truefalse' && testAnswers[i] === q.correctAnswer) correct++;
      if (q.type === 'fill' && testAnswers[i]?.toLowerCase() === q.correctAnswer.toLowerCase()) correct++;
      if (q.type === 'match' && JSON.stringify(testAnswers[i]) === JSON.stringify(q.correctAnswer)) correct++;
    });
    const percentage = Math.round((correct / testQuestions.length) * 100);
    const scoreOutOf10 = (percentage / 100) * 10;
    return { percentage, scoreOutOf10: Number(scoreOutOf10.toFixed(1)) };
  };

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-400 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-white text-5xl font-bold mb-2">📚 SmartFlip</h1>
              <p className="text-white/80 text-xl">Genera flashcards, opción múltiple o pruebas con IA</p>
            </div>
            
            {/* Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/20 p-1 rounded-2xl inline-flex backdrop-blur-sm">
                <button
                  onClick={() => {
                    setActiveTab('describe');
                    setContent('');
                    setFile(null);
                    setError('');
                  }}
                  className={`px-6 py-3 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${
                    activeTab === 'describe' 
                      ? 'bg-white text-gray-700 shadow-lg' 
                      : 'text-white hover:text-white/90'
                  }`}
                >
                  <Lightbulb size={18} />
                  Describir tema
                </button>
                <button
                  onClick={() => {
                    setActiveTab('paste');
                    setContent('');
                    setFile(null);
                    setError('');
                  }}
                  className={`px-6 py-3 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${
                    activeTab === 'paste' 
                      ? 'bg-white text-gray-700 shadow-lg' 
                      : 'text-white hover:text-white/90'
                  }`}
                >
                  <Type size={18} />
                  Pegar texto
                </button>
                <button
                  onClick={() => {
                    setActiveTab('file');
                    setContent('');
                    setFile(null);
                    setError('');
                  }}
                  className={`px-6 py-3 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${
                    activeTab === 'file' 
                      ? 'bg-white text-gray-700 shadow-lg' 
                      : 'text-white hover:text-white/90'
                  }`}
                >
                  <Upload size={18} />
                  Subir archivo
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
              {activeTab === 'describe' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Lightbulb className="text-yellow-500" size={24} />
                    Describe el tema
                  </h2>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe un tema y la IA generará flashcards, opción múltiple o pruebas...

Ejemplos:
• Capitales de Europa
• Fórmulas de física básica
• Historia de la Segunda Guerra Mundial"
                    className="w-full h-48 text-gray-900 placeholder-gray-500 resize-none focus:outline-none border-2 border-gray-200 rounded-2xl p-4 focus:border-blue-500 transition-colors"
                    style={{ fontSize: '16px', lineHeight: '1.6' }}
                  />
                </div>
              )}
              
              {activeTab === 'paste' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Type className="text-blue-500" size={24} />
                    Pegar texto
                  </h2>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Pega aquí el texto del que quieres generar flashcards, opción múltiple o pruebas...

Puede ser de libros, artículos, apuntes, etc."
                    className="w-full h-48 text-gray-900 placeholder-gray-500 resize-none focus:outline-none border-2 border-gray-200 rounded-2xl p-4 focus:border-blue-500 transition-colors"
                    style={{ fontSize: '16px', lineHeight: '1.6' }}
                  />
                </div>
              )}
              
              {activeTab === 'file' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Upload className="text-green-500" size={24} />
                    Subir archivo
                  </h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="fileInput"
                      onChange={handleFileUpload}
                      accept=".pdf,.txt,.docx"
                      className="hidden"
                    />
                    <label
                      htmlFor="fileInput"
                      className="cursor-pointer flex flex-col items-center gap-4"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText size={32} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          {file ? file.name : 'Selecciona un archivo'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          PDF, TXT o DOCX (máx. 10MB)
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  {file && file.type === 'application/pdf' && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="text-blue-600" size={20} />
                        <p className="text-blue-700 text-sm">
                          <strong>Procesando PDF:</strong> Los archivos PDF pueden tardar más tiempo en procesarse. 
                          Para mejores resultados, asegúrate de que el PDF contenga texto seleccionable (no escaneado).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-red-600" size={20} />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Buttons */}
            <div className="flex gap-4 mt-8 flex-wrap justify-center">
              <button
                onClick={() => handleGenerateContent('flashcards')}
                disabled={(!content.trim() && activeTab !== 'file') || (activeTab === 'file' && !file)}
                className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-700 hover:to-purple-600 text-white font-bold rounded-2xl transition-all text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                🚀 Generar Flashcards
              </button>
              <button
                onClick={() => handleGenerateContent('quiz')}
                disabled={(!content.trim() && activeTab !== 'file') || (activeTab === 'file' && !file)}
                className="flex-1 py-4 bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white font-bold rounded-2xl transition-all text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                🎯 Opción Múltiple
              </button>
              <button
                onClick={() => handleGenerateContent('test')}
                disabled={(!content.trim() && activeTab !== 'file') || (activeTab === 'file' && !file)}
                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-2xl transition-all text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                📝 Generar Prueba
              </button>
            </div>
          </div>
        </div>
        
        <footer className="text-center py-4">
          <p className="text-white/60 text-sm">
            Creado por <span className="font-bold text-white">BORC STUDIOS</span> 2025
          </p>
        </footer>
      </div>
    );
  }

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-8"></div>
            <h1 className="text-white text-4xl font-bold mb-4">🧠 Generando contenido...</h1>
            <p className="text-white/80 text-lg mb-2">La IA está procesando tu contenido</p>
            {loadingMessage && (
              <p className="text-white/70 text-sm">{loadingMessage}</p>
            )}
          </div>
        </div>
        
        <footer className="text-center py-4">
          <p className="text-white/60 text-sm">
            Creado por <span className="font-bold text-white">BORC STUDIOS</span> 2025
          </p>
        </footer>
      </div>
    );
  }

  if (mode === 'study') {
    const currentCard = flashcards[currentIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="relative mb-8" style={{ perspective: '1000px' }}>
              <div
                className={`relative w-full h-96 transition-all duration-700 cursor-pointer ${
                  flipped ? 'rotate-y-180' : ''
                } ${animating ? 'scale-95 opacity-75' : 'scale-100 opacity-100'}`}
                onClick={handleFlip}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div 
                  className="absolute inset-0 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="text-center flex-1 flex items-center justify-center">
                    <h2 className="text-4xl font-bold text-gray-800 leading-tight">{currentCard.front}</h2>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-gray-500">
                    <span className="text-sm">Usa ↑↓ o click para voltear</span>
                  </div>
                </div>
                
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl shadow-2xl flex items-center justify-center p-8 backface-hidden"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div className="text-center">
                    <p className="text-xl text-gray-700 leading-relaxed font-medium">{currentCard.back}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`p-4 rounded-full transition-all flex items-center gap-2 ${
                  currentIndex === 0 
                    ? 'bg-white/20 text-white/50 cursor-not-allowed' 
                    : 'bg-white/30 text-white hover:bg-white/40 backdrop-blur-sm'
                }`}
              >
                <ChevronLeft size={24} />
                <span className="hidden sm:inline">Anterior</span>
              </button>
              
              <div className="bg-white/30 backdrop-blur-sm px-6 py-3 rounded-2xl">
                <span className="text-white text-lg font-bold">
                  {currentIndex + 1} / {flashcards.length}
                </span>
              </div>
              
              <button
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
                className={`p-4 rounded-full transition-all flex items-center gap-2 ${
                  currentIndex === flashcards.length - 1 
                    ? 'bg-white/20 text-white/50 cursor-not-allowed' 
                    : 'bg-white/30 text-white hover:bg-white/40 backdrop-blur-sm'
                }`}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div className="text-center">
              <button
                onClick={resetApp}
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-2xl hover:bg-white/30 transition-all font-medium"
              >
                ✨ Crear nuevo contenido
              </button>
            </div>
          </div>
        </div>
        
        <footer className="text-center py-4">
          <p className="text-white/60 text-sm">
            Creado por <span className="font-bold text-white">BORC STUDIOS</span> 2025
          </p>
        </footer>
      </div>
    );
  }

  if (mode === 'quiz') {
    const currentQuestion = quizQuestions[currentIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-600 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 leading-tight">{currentQuestion.question}</h2>
              <div className="grid gap-4">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={`w-full py-4 px-6 rounded-xl text-left transition-all text-lg font-medium ${
                      selectedAnswer === null
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        : selectedAnswer === index
                          ? isCorrect
                            ? 'bg-green-100 text-green-800 border-2 border-green-500'
                            : 'bg-red-100 text-red-800 border-2 border-red-500'
                          : 'bg-gray-100 text-gray-500 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{String.fromCharCode(65 + index)}. {option}</span>
                      {selectedAnswer === index && (
                        isCorrect ? 
                        <CheckCircle size={24} className="text-green-500" /> :
                        <XCircle size={24} className="text-red-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {selectedAnswer !== null && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-700 text-sm">
                    <strong>Explicación:</strong> {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`p-4 rounded-full transition-all flex items-center gap-2 ${
                  currentIndex === 0 
                    ? 'bg-white/20 text-white/50 cursor-not-allowed' 
                    : 'bg-white/30 text-white hover:bg-white/40 backdrop-blur-sm'
                }`}
              >
                <ChevronLeft size={24} />
                <span className="hidden sm:inline">Anterior</span>
              </button>
              
              <div className="bg-white/30 backdrop-blur-sm px-6 py-3 rounded-2xl">
                <span className="text-white text-lg font-bold">
                  {currentIndex + 1} / {quizQuestions.length}
                </span>
              </div>
              
              <button
                onClick={handleNext}
                disabled={currentIndex === quizQuestions.length - 1 || selectedAnswer === null}
                className={`p-4 rounded-full transition-all flex items-center gap-2 ${
                  currentIndex === quizQuestions.length - 1 || selectedAnswer === null
                    ? 'bg-white/20 text-white/50 cursor-not-allowed' 
                    : 'bg-white/30 text-white hover:bg-white/40 backdrop-blur-sm'
                }`}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div className="text-center">
              <button
                onClick={resetApp}
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-2xl hover:bg-white/30 transition-all font-medium"
              >
                ✨ Crear nuevo contenido
              </button>
            </div>
          </div>
        </div>
        
        <footer className="text-center py-4">
          <p className="text-white/60 text-sm">
            Creado por <span className="font-bold text-white">BORC STUDIOS</span> 2025
          </p>
        </footer>
      </div>
    );
  }

  if (mode === 'test') {
    const currentQuestion = testQuestions[currentIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-600 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 leading-tight">{currentQuestion.question}</h2>
              
              {currentQuestion.type === 'multiple' && (
                <div className="grid gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleTestAnswer(currentIndex, index)}
                      disabled={testSubmitted[currentIndex]}
                      className={`w-full py-4 px-6 rounded-xl text-left transition-all text-lg font-medium ${
                        testSubmitted[currentIndex] && testAnswers[currentIndex] === index
                          ? testAnswers[currentIndex] === currentQuestion.correctAnswer
                            ? 'bg-green-100 text-green-800 border-2 border-green-500'
                            : 'bg-red-100 text-red-800 border-2 border-red-500'
                          : testAnswers[currentIndex] === index
                            ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span>{String.fromCharCode(65 + index)}. {option}</span>
                        {testSubmitted[currentIndex] && testAnswers[currentIndex] === index && (
                          testAnswers[currentIndex] === currentQuestion.correctAnswer ? 
                          <CheckCircle size={24} className="text-green-500" /> :
                          <XCircle size={24} className="text-red-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'truefalse' && (
                <div className="grid gap-4">
                  {['Verdadero', 'Falso'].map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleTestAnswer(currentIndex, index === 0)}
                      disabled={testSubmitted[currentIndex]}
                      className={`w-full py-4 px-6 rounded-xl text-left transition-all text-lg font-medium ${
                        testSubmitted[currentIndex] && testAnswers[currentIndex] === (index === 0)
                          ? testAnswers[currentIndex] === currentQuestion.correctAnswer
                            ? 'bg-green-100 text-green-800 border-2 border-green-500'
                            : 'bg-red-100 text-red-800 border-2 border-red-500'
                          : testAnswers[currentIndex] === (index === 0)
                            ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span>{option}</span>
                        {testSubmitted[currentIndex] && testAnswers[currentIndex] === (index === 0) && (
                          testAnswers[currentIndex] === currentQuestion.correctAnswer ? 
                          <CheckCircle size={24} className="text-green-500" /> :
                          <XCircle size={24} className="text-red-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'fill' && (
                <div>
                  <input
                    type="text"
                    value={testAnswers[currentIndex] || ''}
                    onChange={(e) => handleTestAnswer(currentIndex, e.target.value)}
                    disabled={testSubmitted[currentIndex]}
                    placeholder="Escribe tu respuesta..."
                    className={`w-full py-4 px-6 rounded-xl border-2 ${
                      testSubmitted[currentIndex]
                        ? testAnswers[currentIndex]?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
                          ? 'border-green-500 bg-green-100'
                          : 'border-red-500 bg-red-100'
                        : testAnswers[currentIndex]
                          ? 'border-blue-500 bg-blue-100'
                          : 'border-gray-200 focus:border-blue-500'
                    } text-lg font-medium transition-all focus:outline-none`}
                  />
                </div>
              )}

              {currentQuestion.type === 'match' && (
                <div className="grid gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="flex-1 text-lg font-medium text-gray-800">{option}</span>
                      <select
                        value={testAnswers[currentIndex]?.[index] || ''}
                        onChange={(e) => {
                          const newMatches = testAnswers[currentIndex] ? [...testAnswers[currentIndex]] : new Array(currentQuestion.options.length).fill('');
                          newMatches[index] = e.target.value;
                          handleTestAnswer(currentIndex, newMatches);
                        }}
                        disabled={testSubmitted[currentIndex]}
                        className={`flex-1 py-2 px-4 rounded-xl border-2 ${
                          testSubmitted[currentIndex]
                            ? JSON.stringify(testAnswers[currentIndex]) === JSON.stringify(currentQuestion.correctAnswer)
                              ? 'border-green-500 bg-green-100'
                              : 'border-red-500 bg-red-100'
                            : testAnswers[currentIndex]?.[index]
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-200'
                        } text-lg font-medium`}
                      >
                        <option value="">Selecciona...</option>
                        {currentQuestion.matches.map((match, i) => (
                          <option key={i} value={match}>{match}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={() => handleSubmitTestAnswer(currentIndex)}
                  disabled={testAnswers[currentIndex] === null || testSubmitted[currentIndex]}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                    testAnswers[currentIndex] === null || testSubmitted[currentIndex]
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Comprobar
                </button>
              </div>

              {testSubmitted[currentIndex] && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-700 text-sm">
                    <strong>Explicación:</strong> {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`p-4 rounded-full transition-all flex items-center gap-2 ${
                  currentIndex === 0 
                    ? 'bg-white/20 text-white/50 cursor-not-allowed' 
                    : 'bg-white/30 text-white hover:bg-white/40 backdrop-blur-sm'
                }`}
              >
                <ChevronLeft size={24} />
                <span className="hidden sm:inline">Anterior</span>
              </button>
              
              <div className="bg-white/30 backdrop-blur-sm px-6 py-3 rounded-2xl">
                <span className="text-white text-lg font-bold">
                  {currentIndex + 1} / {testQuestions.length}
                </span>
              </div>
              
              <button
                onClick={handleNext}
                disabled={currentIndex === testQuestions.length - 1 || !testSubmitted[currentIndex]}
                className={`p-4 rounded-full transition-all flex items-center gap-2 ${
                  currentIndex === testQuestions.length - 1 || !testSubmitted[currentIndex]
                    ? 'bg-white/20 text-white/50 cursor-not-allowed' 
                    : 'bg-white/30 text-white hover:bg-white/40 backdrop-blur-sm'
                }`}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight size={24} />
              </button>
            </div>
            
            {currentIndex === testQuestions.length - 1 && testSubmitted[currentIndex] && (
              <div className="text-center mb-8">
                <p className="text-white text-2xl font-bold mb-4">
                  Puntuación: {calculateTestScore().scoreOutOf10}/10 ({calculateTestScore().percentage}%)
                </p>
              </div>
            )}
            
            <div className="text-center">
              <button
                onClick={resetApp}
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-2xl hover:bg-white/30 transition-all font-medium"
              >
                ✨ Crear nuevo contenido
              </button>
            </div>
          </div>
        </div>
        
        <footer className="text-center py-4">
          <p className="text-white/60 text-sm">
            Creado por <span className="font-bold text-white">BORC STUDIOS</span> 2025
          </p>
        </footer>
      </div>
    );
  }
};
export default App;
// WEBAPP CREATED BY ALEXANDER BONE, HTTPS://WWW.ALEXBOPE75.COM