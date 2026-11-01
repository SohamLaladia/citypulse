// CityPulse View: CITIZEN DASHBOARD
// Personal Civic Hub for Registered Citizens

const CitizenDashboardView = {
  activeStatusFilter: 'all',
  searchQuery: '',
  _complaints: null, // cached from API

  render() {
    // Use cached API data if available, else MockDB
    const citizenComplaints = this._complaints !== null ? this._complaints : MockDB.getAllComplaints();
    const total = citizenComplaints.length;
    const pending = citizenComplaints.filter(c => c.status === 'submitted' || c.status === 'assigned').length;
    const inProgress = citizenComplaints.filter(c => c.status === 'in_progress').length;
    const resolved = citizenComplaints.filter(c => c.status === 'resolved').length;
    const totalUpvotes = citizenComplaints.reduce((acc, c) => acc + (c.upvotes_count || 1), 0);

    // Fetch from API in background
    this._fetchAndRefresh();

    const userName = (AppState.currentUser && AppState.currentUser.name) ? AppState.currentUser.name : 'Aarav Sharma';
    const userWard = (AppState.currentUser && AppState.currentUser.ward) ? AppState.currentUser.ward : 'Ward 112 (Domlur / Indiranagar)';
    const userId = (AppState.currentUser && AppState.currentUser.id) ? AppState.currentUser.id : 'CIT-94021';

    return `
      <div class="space-y-8 pb-16 page-fade-in">

        <!-- ========================================== -->
        <!-- WELCOME HEADER                             -->
        <!-- ========================================== -->
        <div class="navy-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-cyan-400/20">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-md bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 text-[11px] font-mono font-semibold uppercase">
                Citizen Portal • ${userWard}
              </span>
              <span class="text-xs text-slate-400 font-mono">ID: ${userId}</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, <span class="text-electric-gradient">${userName}</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-300">
              Track your reported grievances, inspect live ward maintenance progress, and verify municipal repairs.
            </p>
          </div>

          <!-- Quick Action -->
          <div class="flex items-center gap-3 w-full md:w-auto">
            <button onclick="Router.navigate('report')" class="w-full md:w-auto px-5 py-3 rounded-xl bg-electric-gradient hover:opacity-95 text-navy-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all">
              ${Icons.get('plus', 'w-4 h-4 text-navy-950')}
              <span>Report a New Issue</span>
            </button>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- CIVIC ANNOUNCEMENT BANNER                  -->
        <!-- ========================================== -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 to-navy-900 border border-blue-500/30 flex items-start sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3">
            <span class="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
              ${Icons.get('bell', 'w-4 h-4')}
            </span>
            <div class="space-y-0.5">
              <p class="font-bold text-white flex items-center gap-2">
                <span>Ward 112 Advisory: Scheduled Road Resurfacing</span>
                <span class="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">PWD Ward Desk</span>
              </p>
              <p class="text-slate-300 text-[11px]">Asphalt micro-surfacing on 100ft Road and 12th Main junction scheduled for Sunday, 06:00 AM - 02:00 PM. Traffic diversions active.</p>
            </div>
          </div>
          <button onclick="Toast.show('Ward Advisory notification marked as acknowledged.', 'info')" class="text-slate-400 hover:text-white text-xs whitespace-nowrap hidden sm:inline">
            Acknowledge
          </button>
        </div>

        <!-- ========================================== -->
        <!-- CITIZEN KPI METRICS                        -->
        <!-- ========================================== -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div class="navy-card p-5 space-y-1 hover:border-cyan-400/40 transition-all">
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-400 font-medium">Total Complaints</p>
              <span class="p-1.5 rounded-lg bg-blue-500/10 text-cyan-400">${Icons.get('fileText', 'w-4 h-4')}</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-white font-mono">${total}</p>
            <p class="text-[11px] text-cyan-400 font-medium">Registered in ${userWard}</p>
          </div>

          <div class="navy-card p-5 space-y-1 hover:border-cyan-400/40 transition-all">
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-400 font-medium">Pending Review</p>
              <span class="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">${Icons.get('clock', 'w-4 h-4')}</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">${pending}</p>
            <p class="text-[11px] text-slate-400">In AI triage & routing</p>
          </div>

          <div class="navy-card p-5 space-y-1 hover:border-cyan-400/40 transition-all">
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-400 font-medium">In Progress</p>
              <span class="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">${Icons.get('wrench', 'w-4 h-4')}</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">${inProgress}</p>
            <p class="text-[11px] text-amber-400/90 font-medium">Field crew active on site</p>
          </div>

          <div class="navy-card p-5 space-y-1 hover:border-cyan-400/40 transition-all">
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-400 font-medium">Resolved & Verified</p>
              <span class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">${Icons.get('checkCircle', 'w-4 h-4')}</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">${resolved}</p>
            <p class="text-[11px] text-emerald-400 font-medium">${total ? Math.round((resolved/total)*100) : 0}% resolution rate</p>
          </div>

        </div>

        <!-- ========================================== -->
        <!-- COMPLAINT LIST & MANAGEMENT TABLE          -->
        <!-- ========================================== -->
        <div class="navy-card p-6 space-y-6">
          
          <!-- Filters & Search Toolbar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            <!-- Status Tabs -->
            <div class="flex items-center p-1 bg-navy-950/70 rounded-xl border border-slate-800 text-xs overflow-x-auto">
              <button 
                onclick="CitizenDashboardView.setFilter('all')" 
                class="px-3.5 py-1.5 rounded-lg transition-all font-semibold ${this.activeStatusFilter === 'all' ? 'bg-cyan-500 text-navy-950' : 'text-slate-400 hover:text-white'}"
              >
                All (${total})
              </button>
              <button 
                onclick="CitizenDashboardView.setFilter('pending')" 
                class="px-3.5 py-1.5 rounded-lg transition-all font-semibold ${this.activeStatusFilter === 'pending' ? 'bg-cyan-500 text-navy-950' : 'text-slate-400 hover:text-white'}"
              >
                Pending (${pending})
              </button>
              <button 
                onclick="CitizenDashboardView.setFilter('in_progress')" 
                class="px-3.5 py-1.5 rounded-lg transition-all font-semibold ${this.activeStatusFilter === 'in_progress' ? 'bg-cyan-500 text-navy-950' : 'text-slate-400 hover:text-white'}"
              >
                In Progress (${inProgress})
              </button>
              <button 
                onclick="CitizenDashboardView.setFilter('resolved')" 
                class="px-3.5 py-1.5 rounded-lg transition-all font-semibold ${this.activeStatusFilter === 'resolved' ? 'bg-cyan-500 text-navy-950' : 'text-slate-400 hover:text-white'}"
              >
                Resolved (${resolved})
              </button>
            </div>

            <!-- Search Field -->
            <div class="relative w-full sm:w-64">
              <span class="absolute left-3 top-2.5 text-slate-400">
                ${Icons.get('search', 'w-4 h-4')}
              </span>
              <input 
                type="text" 
                id="citizen-search-input"
                placeholder="Search by ID, keyword..."
                value="${this.searchQuery}"
                oninput="CitizenDashboardView.handleSearch(this.value)"
                class="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-navy-950/70 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

          </div>

          <!-- Table Container -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th class="py-3 px-4">Ticket ID</th>
                  <th class="py-3 px-4">Issue Description & Locality</th>
                  <th class="py-3 px-4">Category</th>
                  <th class="py-3 px-4">Priority</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Submitted</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                ${this.renderTableRows(citizenComplaints)}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    `;
  },

  async _fetchAndRefresh() {
    try {
      if (!window.API) return;
      const res = await API.getComplaints({ limit: 100 });
      const complaints = (res && res.complaints) ? res.complaints : (Array.isArray(res) ? res : []);
      if (!complaints.length) return;

      this._complaints = complaints;

      if (Router.currentRoute === 'citizen-dashboard') {
        const appContent = document.getElementById('app-content');
        if (appContent) {
          appContent.innerHTML = this.render();
          // render() calls _fetchAndRefresh again — prevent infinite loop by clearing before re-render
        }
      }
    } catch (e) {
      console.warn('Citizen dashboard: using local MockDB fallback', e.message);
    }
  },

  renderTableRows(allComplaints) {
    let list = allComplaints;

    // Filter by status
    if (this.activeStatusFilter === 'pending') {
      list = list.filter(c => c.status === 'submitted' || c.status === 'assigned');
    } else if (this.activeStatusFilter === 'in_progress') {
      list = list.filter(c => c.status === 'in_progress');
    } else if (this.activeStatusFilter === 'resolved') {
      list = list.filter(c => c.status === 'resolved');
    }

    // Filter by search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c => 
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.locality && c.locality.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q))
      );
    }

    if (!list.length) {
      return `
        <tr>
          <td colspan="7" class="py-8 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center gap-2">
              ${Icons.get('info', 'w-6 h-6 text-slate-500')}
              <p class="font-medium">No complaints match your current filter.</p>
              <button onclick="CitizenDashboardView.setFilter('all')" class="text-cyan-400 underline text-xs">Reset filters</button>
            </div>
          </td>
        </tr>
      `;
    }

    return list.slice(0, 15).map(c => {
      const statusBadge = this.getStatusBadge(c.status);
      const sevBadge = this.getSeverityBadge(c.severity);
      const dateFormatted = c.created_at ? c.created_at.slice(0, 10) : 'Recent';

      return `
        <tr class="hover:bg-navy-800/40 transition-colors group">
          
          <!-- ID -->
          <td class="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
            <button onclick="Router.navigate('track', '${c.id}')" class="hover:underline flex items-center gap-1">
              <span>${c.id}</span>
              ${Icons.get('chevronRight', 'w-3 h-3 text-cyan-400/60 group-hover:translate-x-0.5 transition-transform')}
            </button>
          </td>

          <!-- Title & Locality -->
          <td class="py-3 px-4 max-w-xs">
            <div class="space-y-0.5">
              <p class="font-semibold text-white truncate" title="${c.title}">${c.title}</p>
              <p class="text-[11px] text-slate-400 truncate flex items-center gap-1">
                ${Icons.get('mapPin', 'w-3 h-3 text-slate-400')}
                <span>${c.address || c.locality || '—'}</span>
              </p>
            </div>
          </td>

          <!-- Category -->
          <td class="py-3 px-4 whitespace-nowrap">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-[11px] border border-slate-700">
              ${Icons.get(this.getCategoryIcon(c.category), 'w-3 h-3 text-cyan-400')}
              <span>${c.category}</span>
            </span>
          </td>

          <!-- Priority -->
          <td class="py-3 px-4 whitespace-nowrap">
            ${sevBadge}
          </td>

          <!-- Status -->
          <td class="py-3 px-4 whitespace-nowrap">
            ${statusBadge}
          </td>

          <!-- Submitted Date -->
          <td class="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
            ${dateFormatted}
          </td>

          <!-- Action -->
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <div class="inline-flex items-center gap-1.5">
              <button 
                onclick="Router.navigate('track', '${c.id}')" 
                class="px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-cyan-500 hover:text-navy-950 text-cyan-400 font-semibold border border-cyan-400/30 transition-all text-[11px]"
                title="View full status timeline"
              >
                Track
              </button>
              <button 
                onclick="CitizenDashboardView.upvote('${c.id}')" 
                class="px-2 py-1 rounded-lg bg-navy-900 hover:bg-navy-700 text-slate-300 font-mono text-[11px] border border-slate-700 flex items-center gap-1 transition"
                title="Endorse this civic issue"
              >
                ▲ <span id="upvotes-${c.id}">${c.upvotes_count || 1}</span>
              </button>
            </div>
          </td>

        </tr>
      `;
    }).join('');
  },

  getStatusBadge(status) {
    switch (status) {
      case 'resolved':
        return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full badge-resolved text-[11px] font-semibold font-mono">● Resolved</span>`;
      case 'in_progress':
        return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full badge-in_progress text-[11px] font-semibold font-mono">● In Progress</span>`;
      case 'assigned':
        return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full badge-assigned text-[11px] font-semibold font-mono">● Assigned</span>`;
      default:
        return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full badge-submitted text-[11px] font-semibold font-mono">● Submitted</span>`;
    }
  },

  getSeverityBadge(sev) {
    if (sev === 'Critical' || sev === 'High') {
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md badge-critical text-[11px] font-bold">High</span>`;
    } else if (sev === 'Medium') {
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium">Medium</span>`;
    } else {
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-300 border border-slate-500/20 text-[11px]">Low</span>`;
    }
  },

  getCategoryIcon(cat) {
    if (!cat) return 'alertTriangle';
    if (cat.includes('Road')) return 'road';
    if (cat.includes('Water')) return 'droplet';
    if (cat.includes('Garbage')) return 'trash';
    if (cat.includes('Light') || cat.includes('Electricity')) return 'zap';
    if (cat.includes('Drain')) return 'wrench';
    return 'alertTriangle';
  },

  setFilter(status) {
    this.activeStatusFilter = status;
    Router.renderCurrent();
  },

  handleSearch(val) {
    this.searchQuery = val;
    Router.renderCurrent();
  },

  async upvote(id) {
    // Optimistically update the UI count
    const el = document.getElementById(`upvotes-${id}`);
    const currentCount = el ? parseInt(el.textContent) : 1;
    if (el) el.textContent = currentCount + 1;
    Toast.show(`Endorsement recorded for ${id}. Increased priority score.`, 'success');

    // Also update MockDB locally
    MockDB.upvoteComplaint(id);

    // Persist to API
    try {
      if (window.API) {
        await API.supportComplaint(id);
      }
    } catch (e) {
      console.warn('Upvote persisted locally only:', e.message);
    }
  }
};
