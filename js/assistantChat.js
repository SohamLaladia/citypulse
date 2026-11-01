// CityPulse Conversational AI Assistant Widget
// Grounded strictly in real database records, geospatial queries, and government SLAs

const AssistantChat = {
  isOpen: false,
  isTyping: false,
  messages: [
    {
      role: 'assistant',
      text: "👋 Hello! I am **CityPulse AI**, your civic intelligence assistant.\n\nI can check the status of your complaints, query nearby hazardous issues via GPS, explain government SLAs (BBMP, BWSSB, BESCOM), or provide citywide statistics. What can I help you with?",
      tool_used: 'system_greeting',
      sources: []
    }
  ],

  init() {
    this.injectWidgetHtml();
    this.renderMessages();
  },

  injectWidgetHtml() {
    if (document.getElementById('citypulse-assistant-container')) return;

    const container = document.createElement('div');
    container.id = 'citypulse-assistant-container';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-none';

    container.innerHTML = `
      <!-- Chat Dialog Box -->
      <div 
        id="assistant-dialog" 
        class="hidden pointer-events-auto w-[360px] sm:w-[420px] max-w-[95vw] h-[540px] max-h-[80vh] flex flex-col bg-navy-900/95 backdrop-blur-xl border border-cyan-400/40 rounded-2xl shadow-2xl shadow-cyan-500/20 mb-3 overflow-hidden transition-all duration-300 transform scale-95 opacity-0"
      >
        <!-- Header -->
        <div class="px-4 py-3 bg-navy-950/90 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-electric-gradient flex items-center justify-center text-navy-950 font-bold shadow-md shadow-cyan-500/30">
              ${Icons.get('sparkles', 'w-4 h-4 text-navy-950')}
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-white">CityPulse AI</span>
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">Active</span>
              </div>
              <p class="text-[10px] text-slate-400">Strictly Grounded Civic Assistant</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button 
              onclick="AssistantChat.toggle()" 
              class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Close Chat"
            >
              ${Icons.get('close', 'w-4 h-4')}
            </button>
          </div>
        </div>

        <!-- Suggestion Chips Bar -->
        <div class="px-3 py-2 bg-navy-950/50 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <button onclick="AssistantChat.sendQuick('What is the status of my complaints?')" class="px-2.5 py-1 rounded-full bg-navy-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700/80 whitespace-nowrap transition">
            📋 My Complaints
          </button>
          <button onclick="AssistantChat.sendQuick('How many unresolved complaints are near me?')" class="px-2.5 py-1 rounded-full bg-navy-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700/80 whitespace-nowrap transition">
            📍 Nearby Issues
          </button>
          <button onclick="AssistantChat.sendQuick('What is the BBMP SLA for repairing potholes?')" class="px-2.5 py-1 rounded-full bg-navy-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700/80 whitespace-nowrap transition">
            📜 BBMP SLAs
          </button>
          <button onclick="AssistantChat.sendQuick('What are the citywide grievance statistics?')" class="px-2.5 py-1 rounded-full bg-navy-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700/80 whitespace-nowrap transition">
            📊 Statistics
          </button>
        </div>

        <!-- Message History List -->
        <div id="assistant-messages" class="flex-1 p-4 space-y-3.5 overflow-y-auto text-xs">
          <!-- Rendered dynamically -->
        </div>

        <!-- Input Footer -->
        <form onsubmit="AssistantChat.handleFormSubmit(event)" class="p-2.5 bg-navy-950/90 border-t border-slate-800 flex items-center gap-2">
          <input 
            type="text" 
            id="assistant-input" 
            placeholder="Ask about grievances, SLAs, nearby issues..." 
            class="flex-1 bg-navy-900 border border-slate-700 text-white placeholder-slate-400 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
            autocomplete="off"
          />
          <button 
            type="submit" 
            id="assistant-send-btn"
            class="px-3.5 py-2.5 rounded-xl bg-electric-gradient text-navy-950 font-bold hover:opacity-95 transition flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20"
          >
            ${Icons.get('send', 'w-4 h-4 text-navy-950')}
          </button>
        </form>
      </div>

      <!-- Floating Launcher Button -->
      <button 
        id="assistant-launcher"
        onclick="AssistantChat.toggle()" 
        class="pointer-events-auto px-4 py-3 rounded-full bg-electric-gradient text-navy-950 font-extrabold text-xs shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 group"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-navy-950 animate-ping"></span>
        <span class="tracking-wide">Ask CityPulse AI</span>
        <span class="p-1 rounded-full bg-navy-950/20 text-navy-950">
          ${Icons.get('sparkles', 'w-3.5 h-3.5')}
        </span>
      </button>
    `;

    document.body.appendChild(container);
  },

  toggle() {
    this.isOpen = !this.isOpen;
    const dialog = document.getElementById('assistant-dialog');
    const launcher = document.getElementById('assistant-launcher');

    if (this.isOpen) {
      dialog.classList.remove('hidden');
      setTimeout(() => {
        dialog.classList.remove('scale-95', 'opacity-0');
        dialog.classList.add('scale-100', 'opacity-100');
        document.getElementById('assistant-input').focus();
        this.scrollToBottom();
      }, 20);
      launcher.classList.add('opacity-80');
    } else {
      dialog.classList.remove('scale-100', 'opacity-100');
      dialog.classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        dialog.classList.add('hidden');
      }, 200);
      launcher.classList.remove('opacity-80');
    }
  },

  renderMessages() {
    const list = document.getElementById('assistant-messages');
    if (!list) return;

    let html = '';
    for (const msg of this.messages) {
      if (msg.role === 'user') {
        html += `
          <div class="flex justify-end">
            <div class="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-cyan-500 text-navy-950 font-medium shadow-sm leading-relaxed">
              ${this.escapeHtml(msg.text)}
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="flex justify-start">
            <div class="max-w-[90%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-navy-950 border border-slate-800 text-slate-100 space-y-2 shadow-sm leading-relaxed">
              ${msg.tool_used && msg.tool_used !== 'system_greeting' ? `
                <div class="flex items-center gap-1.5">
                  <span class="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/25">
                    ⚙️ Tool: ${msg.tool_used}
                  </span>
                </div>
              ` : ''}
              
              <div class="assistant-markdown space-y-1.5 leading-relaxed">
                ${this.formatMarkdown(msg.text)}
              </div>

              ${msg.sources && msg.sources.length ? `
                <div class="pt-2 border-t border-slate-800 text-[10px] space-y-1 text-slate-400">
                  <p class="font-bold uppercase tracking-wider text-cyan-400">Official Citations:</p>
                  ${msg.sources.map(s => `
                    <p class="truncate">• <a href="${s.url}" target="_blank" class="text-cyan-300 hover:underline">${s.title}</a> (${s.authority})</p>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }
    }

    if (this.isTyping) {
      html += `
        <div class="flex justify-start">
          <div class="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-navy-950 border border-slate-800 text-cyan-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style="animation-delay: 0.15s"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style="animation-delay: 0.3s"></span>
            <span class="text-[10px] text-slate-400 ml-1">Analyzing database & civic charter...</span>
          </div>
        </div>
      `;
    }

    list.innerHTML = html;
    this.scrollToBottom();
  },

  scrollToBottom() {
    const list = document.getElementById('assistant-messages');
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  },

  sendQuick(query) {
    if (!this.isOpen) this.toggle();
    const input = document.getElementById('assistant-input');
    if (input) input.value = query;
    this.sendMessage(query);
  },

  handleFormSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('assistant-input');
    const val = input.value.trim();
    if (!val || this.isTyping) return;
    input.value = '';
    this.sendMessage(val);
  },

  async sendMessage(query) {
    this.messages.push({ role: 'user', text: query });
    this.isTyping = true;
    this.renderMessages();

    // Context coordinates: Default to Indiranagar / Bengaluru
    const lat = 12.9719;
    const lon = 77.6412;
    const locality = "Indiranagar";

    try {
      const resp = await API.chatWithAssistant(query, lat, lon, locality);
      this.messages.push({
        role: 'assistant',
        text: resp.answer || "No response received.",
        tool_used: resp.tool_used,
        sources: resp.sources || []
      });
    } catch (err) {
      console.warn('Assistant API call error, falling back locally:', err);
      this.messages.push({
        role: 'assistant',
        text: `⚠️ **Municipal Assistant Connection Notice**: ${err.message || 'Unable to connect to assistant service.'}\n\nPlease ensure the CityPulse FastAPI server is running with \`uvicorn app.main:app --app-dir backend --port 8000\`.`,
        tool_used: 'fallback_error',
        sources: []
      });
    } finally {
      this.isTyping = false;
      this.renderMessages();
    }
  },

  escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  },

  formatMarkdown(text) {
    if (!text) return '';
    let out = this.escapeHtml(text);
    // Bold
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italics
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    out = out.replace(/`(.*?)`/g, '<code class="bg-navy-900 px-1 py-0.5 rounded text-cyan-300 font-mono text-[10px]">$1</code>');
    // Links [title](url)
    out = out.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-cyan-400 hover:underline font-semibold">$1</a>');
    // Bullet points
    out = out.replace(/^• (.*?)$/gm, '<li class="ml-3 list-disc">$1</li>');
    out = out.replace(/^- (.*?)$/gm, '<li class="ml-3 list-disc">$1</li>');
    // Headings
    out = out.replace(/^### (.*?)$/gm, '<h4 class="font-bold text-white text-xs mt-1">$1</h4>');
    // Line breaks
    out = out.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
    return out;
  }
};

window.AssistantChat = AssistantChat;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => AssistantChat.init(), 100);
});
