import { useMemo, useState } from "react";
import {
    FiAlertCircle,
    FiBell,
    FiCoffee,
    FiDroplet,
    FiPhoneCall,
    FiTrash2,
} from "react-icons/fi";
import "./App.css";

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

    const orderedMessages = useMemo(() => messages, [messages]);

    const pushMessage = (text, isSent = true, status = "Sent") => {
        if (!text.trim()) return;
        setMessages((prev) => [
            {
                id: Date.now(),
                text: text.trim(),
                sender: isSent ? "You" : "Patient",
                time: "Just now",
                isSent,
                status,
            },
            ...prev,
        ]);
        setDraft("");
    };

    const clearAll = () => {
        setMessages([]);
        setDraft("");
    };

    return (
        <main
            className={`min-h-screen ${
                theme === "dark" ? "bg-black text-white" : "bg-white text-black"
            } font-sans`}
        >
            <div className="app-shell mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
                <header className="flex flex-col gap-2">
                    <p className="secure-badge">{labels.secureMessaging}</p>
                    <h1 className="app-title">{labels.appTitle}</h1>
                    <p className="app-subtitle">{labels.subtitle}</p>
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
                                                    <span className="text-sm font-semibold uppercase tracking-wide">
                                                        {label}
                                                    </span>
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
                                            <span className="text-sm font-semibold uppercase tracking-wide">
                                                {label}
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <div className="glass-panel">
                        <div className="flex items-center justify-between pb-3">
                            <p className="text-sm uppercase tracking-[0.18em] text-white font-semibold bg-white/5 px-3 py-1 rounded-lg">
                                {labels.history}
                            </p>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-zinc-500">
                                    {labels.newestFirst}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 messages-list">
                            {draft.trim() && (
                                <article className="message-card latest-message live-preview">
                                    <p className="mt-2 text-sm leading-relaxed message-text live-message-text">
                                        {draft}
                                    </p>
                                </article>
                            )}
                            {orderedMessages.map((message, idx) => (
                                <article
                                    key={message.id}
                                    className={`message-card ${
                                        message.isSent
                                            ? "sent-message"
                                            : "received-message"
                                    } ${idx === 0 ? "latest-message" : ""}`}
                                >
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold message-sender">
                                                {message.sender}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="message-time">
                                                {message.time}
                                            </span>
                                            <span
                                                className={`message-status ${
                                                    message.status
                                                        ? message.status.toLowerCase()
                                                        : message.isSent
                                                        ? "sent"
                                                        : "received"
                                                }`}
                                            >
                                                {message.status
                                                    ? message.status
                                                    : message.isSent
                                                    ? "Sent"
                                                    : "Received"}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed message-text">
                                        {message.text}
                                    </p>
                                </article>
                            ))}
                            {!orderedMessages.length && (
                                <p className="text-sm text-zinc-500">
                                    {labels.noMessages}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <footer className="sticky bottom-0 backdrop-blur">
                    <div className="glass-panel flex flex-col gap-3">
                        <label
                            className="text-xs uppercase tracking-[0.2em] text-zinc-500"
                            htmlFor="message"
                        >
                            {labels.newMessage}
                        </label>
                        <div className="flex items-center gap-3">
                            <textarea
                                id="message"
                                className="message-input"
                                placeholder={labels.placeholder}
                                value={draft}
                                rows={3}
                                onChange={(e) => setDraft(e.target.value)}
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
