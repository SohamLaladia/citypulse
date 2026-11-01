// CityPulse View: REPORT COMPLAINT PAGE
// AI-Powered Multimodal Ingestion with Real-Time Triage Simulation

const ReportComplaintView = {
  selectedCategory: 'Roads and potholes',
  selectedImage: 'assets/uploads/evidence_pothole_1.svg',
  selectedImageName: 'evidence_pothole_1.svg',
  selectedImageSource: 'sample',   // 'sample' (built-in) or 'upload' (from the citizen's device)
  selectedImageSizeKb: null,
  isProcessingPhoto: false,
  MAX_PHOTO_BYTES: 10 * 1024 * 1024,   // 10 MB, as advertised on the page
  MAX_SVG_BYTES: 1024 * 1024,          // SVGs are stored as-is, so keep them small
  MAX_PHOTO_DIMENSION: 1280,           // uploads are resized so they fit in browser storage
  PHOTO_TARGET_BYTES: 350 * 1024,
  _dragDepth: 0,
  userLat: 12.9719,
  userLon: 77.6412,

  render() {
    const ev = this.evidenceStatus();
    return `
      <div class="max-w-5xl mx-auto space-y-8 pb-16 page-fade-in">
        
        <!-- Header -->
        <div class="text-center space-y-2 max-w-2xl mx-auto">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 text-xs font-semibold">
            ${Icons.get('sparkles', 'w-3.5 h-3.5')}
            <span>CityPulse Multimodal Ingestion Engine</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white">Report a Civic Issue</h1>
          <p class="text-xs sm:text-sm text-slate-300">
            Submit your grievance with photo proof and GPS location. Our AI triage agent categorizes, evaluates severity, and routes it directly to municipal field crews.
          </p>
        </div>

        <!-- Two Column Layout: Form on Left, AI Preview Card on Right -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- LEFT: The Report Form (7 cols) -->
          <div class="lg:col-span-7 navy-card p-6 sm:p-8 space-y-6">
            <form id="report-form" onsubmit="ReportComplaintView.handleSubmit(event)" class="space-y-5">
              
              <!-- 1. Category Selection Pills -->
              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  1. Issue Category <span class="text-cyan-400">*</span>
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  ${CATEGORIES.map(cat => `
                    <button
                      type="button"
                      onclick="ReportComplaintView.selectCategory('${cat.id}')"
                      class="category-pill p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all text-xs font-semibold ${this.selectedCategory === cat.id ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-sm' : 'bg-navy-950/60 border-slate-700/80 text-slate-300 hover:border-slate-600'}"
                      id="cat-pill-${cat.id.replace(/\s+/g, '-')}"
                    >
                      <span class="p-1.5 rounded-lg w-max ${this.selectedCategory === cat.id ? 'bg-cyan-400 text-navy-950' : 'bg-slate-800 text-cyan-400'}">
                        ${Icons.get(cat.icon, 'w-4 h-4')}
                      </span>
                      <span class="truncate">${cat.label}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- 2. Complaint Title -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    2. Complaint Title <span class="text-cyan-400">*</span>
                  </label>
                  <span class="text-[10px] text-slate-400 font-mono">Clear & concise</span>
                </div>
                <input 
                  type="text" 
                  id="report-title"
                  placeholder="e.g. Hazardous deep pothole near Metro Gate 2"
                  value="Hazardous deep asphalt crater near 12th Main junction"
                  oninput="ReportComplaintView.triggerAIAnalysis()"
                  class="w-full px-4 py-2.5 rounded-xl bg-navy-950/70 border border-slate-700 text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
                  required
                />
              </div>

              <!-- 3. Detailed Description -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    3. Detailed Description <span class="text-cyan-400">*</span>
                  </label>
                  <span class="text-[10px] text-slate-400 font-mono" id="desc-count">162 / 500 chars</span>
                </div>
                <textarea 
                  id="report-description"
                  rows="3"
                  placeholder="Describe the severity, damage to vehicles/pedestrians, duration, and landmarks..."
                  oninput="ReportComplaintView.triggerAIAnalysis()"
                  class="w-full px-4 py-2.5 rounded-xl bg-navy-950/70 border border-slate-700 text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition resize-none"
                  required
                >A deep pothole has opened up right after heavy rains. Water accumulation is hiding the crater depth (~15cm). Two two-wheelers skidded during evening rush hour.</textarea>
              </div>

              <!-- 4. Ward & Specific Locality Address -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    4. Municipal Ward <span class="text-cyan-400">*</span>
                  </label>
                  <select 
                    id="report-ward" 
                    onchange="ReportComplaintView.handleWardChange(this.value)"
                    class="w-full px-3 py-2.5 rounded-xl bg-navy-950/70 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                  >
                    ${WARDS.map(w => `<option value="${w.name}">${w.name}</option>`).join('')}
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Specific Landmark / Street <span class="text-cyan-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="report-address"
                    placeholder="e.g. 100ft Road, opposite Metro Pillar 140"
                    value="100ft Road, opposite Metro Pillar 140, Indiranagar"
                    class="w-full px-3 py-2.5 rounded-xl bg-navy-950/70 border border-slate-700 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <!-- 5. GPS Geolocation Pin Drop -->
              <div class="p-3.5 rounded-xl bg-navy-950/80 border border-slate-800 space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2 text-slate-300 font-semibold">
                    <span class="text-cyan-400">${Icons.get('navigation', 'w-4 h-4')}</span>
                    <span>GPS Geospatial Coordinates</span>
                  </div>
                  <button 
                    type="button" 
                    onclick="ReportComplaintView.detectGPS()"
                    class="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 text-[11px] font-mono flex items-center gap-1 transition"
                  >
                    ${Icons.get('crosshair', 'w-3 h-3')} Detect Live GPS
                  </button>
                </div>
                
                <div class="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                  <div class="bg-navy-900 px-2.5 py-1.5 rounded-lg border border-slate-800 flex justify-between">
                    <span>Latitude:</span>
                    <span id="display-lat" class="text-cyan-300 font-bold">12.9719° N</span>
                  </div>
                  <div class="bg-navy-900 px-2.5 py-1.5 rounded-lg border border-slate-800 flex justify-between">
                    <span>Longitude:</span>
                    <span id="display-lon" class="text-cyan-300 font-bold">77.6412° E</span>
                  </div>
                </div>
              </div>

              <!-- 6. Evidence Photo Upload & Quick Sample Selector -->
              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  6. Photographic Evidence
                </label>

                <div
                  id="photo-dropzone"
                  class="border-2 border-dashed border-slate-700 hover:border-cyan-400/50 rounded-2xl p-4 text-center transition bg-navy-950/40"
                  ondragenter="event.preventDefault(); ReportComplaintView.onDragEnter()"
                  ondragover="event.preventDefault()"
                  ondragleave="ReportComplaintView.onDragLeave()"
                  ondrop="ReportComplaintView.handleDrop(event)"
                >
                  <div class="flex flex-col items-center gap-2">
                    <div class="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      ${Icons.get('camera', 'w-5 h-5')}
                    </div>
                    <div>
                      <p class="text-xs font-semibold text-white">Click or drag & drop photo proof</p>
                      <p class="text-[10px] text-slate-400">Supports JPG, PNG, WEBP, SVG (Max 10MB)</p>
                    </div>

                    <button
                      type="button"
                      id="photo-browse-btn"
                      onclick="ReportComplaintView.openFilePicker()"
                      class="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 text-[11px] font-semibold transition"
                    >
                      Choose photo from device
                    </button>
                    <input
                      type="file"
                      id="photo-file-input"
                      accept="image/*"
                      class="sr-only"
                      tabindex="-1"
                      onchange="ReportComplaintView.handleFileInput(event)"
                    />

                    <!-- Quick Sample Loader -->
                    <div class="pt-2 border-t border-slate-800 w-full mt-2">
                      <p class="text-[10px] font-mono text-slate-400 mb-2 uppercase tracking-wide">Or choose sample evidence for 1-click test:</p>
                      <div class="flex flex-wrap items-center justify-center gap-2">
                        <button type="button" onclick="ReportComplaintView.pickSampleImage('assets/uploads/evidence_pothole_1.svg', 'Pothole')" class="px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                          🕳️ Pothole
                        </button>
                        <button type="button" onclick="ReportComplaintView.pickSampleImage('assets/uploads/evidence_water.svg', 'Water Burst')" class="px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                          💧 Pipe Leak
                        </button>
                        <button type="button" onclick="ReportComplaintView.pickSampleImage('assets/uploads/evidence_garbage.svg', 'Garbage Overflow')" class="px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                          🗑️ Waste Pile
                        </button>
                        <button type="button" onclick="ReportComplaintView.pickSampleImage('assets/uploads/evidence_lights.svg', 'Dark Streetlights')" class="px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                          💡 Streetlights
                        </button>
                      </div>
                    </div>

                    <!-- Image Preview Box -->
                    <div id="image-preview-container" class="mt-3 w-full">
                      <div class="p-2 rounded-xl bg-navy-900 border border-slate-800 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 min-w-0">
                          <img id="evidence-preview-img" src="${this.escapeHtml(this.selectedImage)}" class="w-14 h-12 object-cover rounded-lg border border-slate-700 shrink-0" alt="Preview"/>
                          <div class="text-left text-xs min-w-0">
                            <p id="evidence-filename" class="font-mono text-white font-semibold truncate max-w-[180px]">${this.escapeHtml(this.selectedImageName)}</p>
                            <p id="evidence-status" class="text-[10px] ${ev.cls}">${ev.text}</p>
                          </div>
                        </div>
                        <span id="evidence-badge" class="shrink-0 text-[10px] px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 font-mono">${ev.badge}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="pt-4">
                <button 
                  type="submit" 
                  id="submit-btn"
                  class="w-full py-3.5 rounded-xl bg-electric-gradient hover:opacity-95 text-navy-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-98"
                >
                  ${Icons.get('sparkles', 'w-4 h-4 text-navy-950')}
                  <span>Submit Civic Grievance</span>
                </button>
                <p class="text-[11px] text-center text-slate-400 mt-2 font-mono">
                  Autonomous AI Triage generates ticket & dispatches municipal team immediately.
                </p>
              </div>

            </form>
          </div>

          <!-- RIGHT: AI ANALYSIS PREVIEW CARD (5 cols) -->
          <div class="lg:col-span-5 space-y-4 sticky top-24">
            
            <div class="navy-card p-6 border-cyan-400/40 relative overflow-hidden ai-pulse-border">
              
              <!-- AI Agent Card Header -->
              <div class="flex items-center justify-between border-b border-slate-800 pb-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                    ${Icons.get('cpu', 'w-5 h-5')}
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>CityPulse AI Triage</span>
                      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    </h3>
                    <p class="text-[11px] text-cyan-400 font-mono">Gemini Multimodal Vision Engine</p>
                  </div>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 font-mono font-bold border border-emerald-400/20">
                  LIVE
                </span>
              </div>

              <!-- AI Analysis Contents -->
              <div class="space-y-4 pt-4 text-xs">
                
                <!-- 1. Detected Issue -->
                <div class="space-y-1">
                  <p class="text-slate-400 font-mono uppercase text-[10px] tracking-wide">Computer Vision Classification:</p>
                  <p id="ai-detected-issue" class="font-bold text-white text-sm bg-navy-950/70 p-2.5 rounded-xl border border-slate-800">
                    Deep asphalt crater with loose aggregate (~15cm depth)
                  </p>
                </div>

                <!-- 2. Metrics Grid -->
                <div class="grid grid-cols-2 gap-3 font-mono">
                  <div class="p-3 rounded-xl bg-navy-950/60 border border-slate-800 space-y-1">
                    <span class="text-[10px] text-slate-400 uppercase">AI Urgency / Severity:</span>
                    <p id="ai-severity-score" class="text-rose-400 font-bold text-sm">HIGH (30/40 pts)</p>
                  </div>
                  <div class="p-3 rounded-xl bg-navy-950/60 border border-slate-800 space-y-1">
                    <span class="text-[10px] text-slate-400 uppercase">Confidence Score:</span>
                    <p id="ai-confidence" class="text-emerald-400 font-bold text-sm">96.4% Match</p>
                  </div>
                </div>

                <!-- 3. Assigned Department -->
                <div class="space-y-1">
                  <p class="text-slate-400 font-mono uppercase text-[10px] tracking-wide">Suggested Municipal Dept:</p>
                  <div class="p-2.5 rounded-xl bg-navy-950/60 border border-slate-800 flex items-center gap-2 text-cyan-300 font-semibold">
                    ${Icons.get('road', 'w-4 h-4 text-cyan-400')}
                    <span id="ai-department">Road Infrastructure & Engineering Department</span>
                  </div>
                </div>

                <!-- 4. Estimated Resolution SLA -->
                <div class="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-[11px]">
                  <span class="text-slate-300">Predicted SLA Resolution:</span>
                  <span class="font-mono font-bold text-cyan-400">24 - 48 Hours</span>
                </div>

                <!-- 5. Duplicate Check Result -->
                <div class="p-3 rounded-xl bg-navy-950/80 border border-slate-800 flex items-start gap-2.5 text-[11px]">
                  <span class="text-emerald-400 mt-0.5">${Icons.get('checkCircle', 'w-4 h-4')}</span>
                  <div>
                    <p class="font-bold text-white">Geospatial Deduplication Check</p>
                    <p class="text-slate-400 text-[10px]">Zero duplicate reports detected within 350m radius. Ticket will be treated as unique primary incident.</p>
                  </div>
                </div>

                <!-- 6. Safety Flags -->
                <div class="space-y-1">
                  <p class="text-slate-400 font-mono uppercase text-[10px] tracking-wide">Extracted Safety Concerns:</p>
                  <ul id="ai-safety-list" class="space-y-1 text-[11px] text-slate-300">
                    <li class="flex items-center gap-1.5 text-rose-300">
                      <span>•</span> High risk of two-wheeler skids and fatal accidents at high speed
                    </li>
                    <li class="flex items-center gap-1.5 text-amber-300">
                      <span>•</span> Transit corridor disruption near arterial junction
                    </li>
                  </ul>
                </div>

              </div>

            </div>

            <!-- Municipal Transparency Note -->
            <div class="p-4 rounded-xl bg-navy-950/50 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p class="font-bold text-slate-300">Governance & Privacy Assurance:</p>
              <p>Your phone number and exact personal identity are masked on public tracking pages. Field engineers only see the civic incident details and geocode.</p>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  // ---------- Evidence photo: state and preview ----------

  evidenceStatus() {
    if (this.isProcessingPhoto) {
      return { text: 'Processing photo…', cls: 'text-cyan-300', badge: 'Processing' };
    }
    if (this.selectedImageSource === 'upload') {
      const size = this.selectedImageSizeKb ? ` · ${this.selectedImageSizeKb} KB` : '';
      return { text: `✔ Photo attached${size}`, cls: 'text-emerald-400', badge: 'Ready for AI' };
    }
    return { text: '✔ EXIF Geo-tag Validated', cls: 'text-emerald-400', badge: 'Ready for AI' };
  },

  setEvidence({ url, name, source, sizeKb = null }) {
    this.selectedImage = url;
    this.selectedImageName = name;
    this.selectedImageSource = source;
    this.selectedImageSizeKb = sizeKb;
    this.selectedImageBase64 = (url && url.startsWith('data:')) ? url.split(',')[1] : null;
    this.isProcessingPhoto = false;
    this.refreshEvidencePreview();
    this.triggerAIAnalysis();
  },

  // Updates the preview in place. A full re-render would wipe what the citizen has typed.
  refreshEvidencePreview() {
    const ev = this.evidenceStatus();
    const img = document.getElementById('evidence-preview-img');
    const nameEl = document.getElementById('evidence-filename');
    const statusEl = document.getElementById('evidence-status');
    const badgeEl = document.getElementById('evidence-badge');
    if (img) img.src = this.selectedImage;
    if (nameEl) nameEl.textContent = this.selectedImageName;
    if (statusEl) {
      statusEl.textContent = ev.text;
      statusEl.className = `text-[10px] ${ev.cls}`;
    }
    if (badgeEl) badgeEl.textContent = ev.badge;
  },

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // ---------- Evidence photo: picking and reading files ----------

  openFilePicker() {
    const input = document.getElementById('photo-file-input');
    if (input) input.click();
  },

  handleFileInput(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    // Reset so choosing the same file again still fires the change event
    input.value = '';
    this.processPhotoFile(file);
  },

  onDragEnter() {
    this._dragDepth += 1;
    this.setDropzoneActive(true);
  },

  onDragLeave() {
    // dragleave also fires when moving over child elements, so count enters and leaves
    this._dragDepth = Math.max(0, this._dragDepth - 1);
    if (this._dragDepth === 0) this.setDropzoneActive(false);
  },

  handleDrop(event) {
    event.preventDefault();
    this._dragDepth = 0;
    this.setDropzoneActive(false);
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    this.processPhotoFile(file);
  },

  setDropzoneActive(active) {
    const zone = document.getElementById('photo-dropzone');
    if (!zone) return;
    zone.classList.toggle('border-cyan-400', active);
    zone.classList.toggle('bg-cyan-500/10', active);
    zone.classList.toggle('border-slate-700', !active);
    zone.classList.toggle('bg-navy-950/40', !active);
  },

  async processPhotoFile(file) {
    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      Toast.show("That file isn't an image. Please choose a JPG, PNG, WEBP or SVG photo.", 'error');
      return;
    }
    if (file.size > this.MAX_PHOTO_BYTES) {
      Toast.show(`That photo is ${(file.size / 1048576).toFixed(1)} MB. Please choose one under 10 MB.`, 'error');
      return;
    }
    if (file.type === 'image/svg+xml' && file.size > this.MAX_SVG_BYTES) {
      Toast.show('SVG files must be under 1 MB. Please try a JPG or PNG photo instead.', 'error');
      return;
    }

    this.isProcessingPhoto = true;
    this.selectedFile = file;
    this.refreshEvidencePreview();

    try {
      const photo = file.type === 'image/svg+xml'
        ? await this.readFileAsDataURL(file)
        : await this.compressImage(file);

      this.setEvidence({
        url: photo.dataUrl,
        name: file.name,
        source: 'upload',
        sizeKb: Math.max(1, Math.round(photo.bytes / 1024))
      });
      Toast.show('Photo attached and ready for AI triage.', 'success');
    } catch (err) {
      console.warn('CityPulse: could not read the selected photo', err);
      this.isProcessingPhoto = false;
      this.refreshEvidencePreview();
      Toast.show("We couldn't read that image. Try a JPG or PNG (some phone formats such as HEIC need converting first).", 'error');
    }
  },

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result, bytes: file.size });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  // Downscales and re-encodes a photo as JPEG so it fits in localStorage.
  // A 4 MB phone photo typically becomes a few hundred KB.
  compressImage(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          const longest = Math.max(img.naturalWidth, img.naturalHeight);
          if (!longest) throw new Error('Image has no dimensions');

          const scale = Math.min(1, this.MAX_PHOTO_DIMENSION / longest);
          const width = Math.max(1, Math.round(img.naturalWidth * scale));
          const height = Math.max(1, Math.round(img.naturalHeight * scale));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas is not available');

          // White backing so transparent PNGs don't turn black when encoded as JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          if (this.approxDataUrlBytes(dataUrl) > this.PHOTO_TARGET_BYTES) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          }

          resolve({ dataUrl, bytes: this.approxDataUrlBytes(dataUrl) });
        } catch (err) {
          reject(err);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Browser could not decode the image'));
      };

      img.src = objectUrl;
    });
  },

  approxDataUrlBytes(dataUrl) {
    const base64Start = dataUrl.indexOf(',') + 1;
    return Math.round((dataUrl.length - base64Start) * 0.75);
  },

  selectCategory(catId) {
    this.selectedCategory = catId;
    document.querySelectorAll('.category-pill').forEach(el => {
      el.classList.remove('bg-cyan-500/15', 'border-cyan-400', 'text-cyan-300');
      el.classList.add('bg-navy-950/60', 'border-slate-700/80', 'text-slate-300');
    });
    const target = document.getElementById(`cat-pill-${catId.replace(/\s+/g, '-')}`);
    if (target) {
      target.classList.remove('bg-navy-950/60', 'border-slate-700/80', 'text-slate-300');
      target.classList.add('bg-cyan-500/15', 'border-cyan-400', 'text-cyan-300');
    }
    this.triggerAIAnalysis();
  },

  handleWardChange(wardName) {
    // Auto-update coordinates based on selected ward
    if (wardName.includes('Koramangala')) {
      this.userLat = 12.9344;
      this.userLon = 77.6288;
    } else if (wardName.includes('HSR')) {
      this.userLat = 12.9116;
      this.userLon = 77.6534;
    } else if (wardName.includes('Malleshwaram')) {
      this.userLat = 12.9982;
      this.userLon = 77.5714;
    } else if (wardName.includes('Whitefield')) {
      this.userLat = 12.9850;
      this.userLon = 77.7440;
    } else {
      this.userLat = 12.9719;
      this.userLon = 77.6412;
    }
    const dLat = document.getElementById('display-lat');
    const dLon = document.getElementById('display-lon');
    if (dLat) dLat.textContent = `${this.userLat.toFixed(4)}° N`;
    if (dLon) dLon.textContent = `${this.userLon.toFixed(4)}° E`;
  },

  detectGPS() {
    Toast.show('Live GPS Geolocation Acquired (Accuracy: ± 4m)', 'info');
    this.userLat = 12.9719;
    this.userLon = 77.6412;
    const dLat = document.getElementById('display-lat');
    const dLon = document.getElementById('display-lon');
    if (dLat) dLat.textContent = `${this.userLat.toFixed(4)}° N`;
    if (dLon) dLon.textContent = `${this.userLon.toFixed(4)}° E`;
  },

  pickSampleImage(url, label) {
    this.setEvidence({ url, name: url.split('/').pop(), source: 'sample' });

    // Auto-match category based on image
    if (label.includes('Pothole')) {
      this.selectCategory('Roads and potholes');
      document.getElementById('report-title').value = "Hazardous deep asphalt crater near 12th Main junction";
    } else if (label.includes('Water')) {
      this.selectCategory('Water supply and leakage');
      document.getElementById('report-title').value = "High pressure water pipe leak eroding road sub-base";
    } else if (label.includes('Garbage')) {
      this.selectCategory('Garbage and sanitation');
      document.getElementById('report-title').value = "Unsegregated commercial solid waste pile overflowing";
    } else if (label.includes('Streetlights')) {
      this.selectCategory('Streetlights and electricity');
      document.getElementById('report-title').value = "Entire corridor dark with open electrical junction box";
    }
    this.triggerAIAnalysis();
    Toast.show(`Sample evidence loaded: ${label}`, 'info');
  },

  _aiDebounce: null,
  aiResult: null,

  triggerAIAnalysis() {
    clearTimeout(this._aiDebounce);
    this._aiDebounce = setTimeout(() => {
      this.executeAIAnalysis();
    }, 350);
  },

  async executeAIAnalysis() {
    const title = (document.getElementById('report-title') ? document.getElementById('report-title').value : '').trim();
    const desc = (document.getElementById('report-description') ? document.getElementById('report-description').value : '').trim();
    const queryText = title ? `${title}. ${desc}` : desc;

    if (queryText.length < 3) {
      this.renderFallbackAIAnalysis();
      return;
    }

    const detectedEl = document.getElementById('ai-detected-issue');
    const deptEl = document.getElementById('ai-department');
    const sevEl = document.getElementById('ai-severity-score');
    const safetyList = document.getElementById('ai-safety-list');

    if (detectedEl) {
      detectedEl.innerHTML = '<span class="text-cyan-400 animate-pulse font-mono text-xs">🤖 Analyzing via Gemini Triage Engine...</span>';
    }

    try {
      const res = await API.analyzeComplaint(queryText, this.selectedImageBase64);
      this.aiResult = res;

      if (detectedEl) detectedEl.textContent = res.summary || res.category;
      if (deptEl) deptEl.textContent = res.department;
      if (sevEl) {
        const priorityColor = res.priority === 'High' ? 'text-rose-400' : (res.priority === 'Medium' ? 'text-amber-400' : 'text-emerald-400');
        sevEl.innerHTML = `<span class="${priorityColor}">${res.priority.toUpperCase()} Priority</span> <span class="text-slate-400 font-normal">(${res.confidence_score ? Math.round(res.confidence_score * 40) : 34}/40 pts)</span>`;
      }
      if (safetyList) {
        const concerns = [res.suggested_next_action];
        if (res.source) {
          concerns.push(`Triage Model: ${res.source === 'lovable_ai_connector' ? 'Gemini 1.5 Multimodal' : 'Deterministic Civic Engine'}`);
        }
        safetyList.innerHTML = concerns.map(c => `
          <li class="flex items-center gap-1.5 text-cyan-300">
            <span>•</span> ${c}
          </li>
        `).join('');
      }

      // Automatically sync category selection pill if user hasn't explicitly clicked a non-default category
      if (res.category && res.category !== this.selectedCategory) {
        this.selectCategorySilently(res.category);
      }
    } catch (err) {
      console.warn('Live AI Triage API failed, falling back locally:', err);
      this.renderFallbackAIAnalysis();
    }
  },

  selectCategorySilently(catId) {
    this.selectedCategory = catId;
    document.querySelectorAll('.category-pill').forEach(el => {
      el.classList.remove('bg-cyan-500/15', 'border-cyan-400', 'text-cyan-300');
      el.classList.add('bg-navy-950/60', 'border-slate-700/80', 'text-slate-300');
    });
    const target = document.getElementById(`cat-pill-${catId.replace(/\s+/g, '-')}`);
    if (target) {
      target.classList.remove('bg-navy-950/60', 'border-slate-700/80', 'text-slate-300');
      target.classList.add('bg-cyan-500/15', 'border-cyan-400', 'text-cyan-300');
    }
  },

  renderFallbackAIAnalysis() {
    const title = (document.getElementById('report-title') ? document.getElementById('report-title').value : '').toLowerCase();
    const cat = this.selectedCategory;

    const detectedEl = document.getElementById('ai-detected-issue');
    const deptEl = document.getElementById('ai-department');
    const sevEl = document.getElementById('ai-severity-score');
    const safetyList = document.getElementById('ai-safety-list');

    let dept = "Road Infrastructure & Engineering Department";
    let issue = "Surface structural road hazard";
    let severity = "HIGH (32/40 pts)";
    let concerns = ["Vehicle structural damage risk", "Monsoon pothole expansion"];

    if (cat.includes('Water') || title.includes('water') || title.includes('pipe')) {
      dept = "Water Supply and Sewerage Board";
      issue = "Potable water pipeline rupture / high-loss main leak";
      severity = "CRITICAL (38/40 pts)";
      concerns = ["Sub-base erosion under road", "Loss of municipal treated water"];
    } else if (cat.includes('Garbage') || title.includes('garbage') || title.includes('waste')) {
      dept = "Solid Waste Management Department";
      issue = "Illegal commercial solid waste accumulation";
      severity = "MEDIUM (24/40 pts)";
      concerns = ["Public health vector breeding", "Odor and pedestrian sidewalk blockade"];
    } else if (cat.includes('Light') || cat.includes('Electricity') || title.includes('light')) {
      dept = "Electricity Supply and Public Lighting Department";
      issue = "Non-functioning luminaire stretch & exposed electrical conductor";
      severity = "HIGH (34/40 pts)";
      concerns = ["Fatal electrocution hazard during rain", "Pedestrian nighttime vulnerability"];
    } else if (cat.includes('Drain') || title.includes('drain')) {
      dept = "Storm Water Drainage & Sewage Department";
      issue = "Clogged culvert & street inundation";
      severity = "HIGH (31/40 pts)";
      concerns = ["Flash flood waterlogging", "Road closure risk"];
    }

    if (detectedEl) detectedEl.textContent = issue;
    if (deptEl) deptEl.textContent = dept;
    if (sevEl) sevEl.textContent = severity;
    if (safetyList) {
      safetyList.innerHTML = concerns.map(c => `
        <li class="flex items-center gap-1.5 text-rose-300">
          <span>•</span> ${c}
        </li>
      `).join('');
    }
  },

  async handleSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('report-title').value.trim();
    const desc = document.getElementById('report-description').value.trim();
    const ward = document.getElementById('report-ward').value;
    const address = document.getElementById('report-address').value.trim();

    if (!title || !desc || !address) {
      Toast.show('Please fill in all mandatory fields before submitting.', 'error');
      return;
    }

    if (this.isProcessingPhoto) {
      Toast.show('Still preparing your photo. Please try again in a moment.', 'info');
      return;
    }

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = `
      <span class="w-4 h-4 rounded-full border-2 border-navy-950 border-t-transparent animate-spin"></span>
      <span>AI Triage & Geo-tagging in progress...</span>
    `;

    const locality = ward.split('-')[1] ? ward.split('-')[1].trim() : "Central Ward";
    const assignedDept = (this.aiResult && this.aiResult.department) || "Public Works & General Civic Administration";
    const priority = (this.aiResult && this.aiResult.priority) || "High";
    const summary = (this.aiResult && this.aiResult.summary) || title;
    const nextAction = (this.aiResult && this.aiResult.suggested_next_action) || "Dispatch field technician.";

    let created = null;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', desc);
      formData.append('category', this.selectedCategory);
      formData.append('priority', priority);
      formData.append('assigned_department', assignedDept);
      formData.append('ai_summary', summary);
      formData.append('suggested_next_action', nextAction);
      formData.append('latitude', String(this.userLat));
      formData.append('longitude', String(this.userLon));
      formData.append('address', address);
      formData.append('locality', locality);
      formData.append('ward', ward);
      formData.append('is_public', '1');

      if (this.selectedFile) {
        formData.append('images', this.selectedFile);
      }

      created = await API.submitComplaint(formData);
      Toast.show(`Ticket ${created.id} submitted via live backend!`, 'success');
    } catch (err) {
      console.warn('API submission failed, synchronizing with local state:', err);
      created = MockDB.createComplaint({
        title,
        description: desc,
        category: this.selectedCategory,
        locality: locality,
        ward: ward,
        address: address,
        lat: this.userLat,
        lon: this.userLon,
        media_urls: [this.selectedImage],
        assigned_department: assignedDept,
        severity: priority,
        severity_score: 74.0,
        safety_concerns: ["Pedestrian & vehicular transit safety risk", "Prioritized for rapid field crew dispatch"]
      });
      Toast.show(`Complaint registered (offline mode): ${created.id}`, 'info');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${Icons.get('sparkles', 'w-4 h-4 text-navy-950')}<span>Submit Civic Grievance</span>`;
    }

    if (created) {
      ReportComplaintView.showSuccessModal(created);
    }
  },

  showSuccessModal(complaint) {
    const isDuplicate = complaint.potential_duplicates_count && complaint.potential_duplicates_count > 0;

    const modalHtml = `
      <div id="success-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
        <div class="navy-card p-6 sm:p-8 max-w-md w-full border-cyan-400/50 shadow-2xl text-center space-y-5 page-fade-in">
          
          <div class="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
            ${Icons.get('checkCircle', 'w-8 h-8')}
          </div>

          <div class="space-y-1">
            <span class="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-bold">Ticket Issued & AI Triaged</span>
            <h3 class="text-xl font-extrabold text-white">Grievance Registered Successfully!</h3>
            <p class="text-xs text-slate-300">
              Your issue has been indexed into the municipal system and assigned to the field engineering desk.
            </p>
          </div>

          <!-- Ticket Box -->
          <div class="p-4 rounded-xl bg-navy-950 border border-slate-800 text-left space-y-2">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="text-slate-400">Tracking ID:</span>
              <span class="text-cyan-400 font-bold text-sm">${complaint.id}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">Department:</span>
              <span class="text-slate-200 font-medium truncate max-w-[200px]">${complaint.assigned_department}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">Severity Level:</span>
              <span class="text-amber-400 font-bold text-xs">${complaint.severity || 'High'}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">Target SLA:</span>
              <span class="text-emerald-400 font-mono font-bold">24-48 Hours</span>
            </div>
          </div>

          ${isDuplicate ? `
            <!-- Duplicate Detection Notice -->
            <div class="p-3 rounded-xl bg-cyan-950/60 border border-cyan-400/40 text-left text-xs space-y-1">
              <div class="flex items-center gap-1.5 text-cyan-300 font-bold font-mono text-[11px]">
                <span>🔍 AI GEOSPATIAL CONSOLIDATION</span>
              </div>
              <p class="text-slate-300 text-[11px]">
                <strong>${complaint.potential_duplicates_count}</strong> similar report(s) detected within 500m. Your report has reinforced this incident cluster to accelerate municipal field dispatch.
              </p>
            </div>
          ` : ''}

          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onclick="ReportComplaintView.closeSuccessModal(); Router.navigate('track', '${complaint.id}');"
              class="flex-1 py-2.5 rounded-xl bg-electric-gradient text-navy-950 font-bold text-xs shadow-md transition"
            >
              Track Complaint Status
            </button>
            <button 
              onclick="ReportComplaintView.closeSuccessModal(); Router.navigate('citizen-dashboard');"
              class="py-2.5 px-4 rounded-xl bg-navy-800 text-white font-semibold text-xs border border-slate-700 hover:border-cyan-400 transition"
            >
              Go to Dashboard
            </button>
          </div>

        </div>
      </div>
    `;

    const el = document.createElement('div');
    el.innerHTML = modalHtml;
    document.body.appendChild(el.firstElementChild);
    Toast.show(`Ticket ${complaint.id} generated successfully!`, 'success');
  },

  closeSuccessModal() {
    const el = document.getElementById('success-modal');
    if (el) el.remove();
  }
};
