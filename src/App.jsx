import React, { useState, useEffect, useRef } from 'react';
import { Upload, Send, FileText, Clock, MapPin, User, Bot, Sparkles, MessageSquare, Sun, Moon } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const DocumentChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('friendly');
  const [personas, setPersonas] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState('chaicode');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPersonas();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPersonas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/personas`);
      const data = await response.json();
      setPersonas(data);
    } catch (error) {
      setPersonas({
        friendly: { name: 'Friendly Assistant', emoji: '😊', prompt: "I'm a friendly and helpful assistant." },
        technical: { name: 'Technical Expert', emoji: '🔧', prompt: 'I provide detailed technical analysis.' },
        creative: { name: 'Creative Helper', emoji: '🎨', prompt: 'I help with creative tasks and ideas.' }
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert('Please select a file');
      return;
    }
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }
    const allowedTypes = ['.pdf', '.csv', '.txt', '.docx', '.doc', '.vtt', '.srt', '.json', '.xml'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      alert(`Unsupported file type. Please select: ${allowedTypes.join(', ')}`);
      return;
    }
    const formData = new FormData();
    formData.append('document', file);
    setIsUploading(true);
    setUploadStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/upload-document`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setUploadStatus({
          type: 'success',
          message: `✅ Successfully processed ${file.name} (${data.stats?.totalChunks || 0} chunks, ${data.stats?.fileType || 'unknown'})`,
          stats: data.stats
        });
        setMessages([{
          id: Date.now(),
          type: 'system',
          content: `Loaded document: ${data.stats?.filename || file.name} (${data.stats?.fileType || 'unknown'})`,
          timestamp: new Date(),
          stats: data.stats
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: `❌ Upload failed: ${error.message}`
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputText, persona: selectedPersona })
      });
      const data = await response.json();
      if (response.ok) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response,
          persona: data.persona,
          emoji: data.emoji,
          sources: data.sources,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      if (parts.length >= 3) {
        const minutes = parseInt(parts[1]);
        const seconds = parts[2].split(/[.,]/)[0];
        return `${minutes}:${seconds}`;
      }
    }
    return timeStr;
  };

  const toggleTheme = () => {
    setTheme(theme === 'chaicode' ? 'light' : 'chaicode');
  };

  // Chaicode-style colors
  const chaicodeBg = "bg-gradient-to-br from-[#18181b] via-[#1e1e23] to-[#232336]";
  const chaicodeAccent = "bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500";
  const chaicodeSidebar = "bg-[#232336]/80 border-r border-[#2d2d3a]";
  const chaicodeCard = "bg-[#232336]/80 border border-[#2d2d3a]";
  const chaicodeText = "text-[#e0e0e6]";
  const chaicodeMuted = "text-[#a1a1aa]";
  const chaicodeButton = "bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white hover:from-purple-700 hover:via-pink-600 hover:to-blue-600";

  return (
    <div className={theme === 'chaicode' ? `flex flex-col h-screen ${chaicodeBg}` : 'flex flex-col h-screen bg-white'}>
      {/* Header */}
      <div className={theme === 'chaicode' ? "relative border-b border-[#2d2d3a] shadow-2xl" : "relative border-b border-gray-200 shadow-2xl"}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bot className={theme === 'chaicode' ? "w-10 h-10 text-purple-400" : "w-10 h-10 text-yellow-600"} />
                <Sparkles className="w-4 h-4 text-pink-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h1 className={theme === 'chaicode' ? "text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent" : "text-3xl font-bold bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text text-transparent"}>
                  AI Document Chat
                </h1>
                <p className={theme === 'chaicode' ? `${chaicodeMuted} text-sm` : "text-gray-600 text-sm"}>Intelligent conversations with your documents</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.txt,.docx,.doc,.vtt,.srt,.json,.xml"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`group relative flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 ${chaicodeButton}`}
              >
                <Upload className="w-5 h-5 group-hover:animate-bounce" />
                <span>{isUploading ? 'Processing...' : 'Upload Document'}</span>
                {isUploading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-pink-600/10 rounded-xl animate-pulse"></div>
                )}
              </button>
              <button
                onClick={toggleTheme}
                className={`ml-2 flex items-center px-3 py-2 rounded-xl ${chaicodeButton} transition-all duration-300`}
                title={theme === 'chaicode' ? 'Switch to Light Mode' : 'Switch to Chaicode Dark Mode'}
              >
                {theme === 'chaicode' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="ml-2">{theme === 'chaicode' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
          {uploadStatus && (
            <div className={`mt-4 p-4 rounded-xl backdrop-blur-sm border ${
              uploadStatus.type === 'success' 
                ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-900/30 border-red-500/30 text-red-300'
            }`}>
              <p className="font-medium">{uploadStatus.message}</p>
              {uploadStatus.stats && (
                <div className="mt-2 text-sm opacity-80">
                  <span className="font-medium">File:</span> {uploadStatus.stats.filename} |{' '}
                  <span className="font-medium">Type:</span> {uploadStatus.stats.fileType} |{' '}
                  <span className="font-medium">Chunks:</span> {uploadStatus.stats.totalChunks}
                  {uploadStatus.stats.totalSubtitles && (
                    <span> | <span className="font-medium">Subtitles:</span> {uploadStatus.stats.totalSubtitles}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full relative">
        {/* Persona Selector Sidebar */}
        <div className={theme === 'chaicode' ? `w-80 ${chaicodeSidebar} p-6` : "w-80 bg-white/60 backdrop-blur-xl border-r border-gray-200/50 p-6"}>
          <h3 className={theme === 'chaicode' ? "text-xl font-bold text-white mb-6 flex items-center space-x-2" : "text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2"}>
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span>AI Assistants</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(personas).map(([key, persona]) => (
              <button
                key={key}
                onClick={() => setSelectedPersona(key)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 transform hover:scale-102 ${
                  selectedPersona === key
                    ? `${chaicodeAccent} text-white shadow-lg shadow-purple-500/10`
                    : `${chaicodeCard} ${chaicodeText} hover:border-purple-500/50 hover:bg-[#28283a]`
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-3xl filter drop-shadow-sm">{persona.emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{persona.name}</div>
                    <div className="text-sm opacity-75 line-clamp-2 mt-1">
                      {persona.prompt.split('.')[0]}...
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className={theme === 'chaicode' ? `${chaicodeMuted} text-center mt-16` : "text-center text-gray-500 mt-16"}>
                <div className="relative inline-block mb-6">
                  <FileText className="w-20 h-20 mx-auto text-purple-600" />
                  <Sparkles className="w-6 h-6 text-pink-400 absolute -top-2 -right-2 animate-pulse" />
                </div>
                <h2 className={theme === 'chaicode' ? "text-2xl font-bold text-white mb-2" : "text-2xl font-bold text-gray-800 mb-2"}>Ready to Chat!</h2>
                <p className="text-lg mb-2">Upload any document and start an intelligent conversation</p>
                <p className="text-sm opacity-75">Supports PDF, CSV, TXT, DOCX, VTT, SRT, JSON, XML and more</p>
                <div className="mt-6 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  {message.type === 'user' && (
                    <div className="flex justify-end">
                      <div className={`${chaicodeAccent} text-white rounded-2xl px-6 py-4 max-w-2xl shadow-lg`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 opacity-75" />
                          <span className="text-sm opacity-75 font-medium">You</span>
                        </div>
                        <p className="leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  )}

                  {message.type === 'bot' && (
                    <div className="flex justify-start">
                      <div className={`${chaicodeCard} rounded-2xl px-6 py-4 max-w-3xl shadow-xl`}>
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-2xl filter drop-shadow-sm">{message.emoji}</span>
                          <span className="text-sm font-semibold text-purple-400">{message.persona}</span>
                        </div>
                        <div className={`${chaicodeText} mb-4 leading-relaxed`}>
                          {message.content}
                        </div>
                        {message.sources && message.sources.length > 0 && (
                          <div className="border-t border-purple-900/30 pt-4 mt-4">
                            <h4 className="text-xs font-bold text-purple-400 mb-3 uppercase tracking-widest flex items-center space-x-1">
                              <Sparkles className="w-3 h-3" />
                              <span>Source References</span>
                            </h4>
                            <div className="space-y-3">
                              {message.sources.map((source, index) => (
                                <div key={index} className="bg-[#28283a] rounded-xl p-3 border border-purple-900/20">
                                  <div className="flex items-center flex-wrap gap-4 text-xs text-purple-300 mb-2">
                                    {source.startTime && (
                                      <div className="flex items-center space-x-1 bg-purple-900/50 px-2 py-1 rounded-md">
                                        <Clock className="w-3 h-3 text-blue-400" />
                                        <span>{formatTimestamp(source.startTime)} {source.endTime && `- ${formatTimestamp(source.endTime)}`}</span>
                                      </div>
                                    )}
                                    {source.metadata?.page && (
                                      <div className="flex items-center space-x-1 bg-purple-900/50 px-2 py-1 rounded-md">
                                        <FileText className="w-3 h-3 text-green-400" />
                                        <span>Page {source.metadata.page}</span>
                                      </div>
                                    )}
                                    {source.metadata?.section && (
                                      <div className="flex items-center space-x-1 bg-purple-900/50 px-2 py-1 rounded-md">
                                        <MapPin className="w-3 h-3 text-purple-400" />
                                        <span>{source.metadata.section}</span>
                                      </div>
                                    )}
                                    {source.metadata?.location && (
                                      <div className="flex items-center space-x-1 bg-purple-900/50 px-2 py-1 rounded-md">
                                        <MapPin className="w-3 h-3 text-purple-400" />
                                        <span>{source.metadata.location}</span>
                                      </div>
                                    )}
                                    {source.metadata?.speaker && (
                                      <div className="flex items-center space-x-1 bg-purple-900/50 px-2 py-1 rounded-md">
                                        <User className="w-3 h-3 text-yellow-400" />
                                        <span>{source.metadata.speaker}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-purple-100 leading-relaxed">{source.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {message.type === 'system' && (
                    <div className="flex justify-center">
                      <div className="bg-purple-900/20 border border-purple-500/30 text-purple-300 rounded-xl px-4 py-3 backdrop-blur-sm">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">{message.content}</span>
                        </div>
                        {message.stats && (
                          <div className="mt-1 text-xs opacity-75">
                            {message.stats.fileType} • {message.stats.totalChunks} chunks
                            {message.stats.totalSubtitles && ` • ${message.stats.totalSubtitles} subtitles`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {message.type === 'error' && (
                    <div className="flex justify-center">
                      <div className="bg-red-900/20 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 backdrop-blur-sm">
                        {message.content}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className={`${chaicodeCard} rounded-2xl px-6 py-4 shadow-xl`}>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                      <Sparkles className="w-3 h-3 text-pink-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <span className={`${chaicodeText} font-medium`}>
                      {personas[selectedPersona]?.emoji} {personas[selectedPersona]?.name} is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={theme === 'chaicode' ? "border-t border-[#2d2d3a] bg-[#232336]/80 p-6" : "border-t border-gray-200/50 bg-white/30 p-6"}>
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about your document content..."
                  className={theme === 'chaicode' ? "w-full bg-[#18181b] border border-[#2d2d3a] rounded-xl px-4 py-4 pr-12 resize-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-purple-400 backdrop-blur-sm transition-all duration-300" : "w-full bg-white border border-gray-300 rounded-xl px-4 py-4 pr-12 resize-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-gray-800 placeholder-gray-400 backdrop-blur-sm transition-all duration-300"}
                  rows={2}
                  disabled={isLoading}
                />
                <div className={theme === 'chaicode' ? "absolute bottom-2 right-2 text-xs text-purple-400" : "absolute bottom-2 right-2 text-xs text-slate-500"}>
                  Press Enter to send
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                className={`px-6 py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-lg transform hover:scale-105 ${chaicodeButton}`}
              >
                <Send className="w-5 h-5" />
                <span>Send</span>
              </button>
            </div>
            <div className={theme === 'chaicode' ? "mt-3 text-xs text-purple-400 flex items-center justify-center space-x-2" : "mt-3 text-xs text-slate-500 flex items-center justify-center space-x-2"}>
              <span>Currently chatting with:</span>
              <span className="font-medium text-purple-400">
                {personas[selectedPersona]?.emoji} {personas[selectedPersona]?.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentChatbot;