import React, { useState, useEffect, useRef } from 'react';
import { Upload, Send, FileText, Clock, MapPin, User, Bot, Sparkles, MessageSquare, Sun, Moon, Folder, Settings, Trash2, Search } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const DocumentChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('friendly');
  const [personas, setPersonas] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState('dark');
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


    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return (
    <div className={isDark ? 'flex h-screen bg-[#1a1a1f] text-white' : 'flex h-screen bg-gray-50 text-gray-900'}>
      {/* Left Sidebar */}
      <div className={isDark ? "w-64 bg-[#16161a] border-r border-[#2a2a2f] flex flex-col" : "w-64 bg-white border-r border-gray-200 flex flex-col"}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#2a2a2f]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-grey-500">LogicAI</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-3 space-y-1">
          <div className="bg-[#6366f1] text-white rounded-lg">
            <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm font-medium">
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat</span>
            </button>
          </div>
          
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm text-gray-500 hover:text-white hover:bg-[#2a2a2f] rounded-lg transition-colors">
            <User className="w-4 h-4" />
            <span>Friends</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm text-gray-500 hover:text-white hover:bg-[#2a2a2f] rounded-lg transition-colors">
            <Search className="w-4 h-4" />
            <span>Explore LogicAI</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm text-gray-500 hover:text-white hover:bg-[#2a2a2f] rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
            <span>Trash</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm text-gray-500 hover:text-white hover:bg-[#2a2a2f] rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* Folders Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Co-hort</span>
              <button className="text-gray-500 hover:text-white">
                <Folder className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between px-3 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-[#2a2a2f] rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Node.js</span>
                </div>
                <span className="text-xs text-gray-500">+48</span>
              </button>
              
              <button className="w-full flex items-center justify-between px-3 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-[#2a2a2f] rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Python</span>
                </div>
              </button>
              
              <button className="w-full flex items-center justify-between px-3 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-[#2a2a2f] rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Javascript</span>
                </div>
                <span className="text-xs text-gray-500">+3</span>
              </button>
              
              <button className="w-full flex items-center justify-between px-3 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-[#2a2a2f] rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>others</span>
                </div>
                <span className="text-xs text-gray-500">+176</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        {/* Top Header */}
        <div className={isDark ? "h-14 bg-[#16161a] border-b border-[#2a2a2f] flex items-center justify-between px-6" : "h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6"}>
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-grey-500">AI Chat</h1>
          </div>
          <button
          onClick={toggleTheme}
          className="ml-2 px-4 py-2 rounded-lg bg-[#6366f1] text-white font-medium flex items-center space-x-2"
>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="flex items-center space-x-4">

            
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search"
                className="bg-[#2a2a2f] border border-[#3a3a3f] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent w-64"
              />
            </div>
            
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
              className="bg-[#6366f1] hover:bg-[#5855eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Processing...' : 'Upload'}</span>
            </button>
            
            <span className="text-sm text-gray-400">16/193</span>
            
            <button className="text-gray-400 hover:text-white">
              <span className="text-sm">History</span>
            </button>
          </div>
        </div>

        {/* Content Area with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Code Block Example */}
              <div className="bg-[#0d1117] rounded-lg border border-[#30363d] overflow-hidden">
                <div className="bg-[#21262d] px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">JavaScript</span>
                  </div>
                  <button className="text-gray-400 hover:text-white text-xs">Copy code</button>
                </div>
                <div className="p-4 font-mono text-sm">
                  <div className="flex">
                    <div className="text-gray-500 select-none pr-4 text-right w-8">
                      <div>1</div>
                      <div>2</div>
                      <div>3</div>
                      <div>4</div>
                      <div>5</div>
                      <div>6</div>
                      <div>7</div>
                      <div>8</div>
                    </div>
                    <div className="flex-1">
                      <div><span className="text-[#ff7b72]">let</span> <span className="text-[#79c0ff]">cancelButton</span> = <span className="text-[#79c0ff]">document</span>.<span className="text-[#d2a8ff]">getElementById</span>(<span className="text-[#a5d6ff]">"cancel-button"</span>);</div>
                      <div><span className="text-[#ff7b72]">let</span> <span className="text-[#79c0ff]">sendButton</span> = <span className="text-[#79c0ff]">document</span>.<span className="text-[#d2a8ff]">getElementById</span>(<span className="text-[#a5d6ff]">"send-button"</span>);</div>
                      <div></div>
                      <div><span className="text-[#79c0ff]">cancelButton</span>.<span className="text-[#d2a8ff]">addEventListener</span>(<span className="text-[#a5d6ff]">"click"</span>, <span className="text-[#ff7b72]">function</span>() {"{"}</div>
                      <div className="pl-4"><span className="text-[#79c0ff]">console</span>.<span className="text-[#d2a8ff]">log</span>(<span className="text-[#a5d6ff]">"Cancel button clicked"</span>);</div>
                      <div>{"}"});</div>
                      <div></div>
                      <div><span className="text-[#79c0ff]">sendButton</span>.<span className="text-[#d2a8ff]">addEventListener</span>(<span className="text-[#a5d6ff]">"click"</span>, <span className="text-[#ff7b72]">function</span>() {"{"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {uploadStatus && (
                <div className={`p-3 rounded-lg border text-sm ${
                  uploadStatus.type === 'success' 
                    ? 'bg-green-900/20 border-green-800 text-green-300' 
                    : 'bg-red-900/20 border-red-800 text-red-300'
                }`}>
                  <p className="font-medium">{uploadStatus.message}</p>
                  {uploadStatus.stats && (
                    <div className="mt-1 text-xs opacity-75">
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

              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <FileText className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">Ready to Chat!</h2>
                  <p className="text-gray-400">Upload any document and start an intelligent conversation</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="space-y-4">
                    {message.type === 'user' && (
                      <div className="flex justify-end">
                        <div className="bg-[#6366f1] text-white rounded-lg px-4 py-3 max-w-2xl">
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    )}

                    {message.type === 'bot' && (
                      <div className="flex justify-start">
                        <div className="bg-[#21262d] border border-[#30363d] rounded-lg px-4 py-3 max-w-3xl">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{message.emoji}</span>
                            <span className="text-sm font-medium text-[#6366f1]">{message.persona}</span>
                          </div>
                          <div className="text-sm text-gray-200 leading-relaxed mb-3">
                            {message.content}
                          </div>
                          {message.sources && message.sources.length > 0 && (
                            <div className="border-t border-[#30363d] pt-3 mt-3">
                              <h4 className="text-xs font-medium text-[#6366f1] mb-2">Source References</h4>
                              <div className="space-y-2">
                                {message.sources.map((source, index) => (
                                  <div key={index} className="bg-[#0d1117] rounded-md p-3 text-xs border border-[#30363d]">
                                    <div className="flex items-center flex-wrap gap-2 mb-2">
                                      {source.startTime && (
                                        <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded text-xs">
                                          {formatTimestamp(source.startTime)}
                                        </span>
                                      )}
                                      {source.metadata?.page && (
                                        <span className="bg-green-900/50 text-green-300 px-2 py-1 rounded text-xs">
                                          Page {source.metadata.page}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">{source.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#21262d] border border-[#30363d] rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#6366f1] border-t-transparent"></div>
                      <span className="text-sm text-gray-300">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[#2a2a2f] bg-[#16161a] p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Summarize the latest"
                    className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputText.trim()}
                  className="bg-[#6366f1] hover:bg-[#5855eb] text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Persona Selector */}
          <div className="w-80 bg-[#16161a] border-l border-[#2a2a2f] p-4">
            <h3 className="text-lg font-semibold text-white mb-4">AI Assistants</h3>
            <div className="space-y-2">
              {Object.entries(personas).map(([key, persona]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPersona(key)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedPersona === key
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[#21262d] text-gray-300 hover:bg-[#2a2a2f] border border-[#30363d]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{persona.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{persona.name}</div>
                      <div className="text-xs opacity-75 truncate mt-1">
                        {persona.prompt.split('.')[0]}...
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Additional sidebar content */}
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Search</h4>
              <div className="space-y-3">
                <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-3">
                  <h5 className="text-sm font-medium text-white mb-1">....</h5>
                  <p className="text-xs text-gray-400">Written code</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 bg-red-500 rounded-full border border-[#16161a]"> </div>
                      <div className="w-4 h-4 bg-green-500 rounded-full border border-[#16161a]"></div>
                      <div className="w-4 h-4 bg-blue-500 rounded-full border border-[#16161a]"></div>
                    </div>
                    <span className="text-xs text-gray-500">Made by Ragekid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentChatbot;