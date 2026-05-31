// ============================================================
// ScholarSense AI — Application Logic
// ============================================================

(function () {
    'use strict';

    // ── DOM References ──────────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const DOM = {
        loadingScreen: $('#loading-screen'),
        loadingMessage: $('#loading-message'),
        loadingProgressBar: $('#loading-progress-bar'),
        navbar: $('#navbar'),
        particlesContainer: $('#particles'),
        studentForm: $('#student-form'),
        analyzeBtn: $('#analyze-btn'),
        btnLoading: $('#btn-loading'),
        analysisLoading: $('#analysis-loading'),
        analysisMessage: $('#analysis-message'),
        resultsSection: $('#results-section'),
        inlineResults: $('#inline-results'),
        inlineScore: $('#inline-score'),
        inlineLevel: $('#inline-level'),
        inlineRecommendations: $('#inline-recommendations'),
        formError: $('#form-error'),
        // Score
        scoreSkeleton: $('#score-skeleton'),
        scoreContent: $('#score-content'),
        scoreNumber: $('#score-number'),
        scoreRingFill: $('#score-ring-fill'),
        scoreLabel: $('#score-label'),
        // Level
        levelSkeleton: $('#level-skeleton'),
        levelContent: $('#level-content'),
        performanceBadge: $('#performance-badge'),
        badgeIcon: $('#badge-icon'),
        badgeText: $('#badge-text'),
        performanceSummary: $('#performance-summary'),
        confidenceFill: $('#confidence-fill'),
        confidenceValue: $('#confidence-value'),
        consistencyFill: $('#consistency-fill'),
        consistencyValue: $('#consistency-value'),
        // Recommendations
        recommendationsSkeleton: $('#recommendations-skeleton'),
        recommendationsList: $('#recommendations-list'),
        // Insights
        insightsSkeleton: $('#insights-skeleton'),
        insightsList: $('#insights-list'),
        // Mobile menu
        mobileMenuBtn: $('#mobile-menu-btn'),
    };

    // ── Loading Screen ──────────────────────────────────────────
    const loadingMessages = [
        'Initializing ScholarSense AI...',
        'Loading Academic Intelligence Engine...',
        'Preparing Performance Analytics...',
    ];

    function runLoadingScreen() {
        let msgIndex = 0;
        const msgInterval = setInterval(() => {
            msgIndex++;
            if (msgIndex < loadingMessages.length) {
                DOM.loadingMessage.style.opacity = '0';
                setTimeout(() => {
                    DOM.loadingMessage.textContent = loadingMessages[msgIndex];
                    DOM.loadingMessage.style.opacity = '1';
                }, 300);
            }
        }, 600);

        // Animate progress bar
        DOM.loadingProgressBar.style.transition = 'width 1.8s cubic-bezier(0.4, 0, 0.2, 1)';
        requestAnimationFrame(() => {
            DOM.loadingProgressBar.style.width = '100%';
        });

        setTimeout(() => {
            clearInterval(msgInterval);
            DOM.loadingScreen.classList.add('loading-hidden');
            setTimeout(() => {
                DOM.loadingScreen.style.display = 'none';
            }, 600);
        }, 2000);
    }

    function showError(message) {
        const errorEl = $('#form-error');
        if (!errorEl) return;
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }

    function clearError() {
        const errorEl = $('#form-error');
        if (!errorEl) return;
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }

    function showInlineResults(responseData) {
        if (!DOM.inlineResults) return;

        DOM.inlineScore.textContent = `${responseData.predicted_score}%`;
        DOM.inlineLevel.textContent = responseData.performance_level;
        DOM.inlineRecommendations.innerHTML = '';

        responseData.recommendations.forEach((recommendation) => {
            const recItem = document.createElement('div');
            recItem.className = 'inline-recommendation';
            recItem.textContent = recommendation;
            DOM.inlineRecommendations.appendChild(recItem);
        });

        DOM.inlineResults.classList.remove('hidden');
    }

    function clearInlineResults() {
        if (!DOM.inlineResults) return;
        DOM.inlineResults.classList.add('hidden');
        if (DOM.inlineRecommendations) DOM.inlineRecommendations.innerHTML = '';
    }

    async function fetchPrediction(payload) {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const body = await response.json().catch(() => null);
            const detail = body?.detail || 'Unable to connect to the prediction service.';
            throw new Error(detail);
        }

        return await response.json();
    }

    // ── Particle System (Canvas-Based Interactive Bubbles) ──────
    class Bubble {
        constructor(canvasWidth, canvasHeight) {
            this.reset(canvasWidth, canvasHeight, true);
        }

        reset(canvasWidth, canvasHeight, startAnywhere = false) {
            this.radius = Math.random() * 12 + 6; // bubble size: 6px to 18px radius
            this.x = Math.random() * canvasWidth;
            // Distribute vertically on initial load, otherwise spawn below screen
            this.y = startAnywhere ? Math.random() * canvasHeight : canvasHeight + this.radius + Math.random() * 100;
            
            // Core drift velocity (moving upwards and slightly left/right)
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = - (Math.random() * 0.5 + 0.3); // Upward float
            
            // Sway physics (using a sine wave to emulate floating water bubble drift)
            this.swaySpeed = Math.random() * 0.02 + 0.01;
            this.swayRange = Math.random() * 0.4 + 0.1;
            this.swayOffset = Math.random() * Math.PI * 2;
            
            // Semi-transparent branding colors (Indigo, Violet, Purple, Cyan, Emerald)
            const colors = [
                'rgba(10, 65, 116, ',   // Indigo
                'rgba(78, 142, 162, ',  // Violet
                'rgba(123, 189, 232, ',  // Purple
                'rgba(123, 189, 232, ',  // Cyan
                'rgba(189, 216, 233, '   // Emerald / Ice Blue
            ];
            this.colorPrefix = colors[Math.floor(Math.random() * colors.length)];
            this.alpha = Math.random() * 0.2 + 0.15; // 0.15 to 0.35 opacity
            
            // Interactive mouse repulsion velocity offsets
            this.ix = 0;
            this.iy = 0;
        }

        update(canvasWidth, canvasHeight, mouse) {
            // Horizontal sway
            this.swayOffset += this.swaySpeed;
            const currentSway = Math.sin(this.swayOffset) * this.swayRange;
            
            // Mouse interaction (repulsion)
            if (mouse.x !== null && mouse.y !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const effectRadius = 160; // range of hover disturbance
                
                if (dist < effectRadius) {
                    const force = (effectRadius - dist) / effectRadius; // 0 (far) to 1 (on top)
                    const angle = Math.atan2(dy, dx);
                    
                    // Smooth repulsion acceleration
                    const push = force * 1.8;
                    this.ix += Math.cos(angle) * push;
                    this.iy += Math.sin(angle) * push;
                }
            }
            
            // Apply friction/damping to the interactive velocity
            this.ix *= 0.92;
            this.iy *= 0.92;
            
            // Apply normal float speed + interactive deflection + sway
            this.x += this.vx + this.ix + currentSway;
            this.y += this.vy + this.iy;
            
            // Wrap left/right sides
            if (this.x < -this.radius) {
                this.x = canvasWidth + this.radius;
            } else if (this.x > canvasWidth + this.radius) {
                this.x = -this.radius;
            }
            
            // Respawn at bottom once bubble floats off the top
            if (this.y < -this.radius) {
                this.reset(canvasWidth, canvasHeight, false);
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            
            // Radial gradient for 3D sphere highlighting
            const grad = ctx.createRadialGradient(
                this.x - this.radius * 0.3, 
                this.y - this.radius * 0.3, 
                this.radius * 0.1,
                this.x, 
                this.y, 
                this.radius
            );
            grad.addColorStop(0, `${this.colorPrefix}${this.alpha + 0.15})`);
            grad.addColorStop(0.6, `${this.colorPrefix}${this.alpha * 0.3})`);
            grad.addColorStop(1, `${this.colorPrefix}0.02)`);
            
            ctx.fillStyle = grad;
            ctx.fill();
            
            // Outer stroke for bubble boundary
            ctx.strokeStyle = `${this.colorPrefix}${this.alpha * 0.6})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Small light reflection dot on the top-left portion of the bubble
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.5})`;
            ctx.fill();
        }
    }

    let canvas = null;
    let ctx = null;
    let bubbles = [];
    const mouse = { x: null, y: null };
    let animId = null;

    function getBubbleCount() {
        const w = window.innerWidth;
        if (w < 480) return 25;
        if (w < 768) return 45;
        if (w < 1200) return 80;
        return 120;
    }

    function resizeCanvas() {
        if (!canvas) return;
        const container = DOM.particlesContainer;
        if (!container) return;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        const targetCount = getBubbleCount();
        if (bubbles.length < targetCount) {
            while (bubbles.length < targetCount) {
                bubbles.push(new Bubble(canvas.width, canvas.height));
            }
        } else if (bubbles.length > targetCount) {
            bubbles.splice(targetCount);
        }
    }

    function animateParticles() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < bubbles.length; i++) {
            bubbles[i].update(canvas.width, canvas.height, mouse);
            bubbles[i].draw(ctx);
        }
        
        animId = requestAnimationFrame(animateParticles);
    }

    function createParticles() {
        const container = DOM.particlesContainer;
        if (!container) return;

        // Clean container and insert canvas
        container.innerHTML = '';
        canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        container.appendChild(canvas);
        ctx = canvas.getContext('2d');

        // Initial sizing
        resizeCanvas();

        // Populate particles
        const count = getBubbleCount();
        bubbles = [];
        for (let i = 0; i < count; i++) {
            bubbles.push(new Bubble(canvas.width, canvas.height));
        }

        // Attach resize event
        window.addEventListener('resize', resizeCanvas);

        // Capture hover movements from the #hero container
        const heroSection = $('#hero');
        if (heroSection) {
            heroSection.addEventListener('mousemove', (e) => {
                const rect = heroSection.getBoundingClientRect();
                mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
                mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
            });

            heroSection.addEventListener('mouseleave', () => {
                mouse.x = null;
                mouse.y = null;
            });

            heroSection.addEventListener('mouseenter', (e) => {
                const rect = heroSection.getBoundingClientRect();
                mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
                mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
            });
        }

        // Start requestAnimationFrame loop
        if (animId) cancelAnimationFrame(animId);
        animateParticles();
    }

    // ── Scroll Reveal ───────────────────────────────────────────
    function initScrollReveal() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        $$('.reveal').forEach((el) => observer.observe(el));
    }

    // ── Navbar Scroll Effect ────────────────────────────────────
    function initNavbarScroll() {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 50) {
                DOM.navbar.classList.add('scrolled');
            } else {
                DOM.navbar.classList.remove('scrolled');
            }
            lastScroll = currentScroll;
        });
    }

    // ── Mobile Menu ─────────────────────────────────────────────
    function initMobileMenu() {
        if (!DOM.mobileMenuBtn) return;
        DOM.mobileMenuBtn.addEventListener('click', () => {
            DOM.mobileMenuBtn.classList.toggle('active');
            const navLinks = $('.navbar-links');
            if (navLinks) navLinks.classList.toggle('active');
        });

        // Close menu on link click
        $$('.nav-link').forEach((link) => {
            link.addEventListener('click', () => {
                DOM.mobileMenuBtn.classList.remove('active');
                const navLinks = $('.navbar-links');
                if (navLinks) navLinks.classList.remove('active');
            });
        });
    }

    // ── Form Validation ─────────────────────────────────────────
    const validationRules = {
        'hours-studied': { min: 0, max: 12, label: 'Hours Studied' },
        'sleep-hours': { min: 0, max: 12, label: 'Sleep Hours' },
        attendance: { min: 0, max: 100, label: 'Attendance' },
        'previous-scores': { min: 0, max: 100, label: 'Previous Scores' },
    };

    function validateInput(input) {
        const rules = validationRules[input.id];
        if (!rules) return true;

        const value = parseFloat(input.value);
        const group = input.closest('.input-group');
        const validationEl = group.querySelector('.input-validation');

        if (input.value === '' || isNaN(value)) {
            group.classList.remove('valid', 'invalid');
            if (validationEl) validationEl.textContent = '';
            return false;
        }

        if (value < rules.min || value > rules.max) {
            group.classList.remove('valid');
            group.classList.add('invalid');
            if (validationEl) validationEl.textContent = `${rules.label} must be between ${rules.min} and ${rules.max}`;
            return false;
        }

        group.classList.remove('invalid');
        group.classList.add('valid');
        if (validationEl) validationEl.textContent = '';
        return true;
    }

    function initFormValidation() {
        Object.keys(validationRules).forEach((id) => {
            const input = $(`#${id}`);
            if (input) {
                input.addEventListener('input', () => validateInput(input));
                input.addEventListener('blur', () => validateInput(input));
            }
        });
    }

    // ── Prediction Engine (Placeholder) ─────────────────────────
    function predictScore(data) {
        // Placeholder prediction logic (to be replaced with API call)
        const { hoursStudied, sleepHours, attendance, previousScores } = data;

        // Weighted formula for realistic placeholder
        let score =
            hoursStudied * 3.5 +
            sleepHours * 1.2 +
            attendance * 0.35 +
            previousScores * 0.3;

        // Normalize to 0-100
        score = Math.min(100, Math.max(0, Math.round(score)));

        return score;
    }

    function getPerformanceLevel(score) {
        if (score >= 90) return { level: 'Excellent', color: '#34d399', icon: '🏆', summary: 'Outstanding performance! You are excelling in your academic journey. Your dedication and consistent efforts are clearly reflected in your predicted score.' };
        if (score >= 75) return { level: 'Good', color: '#7BBDE8', icon: '⭐', summary: 'Great work! Your predicted performance indicates a solid understanding of the material. Keep up the momentum and continue building on your strengths.' };
        if (score >= 60) return { level: 'Average', color: '#eab308', icon: '📊', summary: 'Your performance is satisfactory but there is room for improvement. Focus on the recommended areas to boost your academic scores.' };
        if (score >= 40) return { level: 'Needs Improvement', color: '#f97316', icon: '📈', summary: 'Your predicted score suggests areas that need attention. Follow the personalized recommendations below to improve your academic performance.' };
        return { level: 'Critical', color: '#ef4444', icon: '⚠️', summary: 'Your academic metrics indicate significant areas for improvement. Immediate action is recommended. Please follow the suggestions below carefully.' };
    }

    function generateRecommendations(data, score) {
        const recs = [];

        if (data.hoursStudied < 4) {
            recs.push({
                icon: '📚',
                title: 'Increase Study Hours',
                text: 'Aim for at least 4–6 hours of focused study daily. Break sessions into 25-minute Pomodoro intervals for maximum retention.',
                priority: 'high',
            });
        } else if (data.hoursStudied < 6) {
            recs.push({
                icon: '📖',
                title: 'Optimize Study Sessions',
                text: 'Your study hours are decent. Try incorporating active recall and spaced repetition techniques for better results.',
                priority: 'medium',
            });
        } else {
            recs.push({
                icon: '✅',
                title: 'Excellent Study Habits',
                text: 'Your study hours are well-maintained. Focus on quality over quantity and ensure you take regular breaks.',
                priority: 'low',
            });
        }

        if (data.sleepHours < 6) {
            recs.push({
                icon: '😴',
                title: 'Improve Sleep Quality',
                text: 'Maintain at least 6–8 hours of quality sleep daily. Sleep is crucial for memory consolidation and cognitive performance.',
                priority: 'high',
            });
        } else if (data.sleepHours <= 8) {
            recs.push({
                icon: '🌙',
                title: 'Maintain Sleep Schedule',
                text: 'Your sleep pattern is healthy. Maintain a consistent sleep-wake cycle for optimal brain function.',
                priority: 'low',
            });
        } else {
            recs.push({
                icon: '⏰',
                title: 'Optimize Sleep Duration',
                text: 'Consider reducing excess sleep hours and channeling that time into productive study or physical activity.',
                priority: 'medium',
            });
        }

        if (data.attendance < 75) {
            recs.push({
                icon: '🏫',
                title: 'Improve Class Attendance',
                text: 'Regular attendance is strongly correlated with academic success. Aim for at least 85% attendance for best results.',
                priority: 'high',
            });
        } else {
            recs.push({
                icon: '🎯',
                title: 'Active Class Participation',
                text: 'Great attendance record! Maximize your classroom time by actively participating in discussions and asking questions.',
                priority: 'low',
            });
        }

        if (data.previousScores < 60) {
            recs.push({
                icon: '🔄',
                title: 'Revise Previous Concepts',
                text: 'Strengthen your foundational knowledge by revisiting previous topics. Consider forming study groups for collaborative learning.',
                priority: 'high',
            });
        } else {
            recs.push({
                icon: '📝',
                title: 'Regular Revision Practice',
                text: 'Keep revising previous concepts regularly to maintain strong recall. Practice with past papers and mock tests.',
                priority: 'medium',
            });
        }

        // Add general recommendation
        if (score < 75) {
            recs.push({
                icon: '💡',
                title: 'Seek Academic Support',
                text: 'Consider consulting with professors during office hours or joining tutoring sessions for subjects you find challenging.',
                priority: 'medium',
            });
        }

        return recs;
    }

    // ── Analysis Loading Animation ──────────────────────────────
    const analysisMessages = [
        'Analyzing Study Patterns...',
        'Evaluating Academic Performance...',
        'Comparing Academic Metrics...',
        'Generating Personalized Recommendations...',
    ];

    function showAnalysisLoading() {
        return new Promise((resolve) => {
            DOM.analysisLoading.classList.add('active');
            let msgIndex = 0;

            const msgInterval = setInterval(() => {
                msgIndex++;
                if (msgIndex < analysisMessages.length) {
                    DOM.analysisMessage.style.opacity = '0';
                    setTimeout(() => {
                        DOM.analysisMessage.textContent = analysisMessages[msgIndex];
                        DOM.analysisMessage.style.opacity = '1';
                    }, 300);
                }
            }, 700);

            setTimeout(() => {
                clearInterval(msgInterval);
                DOM.analysisLoading.classList.remove('active');
                resolve();
            }, 3000);
        });
    }

    // ── Score Counter Animation ─────────────────────────────────
    function animateCounter(element, target, duration = 1500) {
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (target - start) * eased);
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ── Score Ring Animation ────────────────────────────────────
    function animateScoreRing(score) {
        const circumference = 2 * Math.PI * 85; // r=85
        DOM.scoreRingFill.style.strokeDasharray = circumference;
        DOM.scoreRingFill.style.strokeDashoffset = circumference;

        // Set color based on score
        const perf = getPerformanceLevel(score);
        DOM.scoreRingFill.style.stroke = perf.color;

        requestAnimationFrame(() => {
            const offset = circumference - (score / 100) * circumference;
            DOM.scoreRingFill.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
            DOM.scoreRingFill.style.strokeDashoffset = offset;
        });
    }

    // ── Render Results ──────────────────────────────────────────
    function renderResults(requestData, responseData) {
        const score = responseData.predicted_score;
        const perf = getPerformanceLevel(score);
        const recommendations = responseData.recommendations || [];

        // Show results section
        DOM.resultsSection.classList.remove('hidden');

        // Show skeletons first
        showSkeletons();

        // Scroll to results
        setTimeout(() => {
            DOM.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        // After a delay, reveal actual content
        setTimeout(() => {
            hideSkeletons();
            revealScore(score, perf);
            revealLevel(perf, score, responseData.performance_level);
        }, 1200);

        setTimeout(() => {
            revealRecommendations(recommendations);
        }, 1800);

        setTimeout(() => {
            revealInsights(requestData);
        }, 2200);

        // Re-observe reveal elements in results
        setTimeout(() => {
            initScrollReveal();
        }, 200);
    }

    function showSkeletons() {
        DOM.scoreSkeleton.classList.remove('hidden');
        DOM.scoreContent.classList.add('hidden');
        DOM.levelSkeleton.classList.remove('hidden');
        DOM.levelContent.classList.add('hidden');
        DOM.recommendationsSkeleton.classList.remove('hidden');
        DOM.recommendationsList.classList.add('hidden');
        DOM.insightsSkeleton.style.display = 'contents';
        DOM.insightsList.classList.add('hidden');
    }

    function hideSkeletons() {
        DOM.scoreSkeleton.classList.add('hidden');
        DOM.scoreContent.classList.remove('hidden');
        DOM.levelSkeleton.classList.add('hidden');
        DOM.levelContent.classList.remove('hidden');
    }

    function revealScore(score, perf) {
        // Animate counter
        animateCounter(DOM.scoreNumber, score, 1500);
        // Animate ring
        animateScoreRing(score);
        // Set label
        DOM.scoreLabel.textContent = `Predicted Performance: ${perf.level}`;
        DOM.scoreLabel.style.color = perf.color;
    }

    function revealLevel(perf, score, performanceLevel) {
        const levelText = performanceLevel || perf.level;
        DOM.badgeIcon.textContent = perf.icon;
        DOM.badgeText.textContent = levelText;
        DOM.performanceBadge.style.borderColor = perf.color;
        DOM.performanceBadge.style.background = `${perf.color}15`;
        DOM.performanceBadge.style.color = perf.color;
        DOM.performanceSummary.querySelector('p').textContent = perf.summary;

        // Animate confidence and consistency metrics
        const confidence = Math.min(98, score + Math.floor(Math.random() * 10));
        const consistency = Math.min(95, Math.max(40, score - 5 + Math.floor(Math.random() * 15)));

        setTimeout(() => {
            DOM.confidenceFill.style.width = `${confidence}%`;
            DOM.confidenceFill.style.background = perf.color;
            DOM.confidenceValue.textContent = `${confidence}%`;
            DOM.consistencyFill.style.width = `${consistency}%`;
            DOM.consistencyFill.style.background = perf.color;
            DOM.consistencyValue.textContent = `${consistency}%`;
        }, 300);
    }

    function revealRecommendations(recommendations) {
        DOM.recommendationsSkeleton.classList.add('hidden');
        DOM.recommendationsList.classList.remove('hidden');
        DOM.recommendationsList.innerHTML = '';

        recommendations.forEach((rec, index) => {
            const card = document.createElement('div');
            card.className = 'recommendation-card glass-card';
            card.style.animationDelay = `${index * 0.15}s`;

            card.innerHTML = `
                <div class="rec-body">
                    <h4 class="rec-title">Recommendation ${index + 1}</h4>
                    <p class="rec-text">${rec}</p>
                </div>
            `;

            DOM.recommendationsList.appendChild(card);
        });
    }

    function revealInsights(data) {
        DOM.insightsSkeleton.style.display = 'none';
        DOM.insightsList.classList.remove('hidden');
        DOM.insightsList.style.display = 'contents';
        DOM.insightsList.innerHTML = '';

        const insights = [
            {
                icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A4174" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
                value: `${data.hoursStudied}h`,
                label: 'Hours Studied',
                color: '#0A4174',
            },
            {
                icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4E8EA2" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
                value: `${data.sleepHours}h`,
                label: 'Sleep Hours',
                color: '#4E8EA2',
            },
            {
                icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7BBDE8" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
                value: `${data.attendance}%`,
                label: 'Attendance',
                color: '#7BBDE8',
            },
            {
                icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
                value: `${data.previousScores}`,
                label: 'Previous Scores',
                color: '#34d399',
            },
        ];

        insights.forEach((insight, index) => {
            const card = document.createElement('div');
            card.className = 'insight-card glass-card';
            card.style.animationDelay = `${index * 0.1}s`;
            card.innerHTML = `
                <div class="insight-icon-wrap" style="background: ${insight.color}15; border-color: ${insight.color}30">
                    ${insight.icon}
                </div>
                <div class="insight-value" style="color: ${insight.color}">${insight.value}</div>
                <div class="insight-label">${insight.label}</div>
            `;
            DOM.insightsList.appendChild(card);
        });
    }

    // ── Form Submission ─────────────────────────────────────────
    function initFormSubmission() {
        DOM.studentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();

            // Validate all inputs
            const inputs = DOM.studentForm.querySelectorAll('.form-input');
            let allValid = true;
            inputs.forEach((input) => {
                if (!validateInput(input)) allValid = false;
            });

            if (!allValid) {
                // Shake invalid inputs
                DOM.studentForm.querySelectorAll('.input-group.invalid, .input-group:not(.valid)').forEach((group) => {
                    group.classList.add('shake');
                    setTimeout(() => group.classList.remove('shake'), 600);
                });
                return;
            }

            // Disable button and prevent duplicate submissions
            DOM.analyzeBtn.disabled = true;
            DOM.analyzeBtn.classList.add('loading');

            const requestData = {
                hoursStudied: parseFloat($('#hours-studied').value),
                sleepHours: parseFloat($('#sleep-hours').value),
                attendance: parseFloat($('#attendance').value),
                previousScores: parseFloat($('#previous-scores').value),
            };

            const payload = {
                hours_studied: requestData.hoursStudied,
                sleep_hours: requestData.sleepHours,
                attendance_percent: requestData.attendance,
                previous_scores: requestData.previousScores,
            };

            try {
                clearInlineResults();
                const [prediction] = await Promise.all([
                    fetchPrediction(payload),
                    showAnalysisLoading(),
                ]);

                showInlineResults(prediction);
                renderResults(requestData, prediction);
            } catch (error) {
                showError(error.message || 'Something went wrong while forecasting performance.');
            } finally {
                DOM.analyzeBtn.disabled = false;
                DOM.analyzeBtn.classList.remove('loading');
            }
        });
    }

    // ── Smooth Scroll for Anchor Links ──────────────────────────
    function initSmoothScroll() {
        $$('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const navHeight = DOM.navbar.offsetHeight;
                    const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
                    window.scrollTo({ top: targetPos, behavior: 'smooth' });
                }
            });
        });
    }

    // ── Feature Card Tilt Effect ────────────────────────────────
    function initCardTilt() {
        $$('.feature-card').forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                if (window.innerWidth < 768) return;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }

    // ── Input Focus Glow ────────────────────────────────────────
    function initInputEffects() {
        $$('.form-input').forEach((input) => {
            input.addEventListener('focus', () => {
                input.closest('.input-group').classList.add('focused');
            });
            input.addEventListener('blur', () => {
                input.closest('.input-group').classList.remove('focused');
            });
        });
    }

    // ── Navbar Active Link ──────────────────────────────────────
    function initActiveNavLink() {
        const sections = $$('section[id]');
        window.addEventListener('scroll', () => {
            const scrollY = window.pageYOffset;
            sections.forEach((section) => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                const navLink = $(`.nav-link[href="#${sectionId}"]`);
                if (navLink) {
                    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                        $$('.nav-link').forEach((l) => l.classList.remove('active'));
                        navLink.classList.add('active');
                    }
                }
            });
        });
    }

    // ── Initialize Everything ───────────────────────────────────
    function init() {
        runLoadingScreen();
        createParticles();
        initScrollReveal();
        initNavbarScroll();
        initMobileMenu();
        initFormValidation();
        initFormSubmission();
        initSmoothScroll();
        initCardTilt();
        initInputEffects();
        initActiveNavLink();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
