export default function ChatPreview() {
  return (
    <div className="chat-preview fade-in">
      <div className="chat-preview-inner">
        <div className="preview-icon">💬</div>
        <h2 className="preview-title">Patient Chat Widget</h2>
        <p className="preview-sub">
          The AI agent is always active — patients reach out through the floating chat button on any page.
          The widget handles the full conversation: intake → qualification → scoring → appointment booking.
        </p>
        <div className="preview-features">
          {[
            ["⚡","Responds in under 60 seconds","Always-on, no manual intervention needed"],
            ["🎯","Intent classification","Understands what service the patient needs"],
            ["📊","Lead scoring","Automatically grades Hot / Warm / Cold"],
            ["📅","Autonomous booking","Confirms appointments for Hot leads instantly"],
            ["🔁","Continuous learning","Improves conversion rates week over week"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="feature-card">
              <div className="feature-icon">{icon}</div>
              <div>
                <div className="feature-title">{title}</div>
                <div className="feature-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="preview-hint">↘ Open the chat widget in the bottom-right corner to try it live.</p>
      </div>
    </div>
  );
}
