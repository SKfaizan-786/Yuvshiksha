import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useLocation, Link } from 'react-router-dom';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { 
  MessageCircle, 
  Send, 
  Search, 
  ArrowLeft,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import axios from 'axios';
import API_CONFIG from '../../config/api';
// Debug components removed - socket is working

const Messages = () => {
  const { socket, isConnected } = useSocket();
  const location = useLocation();
  const isOnline = useOnlineStatus();

  // Debug socket status
  useEffect(() => {
    console.log('🔍 Socket Debug in Messages:', {
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

  // Get current user info with proper ID
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      // Get the actual user ID from various possible sources
      const getUserIdFromToken = () => {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decoded = JSON.parse(jsonPayload);
          return decoded._id || decoded.id || decoded.userId || decoded.sub;
        } catch (error) {
          console.error('Error decoding JWT:', error);
          return null;
        }
      };
      
      const actualUserId = user._id || user.id || user.userId || getUserIdFromToken();
      const userWithId = { ...user, _id: actualUserId, id: actualUserId };
      
      console.log('🔍 Messages - Current user with ID:', { 
        originalUser: user, 
        actualUserId, 
        userWithId 
      });
      
      setCurrentUser(userWithId);
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
      // Send all queued messages when coming back online
      sendQueuedMessages();
      // Fetch latest messages to get any received while offline
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation.participant._id);
      }
    }
    
    if (!isOnline) {
      setShowOfflineNotice(true);
      // Hide notice after 3 seconds
      setTimeout(() => setShowOfflineNotice(false), 3000);
    }
  }, [isOnline]);

  // Send queued messages when online
  const sendQueuedMessages = async () => {
    if (!socket || !isConnected || queuedMessages.length === 0) return;

    for (const queuedMsg of queuedMessages) {
      try {
        socket.emit('send_message', queuedMsg);
        // Add to local messages immediately for better UX
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
    
    // Clear queue after sending
    setQueuedMessages([]);
  };

  // Handle incoming conversation from TeacherList
  useEffect(() => {
    // Handle both old format and new format
    const shouldStartConversation = (location.state?.startConversation && location.state?.teacherId) || 
                                   (location.state?.selectedTeacherId);
    
    if (shouldStartConversation) {
      const teacherId = location.state?.teacherId || location.state?.selectedTeacherId;
      const teacherName = location.state?.teacherName || location.state?.teacherName;
      const teacherAvatar = location.state?.teacherAvatar;
      
      // If conversations are loaded, check for existing conversation
      if (conversations.length > 0) {
        const existingConversation = conversations.find(
          conv => conv.participant._id === teacherId
        );
        
        if (existingConversation) {
          // Select existing conversation
          setSelectedConversation(existingConversation);
          fetchMessages(existingConversation.participant._id);
          return;
        }
      }
      
      // Create a mock conversation object for the selected teacher
      const mockConversation = {
        participant: {
          _id: teacherId,
          firstName: teacherName ? teacherName.split(' ')[0] : 'Teacher',
          lastName: teacherName ? (teacherName.split(' ')[1] || '') : '',
          avatar: teacherAvatar
        },
        lastMessage: { content: 'Start a conversation', createdAt: new Date() },
        unreadCount: 0
      };
      setSelectedConversation(mockConversation);
      
      // Pre-fill message for new conversations from teacher list
      if (location.state?.selectedTeacherId) {
        setNewMessage(`Hi ${teacherName || 'there'}, I'm interested in your classes. Can we discuss the details?`);
      }
    }
  }, [location.state, conversations]);

  // Fetch conversations
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  // Socket event listeners
  useEffect(() => {
    if (socket && isConnected) {
      console.log('Setting up socket listeners, socket connected:', isConnected);
      
      socket.on('new_message', (message) => {
        console.log('Received new_message:', message);
        // Add new message to current conversation if it matches
        if (selectedConversation && 
            (message.sender._id === selectedConversation.participant._id || 
             message.recipient._id === selectedConversation.participant._id)) {
          setMessages(prev => [...prev, message]);
        }
        
        // Update conversations list
        fetchConversations();
      });

      socket.on('message_sent', (sentMessage) => {
        console.log('Message sent confirmation:', sentMessage);
        // Update local message status to sent
        setMessages(prev => prev.map(msg => 
          msg.content === sentMessage.content && msg.status === 'sending'
            ? { ...msg, _id: sentMessage._id, status: 'sent', createdAt: sentMessage.createdAt }
            : msg
        ));
      });

      socket.on('message_notification', (notification) => {
        // Show notification or update unread count
        fetchConversations();
      });

      return () => {
        socket.off('new_message');
        socket.off('message_sent');
        socket.off('message_notification');
      };
    } else {
      console.log('Socket not connected:', { socket: !!socket, isConnected });
    }
  }, [socket, isConnected, selectedConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations...');
      const token = localStorage.getItem('token');
      console.log('Token for conversations:', token ? 'Present' : 'Missing');
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Conversations API response:', response.status, response.data);
      console.log('Number of conversations:', response.data.length);
      
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setLoading(false);
    }
  };

  const fetchMessages = async (participantId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/messages/conversation/${participantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      
      // Join the conversation room
      if (socket && currentUser) {
        const roomId = [currentUser._id, participantId].sort().join('_');
        socket.emit('join_room', roomId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    console.log('Sending message...', { 
      isOnline, 
      hasSocket: !!socket, 
      isConnected, 
      message: newMessage.trim() 
    });

    const messageData = {
      sender: currentUser._id || currentUser.id,
      recipient: selectedConversation.participant._id,
      content: newMessage.trim(),
      messageType: 'text'
    };

    setSendingMessage(true);
    
    // First, add message to local state immediately for better UX
    const localMessage = {
      _id: 'temp_' + Date.now(),
      sender: { 
        _id: currentUser._id || currentUser.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName 
      },
      recipient: { _id: selectedConversation.participant._id },
      content: messageData.content,
      createdAt: new Date(),
      isRead: false,
      status: 'sending' // Mark as sending initially
    };
    setMessages(prev => [...prev, localMessage]);
    setNewMessage(''); // Clear input immediately
    
    try {
      // Always save to database via HTTP API first
      const token = localStorage.getItem('token');
      if (token) {
        const apiResponse = await axios.post(
          `${API_CONFIG.BASE_URL}/api/messages/send`,
          {
            recipient: selectedConversation.participant._id,
            content: messageData.content,
            messageType: 'text'
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        console.log('Message saved to database:', apiResponse.data);
        
        // Update local message with the database ID
        setMessages(prev => prev.map(msg => 
          msg._id === localMessage._id 
            ? { ...msg, _id: apiResponse.data._id, status: 'sent' }
            : msg
        ));
        
        // Refresh conversations list to show new conversation
        console.log('Refreshing conversations after sending message...');
        await fetchConversations();
      }
      
  // No direct socket.emit here. Backend will emit socket event after saving message.
  // This prevents duplicate messages.
  // If socket is not available, message is still saved via API and will sync on reconnect.
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // If database save fails, try socket or queue
      if (socket && isConnected && isOnline) {
        console.log('Database save failed, trying socket...');
        socket.emit('send_message', messageData);
        
        // Update message status to sent
        setMessages(prev => prev.map(msg => 
          msg._id === localMessage._id 
            ? { ...msg, status: 'sent' }
            : msg
        ));
      } else {
        // Update message status to queued
        setMessages(prev => prev.map(msg => 
          msg._id === localMessage._id 
            ? { ...msg, status: 'queued' }
            : msg
        ));
        
        // Queue message
        const queuedMessage = {
          ...messageData,
          queuedAt: new Date().toISOString(),
          tempId: localMessage._id
        };
        
        setQueuedMessages(prev => [...prev, queuedMessage]);
        
        // Show queued notification only if actually offline
        if (!isOnline) {
          setShowOfflineNotice(true);
          setTimeout(() => setShowOfflineNotice(false), 3000);
        }
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    // Instantly update unreadCount in UI
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.participant._id === conversation.participant._id
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
    setSelectedConversation(conversation);
    fetchMessages(conversation.participant._id);
  };

  // Ensure selectedConversation is always the latest from conversations list
  React.useEffect(() => {
    if (!selectedConversation || !selectedConversation.participant?._id) return;
    const realConv = conversations.find(
      conv => conv.participant._id === selectedConversation.participant._id
    );
    if (realConv && realConv !== selectedConversation) {
      setSelectedConversation(realConv);
    }
  }, [conversations]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 h-screen flex">
        {/* Conversations Sidebar */}
        <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/3 xl:w-1/4 flex-col bg-white/90 backdrop-blur-xl border-r-2 border-violet-200/50 shadow-2xl relative`}>
          {/* Sidebar Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/80 via-blue-50/60 to-purple-50/80 rounded-l-none"></div>
          
          {/* Header */}
          <div className="relative z-10 p-4 border-b-2 border-violet-200/30 bg-white/50 backdrop-blur-sm">
            {/* Top Row - Back Button and Status */}
            <div className="flex items-center justify-between mb-3">
              {/* Back Button */}
              <Link
                to="/student/dashboard"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 shadow-md text-sm font-medium"
                title="Go to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'} shadow-sm`}></div>
                <span className={`text-xs font-medium ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            {/* Title Row */}
            <div className="mb-4 text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent">
                Messages
              </h1>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/80 border-2 border-violet-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>

          {/* Offline/Queued Messages Notification */}
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

          {/* Conversations List */}
          <div className="relative z-10 flex-1 overflow-y-auto bg-white/20 backdrop-blur-sm">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <p className="text-slate-700 font-medium text-lg mb-2">No conversations yet</p>
                <p className="text-sm text-slate-600">Start a conversation from the Find Teachers page</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.participant._id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 border-b border-violet-100/50 cursor-pointer transition-all duration-200 hover:bg-white/40 hover:shadow-md ${
                    selectedConversation?.participant._id === conversation.participant._id 
                      ? 'bg-violet-100/60 border-l-4 border-l-violet-500 shadow-sm' 
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                        {conversation.participant.firstName[0]}{conversation.participant.lastName[0]}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {conversation.participant.firstName} {conversation.participant.lastName}
                        </p>
                        <span className="text-xs text-slate-600 font-medium">
                          {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-slate-600 truncate">
                          {conversation.lastMessage.content}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium shadow-sm">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white/50 backdrop-blur-sm`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white/60 backdrop-blur-sm border-b border-white/20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-2 hover:bg-white/30 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedConversation.participant.firstName[0]}{selectedConversation.participant.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.participant.firstName} {selectedConversation.participant.lastName}
                    </h3>
                    <p className={`text-sm ${selectedConversation.participant.isOnline ? 'text-green-600' : 'text-red-600'}`}>{selectedConversation.participant.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  // More robust message identification
                  const currentUserId = currentUser?._id || currentUser?.id;
                  const messageSenderId = message.sender?._id || message.sender?.id;
                  const isOwnMessage = messageSenderId === currentUserId;
                  
                  // Debug logging
                  console.log('ðŸ” Message comparison:', {
                    messageId: message._id,
                    messageSenderId: messageSenderId,
                    currentUserId: currentUserId,
                    isOwnMessage: isOwnMessage,
                    messageContent: message.content.substring(0, 30)
                  });
                  
                  const showDate = index === 0 || 
                    formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
                  
                  return (
                    <div key={message._id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-600">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white/70 backdrop-blur-sm text-gray-900 rounded-bl-md'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-end mt-1 space-x-1 ${
                            isOwnMessage ? 'text-blue-200' : 'text-gray-500'
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
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white/60 backdrop-blur-sm border-t border-white/20">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={isOnline ? "Type a message..." : "Type a message... (will send when online)"}
                    className="flex-1 px-4 py-2 bg-white/70 border border-white/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className={`p-2 text-white rounded-xl transition-colors ${
                      isOnline 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : 'bg-orange-500 hover:bg-orange-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {sendingMessage ? (
                      <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Conversation Selected */
            <div className="flex-1 flex items-center justify-center bg-white/30 backdrop-blur-sm">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Yuvsiksha Messages</h3>
                <p className="text-gray-600">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
