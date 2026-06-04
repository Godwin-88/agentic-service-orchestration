import { useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { showToast } from "@/lib/ui";

export function AgentChat({ contact, onClose }: { contact: any; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'agent', text: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    
    showToast.loading("Agent thinking...");
    // Replace this with your actual agent-chat API call
    const response = await fetch("http://localhost:8000/agents/crm/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": "9c29f3fda00e04503fc37469c60e781140d0b805eae82f1d" },
      body: JSON.stringify({ query: userMsg, contact_data: contact })
    });
    
    const result = await response.json();
    setMessages(prev => [...prev, { role: 'agent', text: result.crm_response.response }]);
    showToast.success("Agent responded");
  };

  return (
    <div className="flex flex-col h-full border-l border-border bg-surface">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-primary"/> Agent Assistant</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'agent' && <Bot className="h-6 w-6 text-primary mt-1" />}
            <div className={`p-3 rounded-lg max-w-[80%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-surface-2'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-border flex gap-2">
        <input 
          className="flex-1 p-2 rounded bg-surface border border-border"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about this contact..."
        />
        <button onClick={sendMessage} className="bg-primary text-primary-foreground p-2 rounded"><Send className="h-4 w-4"/></button>
      </div>
    </div>
  );
}
