import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Bot, User, Sparkles, Trash2, Clock, Database, 
  Search, X, FileText, Copy, Check, ChevronLeft, ChevronRight, ExternalLink, Eye 
} from 'lucide-react';

export default function App() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  
  // --- Database Modal States ---
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbStats, setDbStats] = useState(null);
  const [dbDocs, setDbDocs] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- Sayfalama (Pagination) States ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalMatched, setTotalMatched] = useState(0);

  // --- Büyük Detay Penceresi State ---
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [copied, setCopied] = useState(false);

  // --- Retrived Context Inspection Modal State ---
  const [selectedContext, setSelectedContext] = useState(null);

  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  // Otomatik aşağı kaydırma
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Düşünme süresi sayacı
  useEffect(() => {
    if (loading) {
      setTimerSeconds(0);
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [loading]);

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 1) return 'less than 1 sec';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins > 0 ? `${mins} min ${secs} sec` : `${secs} sec`;
  };

  // --- Database Inspection Functions ---
  const fetchDbStats = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/db/stats');
      setDbStats(res.data);
    } catch (err) {
      console.error('Failed to fetch DB stats:', err);
    }
  };

  const fetchDbDocs = async (search = searchTerm, p = page, limit = pageSize) => {
    setDbLoading(true);
    try {
      const offset = (p - 1) * limit;
      const res = await axios.get('http://localhost:8000/api/db/inspect', {
        params: { limit, offset, search_term: search }
      });
      setDbDocs(res.data.items || []);
      setTotalMatched(res.data.total_matched || 0);
    } catch (err) {
      console.error('Failed to fetch DB docs:', err);
    } finally {
      setDbLoading(false);
    }
  };

  const handleOpenDbModal = () => {
    setShowDbModal(true);
    setPage(1);
    fetchDbStats();
    fetchDbDocs(searchTerm, 1, pageSize);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setPage(1);
    fetchDbDocs(val, 1, pageSize);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchDbDocs(searchTerm, newPage, pageSize);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setPage(1);
    fetchDbDocs(searchTerm, 1, newSize);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userMessage = { sender: 'user', text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    const startTime = Date.now();

    try {
      const res = await axios.post('http://localhost:8000/api/chat', {
        question: userMessage.text,
        history: messages,
      });

      const durationInSeconds = Math.round((Date.now() - startTime) / 1000);
      setMessages((prev) => [
        ...prev,
        { 
          sender: 'bot', 
          text: res.data.answer, 
          contextUsed: res.data.context_used, // Backend'den gelen ham RAG bağlamı
          responseTime: durationInSeconds 
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Error connecting to backend server.', responseTime: 0 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalMatched / pageSize) || 1;

  return (
    <div style={{ 
      maxWidth: '1200px', 
      width: '92%', 
      margin: '20px auto', 
      height: 'calc(100vh - 40px)', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingBottom: '16px', 
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles color="#4F46E5" size={28} />
          <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Pandas RAG Assistant</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleOpenDbModal}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 14px', 
              background: '#EEF2FF', 
              color: '#4F46E5', 
              border: '1px solid #C7D2FE', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <Database size={16} /> Inspect ChromaDB
          </button>

          {messages.length > 0 && (
            <button 
              onClick={() => setMessages([])}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '8px 12px', 
                background: '#f3f4f6', 
                color: '#4b5563', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              <Trash2 size={16} /> Clear Chat
            </button>
          )}
        </div>
      </header>

      {/* Chat Messages Container */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        border: '1px solid #e5e7eb', 
        borderRadius: '16px', 
        padding: '24px', 
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#9ca3af' }}>
            <Bot size={48} color="#4F46E5" style={{ marginBottom: '12px', opacity: 0.8 }} />
            <p style={{ fontSize: '16px', margin: 0 }}>Ask anything about Pandas!</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Example: "How do I filter rows based on multiple conditions?"</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: '6px' }}>
            {msg.sender === 'bot' && msg.responseTime !== undefined && (
              <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '36px' }}>
                <Clock size={11} /> Thought for {formatDuration(msg.responseTime)}
              </span>
            )}
            
            <div style={{ display: 'flex', gap: '12px', maxWidth: '85%', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.sender === 'user' ? '#4F46E5' : '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {msg.sender === 'bot' ? <Bot color="#4F46E5" size={18} /> : <User color="#ffffff" size={18} />}
              </div>
              <div style={{ padding: '14px 18px', borderRadius: '16px', background: msg.sender === 'user' ? '#4F46E5' : '#ffffff', color: msg.sender === 'user' ? '#ffffff' : '#1f2937', boxShadow: msg.sender === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.06)', border: msg.sender === 'user' ? 'none' : '1px solid #f3f4f6', lineHeight: '1.6', fontSize: '15px' }}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
                
                {/* HAM RAG BAĞLAMI GÖSTERME BUTONU */}
                {msg.sender === 'bot' && msg.contextUsed && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => setSelectedContext(msg.contextUsed)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#e0e7ff',
                        color: '#3730a3',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={13} /> View Retrieved RAG Context
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot color="#4F46E5" size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }}>
              <span>Thinking and checking Pandas docs...</span>
              <span style={{ fontSize: '12px', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontStyle: 'normal', fontWeight: 500 }}>
                {formatDuration(timerSeconds)}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a Pandas question..."
          disabled={loading}
          style={{ flex: 1, padding: '14px 18px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none', background: '#ffffff' }}
        />
        <button type="submit" disabled={loading || !question.trim()} style={{ padding: '0 24px', background: loading || !question.trim() ? '#a5b4fc' : '#4F46E5', color: '#fff', border: 'none', borderRadius: '12px', cursor: loading || !question.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={18} />
        </button>
      </form>

      {/* --- DATABASE INSPECTOR MODAL --- */}
      {showDbModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '92vw',
            maxWidth: '1000px',
            height: '85vh',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database color="#4F46E5" size={22} /> ChromaDB Knowledge Base
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Total {dbStats ? dbStats.total_documents : '...'} indexed Pandas docstrings stored in local vector DB
                </p>
              </div>
              <button onClick={() => setShowDbModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px', borderRadius: '8px' }}>
                <X size={22} />
              </button>
            </div>

            {/* Modal Search & Filter Bar */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', background: '#ffffff' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search in 500+ docstrings (e.g. groupby, loc, merge)..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                <span>Show:</span>
                <select 
                  value={pageSize} 
                  onChange={handlePageSizeChange}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#fff' }}
                >
                  <option value={10}>10 per page</option>
                  <option value={15}>15 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>

            {/* Modal Document List Body */}
            <div style={{ 
              flex: 1, 
              minHeight: 0,
              overflowY: 'auto', 
              padding: '20px 24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              background: '#f8fafc'
            }}>
              {dbLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: '14px' }}>
                  Fetching docstrings from ChromaDB...
                </div>
              ) : dbDocs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '14px' }}>
                  No matching docstrings found for "{searchTerm}".
                </div>
              ) : (
                dbDocs.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedDoc(item)}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      background: '#ffffff',
                      padding: '14px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
                        <FileText size={16} color="#4F46E5" />
                        <span>{item.id}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#4F46E5', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Inspect Full Doc <ExternalLink size={13} />
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.preview}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Pagination Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff'
            }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Showing <b>{totalMatched === 0 ? 0 : (page - 1) * pageSize + 1}</b> - <b>{Math.min(page * pageSize, totalMatched)}</b> of <b>{totalMatched}</b> results
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || dbLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '6px 12px', borderRadius: '6px',
                    border: '1px solid #cbd5e1', background: page === 1 ? '#f1f5f9' : '#fff',
                    color: page === 1 ? '#94a3b8' : '#334155',
                    cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '13px'
                  }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', padding: '0 8px' }}>
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || dbLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '6px 12px', borderRadius: '6px',
                    border: '1px solid #cbd5e1', background: page >= totalPages ? '#f1f5f9' : '#fff',
                    color: page >= totalPages ? '#94a3b8' : '#334155',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '13px'
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- RETRIEVED CONTEXT INSPECTOR MODAL --- */}
      {selectedContext && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1150
        }}>
          <div style={{
            width: '85vw',
            maxWidth: '850px',
            maxHeight: '80vh',
            backgroundColor: '#1e1b4b',
            color: '#e0e7ff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #4338ca'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #312e81',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#312e81'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye color="#818cf8" size={20} />
                <h4 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>
                  Retrieved RAG Context (Fed into LLM)
                </h4>
              </div>
              <button 
                onClick={() => setSelectedContext(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7d2fe', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
              <pre style={{
                margin: 0,
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#c7d2fe',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {selectedContext}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* --- BÜYÜK DETAY PENCERESİ --- */}
      {selectedDoc && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            width: '85vw',
            maxWidth: '900px',
            height: '80vh',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #334155'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1e293b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText color="#818cf8" size={20} />
                <h4 style={{ margin: 0, fontSize: '16px', color: '#f8fafc', fontFamily: 'monospace' }}>
                  {selectedDoc.id}
                </h4>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => handleCopyText(selectedDoc.full_text)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '6px',
                    background: '#312e81', color: '#c7d2fe',
                    border: '1px solid #4338ca', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 500
                  }}
                >
                  {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Docstring'}
                </button>

                <button 
                  onClick={() => setSelectedDoc(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
              <pre style={{
                margin: 0,
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {selectedDoc.full_text}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}