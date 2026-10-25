import React, { useState, useRef, useEffect } from 'react';
import { askInventoryAssistant } from '../api/apiService'; // Adjust path if needed

const ChatAssistant = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! Ask me anything about your Kirana inventory.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const aiResponse = await askInventoryAssistant(userMsg.text);

    setMessages((prev) => [...prev, { sender: 'ai', text: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="card shadow-sm mt-4">
      <div className="card-header bg-dark text-white fw-bold">
        📦 Kirana AI Assistant
      </div>
      <div className="card-body bg-light" style={{ height: '350px', overflowY: 'auto' }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-3 text-${msg.sender === 'user' ? 'end' : 'start'}`}>
            <div 
              className={`d-inline-block p-2 rounded ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white border text-dark'}`}
              style={{ maxWidth: '80%', textAlign: 'left' }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-muted small ms-1">AI is analyzing stock...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="card-footer bg-white">
        <form onSubmit={handleSend} className="d-flex">
          <input
            type="text"
            className="form-control me-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., How much GoodDay is expiring soon?"
            disabled={isLoading}
          />
          <button type="submit" className="btn btn-primary fw-bold" disabled={isLoading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
export default ChatAssistant;