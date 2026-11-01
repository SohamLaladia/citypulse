// CityPulse Global UI Components: Navbar, Footer, Toast, Mobile Menu

const Components = {
  renderNavbar() {
    const user = AppState.currentUser;
    const currentRoute = Router.currentRoute;

    return `
      <header class="sticky top-0 z-40 bg-navy-900/90 backdrop-blur-md border-b border-slate-800 transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          
          <!-- Brand Logo -->
          <div class="flex items-center space-x-3 cursor-pointer group" onclick="Router.navigate('landing')">
            <div class="w-10 h-10 rounded-2xl bg-electric-gradient flex items-center justify-center text-navy-950 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-200">
              ${Icons.get('pulse', 'w-6 h-6 text-navy-950', 2.5)}
            </div>
            <div>
              <span class="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                City<span class="text-electric-gradient">Pulse</span>
                <span class="text-[9px] uppercase tracking-wider bg-cyan-500/10 text-cyan-400 font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-400/30">Theme 1</span>
              </span>
              <p class="text-[10px] text-slate-400 font-medium">Making Every Civic Voice Count</p>
            </div>
          </div>

          <!-- Desktop Navigation Links -->
          <nav class="hidden lg:flex items-center space-x-1 p-1 bg-navy-950/70 rounded-xl border border-slate-800 text-xs font-semibold">
            <button 
              onclick="Router.navigate('landing')" 
              class="px-3.5 py-1.5 rounded-lg transition-all ${currentRoute === 'landing' ? 'bg-cyan-500 text-navy-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
            >
              Home
            </button>
            <button 
              onclick="Router.navigate('citizen-dashboard')" 
              class="px-3.5 py-1.5 rounded-lg transition-all ${currentRoute === 'citizen-dashboard' ? 'bg-cyan-500 text-navy-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
            >
              Citizen Dashboard
            </button>
            <button 
              onclick="Router.navigate('report')" 
              class="px-3.5 py-1.5 rounded-lg transition-all ${currentRoute === 'report' ? 'bg-cyan-500 text-navy-950 font-bold shadow-sm' : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'}"
            >
              + Report Issue
            </button>
            <button 
              onclick="Router.navigate('track')" 
              class="px-3.5 py-1.5 rounded-lg transition-all ${currentRoute === 'track' ? 'bg-cyan-500 text-navy-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
            >
              Track Complaint
            </button>
            <button 
              onclick="Router.navigate('admin-dashboard')" 
              class="px-3.5 py-1.5 rounded-lg transition-all ${currentRoute === 'admin-dashboard' ? 'bg-cyan-500 text-navy-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
            >
              Admin Center
            </button>
          </nav>

          <!-- Right: Auth State & Profile -->
          <div class="flex items-center space-x-3">
            
            ${user ? `
              <!-- Logged In User Pill -->
              <div class="flex items-center space-x-2 bg-navy-950/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span class="w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-rose-400' : 'bg-emerald-400'}"></span>
                <span class="font-bold text-white max-w-[120px] truncate">${user.name}</span>
                <span class="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded ${user.role === 'admin' ? 'bg-rose-500/10 text-rose-400' : 'bg-cyan-500/10 text-cyan-400'}">
                  ${user.role}
                </span>
                <button onclick="AppState.logout()" class="text-slate-400 hover:text-rose-400 ml-1 transition" title="Sign Out">
                  ${Icons.get('close', 'w-3.5 h-3.5')}
                </button>
              </div>
            ` : `
              <!-- Sign In CTA -->
              <button 
                onclick="Router.navigate('auth')" 
                class="px-4 py-2 rounded-xl bg-electric-gradient text-navy-950 font-bold text-xs shadow-md hover:opacity-95 transition"
              >
                Sign In
              </button>
            `}

            <!-- Mobile Hamburger Toggle -->
            <button 
              onclick="Components.toggleMobileMenu()" 
              class="lg:hidden p-2 rounded-xl bg-navy-950 text-slate-300 hover:text-white border border-slate-800"
            >
              ${Icons.get('menu', 'w-5 h-5')}
            </button>

          </div>

        </div>

        <!-- Mobile Drawer -->
        <div id="mobile-menu" class="hidden lg:hidden bg-navy-900 border-b border-slate-800 p-4 space-y-2 text-xs">
          <button onclick="Router.navigate('landing'); Components.toggleMobileMenu();" class="w-full text-left p-2.5 rounded-lg text-slate-200 hover:bg-slate-800 font-semibold flex items-center gap-2">
            ${Icons.get('pulse', 'w-4 h-4 text-cyan-400')} Home
          </button>
          <button onclick="Router.navigate('citizen-dashboard'); Components.toggleMobileMenu();" class="w-full text-left p-2.5 rounded-lg text-slate-200 hover:bg-slate-800 font-semibold flex items-center gap-2">
            ${Icons.get('user', 'w-4 h-4 text-cyan-400')} Citizen Dashboard
          </button>
          <button onclick="Router.navigate('report'); Components.toggleMobileMenu();" class="w-full text-left p-2.5 rounded-lg text-cyan-400 hover:bg-slate-800 font-bold flex items-center gap-2">
            ${Icons.get('plus', 'w-4 h-4 text-cyan-400')} Report Civic Issue
          </button>
          <button onclick="Router.navigate('track'); Components.toggleMobileMenu();" class="w-full text-left p-2.5 rounded-lg text-slate-200 hover:bg-slate-800 font-semibold flex items-center gap-2">
            ${Icons.get('search', 'w-4 h-4 text-cyan-400')} Track Complaint Status
          </button>
          <button onclick="Router.navigate('admin-dashboard'); Components.toggleMobileMenu();" class="w-full text-left p-2.5 rounded-lg text-slate-200 hover:bg-slate-800 font-semibold flex items-center gap-2">
            ${Icons.get('shieldCheck', 'w-4 h-4 text-rose-400')} Admin Command Center
          </button>
          <button onclick="Router.navigate('auth'); Components.toggleMobileMenu();" class="w-full text-left p-2.5 rounded-lg text-slate-400 hover:bg-slate-800 font-semibold flex items-center gap-2">
            ${Icons.get('lock', 'w-4 h-4')} Auth / Account Switcher
          </button>
        </div>
      </header>
    `;
  },

  renderFooter() {
    return `
      <footer class="bg-navy-950 border-t border-slate-800/80 pt-12 pb-8 text-xs text-slate-400">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <!-- Brand Column -->
            <div class="space-y-3 md:col-span-1">
              <div class="flex items-center space-x-2">
                <div class="w-7 h-7 rounded-xl bg-electric-gradient flex items-center justify-center text-navy-950 font-extrabold text-xs">
                  ${Icons.get('pulse', 'w-4 h-4 text-navy-950')}
                </div>
                <span class="text-base font-extrabold text-white">CITYPULSE</span>
              </div>
              <p class="text-slate-300 font-medium">Making Every Civic Voice Count.</p>
              <p class="text-[11px] text-slate-400 leading-relaxed">
                Theme 1: Civic Pulse – Digital Governance and Public Information. AI-driven complaint ingestion, geospatial routing, and transparent verification.
              </p>
            </div>

            <!-- Navigation Links -->
            <div class="space-y-2">
              <p class="text-[11px] font-mono font-bold text-white uppercase tracking-wider">Platform Hubs</p>
              <ul class="space-y-1.5">
                <li><button onclick="Router.navigate('landing')" class="hover:text-cyan-400 transition">Landing Page</button></li>
                <li><button onclick="Router.navigate('citizen-dashboard')" class="hover:text-cyan-400 transition">Citizen Dashboard</button></li>
                <li><button onclick="Router.navigate('report')" class="hover:text-cyan-400 transition">Report Complaint</button></li>
                <li><button onclick="Router.navigate('track')" class="hover:text-cyan-400 transition">Complaint Tracker</button></li>
                <li><button onclick="Router.navigate('admin-dashboard')" class="hover:text-cyan-400 transition">Admin Command Room</button></li>
              </ul>
            </div>

            <!-- Municipal Hotlines -->
            <div class="space-y-2">
              <p class="text-[11px] font-mono font-bold text-white uppercase tracking-wider">Civic Hotlines</p>
              <ul class="space-y-1.5 text-[11px]">
                <li class="flex items-center gap-1.5 text-slate-300">
                  ${Icons.get('phone', 'w-3.5 h-3.5 text-cyan-400')}
                  <span>Civic Helpline: <strong>1913</strong> (24x7)</span>
                </li>
                <li class="flex items-center gap-1.5 text-slate-300">
                  ${Icons.get('phone', 'w-3.5 h-3.5 text-blue-400')}
                  <span>Water Supply Board: <strong>1916</strong></span>
                </li>
                <li class="flex items-center gap-1.5 text-slate-300">
                  ${Icons.get('phone', 'w-3.5 h-3.5 text-amber-400')}
                  <span>Electricity Board: <strong>1912</strong></span>
                </li>
                <li class="flex items-center gap-1.5 text-slate-300">
                  ${Icons.get('mail', 'w-3.5 h-3.5 text-slate-400')}
                  <span>grievances@citypulse.gov.in</span>
                </li>
              </ul>
            </div>

            <!-- Governance Compliance -->
            <div class="space-y-2">
              <p class="text-[11px] font-mono font-bold text-white uppercase tracking-wider">Digital Governance</p>
              <p class="text-[11px] text-slate-400 leading-relaxed">
                Complies with MoEFCC SWM Rules 2016, Municipal Citizen Charters, and 256-Bit Public Audit Encryption.
              </p>
              <div class="pt-2">
                <span class="inline-block px-2.5 py-1 rounded bg-navy-900 border border-slate-800 text-[10px] text-cyan-300 font-mono">
                  AI-Integrated Live Backend: Connected
                </span>
              </div>
            </div>

          </div>

          <!-- Bottom Notice & Evaluation Disclaimer -->
          <div class="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© 2026 CityPulse Municipal Platform. All civic rights reserved.</p>
            <p class="text-slate-400 italic text-center sm:text-right">
              Evaluation Note: All incident records are simulated for digital governance demonstration.
            </p>
          </div>

        </div>
      </footer>
    `;
  },

  toggleMobileMenu() {
    const el = document.getElementById('mobile-menu');
    if (el) el.classList.toggle('hidden');
  }
};

// Global Toast System
const Toast = {
  show(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `p-3.5 rounded-xl shadow-2xl backdrop-blur-md border text-xs font-medium flex items-center gap-2.5 transition-all duration-300 transform translate-y-3 opacity-0 pointer-events-auto ${
      type === 'success' ? 'bg-navy-900/95 text-white border-emerald-500/50' :
      type === 'error' ? 'bg-navy-900/95 text-white border-rose-500/50' :
      type === 'warning' ? 'bg-navy-900/95 text-white border-amber-500/50' :
      'bg-navy-900/95 text-white border-cyan-500/50'
    }`;

    let icon = Icons.get('info', 'w-4 h-4 text-cyan-400');
    if (type === 'success') icon = Icons.get('checkCircle', 'w-4 h-4 text-emerald-400');
    else if (type === 'error') icon = Icons.get('alertCircle', 'w-4 h-4 text-rose-400');
    else if (type === 'warning') icon = Icons.get('alertTriangle', 'w-4 h-4 text-amber-400');

    toast.innerHTML = `
      <span class="shrink-0">${icon}</span>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
    }, 20);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-3');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};
