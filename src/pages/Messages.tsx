import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Send, Phone, Video, Info, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Messages = () => {
  const { currentUser, chats, activeChatId, setActiveChatId, sendMessage } = useStore();
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId);
  const lastMessage = activeChat?.messages[activeChat.messages.length - 1];

  useEffect(() => {
    if (lastMessage && lastMessage.senderId === currentUser?.id) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [lastMessage, currentUser?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId, isTyping]);

  if (!currentUser) {
    return <div className="p-8 text-center text-muted-foreground">Please log in to use direct messages.</div>;
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeChatId || !activeChat) return;

    sendMessage(activeChatId, typedMessage.trim());
    setTypedMessage('');
  };

  return (
    <div className="flex h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] lg:h-[calc(100vh-100px)] border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden glass-card shadow-lg mt-3 sm:mt-5">
      {/* Chats List Pane */}
      <div className={`w-full md:w-80 border-r border-black/5 dark:border-white/5 flex flex-col bg-card/30 ${activeChatId !== null ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-black/5 dark:border-white/5">
          <h1 className="font-heading font-bold text-lg text-foreground tracking-tight pl-1">Chats</h1>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/5 p-1.5 space-y-1">
          {chats.map(chat => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  activeChatId === chat.id ? 'bg-primary/10 border-primary/5' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-1 ring-primary/10">
                    <AvatarImage src={chat.avatarUrl} alt={chat.displayName} />
                    <AvatarFallback>{chat.displayName[0]}</AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs sm:text-sm text-foreground truncate">{chat.displayName}</span>
                    <span className="text-[10px] text-muted-foreground/60">{lastMsg?.timestamp || ''}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate leading-normal pr-2 mt-0.5">
                    {lastMsg ? (lastMsg.senderId === currentUser.id ? 'You: ' : '') + lastMsg.text : 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Chat Conversation Pane */}
      <div className={`flex-1 flex flex-col bg-card/10 ${activeChatId === null ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Header bar */}
            <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-card/30 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-muted-foreground" onClick={() => setActiveChatId(null)}>
                  &larr;
                </Button>
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={activeChat.avatarUrl} />
                    <AvatarFallback>{activeChat.displayName[0]}</AvatarFallback>
                  </Avatar>
                  {activeChat.online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-semibold text-sm leading-none">{activeChat.displayName}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{activeChat.online ? 'Active now' : 'Offline'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-primary"><Phone className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-primary"><Video className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-primary"><Info className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeChat.messages.map(msg => {
                const isMyMessage = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-sm leading-relaxed ${
                      isMyMessage 
                        ? 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white rounded-br-none' 
                        : 'bg-muted dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-bl-none text-foreground'
                    }`}>
                      <p>{msg.text}</p>
                      <span className={`block text-[9px] text-right mt-1 opacity-70 ${isMyMessage ? 'text-pink-100' : 'text-muted-foreground'}`}>{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-none px-4 py-2.5 bg-muted dark:bg-slate-900 border border-black/5 dark:border-white/5 flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message input area */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-black/5 dark:border-white/5 bg-card/30 backdrop-blur-md flex gap-2">
              <input
                value={typedMessage}
                onChange={e => setTypedMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-input/60 bg-background/50 px-4 py-2 text-xs sm:text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60 transition-all"
              />
              <Button type="submit" size="icon" className="gradient-btn border-none rounded-xl h-9 w-9 shadow-md flex items-center justify-center shrink-0" disabled={!typedMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary ring-4 ring-primary/5">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h2 className="font-heading font-bold text-foreground text-base sm:text-lg mb-1">Your Direct Messages</h2>
            <p className="text-xs sm:text-sm max-w-xs leading-relaxed">Select a conversation from the left drawer or start a new thread to send media and messages.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
