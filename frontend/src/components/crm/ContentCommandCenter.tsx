import { useState } from "react";
import { PageHeader } from "@/components/crm/primitives";
import { AgentChat } from "@/components/crm/AgentChat";
import { CreatePostModal } from "@/components/crm/CreatePostModal";
import { Sparkles, Calendar as CalendarIcon, Layout, List, Plus, CheckCircle, XCircle, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

type ViewType = 'calendar' | 'kanban' | 'list';

export function ContentCommandCenter() {
  const [view, setView] = useState<ViewType>('calendar');
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock data
  const posts = [
    { id: 1, title: "Product Launch Video", status: "pending_review", channel: "TikTok", date: new Date(2026, 5, 10), virality: 0.85 },
    { id: 2, title: "Industry Insights", status: "approved", channel: "LinkedIn", date: new Date(2026, 5, 15), virality: 0.70 },
  ];

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  return (
    <div className="flex h-full">
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isAgentOpen ? "mr-[400px]" : "mr-0"}`}>
        <PageHeader
          title="Content Command Center"
          description="Plan, adapt, approve, and track across channels."
          actions={
            <div className="flex gap-2">
              <div className="flex bg-surface border border-border rounded-md p-0.5">
                {(['calendar', 'kanban', 'list'] as ViewType[]).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`p-2 rounded ${view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    {v === 'calendar' && <CalendarIcon className="h-4 w-4"/>}
                    {v === 'kanban' && <Layout className="h-4 w-4"/>}
                    {v === 'list' && <List className="h-4 w-4"/>}
                  </button>
                ))}
              </div>
              <button onClick={() => setIsAgentOpen(true)} className="h-9 px-3 rounded-md bg-primary/10 text-primary text-sm flex items-center gap-1.5"><Sparkles className="h-4 w-4"/> AI Assistant</button>
              <button onClick={() => setIsModalOpen(true)} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-1.5"><Plus className="h-4 w-4"/> Create Post</button>
            </div>
          }
        />
        
        <div className="p-8">
          {view === 'calendar' && (
            <div className="surface-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{format(currentDate, "MMMM yyyy")}</h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 border rounded"><ChevronLeft className="h-4 w-4"/></button>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 border rounded"><ChevronRight className="h-4 w-4"/></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>)}
                {days.map(day => (
                  <div key={day.toString()} className="min-h-[100px] p-2 border rounded bg-surface-2">
                    <div className="text-xs text-muted-foreground mb-1">{format(day, "d")}</div>
                    {posts.filter(p => isSameDay(p.date, day)).map(p => (
                      <div key={p.id} className="text-[10px] bg-primary/10 text-primary p-1 rounded mb-1 truncate">{p.title}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {view !== 'calendar' && (
             <div className="surface-card p-6 min-h-[400px] flex items-center justify-center text-muted-foreground">
               {view === 'kanban' ? "Kanban View: Draft/Review/Scheduled/Published layout goes here." : "List View layout goes here."}
             </div>
          )}
        </div>
      </div>
      {isAgentOpen && (
        <div className="w-[400px] border-l border-border bg-surface fixed right-0 top-0 h-full shadow-2xl">
          <AgentChat contact={{ context: "Content Orchestration" }} onClose={() => setIsAgentOpen(false)} />
        </div>
      )}
      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
