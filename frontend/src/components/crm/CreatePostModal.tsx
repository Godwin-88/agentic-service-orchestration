import { useState } from "react";
import { showToast } from "@/lib/ui";
import { createPost } from "@/lib/api/content.functions";
import { Upload, X } from "lucide-react";

const CHANNELS = [
  { id: '1', name: 'LinkedIn' },
  { id: '2', name: 'Instagram' },
  { id: '3', name: 'Facebook' },
  { id: '4', name: 'TikTok' },
];

export function CreatePostModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [content, setContent] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");

  if (!isOpen) return null;

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (selectedChannels.length === 0) {
      showToast.error("Please select at least one channel");
      return;
    }
    
    showToast.loading("Creating posts...");
    // For multi-channel, we'd loop or the backend should handle arrays
    const results = await Promise.all(selectedChannels.map(channel_id => 
      createPost({ data: { channel_id, content, scheduled_at: scheduledAt } })
    ));
    
    if (results.every(r => r.success)) {
      showToast.success("Posts created successfully");
      onClose();
    } else {
      showToast.error("Failed to create some posts");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border p-8 rounded-xl w-full max-w-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Compose Multi-Channel Post</h2>
          <button onClick={onClose}><X className="h-5 w-5"/></button>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <textarea className="w-full h-40 p-3 bg-surface-2 rounded-lg border" placeholder="Write your post content..." onChange={(e) => setContent(e.target.value)} />
            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-surface-2 cursor-pointer">
              <Upload className="h-8 w-8 mb-2"/>
              <p className="text-sm">Upload images or videos</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="font-medium text-sm">Select Channels</div>
            <div className="space-y-2">
              {CHANNELS.map(ch => (
                <button key={ch.id} onClick={() => toggleChannel(ch.id)} className={`w-full p-3 rounded-lg border text-left text-sm ${selectedChannels.includes(ch.id) ? 'bg-primary/10 border-primary' : 'bg-surface-2'}`}>
                  {ch.name}
                </button>
              ))}
            </div>
            <input type="datetime-local" className="w-full p-3 bg-surface-2 rounded-lg border" onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg hover:bg-surface-2">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium">Schedule Posts</button>
        </div>
      </div>
    </div>
  );
}
