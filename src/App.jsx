import { useMemo, useState, useRef, useEffect } from "react";
import {
    FiAlertCircle,
    FiBell,
    FiCoffee,
    FiDroplet,
    FiPhoneCall,
    FiCopy,
    FiTrash2,
} from "react-icons/fi";
import "./App.css";
import useSSE from "./hooks/useSSE";

const quickActions = [
    { label: "Food", color: "tone-blue", icon: FiCoffee },
    { label: "Water", color: "tone-green", icon: FiDroplet },
    { label: "Panic", color: "tone-red", icon: FiAlertCircle },
    { label: "Call Person", color: "tone-orange", icon: FiPhoneCall },

    { label: "Bell", color: "tone-brown", icon: FiBell },

    {
        label: "Clear All",
        color: "tone-yellow",
        icon: FiTrash2,
        action: "clear",
    },
];

function App() {
    const [theme, setTheme] = useState("dark");
    const callOptions = ["Asad", "Irfan", "Anam", "Salman", "Ammi"];
    const [showCallDropdown, setShowCallDropdown] = useState(false);
    const [draft, setDraft] = useState("");
    const [messages, setMessages] = useState([]);
    const [labels, setLabels] = useState({
        appTitle: "Rehan App",
        placeholder: "Write your message here...",
    });
    const textareaRef = useRef(null);
    const footerRef = useRef(null);

    // Backend connection state
    const [chatId, setChatId] = useState(null);
    const [backendUrl] = useState(() => {
        // Use network IP if accessed from network, localhost otherwise
        const hostname = window.location.hostname;
        return hostname === "localhost"
            ? "http://localhost:3000"
            : `http://${hostname}:3000`;
    });
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const typingTimeoutRef = useRef(null);

    // Connect to SSE stream
    const { latestMessage, connectionStatus, error } = useSSE(
        chatId,
        backendUrl
    );

    const orderedMessages = useMemo(() => messages, [messages]);

    // Create chat room on mount
    useEffect(() => {
        // Check if room ID is in URL
        const urlParams = new URLSearchParams(window.location.search);
        const roomIdFromUrl = urlParams.get("room");

        if (roomIdFromUrl) {
            // Use existing room from URL
            setChatId(roomIdFromUrl);
            console.log("Joining existing room:", roomIdFromUrl);
            return;
        }

        // Create new chat room
        const createChatRoom = async () => {
            setIsCreatingChat(true);
            try {
                const response = await fetch(`${backendUrl}/chat`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to create chat");
                }

                const data = await response.json();
                setChatId(data.chatId);

                // Update URL with room ID so it can be shared
                window.history.pushState({}, "", `?room=${data.chatId}`);

                console.log("Chat room created:", data.chatId);
            } catch (err) {
                console.error("Error creating chat:", err);
                alert(
                    "Failed to connect to backend. Make sure server is running on port 3000"
                );
            } finally {
                setIsCreatingChat(false);
            }
        };

        createChatRoom();
    }, [backendUrl]);

    // Handle incoming SSE messages
    useEffect(() => {
        if (!latestMessage) return;

        // Skip heartbeat messages
        if (
            latestMessage.type === "heartbeat" ||
            latestMessage.type === "connection"
        ) {
            return;
        }

        // Add received message to the list
        if (latestMessage.text) {
            setMessages((prev) => {
                // Avoid duplicates
                const exists = prev.some(
                    (msg) =>
                        msg.id === latestMessage.id ||
                        (msg.text === latestMessage.text &&
                            msg.timestamp === latestMessage.timestamp)
                );

                if (exists) return prev;

                return [
                    ...prev,
                    {
                        id: latestMessage.id || Date.now(),
                        text: latestMessage.text,
                        timestamp: latestMessage.timestamp,
                        isFinal: latestMessage.isFinal,
                    },
                ];
            });
        }
    }, [latestMessage]);

    // Mobile keyboard handling - scroll message box into view
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const handleFocus = () => {
            // Only apply on mobile devices
            const isMobile = /iPhone|iPad|iPod|Android/i.test(
                navigator.userAgent
            );
            if (!isMobile) return;

            // Small delay to let keyboard appear
            setTimeout(() => {
                // Scroll the textarea into view
                textarea.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                // Alternative: scroll the footer into view
                if (footerRef.current) {
                    footerRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "end",
                    });
                }
            }, 300);
        };

        const handleResize = () => {
            // When viewport resizes (keyboard opens/closes on mobile)
            const isMobile = /iPhone|iPad|iPod|Android/i.test(
                navigator.userAgent
            );
            if (!isMobile) return;

            if (document.activeElement === textarea) {
                setTimeout(() => {
                    textarea.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }, 100);
            }
        };

        textarea.addEventListener("focus", handleFocus);
        window.addEventListener("resize", handleResize);

        return () => {
            textarea.removeEventListener("focus", handleFocus);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const pushMessage = (text) => {
        if (!text.trim()) return;

        // Send message to backend
        if (chatId) {
            sendMessageToBackend(text.trim());
        } else {
            // Fallback: add locally if chat not created yet
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    text: text.trim(),
                },
            ]);
        }

        setDraft("");
    };

    const sendMessageToBackend = async (text, isFinal = true) => {
        try {
            const response = await fetch(`${backendUrl}/chat/${chatId}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: text,
                    isFinal: isFinal,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            console.log(
                "Message sent successfully:",
                isFinal ? "final" : "draft"
            );
        } catch (err) {
            console.error("Error sending message:", err);
            // Only add to local messages if final and backend fails
            if (isFinal) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        text: text,
                        error: true,
                    },
                ]);
            }
        }
    };

    // Handle real-time typing
    const handleTyping = (value) => {
        setDraft(value);

        // Send draft message to backend for real-time display
        if (chatId && value.trim()) {
            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Debounce: wait 300ms after last keystroke
            typingTimeoutRef.current = setTimeout(() => {
                sendMessageToBackend(value.trim(), false);
            }, 300);
        }
    };

    const clearAll = () => {
        setMessages([]);
        setDraft("");
    };

    const copyRoomLink = async () => {
        if (!chatId) return;

        // Only copy the query string as requested: ?room=CHAT_ID
        const query = `?room=${chatId}`;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(query);
            } else {
                // Fallback for older browsers (mobile Safari, etc.)
                const ta = document.createElement("textarea");
                ta.value = query;
                ta.setAttribute("readonly", "");
                ta.style.position = "absolute";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                ta.setSelectionRange(0, 99999);
                document.execCommand("copy");
                document.body.removeChild(ta);
            }

            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 1500);
        } catch (err) {
            console.error("Failed to copy:", err);
            // eslint-disable-next-line no-alert
            alert(`Copy this query manually:\n${query}`);
        }
    };

    const [copySuccess, setCopySuccess] = useState(false);

    return (
        <main
            className={`min-h-screen ${
                theme === "dark" ? "bg-black text-white" : "bg-white text-black"
            } font-sans`}
        >
            <div className="app-shell mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
                <header className="flex flex-col gap-2">
                    {/* <p className="secure-badge">{labels.secureMessaging}</p> */}
                    <h1 className="app-title">{labels.appTitle}</h1>
                    {/* <p className="app-subtitle">{labels.subtitle}</p> */}

                    {/* Connection Status */}
                    <div className="flex items-center gap-2 text-xs">
                        {isCreatingChat && (
                            <span className="text-yellow-400">
                                ⏳ Creating chat room...
                            </span>
                        )}
                        {chatId && (
                            <>
                                <span
                                    className={
                                        connectionStatus === "connected"
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }
                                >
                                    {connectionStatus === "connected"
                                        ? "🟢 Connected"
                                        : "🔴 Disconnected"}
                                </span>
                                <span className="text-zinc-500">| Room:</span>
                                <div className="ml-3 flex items-center gap-2">
                                    <button
                                        onClick={copyRoomLink}
                                        className="copy-key-btn"
                                        title="Copy room key"
                                        aria-label="Copy room key"
                                    >
                                        <FiCopy className="w-8 h-8" />
                                    </button>

                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className={`copy-feedback ${
                                            copySuccess ? "visible" : ""
                                        }`}
                                    >
                                        {copySuccess ? "Copied" : ""}
                                    </div>
                                </div>
                            </>
                        )}
                        {error && (
                            <span className="text-red-400">⚠️ {error}</span>
                        )}
                    </div>
                </header>
                <section className="flex flex-col gap-4 ">
                    <div className="quick-actions-container">
                        <div className="quick-actions-grid">
                            {quickActions.map(
                                ({ label, color, icon: Icon, action }) => {
                                    if (label === "Call Person") {
                                        return (
                                            <div
                                                key={label}
                                                className="relative block w-full"
                                            >
                                                <button
                                                    className={`${color} action-button w-full`}
                                                    onClick={() =>
                                                        setShowCallDropdown(
                                                            (s) => !s
                                                        )
                                                    }
                                                    type="button"
                                                >
                                                    <Icon className="h-5 w-5" />
                                                    {/* <span className="text-sm font-semibold uppercase tracking-wide">
                                                        {label}
                                                    </span> */}
                                                </button>
                                                {showCallDropdown && (
                                                    <div
                                                        className={`call-dropdown ${
                                                            theme === "dark"
                                                                ? "dark"
                                                                : "light"
                                                        }`}
                                                    >
                                                        {callOptions.map(
                                                            (name) => (
                                                                <button
                                                                    key={name}
                                                                    type="button"
                                                                    className="call-option"
                                                                    onClick={() => {
                                                                        pushMessage(
                                                                            `${name} Ko Bulao`
                                                                        );
                                                                        setShowCallDropdown(
                                                                            false
                                                                        );
                                                                    }}
                                                                >
                                                                    {name}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={label}
                                            className={`${color} action-button w-full`}
                                            onClick={() =>
                                                action === "clear"
                                                    ? clearAll()
                                                    : pushMessage(
                                                          label === "Water"
                                                              ? "Paani Do"
                                                              : label
                                                      )
                                            }
                                            type="button"
                                        >
                                            <Icon className="h-5 w-5" />
                                            {/* <span className="text-sm font-semibold uppercase tracking-wide">
                                                {label}
                                            </span> */}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <div className="glass-panel">
                        <div className="flex items-center justify-between">
                            {/* <p className="text-sm uppercase tracking-[0.18em] text-white font-semibold bg-white/5 px-3 py-1 rounded-lg">
                                {labels.history}
                            </p> */}
                            <div className="flex items-center gap-3">
                                {/* <span className="text-xs text-zinc-500">
                                    {labels.newestFirst}
                                </span> */}
                            </div>
                        </div>
                        <div className="flex flex-col messages-list">
                            {draft.trim() && (
                                <article className="message-card live-preview">
                                    <p className="text-sm leading-relaxed message-text live-message-text">
                                        {draft}
                                    </p>
                                </article>
                            )}
                            {orderedMessages.map((message) => (
                                <article
                                    key={message.id}
                                    className="message-card"
                                >
                                    <p className="text-sm leading-relaxed message-text">
                                        {message.text}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
                handleTyping
                <footer
                    ref={footerRef}
                    className="sticky bottom-0 backdrop-blur"
                >
                    <div className="glass-panel flex flex-col gap-3">
                        {/* <label
                            className="text-xs uppercase tracking-[0.2em] text-zinc-500"
                            htmlFor="message"
                        >
                            {labels.newMessage}
                        </label> */}
                        <div className="flex items-center gap-3">
                            <textarea
                                ref={textareaRef}
                                id="message"
                                className="message-input"
                                placeholder={labels.placeholder}
                                value={draft}
                                rows={3}
                                onChange={(e) => handleTyping(e.target.value)}
                                onKeyDown={(e) => {
                                    // Enter submits, Shift+Enter inserts a newline
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        pushMessage(draft);
                                    }
                                }}
                            />
                            {/* Send button removed per request */}
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    );
}

export default App;
