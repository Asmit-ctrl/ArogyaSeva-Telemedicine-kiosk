import { useEffect, useMemo, useRef, useState } from "react";
import { sendAssistantMessage } from "../services/api";
import { usePatientStore } from "../store/patientStore";

const splitIntoCells = (text) =>
  String(text || "")
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

export default function ChatAssistant({ mode = "kiosk", context = {} }) {
  const patient = usePatientStore((state) => state.patient);
  const symptoms = usePatientStore((state) => state.symptoms);
  const vitals = usePatientStore((state) => state.vitals);
  const messageEndRef = useRef(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        mode === "doctor"
          ? "Doctor assistant is ready. Ask about routing, follow-up, or specialist choice."
          : "AI assistant is ready. Ask about symptoms, next steps, or doctor recommendations.",
      recommendations: []
    }
  ]);
  const placeholder = useMemo(
    () =>
      mode === "doctor"
        ? "Ask for clinical support, follow-up, or specialist recommendation"
        : "Ask about symptoms, next step, or which doctor is best",
    [mode]
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = async ({ textOverride, selectedDoctor } = {}) => {
    const nextText = textOverride ?? input;
    if (!nextText.trim() || loading) {
      return;
    }

    const currentInput = nextText.trim();
    const nextUserMessage = {
      role: "user",
      text: currentInput,
      recommendations: []
    };
    setMessages((current) => [...current, nextUserMessage]);
    setLoading(true);
    setInput("");

    try {
      const response = await sendAssistantMessage({
        message: currentInput,
        patient,
        symptoms,
        vitals,
        mode,
        selectedDoctor: selectedDoctor || undefined,
        history: [...messages, nextUserMessage].slice(-8).map((messageItem) => ({
          role: messageItem.role,
          text: messageItem.text
        })),
        ...context
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: response.data.reply,
          recommendations: response.data.recommendedDoctors || []
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: error?.response?.data?.message || error?.message || "Assistant is temporarily unavailable.",
          recommendations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card assistant-card">
      <div className="assistant-header">
        <div>
          <h3>{mode === "doctor" ? "Doctor AI Assistant" : "AI Health Assistant"}</h3>
          <p className="assistant-subtitle">
            {mode === "doctor"
              ? "Clinical support, routing hints, and follow-up suggestions"
              : "Symptom help, next steps, and doctor recommendations"}
          </p>
        </div>
        <span className={`assistant-status ${loading ? "busy" : "idle"}`}>{loading ? "Thinking..." : "Online"}</span>
      </div>
      <div className="assistant-messages">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`assistant-row ${message.role}`}>
            <div className={`assistant-avatar ${message.role}`}>{message.role === "assistant" ? "AI" : "You"}</div>
            <div className={`assistant-message ${message.role}`}>
              <div className="assistant-message-stack">
                {splitIntoCells(message.text).map((cell, cellIndex) => (
                  <div key={`${index}-${cellIndex}`} className={`assistant-message-cell ${message.role}`}>
                    {cell.split("\n").map((line, lineIndex) => (
                      <p key={`${index}-${cellIndex}-${lineIndex}`}>{line}</p>
                    ))}
                  </div>
                ))}
                {message.role === "assistant" && message.recommendations?.length ? (
                  <div className="assistant-recommendations">
                    {message.recommendations.map((doctor) => (
                      <div key={doctor.doctorId || doctor.name} className="assistant-recommendation-card">
                        <strong>{doctor.name}</strong>
                        <span>{doctor.specialization.replace(/_/g, " ")}</span>
                        <span>Wait {doctor.waitTimeMinutes || "--"} min</span>
                        <span>Rating {doctor.rating || "--"}</span>
                        <button
                          type="button"
                          className="assistant-recommendation-action"
                          disabled={loading}
                          onClick={() =>
                            send({
                              textOverride: `Tell me about ${doctor.name}`,
                              selectedDoctor: doctor
                            })
                          }
                        >
                          Select Doctor
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {loading ? (
          <div className="assistant-row assistant">
            <div className="assistant-avatar assistant">AI</div>
            <div className="assistant-message assistant">
              <div className="assistant-message-stack">
                <div className="assistant-message-cell assistant assistant-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div ref={messageEndRef} />
      </div>
      <div className="assistant-input-row">
        <input
          className="kiosk-input"
          placeholder={placeholder}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              send();
            }
          }}
        />
        <button className="assistant-send" onClick={send} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
