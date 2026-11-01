// CityPulse View: COMPLAINT TRACKING PAGE
// Transparent Civic Timeline, Before/After Evidence & Citizen Sign-Off

const ComplaintTrackingView = {
  currentComplaintId: 'CP-2026-BLR01',
  selectedRating: 5,
  _cache: {}, // id -> complaint object from API

  render(complaintId) {
    if (complaintId) {
      this.currentComplaintId = complaintId;
    }

    // Try cached API data first, then MockDB
    let complaint = this._cache[this.currentComplaintId] || MockDB.getComplaintById(this.currentComplaintId);
    if (!complaint) {
      const all = MockDB.getAllComplaints();
      complaint = all[0];
      this.currentComplaintId = complaint ? complaint.id : 'CP-2026-BLR01';
    }

    // Kick off async fetch (non-blocking)
    this._fetchComplaint(this.currentComplaintId);

    if (!complaint) {
      return `
        <div class="navy-card p-12 text-center space-y-4 max-w-xl mx-auto my-12">
          ${Icons.get('alertCircle', 'w-12 h-12 text-rose-400 mx-auto')}
          <h2 class="text-xl font-bold text-white">No Complaints Found in System</h2>
          <p class="text-xs text-slate-300">Submit a new complaint or reset the database to view tracking timeline.</p>
          <button onclick="Router.navigate('report')" class="px-5 py-2.5 rounded-xl bg-electric-gradient text-navy-950 font-bold text-xs">
            Report First Complaint
          </button>
        </div>
      `;
    }

    const isResolved = complaint.status === 'resolved';

    return `
      <div class="max-w-5xl mx-auto space-y-8 pb-16 page-fade-in">

        <!-- ========================================== -->
        <!-- SEARCH / LOOKUP TOOLBAR                    -->
        <!-- ========================================== -->
        <div class="navy-card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-cyan-400/20">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <span class="text-cyan-400">
              ${Icons.get('search', 'w-5 h-5')}
            </span>
            <input 
              type="text" 
              id="tracking-search-input"
              value="${this.currentComplaintId}" 
              placeholder="Search Ticket ID (e.g. CP-2026-BLR01)..."
              class="bg-navy-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 font-mono w-full sm:w-64 focus:outline-none focus:border-cyan-400"
              onkeydown="if(event.key === 'Enter') ComplaintTrackingView.searchTicket()"
            />
            <button 
              onclick="ComplaintTrackingView.searchTicket()"
              class="px-4 py-2 rounded-xl bg-cyan-500 text-navy-950 font-bold text-xs hover:bg-cyan-400 transition"
            >
              Track
            </button>
          </div>

          <!-- Quick Suggestions -->
          <div class="flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto w-full sm:w-auto">
            <span class="text-[11px] font-mono shrink-0">Sample Tickets:</span>
            <button onclick="Router.navigate('track', 'CP-2026-BLR01')" class="px-2 py-0.5 rounded bg-navy-950 hover:bg-slate-800 text-cyan-400 font-mono text-[11px] border border-slate-800">BLR01</button>
            <button onclick="Router.navigate('track', 'CP-2026-BLR03')" class="px-2 py-0.5 rounded bg-navy-950 hover:bg-slate-800 text-emerald-400 font-mono text-[11px] border border-slate-800">BLR03 (Resolved)</button>
            <button onclick="Router.navigate('track', 'CP-2026-BLR05')" class="px-2 py-0.5 rounded bg-navy-950 hover:bg-slate-800 text-amber-400 font-mono text-[11px] border border-slate-800">BLR05 (Active)</button>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- COMPLAINT SUMMARY PROFILE CARD             -->
        <!-- ========================================== -->
        <div class="navy-card p-6 sm:p-8 space-y-6 relative overflow-hidden border-cyan-400/30">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 font-mono font-bold text-sm tracking-wide">
                  ${complaint.id}
                </span>
                ${this.getStatusBadge(complaint.status)}
                ${this.getSeverityBadge(complaint.severity)}
                <span class="text-xs text-slate-400 font-mono">Submitted: ${complaint.created_at ? complaint.created_at.slice(0, 16).replace('T', ' ') : 'Oct 30, 2026'}</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                ${complaint.title}
              </h1>
              <p class="text-xs text-slate-300 max-w-3xl leading-relaxed">
                ${complaint.description}
              </p>
            </div>

            <!-- Action Buttons: Copy, Share, Print -->
            <div class="flex items-center gap-2 shrink-0">
              <button 
                onclick="ComplaintTrackingView.copyTicketId('${complaint.id}')"
                class="px-3 py-2 rounded-xl bg-navy-950 hover:bg-navy-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Copy Complaint ID"
              >
                ${Icons.get('qrCode', 'w-4 h-4 text-cyan-400')}
                <span>Copy ID</span>
              </button>
              <button 
                onclick="window.print()"
                class="px-3 py-2 rounded-xl bg-navy-950 hover:bg-navy-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Print Audit Report"
              >
                ${Icons.get('printer', 'w-4 h-4 text-slate-400')}
                <span>Print</span>
              </button>
            </div>

          </div>

          <!-- Metadata Grid: Location, Ward, Assigned Officer, SLA -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            
            <div class="p-3.5 rounded-xl bg-navy-950/70 border border-slate-800 space-y-1">
              <span class="text-[10px] text-slate-400 uppercase tracking-wide">Ward & Locality:</span>
              <p class="font-bold text-white truncate">${complaint.ward}</p>
              <p class="text-[11px] text-slate-400 truncate">${complaint.address}</p>
            </div>

            <div class="p-3.5 rounded-xl bg-navy-950/70 border border-slate-800 space-y-1">
              <span class="text-[10px] text-slate-400 uppercase tracking-wide">Responsible Department:</span>
              <p class="font-bold text-cyan-300 truncate">${complaint.assigned_department}</p>
              <p class="text-[11px] text-slate-400">Municipal Rapid Unit</p>
            </div>

            <div class="p-3.5 rounded-xl bg-navy-950/70 border border-slate-800 space-y-1">
              <span class="text-[10px] text-slate-400 uppercase tracking-wide">Assigned Engineer:</span>
              <p class="font-bold text-white truncate">${complaint.officer ? complaint.officer.name : 'Er. Rajesh Verma'}</p>
              <p class="text-[11px] text-emerald-400">${complaint.officer ? complaint.officer.designation : 'Executive Engineer'}</p>
            </div>

            <div class="p-3.5 rounded-xl bg-navy-950/70 border border-slate-800 space-y-1">
              <span class="text-[10px] text-slate-400 uppercase tracking-wide">Target Resolution SLA:</span>
              <p class="font-bold text-amber-400">Within 48 Hours</p>
              <p class="text-[11px] text-slate-400">Automated Audit Trail</p>
            </div>

          </div>

        </div>

        <!-- ========================================== -->
        <!-- TWO COLUMN: TIMELINE & EVIDENCE COMPARISON -->
        <!-- ========================================== -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- LEFT: Interactive Status Timeline (7 cols) -->
          <div class="lg:col-span-7 navy-card p-6 sm:p-8 space-y-6">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <span>Lifecycle Milestone Timeline</span>
                  <span class="text-[10px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded font-mono">Immutable</span>
                </h3>
                <p class="text-xs text-slate-400">Track timestamped municipal progression and field engineer actions.</p>
              </div>
              <span class="text-xs font-mono text-cyan-400 font-bold">${complaint.timeline.length} Steps</span>
            </div>

            <!-- Stepper Container -->
            <div class="relative space-y-6 pl-8">
              <!-- Timeline vertical line -->
              <div class="timeline-stem"></div>

              ${complaint.timeline.map((step, idx) => {
                const isStepCompleted = step.status === 'completed';
                const isStepInProgress = step.status === 'in-progress' || step.status === 'in_progress';

                let dotBg = "bg-slate-700 border-slate-600 text-slate-400";
                if (isStepCompleted) dotBg = "bg-emerald-500 border-emerald-400 text-navy-950";
                else if (isStepInProgress) dotBg = "bg-amber-500 border-amber-400 text-navy-950 radar-ping";

                return `
                  <div class="relative group">
                    <!-- Step Indicator Circle -->
                    <div class="absolute -left-8 top-0.5 w-6 h-6 rounded-full border-2 ${dotBg} flex items-center justify-center text-xs font-bold shadow-md z-10">
                      ${isStepCompleted ? '✔' : (idx + 1)}
                    </div>

                    <!-- Step Content Card -->
                    <div class="p-4 rounded-xl ${isStepCompleted ? 'bg-navy-950/80 border-slate-800' : (isStepInProgress ? 'bg-blue-950/40 border-cyan-500/40' : 'bg-navy-950/40 border-slate-800/60')} border space-y-1.5 transition-all">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>${step.title}</span>
                          ${isStepInProgress ? '<span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 font-mono">ACTIVE NOW</span>' : ''}
                        </h4>
                        <span class="text-[10px] font-mono text-slate-400">${step.time}</span>
                      </div>

                      <p class="text-xs text-slate-300 leading-relaxed">${step.desc}</p>
                      
                      <div class="pt-1 flex items-center gap-2 text-[10px] text-cyan-400 font-mono">
                        <span>Actor: ${step.actor}</span>
                      </div>
                    </div>

                  </div>
                `;
              }).join('')}

            </div>

          </div>

          <!-- RIGHT: Evidence Photos & Citizen Verification (5 cols) -->
          <div class="lg:col-span-5 space-y-6">
            
            <!-- Photographic Evidence Comparison Card -->
            <div class="navy-card p-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
                  ${Icons.get('camera', 'w-4 h-4 text-cyan-400')}
                  <span>Photographic Evidence</span>
                </h3>
                <span class="text-[10px] font-mono text-slate-400">Verification Proof</span>
              </div>

              <!-- Before Photo -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-semibold text-rose-300">Original Citizen Report (Before):</span>
                  <span class="text-[10px] text-slate-400 font-mono">Timestamp Verified</span>
                </div>
                <div class="rounded-xl overflow-hidden border border-slate-700 bg-navy-950">
                  <img 
                    src="${complaint.media_urls && complaint.media_urls.length ? complaint.media_urls[0] : 'assets/uploads/evidence_pothole_1.svg'}" 
                    alt="Citizen Evidence" 
                    class="w-full h-44 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              <!-- After Photo (If resolved) -->
              <div class="space-y-1.5 pt-2 border-t border-slate-800">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-semibold text-emerald-400">Post-Repair Field Proof (After):</span>
                  <span class="text-[10px] text-emerald-400 font-mono">${isResolved ? 'Verified by BBMP' : 'Awaiting Work Completion'}</span>
                </div>
                <div class="rounded-xl overflow-hidden border border-slate-700 bg-navy-950">
                  <img 
                    src="${complaint.resolved_photo || 'assets/uploads/resolved_pothole_1.svg'}" 
                    alt="Repair Evidence" 
                    class="w-full h-44 object-cover ${!isResolved ? 'opacity-40 grayscale' : 'hover:scale-105 transition-transform duration-300'}"
                  />
                </div>
                ${!isResolved ? '<p class="text-[10px] text-slate-400 text-center italic">Crews will upload completion photo upon site finishing.</p>' : ''}
              </div>

            </div>

            <!-- Citizen Satisfaction & Sign-off Widget -->
            <div class="navy-card p-6 space-y-4 border-cyan-400/30">
              <div class="space-y-1">
                <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
                  ${Icons.get('star', 'w-4 h-4 text-amber-400')}
                  <span>Citizen Satisfaction & Sign-Off</span>
                </h3>
                <p class="text-xs text-slate-300">
                  Rate municipal quality or dispute inadequate repair to automatically re-open the ticket.
                </p>
              </div>

              <!-- Star Rating -->
              <div class="space-y-1">
                <label class="block text-[10px] font-mono text-slate-400 uppercase">Service Quality Rating:</label>
                <div class="flex items-center gap-2">
                  ${[1, 2, 3, 4, 5].map(star => `
                    <button 
                      type="button" 
                      onclick="ComplaintTrackingView.setRating(${star})"
                      id="star-btn-${star}"
                      class="text-xl transition-transform hover:scale-125 ${star <= this.selectedRating ? 'text-amber-400' : 'text-slate-600'}"
                    >
                      ★
                    </button>
                  `).join('')}
                  <span id="rating-label" class="text-xs text-amber-300 font-mono ml-2 font-bold">${this.selectedRating} / 5 Stars</span>
                </div>
              </div>

              <!-- Feedback Comment -->
              <div class="space-y-1">
                <label class="block text-[10px] font-mono text-slate-400 uppercase">Citizen Feedback Note:</label>
                <textarea 
                  id="feedback-text" 
                  rows="2" 
                  placeholder="Share your experience or note any remaining defect..."
                  class="w-full p-2.5 rounded-xl bg-navy-950/80 border border-slate-700 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 resize-none"
                >${complaint.feedback ? complaint.feedback.comment : 'Pothole was patched within 24 hours. Good asphalt compaction.'}</textarea>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col sm:flex-row gap-2 pt-2">
                <button 
                  onclick="ComplaintTrackingView.confirmResolution('${complaint.id}')"
                  class="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs transition"
                >
                  ✔ Confirm & Close Ticket
                </button>
                <button 
                  onclick="ComplaintTrackingView.disputeResolution('${complaint.id}')"
                  class="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                >
                  Dispute Repair
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    `;
  },

  async _fetchComplaint(id) {
    if (!id || !window.API || this._fetching === id) return;
    this._fetching = id;
    try {
      const data = await API.getComplaintById(id);
      if (data && data.id) {
        // Normalize fields from backend schema
        if (data.resolution_evidence && data.resolution_evidence.image_url) {
          data.resolved_photo = data.resolved_photo || data.resolution_evidence.image_url;
        }
        if (Array.isArray(data.timeline)) {
          data.timeline = data.timeline.map((step, idx) => ({
            title: step.title || step.action || (step.status_to ? 'Status: ' + step.status_to.toUpperCase() : `Step ${idx + 1}`),
            desc: step.desc || step.notes || 'Status update recorded in municipal audit trail.',
            time: step.time || (step.created_at ? step.created_at.slice(0, 16).replace('T', ' ') : 'Recent'),
            actor: step.actor || step.actor_name || 'Municipal Engineer',
            status: step.status || (step.status_to === 'resolved' ? 'completed' : (step.status_to === 'in_progress' ? 'in_progress' : 'completed'))
          }));
        } else {
          data.timeline = [
            { title: 'Grievance Registered', desc: 'Complaint logged in Municipal Corporation system.', time: data.created_at ? data.created_at.slice(0, 16).replace('T', ' ') : 'Recent', actor: 'Citizen Portal', status: 'completed' },
            { title: 'AI Triage & Classification', desc: 'Automated urgency score and department routing assigned.', time: 'System Automated', actor: 'CityPulse AI Engine', status: 'completed' },
            { title: 'Field Crew Dispatch', desc: `Assigned to ${data.assigned_department || 'Ward Maintenance Crew'}.`, time: 'Within 2 Hours', actor: 'Ward Engineer', status: data.status === 'submitted' ? 'in_progress' : 'completed' }
          ];
          if (data.status === 'resolved') {
            data.timeline.push({ title: 'Repair Verified & Closed', desc: 'Field repair completed and resolution evidence uploaded.', time: data.updated_at ? data.updated_at.slice(0, 16).replace('T', ' ') : 'Recent', actor: 'Field Engineer', status: 'completed' });
          }
        }
        this._cache[id] = data;

        // Re-render if the user is still viewing this ticket
        if (Router.currentRoute === 'track' && (Router.currentParam === id || this.currentComplaintId === id)) {
          const appContent = document.getElementById('app-content');
          if (appContent) {
            appContent.innerHTML = this.render(id);
          }
        }
      }
    } catch (e) {
      console.warn(`Could not fetch ticket ${id} from API, using local data:`, e.message);
    } finally {
      this._fetching = null;
    }
  },

  getStatusBadge(status) {
    switch (status) {
      case 'resolved':
        return `<span class="px-2.5 py-0.5 rounded-full badge-resolved text-xs font-bold font-mono">● Resolved & Verified</span>`;
      case 'in_progress':
        return `<span class="px-2.5 py-0.5 rounded-full badge-in_progress text-xs font-bold font-mono">● In Progress</span>`;
      case 'assigned':
        return `<span class="px-2.5 py-0.5 rounded-full badge-assigned text-xs font-bold font-mono">● Assigned to Ward Crew</span>`;
      default:
        return `<span class="px-2.5 py-0.5 rounded-full badge-submitted text-xs font-bold font-mono">● Submitted</span>`;
    }
  },

  getSeverityBadge(sev) {
    if (sev === 'Critical' || sev === 'High') {
      return `<span class="px-2.5 py-0.5 rounded-md badge-critical text-xs font-bold font-mono">Priority: HIGH</span>`;
    } else {
      return `<span class="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-cyan-400 border border-blue-500/30 text-xs font-mono">Priority: NORMAL</span>`;
    }
  },

  setRating(star) {
    this.selectedRating = star;
    for (let i = 1; i <= 5; i++) {
      const btn = document.getElementById(`star-btn-${i}`);
      if (btn) {
        btn.className = `text-xl transition-transform hover:scale-125 ${i <= star ? 'text-amber-400' : 'text-slate-600'}`;
      }
    }
    const label = document.getElementById('rating-label');
    if (label) label.textContent = `${star} / 5 Stars`;
  },

  async confirmResolution(id) {
    const textEl = document.getElementById('feedback-text');
    const comment = textEl ? textEl.value.trim() : '';
    MockDB.addFeedback(id, this.selectedRating, comment);
    MockDB.updateComplaintStatus(id, 'resolved', comment || 'Resolution certified by citizen.');
    if (this._cache[id]) {
      this._cache[id].status = 'resolved';
    }
    Toast.show(`Ticket ${id} verified and officially closed! Thank you.`, 'success');
    Router.renderCurrent();

    try {
      if (window.API) {
        await API.disputeResolution(id, true, comment || 'Resolution confirmed by citizen.');
      }
    } catch (e) {
      console.warn('Backend confirmation synced locally only:', e.message);
    }
  },

  async disputeResolution(id) {
    const textEl = document.getElementById('feedback-text');
    const comment = textEl ? textEl.value.trim() : 'Citizen flagged inadequate repair.';
    MockDB.updateComplaintStatus(id, 'in_progress', `Dispute filed by citizen: ${comment}`);
    if (this._cache[id]) {
      this._cache[id].status = 'in_progress';
    }
    Toast.show(`Dispute filed for ${id}. Ticket reopened and escalated to Ward Engineer.`, 'warning');
    Router.renderCurrent();

    try {
      if (window.API) {
        await API.disputeResolution(id, false, comment);
      }
    } catch (e) {
      console.warn('Backend dispute synced locally only:', e.message);
    }
  },

  async searchTicket() {
    const input = document.getElementById('tracking-search-input');
    const val = input ? input.value.trim() : '';
    if (!val) {
      Toast.show('Please enter a Complaint ID to track.', 'warning');
      return;
    }

    // Check MockDB first
    let found = MockDB.getComplaintById(val);
    if (!found && window.API) {
      try {
        found = await API.getComplaintById(val);
        if (found) {
          this._cache[val] = found;
        }
      } catch (_) {}
    }

    if (!found) {
      Toast.show(`Ticket ID "${val}" was not found. Showing closest match.`, 'warning');
    }
    Router.navigate('track', val);
  },

  copyTicketId(id) {
    navigator.clipboard.writeText(id).then(() => {
      Toast.show(`Copied "${id}" to clipboard!`, 'info');
    }).catch(() => {
      Toast.show(`Complaint ID: ${id}`, 'info');
    });
  }
};
