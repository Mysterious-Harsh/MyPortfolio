// Portfolio JavaScript - Main functionality
class PortfolioApp {
	constructor() {
		this.currentPage =
			window.location.pathname.split("/").pop() || "index.html";
		this.projects = this.getProjectData();
		this.experience = this.getExperienceData();
		this.skills = this.getSkillsData();
		this.init();
	}

	init() {
		this.initNavigation();
		this.initScrollAnimations();
		this.initPageSpecificFeatures();
		this.initParticleBackground();
		this.initTypewriter();
	}

	// Navigation functionality
	initNavigation() {
		const navLinks = document.querySelectorAll("nav a");
		navLinks.forEach((link) => {
			link.addEventListener("click", (e) => {
				if (link.getAttribute("href").startsWith("#")) {
					e.preventDefault();
					const target = document.querySelector(
						link.getAttribute("href")
					);
					if (target) {
						target.scrollIntoView({ behavior: "smooth" });
					}
				}
			});
		});

		// Mobile menu toggle
		const mobileToggle = document.querySelector(".mobile-menu-toggle");
		const navMenu = document.querySelector(".nav-menu");

		if (mobileToggle && navMenu) {
			mobileToggle.addEventListener("click", () => {
				navMenu.classList.toggle("active");
				mobileToggle.classList.toggle("active");
			});
		}

		// Scroll-based navigation styling
		window.addEventListener("scroll", () => {
			const nav = document.querySelector("nav");
			if (window.scrollY > 100) {
				nav.classList.add("scrolled");
			} else {
				nav.classList.remove("scrolled");
			}
		});
	}

	// Scroll animations
	initScrollAnimations() {
		const observerOptions = {
			threshold: 0.1,
			rootMargin: "0px 0px -50px 0px",
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("animate-in");

					// Stagger animation for child elements
					const children =
						entry.target.querySelectorAll(".stagger-child");
					children.forEach((child, index) => {
						setTimeout(() => {
							child.classList.add("animate-in");
						}, index * 100);
					});
				}
			});
		}, observerOptions);

		// Observe all sections
		document
			.querySelectorAll("section, .card, .timeline-item")
			.forEach((el) => {
				observer.observe(el);
			});
	}

	// Page-specific features
	initPageSpecificFeatures() {
		if (
			this.currentPage.includes("projects") ||
			document.querySelector(".projects-grid")
		) {
			this.initProjectFilters();
			this.initProjectModals();
		}

		if (
			this.currentPage.includes("about") ||
			document.querySelector(".skills-visualization")
		) {
			this.initSkillsChart();
		}

		if (
			this.currentPage.includes("experience") ||
			document.querySelector(".experience-timeline")
		) {
			this.initExperienceTimeline();
		}

		if (
			this.currentPage.includes("contact") ||
			document.querySelector(".contact-form")
		) {
			this.initContactForm();
		}

		// Counter animations for stats
		this.initCounters();
	}

	// Project filtering system
	initProjectFilters() {
		const filterButtons = document.querySelectorAll(".filter-btn");
		const searchInput = document.querySelector(".project-search");
		const projectCards = document.querySelectorAll(".project-card");

		// Filter by category
		filterButtons.forEach((btn) => {
			btn.addEventListener("click", () => {
				const filter = btn.dataset.filter;

				// Update active button
				filterButtons.forEach((b) => b.classList.remove("active"));
				btn.classList.add("active");

				// Filter projects
				this.filterProjects(filter, searchInput?.value || "");
			});
		});

		// Search functionality
		if (searchInput) {
			searchInput.addEventListener("input", (e) => {
				const activeFilter =
					document.querySelector(".filter-btn.active")?.dataset
						.filter || "all";
				this.filterProjects(activeFilter, e.target.value);
			});
		}
	}

	filterProjects(category, searchTerm) {
		const projectCards = document.querySelectorAll(".project-card");

		projectCards.forEach((card) => {
			const projectCategory = card.dataset.category;
			const projectTitle = card
				.querySelector("h3")
				.textContent.toLowerCase();
			const projectDescription = card
				.querySelector("p")
				.textContent.toLowerCase();

			const matchesCategory =
				category === "all" || projectCategory === category;
			const matchesSearch =
				searchTerm === "" ||
				projectTitle.includes(searchTerm.toLowerCase()) ||
				projectDescription.includes(searchTerm.toLowerCase());

			if (matchesCategory && matchesSearch) {
				card.style.display = "block";
				setTimeout(() => {
					card.classList.add("visible");
				}, 100);
			} else {
				card.classList.remove("visible");
				setTimeout(() => {
					card.style.display = "none";
				}, 300);
			}
		});
	}

	// Project modal system
	initProjectModals() {
		const projectCards = document.querySelectorAll(".project-card");
		const modal = document.querySelector(".project-modal");
		const closeBtn = document.querySelector(".modal-close");

		projectCards.forEach((card) => {
			card.addEventListener("click", () => {
				const projectId = card.dataset.project;
				this.openProjectModal(projectId);
			});
		});

		if (closeBtn) {
			closeBtn.addEventListener("click", () => {
				this.closeProjectModal();
			});
		}

		// Close modal on outside click
		if (modal) {
			modal.addEventListener("click", (e) => {
				if (e.target === modal) {
					this.closeProjectModal();
				}
			});
		}
	}

	openProjectModal(projectId) {
		const project = this.projects.find((p) => p.id === projectId);
		if (!project) return;

		const modal = document.querySelector(".project-modal");
		const modalContent = modal.querySelector(".modal-content");

		// Update modal content
		modalContent.innerHTML = `
            <div class="modal-header">
                <h2>${project.title}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <img src="${project.image}" alt="${
			project.title
		}" class="modal-image">
                <div class="project-details">
                    <p>${project.description}</p>
                    <div class="tech-stack">
                        <h4>Technologies Used:</h4>
                        <div class="tech-tags">
                            ${project.technologies
								.map(
									(tech) =>
										`<span class="tech-tag">${tech}</span>`
								)
								.join("")}
                        </div>
                    </div>
                    <div class="project-links">
                        ${
							project.github
								? `<a href="${project.github}" target="_blank" class="btn btn-outline">GitHub</a>`
								: ""
						}
                        ${
							project.demo
								? `<a href="${project.demo}" target="_blank" class="btn btn-primary">Live Demo</a>`
								: ""
						}
                    </div>
                </div>
            </div>
        `;

		modal.classList.add("active");
		document.body.style.overflow = "hidden";

		// Re-attach close event
		const closeBtn = modal.querySelector(".modal-close");
		closeBtn.addEventListener("click", () => {
			this.closeProjectModal();
		});
	}

	closeProjectModal() {
		const modal = document.querySelector(".project-modal");
		modal.classList.remove("active");
		document.body.style.overflow = "";
	}

	// Skills chart visualization
	initSkillsChart() {
		const chartContainer = document.querySelector("#skills-chart");
		if (!chartContainer) return;

		const chart = echarts.init(chartContainer);

		const option = {
			backgroundColor: "transparent",
			radar: {
				indicator: [
					{ name: "Machine Learning", max: 100 },
					{ name: "Deep Learning", max: 100 },
					{ name: "Computer Vision", max: 100 },
					{ name: "NLP", max: 100 },
					{ name: "Data Analysis", max: 100 },
					{ name: "Cloud Computing", max: 100 },
				],
				axisName: {
					color: "#ffffff",
				},
				splitLine: {
					lineStyle: {
						color: "#333333",
					},
				},
				axisLine: {
					lineStyle: {
						color: "#333333",
					},
				},
			},
			series: [
				{
					type: "radar",
					data: [
						{
							value: [90, 85, 88, 82, 95, 80],
							name: "Skills",
							areaStyle: {
								color: "rgba(0, 102, 255, 0.3)",
							},
							lineStyle: {
								color: "#0066ff",
							},
							itemStyle: {
								color: "#0066ff",
							},
						},
					],
				},
			],
		};

		chart.setOption(option);

		// Responsive chart
		window.addEventListener("resize", () => {
			chart.resize();
		});
	}

	// Experience timeline
	initExperienceTimeline() {
		const timelineItems = document.querySelectorAll(".timeline-item");

		timelineItems.forEach((item, index) => {
			setTimeout(() => {
				item.classList.add("animate-in");
			}, index * 200);
		});

		// Interactive timeline
		const timelinePoints = document.querySelectorAll(".timeline-point");
		timelinePoints.forEach((point) => {
			point.addEventListener("click", () => {
				const target = point.dataset.target;
				const detail = document.querySelector(target);

				// Close other details
				document.querySelectorAll(".timeline-detail").forEach((d) => {
					if (d !== detail) {
						d.classList.remove("active");
					}
				});

				// Toggle current detail
				detail.classList.toggle("active");
			});
		});
	}

	// Contact form
	initContactForm() {
		const form = document.querySelector(".contact-form");
		if (!form) return;

		form.addEventListener("submit", (e) => {
			e.preventDefault();

			const formData = new FormData(form);
			const data = Object.fromEntries(formData);

			// Validate form
			if (this.validateForm(data)) {
				this.submitForm(data);
			}
		});

		// Real-time validation
		const inputs = form.querySelectorAll("input, textarea, select");
		inputs.forEach((input) => {
			input.addEventListener("blur", () => {
				this.validateField(input);
			});
		});
	}

	validateForm(data) {
		let isValid = true;

		// Check required fields
		if (!data.name || data.name.trim() === "") {
			this.showFieldError("name", "Name is required");
			isValid = false;
		}

		if (!data.email || !this.isValidEmail(data.email)) {
			this.showFieldError("email", "Valid email is required");
			isValid = false;
		}

		if (!data.message || data.message.trim() === "") {
			this.showFieldError("message", "Message is required");
			isValid = false;
		}

		return isValid;
	}

	validateField(field) {
		const value = field.value.trim();
		const fieldName = field.name;

		this.clearFieldError(fieldName);

		switch (fieldName) {
			case "name":
				if (!value) {
					this.showFieldError(fieldName, "Name is required");
					return false;
				}
				break;
			case "email":
				if (!value || !this.isValidEmail(value)) {
					this.showFieldError(fieldName, "Valid email is required");
					return false;
				}
				break;
			case "message":
				if (!value) {
					this.showFieldError(fieldName, "Message is required");
					return false;
				}
				break;
		}

		return true;
	}

	isValidEmail(email) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	showFieldError(fieldName, message) {
		const field = document.querySelector(`[name="${fieldName}"]`);
		const errorElement = field.parentNode.querySelector(".error-message");

		field.classList.add("error");
		if (errorElement) {
			errorElement.textContent = message;
			errorElement.style.display = "block";
		}
	}

	clearFieldError(fieldName) {
		const field = document.querySelector(`[name="${fieldName}"]`);
		const errorElement = field.parentNode.querySelector(".error-message");

		field.classList.remove("error");
		if (errorElement) {
			errorElement.style.display = "none";
		}
	}

	submitForm(data) {
		const submitBtn = document.querySelector(".submit-btn");
		const originalText = submitBtn.textContent;

		// Show loading state
		submitBtn.textContent = "Sending...";
		submitBtn.disabled = true;

		// Simulate form submission (replace with actual endpoint)
		setTimeout(() => {
			this.showFormSuccess();
			submitBtn.textContent = originalText;
			submitBtn.disabled = false;
		}, 2000);
	}

	showFormSuccess() {
		const successMessage = document.querySelector(".success-message");
		const form = document.querySelector(".contact-form");

		form.style.display = "none";
		successMessage.style.display = "block";

		// Reset form after delay
		setTimeout(() => {
			form.reset();
			form.style.display = "block";
			successMessage.style.display = "none";
		}, 5000);
	}

	// Counter animations
	initCounters() {
		const counters = document.querySelectorAll(".counter");

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					this.animateCounter(entry.target);
					observer.unobserve(entry.target);
				}
			});
		});

		counters.forEach((counter) => observer.observe(counter));
	}

	animateCounter(element) {
		const target = parseInt(element.dataset.target);
		const duration = 2000;
		const increment = target / (duration / 16);
		let current = 0;

		const timer = setInterval(() => {
			current += increment;
			if (current >= target) {
				current = target;
				clearInterval(timer);
			}
			element.textContent = Math.floor(current);
		}, 16);
	}

	// Typewriter effect
	initTypewriter() {
		const typewriterElement = document.querySelector(".typewriter-text");
		if (!typewriterElement) return;

		const texts = [
			"Data Scientist",
			"Data Analyst",
			"Machine Learning Engineer",
			"AI Researcher",
			"Deep Learning Specialist",
		];

		let textIndex = 0;
		let charIndex = 0;
		let isDeleting = false;

		const type = () => {
			const currentText = texts[textIndex];

			if (isDeleting) {
				typewriterElement.textContent = currentText.substring(
					0,
					charIndex - 1
				);
				charIndex--;
			} else {
				typewriterElement.textContent = currentText.substring(
					0,
					charIndex + 1
				);
				charIndex++;
			}

			let typeSpeed = isDeleting ? 50 : 100;

			if (!isDeleting && charIndex === currentText.length) {
				typeSpeed = 2000;
				isDeleting = true;
			} else if (isDeleting && charIndex === 0) {
				isDeleting = false;
				textIndex = (textIndex + 1) % texts.length;
				typeSpeed = 500;
			}

			setTimeout(type, typeSpeed);
		};

		type();
	}

	// Particle background system
	initParticleBackground() {
		const canvas = document.querySelector("#particle-canvas");
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		let particles = [];
		let mouse = { x: 0, y: 0 };

		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		const createParticles = () => {
			particles = [];
			const particleCount = Math.floor(
				(canvas.width * canvas.height) / 20000
			);

			for (let i = 0; i < particleCount; i++) {
				particles.push({
					x: Math.random() * canvas.width,
					y: Math.random() * canvas.height,
					vx: (Math.random() - 0.5) * 0.5,
					vy: (Math.random() - 0.5) * 0.5,
					size: Math.random() * 2 + 1,
				});
			}
		};

		const updateParticles = () => {
			particles.forEach((particle) => {
				particle.x += particle.vx;
				particle.y += particle.vy;

				if (particle.x < 0 || particle.x > canvas.width)
					particle.vx *= -1;
				if (particle.y < 0 || particle.y > canvas.height)
					particle.vy *= -1;

				// Mouse interaction
				const dx = mouse.x - particle.x;
				const dy = mouse.y - particle.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < 100) {
					particle.x -= dx * 0.01;
					particle.y -= dy * 0.01;
				}
			});
		};

		const drawParticles = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			particles.forEach((particle) => {
				ctx.beginPath();
				ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
				ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
				ctx.fill();
			});

			// Draw connections
			particles.forEach((particle, i) => {
				particles.slice(i + 1).forEach((otherParticle) => {
					const dx = particle.x - otherParticle.x;
					const dy = particle.y - otherParticle.y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (distance < 100) {
						ctx.beginPath();
						ctx.moveTo(particle.x, particle.y);
						ctx.lineTo(otherParticle.x, otherParticle.y);
						ctx.strokeStyle = `rgba(0, 102, 255, ${
							0.2 * (1 - distance / 100)
						})`;
						ctx.stroke();
					}
				});
			});
		};

		const animate = () => {
			updateParticles();
			drawParticles();
			requestAnimationFrame(animate);
		};

		// Mouse tracking
		window.addEventListener("mousemove", (e) => {
			mouse.x = e.clientX;
			mouse.y = e.clientY;
		});

		// Initialize
		resizeCanvas();
		createParticles();
		animate();

		// Handle resize
		window.addEventListener("resize", () => {
			resizeCanvas();
			createParticles();
		});
	}

	// Data methods
	getProjectData() {
		return [
			{
				id: "speech-emotion",
				title: "Real-Time Speech Emotion Recognition",
				description:
					"Advanced ML system that detects seven types of emotions from human speech in real-time using deep learning models.",
				image: "resources/project-speech-emotion.jpg",
				category: "deep-learning",
				technologies: [
					"Python",
					"TensorFlow",
					"Librosa",
					"PyAudio",
					"NLTK",
				],
				github: "https://github.com/Mysterious-Harsh/Real_Time_Speech_Emotion_Recognition",
				demo: "#",
			},
			{
				id: "face-mask-detection",
				title: "Real-Time Face Mask Detection",
				description:
					"Computer vision application using YOLOv5 for real-time face mask detection with high accuracy.",
				image: "resources/project-face-mask.jpg",
				category: "computer-vision",
				technologies: ["Python", "YOLOv5", "OpenCV", "PyTorch", "CUDA"],
				github: "https://github.com/Mysterious-Harsh/Real_Time_Face_Mask_Detection",
				demo: "#",
			},
			{
				id: "data-dashboard",
				title: "Interactive Data Dashboard",
				description:
					"Comprehensive business analytics dashboard with real-time data visualization and KPI tracking.",
				image: "resources/project-dashboard.jpg",
				category: "data-analysis",
				technologies: ["Python", "Pandas", "Plotly", "Dash", "SQL"],
				github: "#",
				demo: "#",
			},
		];
	}

	getExperienceData() {
		return [
			{
				company: "Dataannotation.tech",
				position: "Data Scientist",
				duration: "Jan 2024 - Present",
				location: "Remote",
				achievements: [
					"Improved model training efficiency by 20% through hyperparameter optimization",
					"Analyzed and optimized large datasets for multiple AI applications",
					"Developed data validation and anomaly detection systems",
				],
			},
			{
				company: "Microsoft (Nuance)",
				position: "Research Scientist Intern",
				duration: "Mar 2023 - Aug 2023",
				location: "Montreal",
				achievements: [
					"Improved real-time speech recognition by 80% for Microsoft Teams",
					"Integrated GPT-4 for outcome prediction in Gradio UI",
					"Reduced deployment failures by 40% through CI/CD pipeline optimization",
				],
			},
		];
	}

	getSkillsData() {
		return {
			"Programming Languages": ["Python", "R", "SQL", "Java", "C++"],
			"Machine Learning": [
				"Scikit-Learn",
				"TensorFlow",
				"PyTorch",
				"XGBoost",
				"Keras",
			],
			"Data Analysis": [
				"Pandas",
				"NumPy",
				"Matplotlib",
				"Seaborn",
				"Plotly",
			],
			"Cloud & Big Data": [
				"Azure",
				"AWS",
				"Apache Spark",
				"Docker",
				"MLflow",
			],
			"Computer Vision": [
				"OpenCV",
				"YOLO",
				"CNN",
				"Image Processing",
				"Object Detection",
			],
			NLP: [
				"NLTK",
				"Transformers",
				"BERT",
				"Text Classification",
				"Sentiment Analysis",
			],
		};
	}
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	new PortfolioApp();

	// Initialize background system
	if (typeof BackgroundSystem !== "undefined") {
		new BackgroundSystem();
	}
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
	anchor.addEventListener("click", function (e) {
		e.preventDefault();
		const target = document.querySelector(this.getAttribute("href"));
		if (target) {
			target.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	});
});

// Utility functions
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

function throttle(func, limit) {
	let inThrottle;
	return function () {
		const args = arguments;
		const context = this;
		if (!inThrottle) {
			func.apply(context, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}
