
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2, Minimize2, Maximize2, Mic, PhoneOff, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/authService';
import { supportService } from '../services/supportService';
import { connectLiveSession } from '../services/geminiService';
import { SupportTicket, TicketStatus } from '../types';
import { Blob } from '@google/genai';
import { useToast } from './ui/Toast';

export const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    // Audio State
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    const user = authService.getSession();

    useEffect(() => {
        if (user && isOpen) {
            const fetchHistory = async () => {
                const history = await supportService.getUserTickets(user.id);
                setMessages(history);
            };
            fetchHistory();
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (scrollRef.current && !isVoiceMode) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isVoiceMode]);

    // Clean up audio on unmount or close
    useEffect(() => {
        return () => {
            stopVoiceSession();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !user) return;

        setIsLoading(true);
        const tempQuery = query;
        setQuery('');

        try {
            const ticket = await supportService.createTicket(tempQuery, user);
            setMessages([...messages, ticket]);
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const cleanResponse = (text: string) => {
        if (!text) return "";
        return text.replace(/\*\*/g, '').replace(/##/g, '').replace(/\*/g, '•');
    };

    // --- Voice Logic ---

    // Encode PCM Float32 to 16-bit PCM Base64
    const base64EncodeAudio = (float32Array: Float32Array) => {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            let s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        let binary = '';
        const bytes = new Uint8Array(int16Array.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    // Decode Base64 to ArrayBuffer
    const base64ToArrayBuffer = (base64: string) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    const startVoiceSession = async () => {
        setIsConnecting(true);
        setIsVoiceMode(true);

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass({ sampleRate: 16000 });
            audioContextRef.current = ctx;
            nextStartTimeRef.current = ctx.currentTime;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = ctx.createMediaStreamSource(stream);
            const processor = ctx.createScriptProcessor(4096, 1, 1);

            inputSourceRef.current = source;
            processorRef.current = processor;

            source.connect(processor);
            processor.connect(ctx.destination);

            const sessionPromise = connectLiveSession({
                onopen: () => {
                    setIsConnected(true);
                    setIsConnecting(false);
                },
                onmessage: async (message: any) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && audioContextRef.current) {
                        try {
                            const audioData = base64ToArrayBuffer(base64Audio);
                            // Live API sends PCM 24000Hz usually
                            const pcmData = new Int16Array(audioData);
                            const float32Data = new Float32Array(pcmData.length);
                            for (let i = 0; i < pcmData.length; i++) {
                                float32Data[i] = pcmData[i] / 32768.0;
                            }
                            
                            const buffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
                            buffer.getChannelData(0).set(float32Data);

                            const sourceNode = audioContextRef.current.createBufferSource();
                            sourceNode.buffer = buffer;
                            sourceNode.connect(audioContextRef.current.destination);
                            
                            const now = audioContextRef.current.currentTime;
                            const startTime = Math.max(now, nextStartTimeRef.current);
                            sourceNode.start(startTime);
                            nextStartTimeRef.current = startTime + buffer.duration;
                        } catch (e) {
                            console.error("Audio Decode Error", e);
                        }
                    }
                },
                onclose: () => {
                    stopVoiceSession();
                },
                onerror: (e: any) => {
                    console.error("Session Error", e);
                    addToast("Voice session disconnected unexpectedly.", 'error');
                    stopVoiceSession();
                }
            });

            sessionPromiseRef.current = sessionPromise;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const b64 = base64EncodeAudio(inputData);
                
                sessionPromise.then(session => {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: "audio/pcm;rate=16000",
                            data: b64
                        }
                    });
                });
            };

        } catch (e: any) {
            console.error("Voice Setup Failed", e);
            if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                addToast("Microphone access denied. Please check your browser permissions.", 'error');
            } else {
                addToast("Failed to initialize voice session. Check connection.", 'error');
            }
            setIsConnecting(false);
            setIsVoiceMode(false);
        }
    };

    const stopVoiceSession = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
        }
        if (inputSourceRef.current) {
            inputSourceRef.current.disconnect();
            inputSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
        }

        audioContextRef.current = null;
        sessionPromiseRef.current = null;
        setIsConnected(false);
        setIsConnecting(false);
        setIsVoiceMode(false);
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="mb-4 bg-white w-[350px] md:w-[400px] h-[500px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col pointer-events-auto relative"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center text-white shrink-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Nexus Assistant</h4>
                                    <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded transition-colors"><Minimize2 size={16}/></button>
                            </div>
                        </div>

                        {isVoiceMode ? (
                            <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
                                {/* Visualizer */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                    <motion.div 
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="w-40 h-40 bg-indigo-500 rounded-full blur-3xl"
                                    />
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.3, 0.6] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                                        className="w-32 h-32 bg-purple-500 rounded-full blur-2xl absolute"
                                    />
                                </div>

                                <div className="z-10 text-center">
                                    <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 mb-6 mx-auto shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                                        <Bot size={40} className="text-white" />
                                    </div>
                                    <h3 className="text-white font-bold text-xl mb-2">Nexus Live</h3>
                                    <p className="text-indigo-200 text-sm mb-8">
                                        {isConnecting ? 'Connecting...' : 'Listening...'}
                                    </p>
                                    
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={stopVoiceSession}
                                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto"
                                    >
                                        <PhoneOff size={20} /> End Call
                                    </motion.button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200" ref={scrollRef}>
                                    {messages.length === 0 && (
                                        <div className="text-center py-8 text-slate-400">
                                            <MessageCircle size={48} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">How can I help you today?</p>
                                        </div>
                                    )}
                                    
                                    {messages.map((msg) => (
                                        <React.Fragment key={msg.id}>
                                            <div className="flex justify-end">
                                                <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[85%] shadow-sm">
                                                    {msg.query}
                                                </div>
                                            </div>
                                            <div className="flex justify-start">
                                                <div className="flex gap-2 max-w-[90%]">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 text-white shadow-sm mt-1">
                                                        <Bot size={16} />
                                                    </div>
                                                    <div className="bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm leading-relaxed">
                                                        {cleanResponse(msg.response || "...")}
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                    
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-100 rounded-xl px-4 py-2 flex items-center gap-1 ml-10">
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                                    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                                        <button 
                                            type="button" 
                                            onClick={startVoiceSession}
                                            className="p-2.5 bg-slate-100 text-slate-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                            title="Start Voice Call"
                                        >
                                            <Mic size={18} />
                                        </button>
                                        <input 
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                                            placeholder="Type your question..."
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            disabled={isLoading}
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!query.trim() || isLoading}
                                            className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto p-4 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300
                    ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </motion.button>
        </div>
    );
};
