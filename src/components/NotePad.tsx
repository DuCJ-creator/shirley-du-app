import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { FileText, X, Plus, Edit, Trash2, Download, Check, BookOpen } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from '../lib/utils';
import { StudyNote } from '../types';
import { getLocalDateString } from '../lib/helpers';

export const NotePad = ({ notes, onSave, onDelete }: { notes: StudyNote[], onSave: (note: Partial<StudyNote>) => void, onDelete: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<StudyNote> | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'drawing'>('text');
  const [color, setColor] = useState('#fef08a');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();

  const colors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#ddd6fe'];

  useEffect(() => {
    if (activeTab === 'drawing' && canvasRef.current && currentNote?.drawingData) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.clearRect(0, 0, 800, 600);
        ctx?.drawImage(img, 0, 0);
      };
      img.src = currentNote.drawingData;
    }
  }, [activeTab, currentNote?.id]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setLastPos(pos);
  };

  const getPos = (e: any) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvasRef.current!.width / rect.width),
      y: (clientY - rect.top) * (canvasRef.current!.height / rect.height)
    };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setCurrentNote(prev => ({ ...prev, drawingData: dataUrl }));
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleExport = async () => {
    const notesToExport = notes.filter(n => selectedIds.has(n.id));
    if (notesToExport.length === 0) {
      alert("Please select at least one note to export.");
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      doc.setFontSize(22);
      doc.text("My Selected Space Logs", 20, yPos);
      yPos += 15;

      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.zIndex = '-1000';
      document.body.appendChild(container);

      for (const note of notesToExport) {
        const noteEl = document.createElement('div');
        noteEl.style.width = '800px';
        noteEl.style.minHeight = '1000px';
        noteEl.style.backgroundColor = note.color;
        noteEl.style.padding = '60px';
        noteEl.style.position = 'relative';
        noteEl.style.fontFamily = 'Inter, sans-serif';
        noteEl.style.fontSize = '32px';
        noteEl.style.lineHeight = '1.6';
        noteEl.style.color = '#1a1a1a';
        noteEl.style.whiteSpace = 'pre-wrap';
        noteEl.style.borderRadius = '40px';
        noteEl.style.overflow = 'hidden';
        
        const textContent = document.createElement('div');
        textContent.textContent = note.content || '';
        noteEl.appendChild(textContent);
        
        if (note.drawingData) {
          const img = document.createElement('img');
          img.src = note.drawingData;
          img.style.position = 'absolute';
          img.style.top = '0';
          img.style.left = '0';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          noteEl.appendChild(img);
        }

        container.appendChild(noteEl);
        
        const canvas = await html2canvas(noteEl, { 
          scale: 2, 
          backgroundColor: null,
          logging: false,
          useCORS: true 
        });
        const imgData = canvas.toDataURL('image/png');
        
        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (yPos + imgHeight > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Recorded At: ${note.date}`, 20, yPos);
        yPos += 5;

        doc.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 20;
        
        container.removeChild(noteEl);
      }

      document.body.removeChild(container);
      doc.save(`space-logs-${getLocalDateString()}.pdf`);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-32 right-8 w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl z-[2100] group pointer-events-auto"
      >
        <FileText className="w-6 h-6 text-white group-hover:text-cyan-400 transition-colors" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full text-[8px] flex items-center justify-center font-bold">{notes.length}</div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-24 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-[420px] h-[500px] sm:h-[600px] bg-[#fbf9f3] border border-[#d2cca1]/40 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.5),_0_0_0_1px_rgba(0,0,0,0.06)] z-[2500] flex flex-row pointer-events-auto overflow-hidden"
          >
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="w-10 bg-[#ebe7d8]/60 border-r border-[#d4cfbd]/80 relative flex flex-col justify-around py-6 z-20 select-none cursor-grab active:cursor-grabbing touch-none"
              title="Drag to move"
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="relative w-full h-4 flex items-center justify-end">
                  <div className="absolute -right-3.5 w-7 h-3 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 border border-slate-500/20 shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                  <div className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-slate-900/45 shadow-inner" />
                  <div className="absolute right-1 w-1.5 h-1.5 rounded-full bg-slate-900/30 shadow-inner" />
                </div>
              ))}
            </div>

            <div className="flex-1 flex flex-col h-full bg-[#fdfbf6] text-slate-800">
              <div 
                onPointerDown={(e) => dragControls.start(e)}
                className="h-14 flex items-center justify-between px-5 border-b border-[#e5dfcf] cursor-grab active:cursor-grabbing select-none touch-none bg-slate-50/50"
                title="Drag to move"
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] leading-none">Universal Log</span>
                    <span className="text-[7px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Sync: Active</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-200/50 rounded-xl text-slate-400 hover:text-slate-800 transition-all font-bold"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {currentNote && (
                <div className="px-5 py-2.5 border-b border-[#e5dfcf] flex items-center justify-between gap-4 select-none bg-[#fbf9f3]">
                  <div className="flex bg-slate-200/50 rounded-xl p-1 border border-slate-300/25">
                    <button 
                      onClick={() => setActiveTab('text')}
                      className={cn("px-4 py-1 flex text-[9px] font-black rounded-lg transition-all tracking-wider uppercase", activeTab === 'text' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >TEXT</button>
                    <button 
                      onClick={() => setActiveTab('drawing')}
                      className={cn("px-4 py-1 flex text-[9px] font-black rounded-lg transition-all tracking-wider uppercase", activeTab === 'drawing' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >DRAW</button>
                  </div>
                  <div className="flex gap-1">
                    {colors.map(c => (
                      <button 
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn("w-4 h-4 rounded-full border border-slate-400/40 transition-all", color === c ? "ring-2 ring-slate-800 scale-110 shadow-sm" : "opacity-60 hover:opacity-100")}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                {currentNote ? (
                  <div className="h-full flex flex-col gap-3">
                    <div 
                      className="flex-1 relative rounded-xl border border-[#e5dfcf] shadow-inner group/editor overflow-hidden"
                      style={{ backgroundColor: color || '#ffffff' }}
                    >
                      <div className="absolute inset-0 z-0">
                        <canvas 
                          ref={canvasRef}
                          width={800}
                          height={1000}
                          className={cn(
                            "w-full h-full",
                            activeTab === 'drawing' ? "cursor-crosshair z-20 pointer-events-auto" : "pointer-events-none z-0"
                          )}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>
                      
                      <textarea 
                        autoFocus={activeTab === 'text'}
                        className={cn(
                          "absolute inset-0 w-full h-full bg-transparent border-none focus:ring-0 text-slate-800 font-medium font-sans resize-none p-5 leading-6 z-10 notebook-paper-lined",
                          activeTab === 'drawing' ? "pointer-events-none opacity-40 select-none" : "pointer-events-auto opacity-100"
                        )}
                        value={currentNote.content}
                        onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                        placeholder={activeTab === 'text' ? "Write your transmission log here..." : ""}
                      />

                      <div className="absolute top-2 right-4 pointer-events-none">
                        <span className="text-[8px] font-black uppercase opacity-25 tracking-tighter text-slate-500">
                          {activeTab === 'drawing' ? "Drawing Mode Active" : "Text Mode Active"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-1 pb-1">
                      <button onClick={() => setCurrentNote(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest leading-none">Discard</button>
                      <button 
                        onClick={() => {
                          onSave({ ...currentNote, color });
                          setCurrentNote(null);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest shadow-sm hover:shadow active:scale-95 transition-all"
                      >Save Entry</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <header className="flex justify-between items-center mb-1">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stored Logs</h4>
                        <div className="flex gap-2.5">
                          <button 
                            onClick={() => setSelectedIds(new Set(notes.map(n => n.id)))} 
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase"
                          >Select All</button>
                          <button 
                            onClick={() => setSelectedIds(new Set())} 
                            className="text-[9px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase"
                          >Clear</button>
                        </div>
                      </div>
                      <button 
                        onClick={handleExport} 
                        disabled={isExporting || selectedIds.size === 0} 
                        className="text-[10px] font-bold text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-1.5 border border-[#e5dfcf] px-2.5 py-1 rounded-lg bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed group/btn shadow-xs active:scale-95"
                      >
                        <Download className="w-3 h-3 text-slate-500 group-hover/btn:text-indigo-600" /> 
                        {isExporting ? "GENERATING..." : `EXPORT PDF (${selectedIds.size})`}
                      </button>
                    </header>
                    
                    <button 
                      onClick={() => {
                        setCurrentNote({ content: '', id: Math.random().toString(36).substr(2, 9), color, type: 'text' });
                        setActiveTab('text');
                      }}
                      className="w-full h-14 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-3 hover:bg-[#faf6ea] hover:border-slate-400 transition-all text-slate-400 hover:text-slate-600 bg-white/60 shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">New Transmission</span>
                    </button>

                    <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-1">
                      {notes.map(note => (
                        <motion.div 
                          key={note.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => { setCurrentNote(note); setActiveTab(note.type as any || 'text'); }}
                          className={cn(
                            "rounded-xl p-4 group transition-all relative cursor-pointer border shadow-sm hover:shadow-md",
                            selectedIds.has(note.id) ? "border-indigo-500 ring-2 ring-indigo-500/10 scale-[1.01]" : "border-slate-200"
                          )}
                          style={{ backgroundColor: note.color || '#ffffff' }}
                        >
                          <div 
                            onClick={(e) => toggleSelect(note.id, e)}
                            className={cn(
                              "absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center transition-all z-10 shadow-md",
                              selectedIds.has(note.id) ? "bg-indigo-600 text-white border border-white scale-110" : "bg-white/70 text-slate-300 hover:bg-white hover:text-slate-500"
                            )}
                          >
                            <Check className={cn("w-3 h-3", !selectedIds.has(note.id) && "opacity-0")} />
                          </div>

                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-[8px] font-black uppercase opacity-40 tracking-tighter text-slate-600">{note.date}</span>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1 hover:bg-black/5 rounded"><Edit className="w-3 h-3 text-slate-500" /></button>
                              <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="p-1 hover:bg-black/5 rounded text-red-600"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                          {note.drawingData ? (
                            <div className="relative aspect-video bg-white/45 rounded-lg overflow-hidden mb-2 border border-slate-200">
                              <img src={note.drawingData} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Drawing preview" />
                            </div>
                          ) : null}
                          <p className="text-[11px] font-semibold text-slate-800 leading-normal line-clamp-2">{note.content}</p>
                        </motion.div>
                      ))}
                      {notes.length === 0 && (
                        <div className="py-16 text-center">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No logs found</p>
                          <p className="text-[9px] text-slate-400/80 mt-1 font-zh">建立新傳輸開始記錄</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
