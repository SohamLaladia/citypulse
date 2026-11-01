// CityPulse Application Controller & Client Router
// Stage 1: Autonomous Frontend Engine with Reactive State Management

const AppState = {
  USER_STORAGE_KEY: 'citypulse_user_session',
  currentUser: null,
  token: null,

  init() {
    try {
      this.token = API.getToken();
      const saved = localStorage.getItem(this.USER_STORAGE_KEY);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      } else {
        // Default citizen session
        this.currentUser = {
          id: "USR-CITIZEN-01",
          name: "Aarav Sharma",
          email: "citizen@citypulse.org",
          role: "citizen",
          ward: "Ward 112 - Domlur / Indiranagar"
        };
        this.saveUser();
      }

      // If no token exists yet, auto-authenticate demo citizen in background
      if (!this.token) {
        API.login("citizen@citypulse.org", "Password123!")
          .then(res => {
            if (res && res.access_token) {
              this.setAuth(res.access_token, res.user || this.currentUser);
            }
          })
          .catch(e => {
            console.log('CityPulse running in autonomous offline/local mode', e.message);
          });
      }
    } catch (e) {
      console.warn("Error parsing user session", e);
    }
  },

  setAuth(token, user) {
    this.token = token;
    this.currentUser = user;
    if (window.API) {
      API.setToken(token);
    }
    this.saveUser();
  },

  saveUser() {
    if (this.currentUser) {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(this.USER_STORAGE_KEY);
    }
    this.updateNavbarUser();
  },

  logout() {
    this.currentUser = null;
    this.token = null;
    if (window.API) {
      API.clearToken();
    }
    localStorage.removeItem(this.USER_STORAGE_KEY);
    Toast.show('Signed out successfully.', 'info');
    Router.navigate('landing');
  },

  updateNavbarUser() {
    const navEl = document.getElementById('navbar-container');
    if (navEl) {
      navEl.innerHTML = Components.renderNavbar();
    }
  }
};

const Router = {
  currentRoute: 'landing',
  currentParam: null,

  init() {
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();
  },

  handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'landing';
    const parts = hash.split('/');
    const route = parts[0] || 'landing';
    const param = parts[1] || null;

    this.currentRoute = route;
    this.currentParam = param;
    this.renderCurrent();
  },

  navigate(route, param = null) {
    this.currentRoute = route;
    this.currentParam = param;

    let hash = `#${route}`;
    if (param) hash += `/${param}`;

    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      this.renderCurrent();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderCurrent() {
    // 1. Re-render Navbar to reflect active page and user session
    const navContainer = document.getElementById('navbar-container');
    if (navContainer) {
      navContainer.innerHTML = Components.renderNavbar();
    }

    // 2. Render targeted view into #app-content
    const appContent = document.getElementById('app-content');
    if (!appContent) return;

    let viewHtml = '';
    switch (this.currentRoute) {
      case 'landing':
        viewHtml = LandingView.render();
        break;
      case 'citizen-dashboard':
        viewHtml = CitizenDashboardView.render();
        break;
      case 'report':
        viewHtml = ReportComplaintView.render();
        break;
      case 'track':
        viewHtml = ComplaintTrackingView.render(this.currentParam);
        break;
      case 'admin-dashboard':
        viewHtml = AdminDashboardView.render();
        break;
      case 'auth':
        viewHtml = AuthView.render(this.currentParam);
        break;
      default:
        viewHtml = LandingView.render();
        this.currentRoute = 'landing';
    }

    appContent.innerHTML = viewHtml;

    // 3. Post-render view hooks
    if (this.currentRoute === 'admin-dashboard') {
      AdminDashboardView.initChart();
    } else if (this.currentRoute === 'report') {
      ReportComplaintView.triggerAIAnalysis();
    }

    // 4. Update Footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
      footerContainer.innerHTML = Components.renderFooter();
    }
  }
};

// Global Bootstrapper
document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
  MockDB.init();
  Router.init();

  // If a photo is dropped outside the upload zone, stop the browser from opening it
  // (which would navigate away and lose the report being written). The upload zone
  // has its own drop handler that accepts the file.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());
  console.log("CityPulse Smart-City Web Application Initialized. Making Every Civic Voice Count.");
});
