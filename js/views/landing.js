// CityPulse View: LANDING PAGE
// High-Impact Smart-City SaaS Showcase

const LandingView = {
  _stats: null,

  render() {
    const stats = this._stats || MockDB.getStatistics();
    this._fetchStats();

    return `
      <div class="space-y-16 pb-16 page-fade-in">

        <!-- ========================================== -->
        <!-- HERO SECTION                               -->
        <!-- ========================================== -->
        <section class="relative pt-8 pb-12 overflow-hidden">
          <!-- Ambient Glow Background Blobs -->
          <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-cyan-500/15 to-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
          
          <div class="text-center max-w-4xl mx-auto space-y-6">
            
            <!-- Civic Theme Badge -->
            <div class="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-navy-800/90 border border-cyan-400/30 text-cyan-400 text-xs font-semibold shadow-sm backdrop-blur-md">
              <span class="w-2 h-2 rounded-full bg-cyan-400 radar-ping"></span>
              <span class="tracking-wide uppercase">Theme 1: Civic Pulse – Digital Governance & Public Information</span>
            </div>

            <!-- Main Heading with Electric Gradient -->
            <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Making Every <br class="hidden sm:inline"/>
              <span class="text-electric-gradient">Civic Voice Count</span>
            </h1>

            <!-- Subtitle -->
            <p class="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              CityPulse is an AI-powered civic complaint management platform that transforms urban reporting into transparent, accountable municipal action.
            </p>

            <!-- CTA Buttons -->
            <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button onclick="Router.navigate('report')" class="px-6 py-3.5 rounded-xl bg-electric-gradient hover:opacity-95 text-navy-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
                ${Icons.get('sparkles', 'w-4 h-4 text-navy-950')}
                <span>Report a Civic Issue</span>
              </button>
              
              <button onclick="Router.navigate('citizen-dashboard')" class="px-6 py-3.5 rounded-xl bg-navy-800/80 hover:bg-navy-700/80 text-white font-semibold text-sm border border-slate-700/80 hover:border-cyan-400/40 transition-all duration-200 flex items-center gap-2">
                ${Icons.get('user', 'w-4 h-4 text-cyan-400')}
                <span>Citizen Dashboard</span>
              </button>

              <button onclick="Router.navigate('admin-dashboard')" class="px-5 py-3.5 rounded-xl bg-transparent hover:bg-navy-800/50 text-slate-300 hover:text-white font-medium text-sm border border-slate-700/50 transition-all flex items-center gap-2">
                ${Icons.get('shieldCheck', 'w-4 h-4 text-slate-400')}
                <span>Admin Command Portal</span>
              </button>
            </div>

            <!-- Quick Track Input Bar -->
            <div class="pt-6 max-w-lg mx-auto">
              <div class="p-1.5 rounded-2xl bg-navy-900/90 border border-slate-700/80 focus-within:border-cyan-400/60 shadow-xl flex items-center gap-2 transition-all">
                <span class="pl-3 text-slate-400">
                  ${Icons.get('search', 'w-4 h-4')}
                </span>
                <input 
                  type="text" 
                  id="landing-track-input" 
                  placeholder="Enter Complaint ID (e.g. CP-2026-BLR01)" 
                  class="bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 flex-1 focus:outline-none px-2 font-mono"
                  onkeydown="if(event.key === 'Enter') LandingView.trackFromHero()"
                />
                <button 
                  onclick="LandingView.trackFromHero()"
                  class="px-4 py-2 rounded-xl bg-navy-800 hover:bg-cyan-500 hover:text-navy-950 text-cyan-400 text-xs font-semibold border border-cyan-400/30 transition-all"
                >
                  Track Status
                </button>
              </div>
              <p class="text-[11px] text-slate-400 mt-2">
                Try demo tickets: 
                <button onclick="Router.navigate('track', 'CP-2026-BLR01')" class="text-cyan-400 underline font-mono hover:text-cyan-300">CP-2026-BLR01</button>, 
                <button onclick="Router.navigate('track', 'CP-2026-BLR03')" class="text-cyan-400 underline font-mono hover:text-cyan-300">CP-2026-BLR03</button>, 
                <button onclick="Router.navigate('track', 'CP-2026-BLR05')" class="text-cyan-400 underline font-mono hover:text-cyan-300">CP-2026-BLR05</button>
              </p>
            </div>

          </div>
        </section>

        <!-- ========================================== -->
        <!-- LIVE CIVIC TELEMETRY MARQUEE               -->
        <!-- ========================================== -->
        <div class="w-full bg-navy-900/90 border-y border-slate-800 py-2.5 px-4 overflow-hidden rounded-xl">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 shrink-0 pr-3 border-r border-slate-800 text-[11px] font-bold text-cyan-400">
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span class="tracking-wider uppercase">LIVE MUNICIPAL FEED</span>
            </div>
            <div class="overflow-hidden flex-1 relative">
              <div class="marquee-container text-xs text-slate-300 space-x-8">
                <span class="inline-flex items-center gap-1.5"><strong class="text-emerald-400">Ward 112:</strong> 100ft Rd Pothole Patch in progress by PWD Crew</span>
                <span class="inline-flex items-center gap-1.5"><strong class="text-cyan-400">Ward 151:</strong> Koramangala Sony Signal Storm Drain Cleared & Verified</span>
                <span class="inline-flex items-center gap-1.5"><strong class="text-amber-400">Ward 174:</strong> HSR Layout Solid Waste Cleared & Bin Placed</span>
                <span class="inline-flex items-center gap-1.5"><strong class="text-emerald-400">Ward 65:</strong> Margosa Rd BWSSB Water Pipe Fissure Sealed</span>
                <span class="inline-flex items-center gap-1.5"><strong class="text-cyan-400">Ward 84:</strong> Whitefield 8 Streetlights Restored with New LED Units</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- KEY PLATFORM STATISTICS                    -->
        <!-- ========================================== -->
        <section class="space-y-6">
          <div class="text-center max-w-xl mx-auto">
            <h2 class="text-xs font-bold text-cyan-400 tracking-widest uppercase">Municipal Performance Metrics</h2>
            <p class="text-2xl font-bold text-white mt-1">Driving Real-World Civic Transformation</p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div class="navy-card p-6 text-center space-y-1">
              <p class="text-3xl sm:text-4xl font-extrabold text-white font-mono">${stats.platformTotal.toLocaleString()}+</p>
              <p class="text-xs text-slate-400 font-medium">Grievances Registered</p>
              <span class="inline-block mt-2 text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full font-semibold">Citywide Ingestion</span>
            </div>

            <div class="navy-card p-6 text-center space-y-1">
              <p class="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">${stats.slaCompliance}</p>
              <p class="text-xs text-slate-400 font-medium">SLA Resolution Rate</p>
              <span class="inline-block mt-2 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-semibold">High Adherence</span>
            </div>

            <div class="navy-card p-6 text-center space-y-1">
              <p class="text-3xl sm:text-4xl font-extrabold text-cyan-300 font-mono">${stats.avgResponseHours}</p>
              <p class="text-xs text-slate-400 font-medium">Avg Crew Dispatch Time</p>
              <span class="inline-block mt-2 text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full font-semibold">Autonomous Triage</span>
            </div>

            <div class="navy-card p-6 text-center space-y-1">
              <p class="text-3xl sm:text-4xl font-extrabold text-purple-400 font-mono">42 / 42</p>
              <p class="text-xs text-slate-400 font-medium">Municipal Wards Connected</p>
              <span class="inline-block mt-2 text-[10px] text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full font-semibold">100% Coverage</span>
            </div>

          </div>
        </section>

        <!-- ========================================== -->
        <!-- CORE CAPABILITIES / FEATURE CARDS          -->
        <!-- ========================================== -->
        <section class="space-y-8">
          <div class="text-center max-w-2xl mx-auto space-y-2">
            <h2 class="text-xs font-bold text-cyan-400 tracking-widest uppercase">Smart-City Architecture</h2>
            <h3 class="text-2xl sm:text-3xl font-extrabold text-white">Engineered for Transparency & Speed</h3>
            <p class="text-sm text-slate-400">CityPulse unifies computer vision, geospatial intelligence, and municipal routing into a single seamless platform.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <!-- Feature 1 -->
            <div class="navy-card p-6 space-y-4 hover:border-cyan-400/40 transition-all">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-400/20">
                ${Icons.get('cpu', 'w-6 h-6 text-cyan-400')}
              </div>
              <h4 class="text-lg font-bold text-white">Multimodal AI Triage</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Computer vision models automatically analyze citizen photos, assessing pavement craters, pipe fissures, and structural hazards with 96%+ accuracy.
              </p>
              <div class="pt-2 flex items-center gap-2 text-[11px] font-mono text-cyan-400">
                <span>Auto-categorization</span> • <span>Severity Scoring</span>
              </div>
            </div>

            <!-- Feature 2 -->
            <div class="navy-card p-6 space-y-4 hover:border-cyan-400/40 transition-all">
              <div class="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-400/20">
                ${Icons.get('mapPin', 'w-6 h-6 text-blue-400')}
              </div>
              <h4 class="text-lg font-bold text-white">Geospatial Ward Dispatch</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Automated Haversine spatial indexing assigns complaints directly to the exact jurisdictional engineer and field crew, eliminating bureaucratic delays.
              </p>
              <div class="pt-2 flex items-center gap-2 text-[11px] font-mono text-blue-400">
                <span>Ward Boundary Matching</span> • <span>Zero Misrouting</span>
              </div>
            </div>

            <!-- Feature 3 -->
            <div class="navy-card p-6 space-y-4 hover:border-cyan-400/40 transition-all">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-400/20">
                ${Icons.get('checkCircle', 'w-6 h-6 text-emerald-400')}
              </div>
              <h4 class="text-lg font-bold text-white">Before & After Verification</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Municipal crews must upload photographic proof of repair. Citizens review timestamped photos and confirm closure before a ticket is permanently resolved.
              </p>
              <div class="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                <span>Citizen Sign-off</span> • <span>Dispute Mechanism</span>
              </div>
            </div>

            <!-- Feature 4 -->
            <div class="navy-card p-6 space-y-4 hover:border-cyan-400/40 transition-all">
              <div class="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-400/20">
                ${Icons.get('clock', 'w-6 h-6 text-purple-400')}
              </div>
              <h4 class="text-lg font-bold text-white">Dynamic SLA Monitoring</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Automated escalation countdowns flag critical road and water incidents, triggering alerts to Zonal Commissioners if resolution targets approach breach.
              </p>
              <div class="pt-2 flex items-center gap-2 text-[11px] font-mono text-purple-400">
                <span>SLA Timers</span> • <span>Breach Prevention</span>
              </div>
            </div>

            <!-- Feature 5 -->
            <div class="navy-card p-6 space-y-4 hover:border-cyan-400/40 transition-all">
              <div class="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-400/20">
                ${Icons.get('barChart', 'w-6 h-6 text-amber-400')}
              </div>
              <h4 class="text-lg font-bold text-white">Predictive Hotspot Analytics</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Aggregates spatial clusters of recurring potholes or drainage blocks, assisting municipal planning committees in preventative capital infrastructure upgrades.
              </p>
              <div class="pt-2 flex items-center gap-2 text-[11px] font-mono text-amber-400">
                <span>Density Heatmaps</span> • <span>Budget Intelligence</span>
              </div>
            </div>

            <!-- Feature 6 -->
            <div class="navy-card p-6 space-y-4 hover:border-cyan-400/40 transition-all">
              <div class="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-400/20">
                ${Icons.get('shieldCheck', 'w-6 h-6 text-indigo-400')}
              </div>
              <h4 class="text-lg font-bold text-white">Transparent Public Audit</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Immutable activity logs track every status change, officer note, and citizen endorsement, fostering civic trust through open municipal governance.
              </p>
              <div class="pt-2 flex items-center gap-2 text-[11px] font-mono text-indigo-400">
                <span>Immutable Logs</span> • <span>Public Verification</span>
              </div>
            </div>

          </div>
        </section>

        <!-- ========================================== -->
        <!-- HOW IT WORKS SECTION                       -->
        <!-- ========================================== -->
        <section class="space-y-10">
          <div class="text-center max-w-2xl mx-auto space-y-2">
            <h2 class="text-xs font-bold text-cyan-400 tracking-widest uppercase">The Resolution Pipeline</h2>
            <h3 class="text-2xl sm:text-3xl font-extrabold text-white">How CityPulse Works</h3>
            <p class="text-sm text-slate-400">From citizen detection to verified field repair in four structured phases.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 relative">

            <!-- Step 1 -->
            <div class="navy-card p-6 text-center space-y-3 relative group hover:border-cyan-400/50 transition-all">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg font-extrabold border border-cyan-400/30">
                1
              </div>
              <h4 class="text-base font-bold text-white">Capture & Submit</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Citizen snaps an on-site photo, system auto-detects GPS coordinates, and attaches complaint details in seconds.
              </p>
              <span class="inline-block text-[10px] text-cyan-400 font-mono">30-Second Filing</span>
            </div>

            <!-- Step 2 -->
            <div class="navy-card p-6 text-center space-y-3 relative group hover:border-cyan-400/50 transition-all">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg font-extrabold border border-blue-400/30">
                2
              </div>
              <h4 class="text-base font-bold text-white">Autonomous AI Triage</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Gemini multimodal AI validates evidence, scores safety severity, checks for duplicates, and auto-routes to the department.
              </p>
              <span class="inline-block text-[10px] text-blue-400 font-mono">Instant Dispatch</span>
            </div>

            <!-- Step 3 -->
            <div class="navy-card p-6 text-center space-y-3 relative group hover:border-cyan-400/50 transition-all">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg font-extrabold border border-amber-400/30">
                3
              </div>
              <h4 class="text-base font-bold text-white">Field Crew Action</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Ward engineers receive digital work orders. Ground crews execute asphalt patch, pipe repair, or trash clearing.
              </p>
              <span class="inline-block text-[10px] text-amber-400 font-mono">On-Site Resolution</span>
            </div>

            <!-- Step 4 -->
            <div class="navy-card p-6 text-center space-y-3 relative group hover:border-cyan-400/50 transition-all">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-extrabold border border-emerald-400/30">
                4
              </div>
              <h4 class="text-base font-bold text-white">Citizen Verification</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Post-repair photo proof is delivered to citizen. Citizen certifies repair quality with 5-star rating or can dispute closure.
              </p>
              <span class="inline-block text-[10px] text-emerald-400 font-mono">Guaranteed Closure</span>
            </div>

          </div>
        </section>

        <!-- ========================================== -->
        <!-- CALL TO ACTION BANNER                      -->
        <!-- ========================================== -->
        <section class="navy-card p-8 sm:p-12 relative overflow-hidden text-center space-y-6 border border-cyan-400/30">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-500/15 to-transparent pointer-events-none"></div>
          
          <div class="max-w-2xl mx-auto space-y-3 relative z-10">
            <h3 class="text-2xl sm:text-3xl font-extrabold text-white">Ready to Empower Your Municipality?</h3>
            <p class="text-sm text-slate-300">
              Join thousands of active citizens and civic administrators making cities safer, cleaner, and more responsive every day.
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <button onclick="Router.navigate('report')" class="px-6 py-3 rounded-xl bg-electric-gradient text-navy-950 font-bold text-sm shadow-md transition hover:opacity-95">
              Submit a Complaint Now
            </button>
            <button onclick="Router.navigate('auth', 'admin')" class="px-6 py-3 rounded-xl bg-navy-800 text-white font-semibold text-sm border border-slate-700 hover:border-cyan-400/40 transition">
              Municipal Admin Sign In
            </button>
          </div>
        </section>

      </div>
    `;
  },

  trackFromHero() {
    const input = document.getElementById('landing-track-input');
    const id = input ? input.value.trim() : '';
    if (!id) {
      Toast.show('Please enter a Complaint ID to track (e.g. CP-2026-BLR01)', 'warning');
      return;
    }
    Router.navigate('track', id);
  },

  async _fetchStats() {
    if (!window.API || this._statsLoaded) return;
    this._statsLoaded = true;
    try {
      const data = await API.getAnalyticsOverview();
      if (data && data.summary) {
        const s = data.summary;
        this._stats = {
          ...MockDB.getStatistics(),
          platformTotal: s.total_complaints ? Math.max(s.total_complaints, 48) : 48290,
          slaCompliance: s.resolution_rate_pct ? `${Math.round(s.resolution_rate_pct)}%` : '98.4%',
          avgResponseHours: s.avg_resolution_hours ? `< ${Math.round(s.avg_resolution_hours)}h` : '< 24h'
        };
      }
    } catch (_) {
      // Keep MockDB numbers
    }
  }
};
