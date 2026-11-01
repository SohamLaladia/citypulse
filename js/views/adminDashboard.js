// CityPulse View: ADMIN DASHBOARD
// Municipal Command & Control Operations Center

const AdminDashboardView = {
  statusFilter: 'all',
  categoryFilter: 'all',
  wardFilter: 'all',
  searchQuery: '',
  chartInstance: null,
  _data: null, // cached API data

  render() {
    // Use cached API data if available, otherwise fall back to MockDB
    const stats = this._data ? this._data.stats : MockDB.getStatistics();
    const allComplaints = this._data ? this._data.complaints : MockDB.getAllComplaints();
    const wardStats = this._data ? this._data.wardStats : MockDB.getWardStatistics();
    const categoryDist = this._data ? this._data.categoryDist : MockDB.getCategoryDistribution();

    // Kick off async refresh (non-blocking — updates DOM when done)
    this._fetchAndRefresh();

    return this._buildHtml(stats, allComplaints, wardStats, categoryDist);
  },

  async _fetchAndRefresh() {
    try {
      if (!window.API) return;
      const [complaintsRes, analyticsRes] = await Promise.all([
        API.getAdminComplaints({ limit: 200 }),
        API.getAnalyticsOverview()
      ]);

      const complaints = (complaintsRes && complaintsRes.complaints) ? complaintsRes.complaints : (Array.isArray(complaintsRes) ? complaintsRes : []);
      const summary = (analyticsRes && analyticsRes.summary) ? analyticsRes.summary : {};

      // Build stats from API data
      const stats = {
        total: summary.total_complaints || complaints.length,
        pending: summary.pending_count || complaints.filter(c => c.status === 'submitted' || c.status === 'assigned').length,
        inProgress: summary.in_progress_count || complaints.filter(c => c.status === 'in_progress').length,
        resolved: summary.resolved_count || complaints.filter(c => c.status === 'resolved').length
      };

      // Build category distribution from complaint list
      const categoryDist = {};
      complaints.forEach(c => {
        categoryDist[c.category] = (categoryDist[c.category] || 0) + 1;
      });

      // Build ward stats from complaint list
      const wardMap = {};
      complaints.forEach(c => {
        const ward = c.ward || 'Unknown';
        if (!wardMap[ward]) wardMap[ward] = { name: ward, zone: 'Bangalore Urban', totalComplaints: 0, resolvedComplaints: 0 };
        wardMap[ward].totalComplaints++;
        if (c.status === 'resolved') wardMap[ward].resolvedComplaints++;
      });
      let wardStats = Object.values(wardMap).sort((a, b) => b.totalComplaints - a.totalComplaints).slice(0, 6).map(w => ({
        ...w,
        resolutionRate: w.totalComplaints ? Math.round((w.resolvedComplaints / w.totalComplaints) * 100) + '%' : '0%'
      }));
      // Pad with mock wards if API returned too few
      if (wardStats.length < 3) {
        const mockWards = MockDB.getWardStatistics();
        mockWards.forEach(mw => { if (!wardMap[mw.name]) wardStats.push(mw); });
      }

      this._data = { complaints, stats, categoryDist, wardStats };

      // Re-render only if still on admin dashboard
      if (Router.currentRoute === 'admin-dashboard') {
        const appContent = document.getElementById('app-content');
        if (appContent) {
          appContent.innerHTML = this._buildHtml(stats, complaints, wardStats, categoryDist);
          this.initChart();
        }
      }
    } catch (e) {
      console.warn('Admin dashboard: using local MockDB fallback', e.message);
    }
  },

  _buildHtml(stats, allComplaints, wardStats, categoryDist) {
    return `
      <div class="space-y-8 pb-16 page-fade-in">

        <!-- ========================================== -->
        <!-- COMMAND CENTER HEADER                      -->
        <!-- ========================================== -->
        <div class="navy-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-cyan-400/30">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-mono font-bold uppercase">
                Restricted • Municipal Corporation Command Room
              </span>
              <span class="text-xs text-slate-400 font-mono">Live Clock: 16:45:12 IST</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white">
              Municipal Operations & <span class="text-electric-gradient">Triage Control Hub</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-300">
              Real-time civic grievance dispatch, ward SLA compliance monitoring, and before/after repair audit.
            </p>
          </div>

          <!-- Quick Admin Action Buttons -->
          <div class="flex flex-wrap items-center gap-3">
            <button onclick="AdminDashboardView.exportCSV()" class="px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-navy-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition">
              ${Icons.get('download', 'w-4 h-4 text-cyan-400')}
              <span>Export CSV</span>
            </button>
            <button onclick="AdminDashboardView.resetDemoData()" class="px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-navy-800 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition" title="Restore default sample records">
              ${Icons.get('refresh', 'w-4 h-4')}
              <span>Reset Data</span>
            </button>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- KPI METRICS (4 Core Prompt Counters)       -->
        <!-- ========================================== -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div class="navy-card p-5 space-y-1 hover:border-cyan-400/40 transition-all">
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-400 font-medium">Total Complaints</p>
              <span class="p-1.5 rounded-lg bg-blue-500/10 text-cyan-400">${Icons.get('fileText', 'w-4 h-4')}</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-white font-mono">${stats.total}</p>
            <p class="text-[11px] text-cyan-400 font-medium">Active in Municipal Grid</p>
          </div>

          <div class="navy-card p-5 space-y-1 hover:border-cyan-400/40 transition-all">
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-400 font-medium">Pending Triage / New</p>
              <span class="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">${Icons.get('clock', 'w-4 h-4')}</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">${stats.pending}</p>
            <p class="text-[11px] text-slate-400">Awaiting field officer</p>
          </div>

          <div class="navy-card p-5 space-y-1 hover:border-cyan-400/40 transition-all">
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-400 font-medium">In-Progress Repairs</p>
              <span class="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">${Icons.get('wrench', 'w-4 h-4')}</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">${stats.inProgress}</p>
            <p class="text-[11px] text-amber-400/90 font-medium">Crews on site</p>
          </div>

          <div class="navy-card p-5 space-y-1 hover:border-cyan-400/40 transition-all">
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-400 font-medium">Resolved Complaints</p>
              <span class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">${Icons.get('checkCircle', 'w-4 h-4')}</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">${stats.resolved}</p>
            <p class="text-[11px] text-emerald-400 font-medium">${stats.total ? Math.round((stats.resolved/stats.total)*100) : 0}% resolution rate</p>
          </div>

        </div>

        <!-- ========================================== -->
        <!-- TWO COLUMN: CATEGORY CHARTS & WARD STATS   -->
        <!-- ========================================== -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Category Distribution Chart (5 cols) -->
          <div class="lg:col-span-5 navy-card p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
                  ${Icons.get('pieChart', 'w-4 h-4 text-cyan-400')}
                  <span>Category Distribution</span>
                </h3>
                <p class="text-[11px] text-slate-400">Incident breakdown across civic sectors</p>
              </div>
              <span class="text-[10px] font-mono bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded">Live Breakdown</span>
            </div>

            <!-- Canvas Container -->
            <div class="relative h-64 w-full flex items-center justify-center">
              <canvas id="category-chart"></canvas>
            </div>

            <!-- Category Legend -->
            <div class="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800 font-mono">
              <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Roads: ${categoryDist['Roads and potholes'] || 0}</div>
              <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Water: ${categoryDist['Water supply and leakage'] || 0}</div>
              <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Sanitation: ${categoryDist['Garbage and sanitation'] || 0}</div>
              <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Lighting: ${categoryDist['Streetlights and electricity'] || 0}</div>
            </div>
          </div>

          <!-- Locality-Wise Ward Statistics Table (7 cols) -->
          <div class="lg:col-span-7 navy-card p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
                  ${Icons.get('barChart', 'w-4 h-4 text-cyan-400')}
                  <span>Locality-Wise Ward Performance</span>
                </h3>
                <p class="text-[11px] text-slate-400">Zonal SLA compliance and resolution speed</p>
              </div>
              <span class="text-[10px] font-mono text-emerald-400">6 Monitored Sectors</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs font-mono">
                <thead class="text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3">Ward / Locality</th>
                    <th class="py-2.5 px-3">Zone</th>
                    <th class="py-2.5 px-3 text-center">Complaints</th>
                    <th class="py-2.5 px-3 text-center">Resolved</th>
                    <th class="py-2.5 px-3 text-right">SLA Adherence</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80">
                  ${wardStats.map(w => `
                    <tr class="hover:bg-navy-800/40 transition">
                      <td class="py-2.5 px-3 font-bold text-white">${w.name}</td>
                      <td class="py-2.5 px-3 text-slate-400">${w.zone}</td>
                      <td class="py-2.5 px-3 text-center text-cyan-300 font-bold">${w.totalComplaints}</td>
                      <td class="py-2.5 px-3 text-center text-emerald-400 font-bold">${w.resolvedComplaints}</td>
                      <td class="py-2.5 px-3 text-right font-bold text-emerald-400">${w.resolutionRate}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        <!-- ========================================== -->
        <!-- COMPLAINT MANAGEMENT TABLE (With Actions)  -->
        <!-- ========================================== -->
        <div class="navy-card p-6 space-y-6">
          
          <!-- Table Header & Multi-Filter Bar -->
          <div class="space-y-4">
            
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <span>Complaint Management Master Table</span>
                  <span class="text-[10px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold">Live Admin View</span>
                </h3>
                <p class="text-xs text-slate-400">Directly update ticket statuses, assign officers, or inspect AI analysis.</p>
              </div>

              <!-- Search Bar -->
              <div class="relative w-full sm:w-72">
                <span class="absolute left-3 top-2.5 text-slate-400">
                  ${Icons.get('search', 'w-4 h-4')}
                </span>
                <input 
                  type="text"
                  placeholder="Filter by ID, locality, keyword..."
                  value="${this.searchQuery}"
                  oninput="AdminDashboardView.handleSearch(this.value)"
                  class="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-navy-950/70 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <!-- Filters Row -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <!-- Status Filter -->
              <div>
                <label class="block text-[10px] font-mono text-slate-400 uppercase mb-1">Status Filter:</label>
                <select 
                  onchange="AdminDashboardView.handleStatusFilter(this.value)"
                  class="w-full text-xs bg-navy-950/70 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">All Statuses (${allComplaints.length})</option>
                  <option value="submitted" ${this.statusFilter === 'submitted' ? 'selected' : ''}>Submitted (${stats.pending})</option>
                  <option value="in_progress" ${this.statusFilter === 'in_progress' ? 'selected' : ''}>In Progress (${stats.inProgress})</option>
                  <option value="resolved" ${this.statusFilter === 'resolved' ? 'selected' : ''}>Resolved (${stats.resolved})</option>
                </select>
              </div>

              <!-- Category Filter -->
              <div>
                <label class="block text-[10px] font-mono text-slate-400 uppercase mb-1">Category Filter:</label>
                <select 
                  onchange="AdminDashboardView.handleCategoryFilter(this.value)"
                  class="w-full text-xs bg-navy-950/70 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">All Categories</option>
                  ${CATEGORIES.map(c => `<option value="${c.id}" ${this.categoryFilter === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select>
              </div>

              <!-- Ward Filter -->
              <div>
                <label class="block text-[10px] font-mono text-slate-400 uppercase mb-1">Ward Filter:</label>
                <select 
                  onchange="AdminDashboardView.handleWardFilter(this.value)"
                  class="w-full text-xs bg-navy-950/70 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">All Wards (42)</option>
                  ${WARDS.map(w => `<option value="${w.id}" ${this.wardFilter === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
                </select>
              </div>

            </div>

          </div>

          <!-- Table Content -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th class="py-3 px-3">Ticket ID</th>
                  <th class="py-3 px-3">Grievance & Locality</th>
                  <th class="py-3 px-3">Category</th>
                  <th class="py-3 px-3">Urgency</th>
                  <th class="py-3 px-3">Responsible Dept</th>
                  <th class="py-3 px-3">Status Action</th>
                  <th class="py-3 px-3 text-right">Triage</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                ${this.renderAdminTableRows(allComplaints)}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    `;
  },

  renderAdminTableRows(allComplaints) {
    let list = allComplaints;

    if (this.statusFilter !== 'all') {
      if (this.statusFilter === 'submitted') {
        list = list.filter(c => c.status === 'submitted' || c.status === 'assigned');
      } else {
        list = list.filter(c => c.status === this.statusFilter);
      }
    }

    if (this.categoryFilter !== 'all') {
      list = list.filter(c => c.category === this.categoryFilter);
    }

    if (this.wardFilter !== 'all') {
      list = list.filter(c => c.ward && c.ward.includes(this.wardFilter));
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c => 
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.locality && c.locality.toLowerCase().includes(q))
      );
    }

    if (!list.length) {
      return `
        <tr>
          <td colspan="7" class="py-8 text-center text-slate-400">
            No complaints match the specified administrative filters.
          </td>
        </tr>
      `;
    }

    return list.slice(0, 20).map(c => {
      return `
        <tr class="hover:bg-navy-800/40 transition">
          
          <!-- ID -->
          <td class="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
            <button onclick="Router.navigate('track', '${c.id}')" class="hover:underline">
              ${c.id}
            </button>
          </td>

          <!-- Title & Locality -->
          <td class="py-3 px-3 max-w-xs">
            <p class="font-semibold text-white truncate" title="${c.title}">${c.title}</p>
            <p class="text-[11px] text-slate-400 truncate">${c.ward || ''} • ${c.address || c.locality || ''}</p>
          </td>

          <!-- Category -->
          <td class="py-3 px-3 whitespace-nowrap text-slate-300">
            ${c.category}
          </td>

          <!-- Urgency -->
          <td class="py-3 px-3 whitespace-nowrap">
            <span class="font-mono text-xs font-bold ${(c.severity === 'High' || c.severity === 'Critical') ? 'text-rose-400' : 'text-blue-400'}">
              ${c.severity || 'Medium'}
            </span>
          </td>

          <!-- Responsible Dept -->
          <td class="py-3 px-3 whitespace-nowrap max-w-[180px] truncate text-slate-300">
            ${c.assigned_department || '—'}
          </td>

          <!-- Editable Status Dropdown (Direct Admin Action) -->
          <td class="py-3 px-3 whitespace-nowrap">
            <select 
              onchange="AdminDashboardView.updateStatus('${c.id}', this.value)"
              class="text-[11px] font-mono px-2 py-1 rounded-lg bg-navy-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="submitted" ${c.status === 'submitted' ? 'selected' : ''}>Submitted</option>
              <option value="in_progress" ${c.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="resolved" ${c.status === 'resolved' ? 'selected' : ''}>Resolved</option>
            </select>
          </td>

          <!-- Triage Modal Action -->
          <td class="py-3 px-3 text-right whitespace-nowrap">
            <button 
              onclick="AdminDashboardView.openTriageModal('${c.id}')"
              class="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 hover:text-navy-950 text-cyan-400 border border-cyan-400/30 text-[11px] font-semibold transition"
            >
              Inspect
            </button>
          </td>

        </tr>
      `;
    }).join('');
  },

  initChart() {
    setTimeout(() => {
      const canvas = document.getElementById('category-chart');
      if (!canvas || !window.Chart) return;

      const dist = (this._data && this._data.categoryDist) ? this._data.categoryDist : MockDB.getCategoryDistribution();
      const labels = ['Roads', 'Water', 'Waste', 'Lighting', 'Drainage', 'Other'];
      const data = [
        dist['Roads and potholes'] || 0,
        dist['Water supply and leakage'] || 0,
        dist['Garbage and sanitation'] || 0,
        dist['Streetlights and electricity'] || 0,
        dist['Drainage and sewage'] || 0,
        dist['Other civic issues'] || 0
      ];

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const ctx = canvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: [
              '#F59E0B', // Amber
              '#00D2FF', // Cyan
              '#10B981', // Emerald
              '#A855F7', // Purple
              '#3B82F6', // Blue
              '#64748B'  // Slate
            ],
            borderWidth: 2,
            borderColor: '#0B132B'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          cutout: '70%'
        }
      });
    }, 150);
  },

  handleStatusFilter(val) {
    this.statusFilter = val;
    Router.renderCurrent();
  },

  handleCategoryFilter(val) {
    this.categoryFilter = val;
    Router.renderCurrent();
  },

  handleWardFilter(val) {
    this.wardFilter = val;
    Router.renderCurrent();
  },

  handleSearch(val) {
    this.searchQuery = val;
    Router.renderCurrent();
  },

  async updateStatus(id, newStatus) {
    // Local update for immediate UI feedback (no page flicker)
    MockDB.updateComplaintStatus(id, newStatus, `Updated by Municipal Admin to ${newStatus}`);
    if (this._data && this._data.complaints) {
      const c = this._data.complaints.find(x => x.id === id);
      if (c) c.status = newStatus;
    }
    Toast.show(`Ticket ${id} status updated to: ${newStatus.toUpperCase()}`, 'success');
    Router.renderCurrent();

    // Persist to backend (fire-and-forget)
    try {
      if (window.API) {
        await API.updateComplaintStatus(id, newStatus, `Updated by Municipal Admin to ${newStatus}`);
      }
    } catch (e) {
      console.warn('Status update persisted locally only (API unavailable):', e.message);
    }
  },

  async openTriageModal(id) {
    // Try to fetch full complaint from API; fall back to MockDB
    let c = null;
    try {
      if (window.API) c = await API.getComplaintById(id);
    } catch (e) { /* fall through */ }
    if (!c) c = MockDB.getComplaintById(id);
    if (!c) {
      // Try to find in cached data
      if (this._data && this._data.complaints) {
        c = this._data.complaints.find(x => x.id === id);
      }
    }
    if (!c) {
      Toast.show(`Complaint ${id} not found.`, 'warning');
      return;
    }

    const modalHtml = `
      <div id="admin-triage-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
        <div class="navy-card p-6 sm:p-8 max-w-2xl w-full border-cyan-400/50 shadow-2xl space-y-5 page-fade-in max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span class="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">Admin Triage & Audit Inspector</span>
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>${c.id}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 font-mono">${c.status}</span>
              </h3>
            </div>
            <button onclick="AdminDashboardView.closeTriageModal()" class="text-slate-400 hover:text-white text-lg">✕</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <p class="font-bold text-white text-sm">${c.title}</p>
              <p class="text-slate-300 mt-1">${c.description}</p>
            </div>

            <div class="grid grid-cols-2 gap-3 p-3 bg-navy-950 rounded-xl border border-slate-800 font-mono">
              <div>
                <span class="text-slate-400 text-[10px]">Location:</span>
                <p class="text-white font-bold">${c.ward || '—'}</p>
                <p class="text-slate-400 text-[11px]">${c.address || c.locality || '—'}</p>
              </div>
              <div>
                <span class="text-slate-400 text-[10px]">Assigned Department:</span>
                <p class="text-cyan-300 font-bold">${c.assigned_department || '—'}</p>
                <p class="text-emerald-400 text-[11px]">${c.officer ? c.officer.name : 'Er. Rajesh Verma'}</p>
              </div>
            </div>

            <!-- Evidence Preview -->
            <div class="space-y-1">
              <span class="text-slate-400 text-[10px] uppercase font-mono">Photographic Evidence:</span>
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-lg overflow-hidden border border-slate-800 bg-navy-950">
                  <p class="p-1 text-[10px] text-slate-400 bg-navy-900 text-center font-mono">Citizen Photo (Before)</p>
                  <img src="${c.media_urls && c.media_urls[0] ? c.media_urls[0] : 'assets/uploads/evidence_pothole_1.svg'}" class="w-full h-32 object-cover"/>
                </div>
                <div class="rounded-lg overflow-hidden border border-slate-800 bg-navy-950">
                  <p class="p-1 text-[10px] text-emerald-400 bg-navy-900 text-center font-mono">Field Resolution Proof (After)</p>
                  <img src="${c.resolved_photo || 'assets/uploads/resolved_pothole_1.svg'}" class="w-full h-32 object-cover"/>
                </div>
              </div>
            </div>

            <!-- AI Analysis (if available) -->
            ${c.severity_score ? `
            <div class="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-1 font-mono text-[11px]">
              <p class="font-bold text-cyan-400 text-[10px] uppercase">AI Triage Analysis:</p>
              <div class="grid grid-cols-2 gap-2">
                <div><span class="text-slate-400">Severity Score:</span> <span class="text-white font-bold">${c.severity_score}/100</span></div>
                <div><span class="text-slate-400">Safety Alert:</span> <span class="${c.safety_concern ? 'text-rose-400' : 'text-emerald-400'} font-bold">${c.safety_concern ? '⚠ Yes' : '✓ None'}</span></div>
              </div>
            </div>` : ''}

            <!-- Administrative Quick Actions -->
            <div class="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3">
              <p class="font-bold text-white uppercase text-[10px] font-mono">Executive Actions:</p>
              <div class="flex flex-wrap gap-2">
                <button onclick="AdminDashboardView.updateStatus('${c.id}', 'resolved'); AdminDashboardView.closeTriageModal();" class="px-3 py-1.5 rounded-lg bg-emerald-500 text-navy-950 font-bold text-xs">
                  Certify Repair & Mark Resolved
                </button>
                <button onclick="AdminDashboardView.updateStatus('${c.id}', 'in_progress'); AdminDashboardView.closeTriageModal();" class="px-3 py-1.5 rounded-lg bg-amber-500 text-navy-950 font-bold text-xs">
                  Dispatch Rapid Crew (In Progress)
                </button>
                <button onclick="Router.navigate('track', '${c.id}'); AdminDashboardView.closeTriageModal();" class="px-3 py-1.5 rounded-lg bg-navy-800 text-cyan-400 border border-cyan-400/30 text-xs">
                  Open Public Tracking View
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    const el = document.createElement('div');
    el.innerHTML = modalHtml;
    document.body.appendChild(el.firstElementChild);
  },

  closeTriageModal() {
    const el = document.getElementById('admin-triage-modal');
    if (el) el.remove();
  },

  exportCSV() {
    const complaints = (this._data && this._data.complaints) ? this._data.complaints : MockDB.getAllComplaints();
    let csv = "ID,Title,Category,Ward,Status,Priority,Created_At\n";
    complaints.forEach(c => {
      csv += `"${c.id}","${(c.title||'').replace(/"/g, '""')}","${c.category}","${c.ward||''}","${c.status}","${c.severity||''}","${c.created_at||''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CityPulse_Complaints_Report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    Toast.show('CSV Report exported successfully!', 'success');
  },

  resetDemoData() {
    this._data = null; // clear API cache so next render fetches fresh
    MockDB.resetToDefault();
    Toast.show('Sample complaints database restored to initial realistic state.', 'info');
    Router.renderCurrent();
  }
};
