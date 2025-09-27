import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import API_CONFIG from '../../config/api';
import { getFromLocalStorage } from '../../utils/storage';

const Messages = () => {
  const { socket, isConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  // Debug socket status
  useEffect(() => {
    console.log('🔍 Teacher Messages - Socket Debug:', {
      socket: !!socket,
      isConnected,
      socketId: socket?.id,
      socketConnected: socket?.connected,
      socketUrl: socket?.io?.uri
    });
  }, [socket, isConnected]);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState([]);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user info from localStorage on component mount
  useEffect(() => {
    const user = getFromLocalStorage('currentUser');
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Load queued messages from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('queuedMessages');
    if (saved) {
      setQueuedMessages(JSON.parse(saved));
    }
  }, []);

  // Save queued messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('queuedMessages', JSON.stringify(queuedMessages));
  }, [queuedMessages]);

  // Handle online/offline status changes
  useEffect(() => {
    if (isOnline && queuedMessages.length > 0) {
      sendQueuedMessages();
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation.participant._id);
      }
    }
    if (!isOnline) {
      setShowOfflineNotice(true);
      setTimeout(() => setShowOfflineNotice(false), 3000);
    }
  }, [isOnline]);

  // Send queued messages when online
  const sendQueuedMessages = async () => {
    if (!socket || !isConnected || queuedMessages.length === 0) return;

    for (const queuedMsg of queuedMessages) {
      try {
        socket.emit('send_message', queuedMsg);
        if (selectedConversation && queuedMsg.recipient === selectedConversation.participant._id) {
          const localMessage = {
            _id: 'temp_' + Date.now(),
            sender: { _id: currentUser._id },
            content: queuedMsg.content,
            createdAt: new Date(),
            isRead: false
          };
          setMessages(prev => [...prev, localMessage]);
        }
      } catch (error) {
        console.error('Error sending queued message:', error);
      }
    }
    setQueuedMessages([]);
  };

  // Handle incoming conversation from other sources (if any)
  useEffect(() => {
    const shouldStartConversation = location.state?.selectedStudentId;
    if (shouldStartConversation) {
      const studentId = location.state.selectedStudentId;
      const studentName = location.state.studentName;
      const studentAvatar = location.state.studentAvatar;
      if (conversations.length > 0) {
        const existingConversation = conversations.find(
          conv => conv.participant._id === studentId
        );
        if (existingConversation) {
          handleSelectConversation(existingConversation);
          return;
        }
      }
      const mockConversation = {
        participant: {
          _id: studentId,
          firstName: studentName ? studentName.split(' ')[0] : 'Student',
          lastName: studentName ? (studentName.split(' ')[1] || '') : '',
          avatar: studentAvatar
        },
        lastMessage: { content: 'Start a conversation', createdAt: new Date() },
        unreadCount: 0
      };
      setSelectedConversation(mockConversation);
      setNewMessage(`Hello ${studentName || 'there'}, I'm ready to help you with your studies!`);
    }
  }, [location.state, conversations, currentUser]);

  // Fetch conversations
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  // Socket event listeners
  useEffect(() => {
    if (socket && isConnected && currentUser) {
      const handleNewMessage = (message) => {
        console.log('📨 Teacher received new message:', message);
        
        // Don't add the message if current user is the sender (they already have it from optimistic update)
        if (message.sender._id === currentUser._id) {
          console.log('📨 Teacher: Ignoring own message from server to avoid duplicate');
          // Still refresh conversations to update last message display
          fetchConversations();
          return;
        }
        
        // Only add messages from other users (incoming messages)
        if (selectedConversation && 
            message.sender._id === selectedConversation.participant._id && 
            message.recipient._id === currentUser._id) {
          setMessages(prev => {
            // Avoid duplicates by checking if message already exists
            const exists = prev.find(m => m._id === message._id);
            if (!exists) {
              return [...prev, message];
            }
            return prev;
          });
        }
        // Always refresh conversations to update last message
        fetchConversations();
      };
      
      const handleMessageSent = (sentMessage) => {
        console.log('✅ Teacher message sent confirmation:', sentMessage);
        setMessages(prev => prev.map(msg =>
          (msg.content === sentMessage.content && msg.status === 'sending') ||
          (msg._id && msg._id.toString().startsWith('temp_'))
            ? { ...msg, _id: sentMessage._id, status: 'sent', createdAt: sentMessage.createdAt }
            : msg
        ));
      };
      
      const handleMessageNotification = (notification) => {
        console.log('🔔 Teacher message notification:', notification);
        fetchConversations();
      };

      // Handle new conversation creation
      const handleNewConversation = (conversationData) => {
        console.log('🆕 Teacher: New conversation created:', conversationData);
        // Add the new conversation to the top of the list
        setConversations(prev => {
          const exists = prev.find(conv => conv.participant._id === conversationData.participant._id);
          if (!exists) {
            return [conversationData, ...prev];
          }
          return prev.map(conv => 
            conv.participant._id === conversationData.participant._id 
              ? { ...conv, ...conversationData }
              : conv
          );
        });
      };

      // Handle user online/offline status
      const handleUserOnline = (userId) => {
        console.log('👤 Teacher: User came online:', userId);
        setConversations(prev => prev.map(conv => 
          conv.participant._id === userId 
            ? { ...conv, participant: { ...conv.participant, isOnline: true } }
            : conv
        ));
      };

      const handleUserOffline = (userId) => {
        console.log('👤 Teacher: User went offline:', userId);
        setConversations(prev => prev.map(conv => 
          conv.participant._id === userId 
            ? { ...conv, participant: { ...conv.participant, isOnline: false } }
            : conv
        ));
      };

      socket.on('new_message', handleNewMessage);
      socket.on('message_sent', handleMessageSent);
      socket.on('message_notification', handleMessageNotification);
      socket.on('new_conversation', handleNewConversation);
      socket.on('user_online', handleUserOnline);
      socket.on('user_offline', handleUserOffline);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('message_sent', handleMessageSent);
        socket.off('message_notification', handleMessageNotification);
        socket.off('new_conversation', handleNewConversation);
        socket.off('user_online', handleUserOnline);
        socket.off('user_offline', handleUserOffline);
      };
    }
  }, [socket, isConnected, selectedConversation, currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      // FIX: Removed manual token from headers
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/messages/conversations`, {
        withCredentials: true // CRITICAL: This sends the HttpOnly cookie
      });
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching conversations:', error.response?.status, error.response?.data);
      setLoading(false);
      // Optional: Redirect on 401
      if (error.response?.status === 401) {
        navigate('/login', { replace: true });
      }
    }
  };

  const fetchMessages = async (participantId) => {
    if (!currentUser) return;
    try {
      // FIX: Removed manual token from headers
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/messages/conversation/${participantId}`, {
        withCredentials: true // CRITICAL: This sends the HttpOnly cookie
      });
      setMessages(response.data);
      if (socket && currentUser) {
        const roomId = [currentUser._id, participantId].sort().join('_');
        socket.emit('join_room', roomId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Optional: Redirect on 401
      if (error.response?.status === 401) {
        navigate('/login', { replace: true });
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    const tempId = 'temp_' + Date.now();
    const messageData = {
      sender: currentUser._id,
      recipient: selectedConversation.participant._id,
      content: newMessage.trim(),
      messageType: 'text',
      tempId
    };

    const localMessage = {
      _id: tempId,
      sender: { _id: currentUser._id, firstName: currentUser.firstName, lastName: currentUser.lastName },
      recipient: { _id: selectedConversation.participant._id },
      content: messageData.content,
      createdAt: new Date(),
      isRead: false,
      status: 'sending'
    };
    
    // Immediately show the message in UI
    setMessages(prev => [...prev, localMessage]);
    setNewMessage('');

    try {
      if (socket && isConnected && isOnline) {
        // Use socket for real-time messaging
        console.log('📤 Teacher sending message via socket:', messageData);
        socket.emit('send_message', messageData);
        
        // The backend socket handler will save to database and emit to all connected users
      } else {
        // Fallback to API only if socket is not available
        console.log('📤 Teacher sending message via API (socket not available)');
        const apiResponse = await axios.post(
          `${API_CONFIG.BASE_URL}/api/messages/send`,
          messageData,
          { withCredentials: true }
        );
        setMessages(prev => prev.map(msg =>
          msg._id === tempId
            ? { ...msg, _id: apiResponse.data._id, status: 'sent', createdAt: apiResponse.data.createdAt }
            : msg
        ));
        fetchConversations();
      }
    } catch (error) {
      console.error('❌ Teacher error sending message:', error);
      setMessages(prev => prev.map(msg =>
        msg._id === tempId ? { ...msg, status: 'queued' } : msg
      ));
      setQueuedMessages(prev => [...prev, messageData]);
      if (!isOnline) {
        setShowOfflineNotice(true);
        setTimeout(() => setShowOfflineNotice(false), 3000);
      }
      if (error.response?.status === 401) {
        navigate('/login', { replace: true });
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.participant._id === conversation.participant._id ? { ...conv, unreadCount: 0 } : conv
      )
    );
    setSelectedConversation(conversation);
    fetchMessages(conversation.participant._id);
  };
  
  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === today.toDateString()) return 'Today';
    if (messageDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return messageDate.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
      <div className="relative z-10 h-screen flex">
        {/* Conversations Sidebar */}
        <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/3 xl:w-1/4 flex-col bg-white/90 backdrop-blur-xl border-r-2 border-purple-200/50 shadow-2xl relative`}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-purple-50/80 rounded-l-none"></div>
          <div className="relative z-10 p-4 border-b-2 border-purple-200/30 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <Link
                to="/teacher/dashboard"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md text-sm font-medium"
                title="Go to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </div>
            <div className="mb-4 text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                Messages
              </h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/80 border-2 border-purple-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>
          {(showOfflineNotice || (!isOnline && queuedMessages.length > 0)) && (
            <div className="relative z-10 p-3 bg-gradient-to-r from-orange-100 to-yellow-100 border-l-4 border-orange-500">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  {!isOnline && queuedMessages.length > 0
                    ? `${queuedMessages.length} message(s) queued - will send when online`
                    : "You're offline - messages will be queued"}
                </span>
              </div>
            </div>
          )}
          <div className="relative z-10 flex-1 overflow-y-auto bg-white/20 backdrop-blur-sm">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <p className="text-slate-700 font-medium text-lg mb-2">No conversations yet</p>
                <p className="text-sm text-slate-600">Students will appear here when they message you</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.participant._id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 border-b border-purple-100/50 cursor-pointer transition-all duration-200 hover:bg-white/40 hover:shadow-md ${
                    selectedConversation?.participant._id === conversation.participant._id
                      ? 'bg-purple-100/60 border-l-4 border-l-purple-500 shadow-sm'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                      {conversation.participant.firstName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800 truncate">
                          {conversation.participant.firstName} {conversation.participant.lastName}
                        </h3>
                        <span className="text-xs text-slate-500">
                          {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-block bg-purple-500 text-white text-xs rounded-full px-2 py-1 mt-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Chat Area */}
        <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white/60 backdrop-blur-xl relative`}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-purple-200/30 bg-white/40 backdrop-blur-sm flex items-center space-x-4">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="lg:hidden p-2 rounded-lg hover:bg-white/60 transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                  {selectedConversation.participant.firstName.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">
                    {selectedConversation.participant.firstName} {selectedConversation.participant.lastName}
                  </h2>
                  <p className="text-sm text-slate-600">Student</p>
                  {/* Online/Offline status */}
                  <span className={`flex items-center gap-1 text-xs font-medium ${selectedConversation.participant.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${selectedConversation.participant.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {selectedConversation.participant.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const currentUserId = currentUser?._id || currentUser?.id;
                  const messageSenderId = message.sender?._id || message.sender?.id;
                  const isOwnMessage = messageSenderId === currentUserId;
                  const showDate = index === 0 || formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
                  return (
                    <div key={message._id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-600">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        {/* Incoming message avatar */}
                        {!isOwnMessage && (
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                            {selectedConversation?.participant?.firstName?.[0]}
                            {selectedConversation?.participant?.lastName?.[0]}
                          </div>
                        )}
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-md transition-colors duration-200 ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md border border-purple-100'
                        }`}>
                          <p className="text-sm break-words">{message.content}</p>
                          <div className={`flex items-center mt-1 space-x-1 ${
                            isOwnMessage ? 'justify-end text-white' : 'justify-start text-gray-500'
                          }`}>
                            <span className="text-xs">{formatTime(message.createdAt)}</span>
                            {isOwnMessage && (
                              message.status === 'queued' ? (
                                <Clock className="w-3 h-3 text-orange-400" title="Queued - will send when online" />
                              ) : message.isRead ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                        {/* Outgoing message avatar space for alignment */}
                        {isOwnMessage && <div className="w-8 h-8" />}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-white/60 backdrop-blur-sm border-t border-white/20">
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 bg-white/80 border-2 border-purple-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none shadow-sm"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Messages</h2>
                <p className="text-slate-600">Select a conversation to start messaging with your students</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;