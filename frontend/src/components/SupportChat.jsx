import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Send, X } from "lucide-react";

const quickQuestions = [
  { label: "Track my order", message: "How can I track my order?" },
  { label: "Shipping", message: "Tell me about shipping." },
  { label: "Returns & exchanges", message: "How do returns and exchanges work?" },
  { label: "Sizing help", message: "I need help choosing my shoe size." },
];

function getReply(question) {
  const text = question.toLowerCase();

  if (/\b(hi|hello|hey)\b/.test(text)) {
    return "Hi there! I can help with orders, shipping, returns, and finding the right fit. What can I help you with?";
  }
  if (/size|fit|sizing|wide|narrow/.test(text)) {
    return "For the best fit, measure both feet at the end of the day and compare the longer foot with the size guide on the shoe’s product page. If you’re between sizes or need a wider fit, our team can help you choose. ";
  }
  if (/track|order|delivery|where.*(shoe|package|parcel)/.test(text)) {
    return "You can find the latest status in your account’s Orders section. Have your order number handy? Our support team can look into a delayed or missing parcel with you.";
  }
  if (/ship|deliver|arriv/.test(text)) {
    return "Delivery times and available options are shown at checkout for your address. Once your order ships, you’ll receive tracking details by email. If an order is delayed, contact us with your order number.";
  }
  if (/return|exchange|refund|wrong|damaged|defect/.test(text)) {
    return "Sorry something isn’t right. Contact our team with your order number and a short description of the issue so we can guide you through the return, exchange, or refund options.";
  }
  if (/contact|human|person|agent|support|team/.test(text)) {
    return "A member of our team can help with account or order-specific questions. Email hello@khan.store, Monday to Friday, 9am–6pm, or visit our support page.";
  }
  if (/care|clean|cleaning/.test(text)) {
    return "Shoe care depends on the material. Check the care notes on your product page, and tell us the shoe style and material if you’d like specific advice.";
  }
  return "I can help with sizing, shipping, order tracking, returns, and shoe care. For a personal answer, email hello@khan.store or send us a message on our support page.";
}

function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "Welcome to Khan. What can I help you with today?" },
  ]);
  const [showTopics, setShowTopics] = useState(true);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen]);

  function sendMessage(message = input) {
    const text = message.trim();
    if (!text) return;
    setMessages((current) => [...current, { from: "user", text }, { from: "bot", text: getReply(text) }]);
    setInput("");
    setShowTopics(false);
  }

  return (
    <div className="support-chat">
      {isOpen && (
        <section className="support-chat-panel" aria-label="Khan customer support chat">
          <header className="support-chat-header">
            <span className="support-chat-avatar" aria-hidden="true">K</span>
            <div><strong>Khan support</strong><span>Here to help with your shoes</span></div>
            <button type="button" className="support-chat-close" aria-label="Close chat" onClick={() => setIsOpen(false)}><X size={19} /></button>
          </header>
          <div className="support-chat-messages" ref={listRef} aria-live="polite">
            <p className="support-chat-note">Instant answers · No order details needed</p>
            {messages.map((message, index) => (
              <div className={`support-chat-message is-${message.from}`} key={`${index}-${message.from}`}>
                <p>{message.text}</p>
              </div>
            ))}
            {showTopics && <div className="support-chat-topics" aria-label="Common questions">
              {quickQuestions.map((topic) => <button type="button" key={topic.label} onClick={() => sendMessage(topic.message)}>{topic.label}</button>)}
            </div>}
          </div>
          <form className="support-chat-form" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your question..." aria-label="Type your question" />
            <button type="submit" aria-label="Send message" disabled={!input.trim()}><Send size={17} /></button>
          </form>
          <footer className="support-chat-footer">Need more help? <Link to="/support" onClick={() => setIsOpen(false)}>Contact our team</Link></footer>
        </section>
      )}
      <button type="button" className={`support-chat-toggle${isOpen ? " is-open" : ""}`} aria-label={isOpen ? "Close support chat" : "Chat with Khan support"} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? <X size={23} /> : <><MessageCircle size={21} /><span>Need help?</span></>}
      </button>
    </div>
  );
}

export default SupportChat;
