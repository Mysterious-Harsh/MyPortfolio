// Advanced Background System with Static Images and Scrolling Content
class BackgroundSystem {
	constructor() {
		this.pageBackgrounds = {
			index: "resources/bg-home.png",
			about: "resources/bg-about.png",
			projects: "resources/bg-projects.jpg",
			experience: "resources/bg-experience.jpg",
			contact: "resources/bg-contact.jpg",
		};

		this.currentPage = this.getCurrentPage();
		this.backgroundOverlay = null;
		this.scrollEffects = [];

		this.init();
	}

	init() {
		this.setupStaticBackground();
		this.createScrollEffects();
		this.addParallaxEffects();
		this.initializeLiveElements();
	}

	getCurrentPage() {
		const path = window.location.pathname;
		if (path.includes("about")) return "about";
		if (path.includes("projects")) return "projects";
		if (path.includes("experience")) return "experience";
		if (path.includes("contact")) return "contact";
		return "index";
	}

	setupStaticBackground() {
		// Remove any existing background setup
		this.removeExistingBackgrounds();

		// Create static background container
		this.createBackgroundContainer();

		// Set background image
		this.setPageBackground();

		// Make content scrollable over background
		this.setupScrollingContent();
	}

	removeExistingBackgrounds() {
		// Remove hero backgrounds and particles
		const heroElements = document.querySelectorAll(
			".hero, #particle-canvas"
		);
		heroElements.forEach((el) => {
			if (el) el.style.background = "none";
		});
	}

	createBackgroundContainer() {
		// Create background overlay
		this.backgroundOverlay = document.createElement("div");
		this.backgroundOverlay.id = "static-background";
		this.backgroundOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
            z-index: -2;
            transition: background-image 0.8s ease;
        `;

		// Add subtle overlay for text readability
		const overlay = document.createElement("div");
		overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 10, 10, 0.3);
            z-index: -1;
        `;

		this.backgroundOverlay.appendChild(overlay);
		document.body.insertBefore(
			this.backgroundOverlay,
			document.body.firstChild
		);
	}

	setPageBackground() {
		const backgroundUrl = this.pageBackgrounds[this.currentPage];
		if (backgroundUrl && this.backgroundOverlay) {
			this.backgroundOverlay.style.backgroundImage = `url('${backgroundUrl}')`;
		}
	}

	setupScrollingContent() {
		// Ensure main content scrolls over background
		const mainContent = document.querySelector(".main-content");
		if (mainContent) {
			mainContent.style.position = "relative";
			mainContent.style.zIndex = "1";
			mainContent.style.background = "transparent";
		}

		// Make sections have transparent backgrounds
		const sections = document.querySelectorAll("section");
		sections.forEach((section) => {
			section.style.background = "transparent";
			section.style.position = "relative";
			section.style.zIndex = "1";
		});

		// Add subtle background to content cards for readability
		const cards = document.querySelectorAll(
			".skill-card, .project-card, .experience-card, .contact-card, .timeline-content"
		);
		cards.forEach((card) => {
			card.style.background = "rgba(26, 26, 26, 0.9)";
			card.style.backdropFilter = "blur(10px)";
		});
	}

	createScrollEffects() {
		// Add scroll-triggered animations
		window.addEventListener("scroll", () => {
			this.updateScrollEffects();
		});
	}

	updateScrollEffects() {
		const scrollY = window.pageYOffset;
		const windowHeight = window.innerHeight;

		// Parallax effect for background
		if (this.backgroundOverlay) {
			const parallaxSpeed = 0.2;
			this.backgroundOverlay.style.transform = `translateY(${
				scrollY * parallaxSpeed
			}px)`;
		}

		// Fade in sections as they come into view
		const sections = document.querySelectorAll("section");
		sections.forEach((section, index) => {
			const rect = section.getBoundingClientRect();
			const sectionTop = rect.top;
			const sectionHeight = rect.height;

			if (
				sectionTop < windowHeight * 0.8 &&
				sectionTop > -sectionHeight
			) {
				const opacity = Math.max(
					0,
					Math.min(1, (windowHeight - sectionTop) / windowHeight)
				);
				section.style.opacity = opacity;
				section.style.transform = `translateY(${(1 - opacity) * 30}px)`;
			}
		});
	}

	addParallaxEffects() {
		// Add parallax to specific elements
		const parallaxElements = document.querySelectorAll(
			".skill-card, .project-card, .stat-item, .metric-card"
		);

		window.addEventListener("scroll", () => {
			const scrollY = window.pageYOffset;

			parallaxElements.forEach((element, index) => {
				// const speed = 0.01 + (index % 2) * 0.05;
				// const yPos = -(scrollY * speed);
				const yPos = -(scrollY * 0.01);
				element.style.transform = `translateY(${yPos}px)`;
			});
		});
	}

	initializeLiveElements() {
		// Add animated particles that move with scroll
		this.createFloatingParticles();

		// Add wave effects to backgrounds
		this.createWaveEffects();

		// Add glow effects that pulse with scroll
		this.createScrollGlowEffects();
	}

	createFloatingParticles() {
		const particleContainer = document.createElement("div");
		particleContainer.id = "floating-particles";
		particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        `;

		// Create particles
		for (let i = 0; i < 20; i++) {
			const particle = document.createElement("div");
			particle.className = "floating-particle";
			particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: var(--accent-color);
                border-radius: 50%;
                opacity: 0.8;
                animation: float ${5 + Math.random() * 5}s infinite linear;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 2}s;
            `;
			particleContainer.appendChild(particle);
		}

		document.body.appendChild(particleContainer);

		// Add floating animation
		const style = document.createElement("style");
		style.textContent = `
            @keyframes float {
                0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                10% { opacity: 0.8; }
                90% { opacity: 0.8; }
                100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
            }
        `;
		document.head.appendChild(style);
	}

	createWaveEffects() {
		const waveContainer = document.createElement("div");
		waveContainer.id = "wave-effects";
		waveContainer.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 200px;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        `;

		// Create wave layers
		for (let i = 0; i < 3; i++) {
			const wave = document.createElement("div");
			wave.className = "wave";
			wave.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 100px;
                background: linear-gradient(45deg, var(--accent-color), transparent);
                opacity: 0.1;
                animation: wave ${3 + i * 2}s infinite ease-in-out;
                animation-delay: ${i * 0.5}s;
            `;
			waveContainer.appendChild(wave);
		}

		document.body.appendChild(waveContainer);

		// Add wave animation
		const style = document.createElement("style");
		style.textContent = `
            @keyframes wave {
                0%, 100% { transform: translateX(0) translateY(0); }
                25% { transform: translateX(-25px) translateY(-10px); }
                50% { transform: translateX(25px) translateY(5px); }
                75% { transform: translateX(-15px) translateY(-5px); }
            }
        `;
		document.head.appendChild(style);
	}

	createScrollGlowEffects() {
		const glowElements = document.querySelectorAll(
			".btn, .tech-tag, .skill-progress-fill"
		);

		window.addEventListener("scroll", () => {
			const scrollY = window.pageYOffset;
			const scrollProgress =
				scrollY / (document.body.scrollHeight - window.innerHeight);

			glowElements.forEach((element) => {
				const glowIntensity = 0.5 + scrollProgress * 0.5;
				element.style.boxShadow = `0 0 ${
					10 * glowIntensity
				}px var(--accent-color)`;
				element.style.filter = `brightness(${
					0.8 + scrollProgress * 0.4
				})`;
			});
		});
	}

	// Public method to change background
	changeBackground(backgroundUrl) {
		if (this.backgroundOverlay) {
			this.backgroundOverlay.style.backgroundImage = `url('${backgroundUrl}')`;
		}
	}

	// Add background transition effects
	addBackgroundTransition() {
		const transitionOverlay = document.createElement("div");
		transitionOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: var(--primary-bg);
            z-index: 9998;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
        `;

		document.body.appendChild(transitionOverlay);

		// Fade out effect when changing backgrounds
		window.addEventListener("beforeunload", () => {
			transitionOverlay.style.opacity = "1";
		});
	}
}

// Initialize background system when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	new BackgroundSystem();
});
