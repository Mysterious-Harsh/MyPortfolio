// Background Selector Component
class BackgroundSelector {
    constructor() {
        this.backgrounds = [
            {
                id: 'neural-1',
                name: 'Neural Network 1',
                url: 'resources/neural-bg-1.jpg',
                description: 'Abstract neural network with interconnected nodes'
            },
            {
                id: 'neural-2',
                name: 'Neural Network 2',
                url: 'resources/neural-bg-2.jpg',
                description: 'Digital mesh with cyan and blue connections'
            },
            {
                id: 'neural-3',
                name: 'Neural Network 3',
                url: 'resources/neural-bg-3.jpg',
                description: 'AI brain network with neon pathways'
            },
            {
                id: 'neural-4',
                name: 'Neural Network 4',
                url: 'resources/neural-bg-4.jpg',
                description: 'Minimalist network with clean lines'
            },
            {
                id: 'neural-5',
                name: 'Neural Network 5',
                url: 'resources/neural-bg-5.jpg',
                description: '3D layered network structure'
            },
            {
                id: 'original',
                name: 'Original Hero',
                url: 'resources/hero-bg.jpg',
                description: 'Original digital network visualization'
            }
        ];
        
        this.currentBackground = this.backgrounds[0];
        this.init();
    }
    
    init() {
        this.createBackgroundSelector();
        this.addEventListeners();
    }
    
    createBackgroundSelector() {
        const selector = document.createElement('div');
        selector.id = 'background-selector-component';
        selector.innerHTML = `
            <div class="selector-toggle" id="bg-selector-toggle">
                🖼️
            </div>
            <div class="selector-panel" id="bg-selector-panel">
                <h4>Choose Background</h4>
                <div class="background-grid">
                    ${this.backgrounds.map((bg, index) => `
                        <div class="background-option ${index === 0 ? 'active' : ''}" 
                             data-bg-index="${index}"
                             title="${bg.description}">
                            <div class="bg-preview" style="background-image: url('${bg.url}')"></div>
                            <div class="bg-name">${bg.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #background-selector-component {
                position: fixed;
                top: 50%;
                left: 20px;
                transform: translateY(-50%);
                z-index: 9999;
                font-family: 'Inter', sans-serif;
            }
            
            .selector-toggle {
                width: 50px;
                height: 50px;
                background: var(--accent-color);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 1.5rem;
                box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
                transition: all 0.3s ease;
            }
            
            .selector-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 102, 255, 0.4);
            }
            
            .selector-panel {
                position: absolute;
                top: 0;
                left: 60px;
                width: 300px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                opacity: 0;
                visibility: hidden;
                transform: translateX(-20px);
                transition: all 0.3s ease;
            }
            
            .selector-panel.active {
                opacity: 1;
                visibility: visible;
                transform: translateX(0);
            }
            
            .selector-panel h4 {
                color: white;
                margin-bottom: 1rem;
                font-size: 1.1rem;
            }
            
            .background-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .background-option {
                cursor: pointer;
                border-radius: 8px;
                overflow: hidden;
                border: 2px solid transparent;
                transition: all 0.3s ease;
                background: #0a0a0a;
            }
            
            .background-option:hover {
                transform: translateY(-2px);
                border-color: var(--accent-color);
            }
            
            .background-option.active {
                border-color: var(--accent-color);
                box-shadow: 0 0 0 2px var(--accent-color);
            }
            
            .bg-preview {
                width: 100%;
                height: 80px;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
            }
            
            .bg-name {
                padding: 0.5rem;
                color: white;
                font-size: 0.8rem;
                text-align: center;
                background: rgba(0, 0, 0, 0.7);
            }
            
            @media (max-width: 768px) {
                #background-selector-component {
                    top: auto;
                    bottom: 20px;
                    left: 20px;
                }
                
                .selector-panel {
                    left: auto;
                    right: 60px;
                    width: 250px;
                }
                
                .background-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(selector);
    }
    
    addEventListeners() {
        const toggle = document.getElementById('bg-selector-toggle');
        const panel = document.getElementById('bg-selector-panel');
        const backgroundOptions = document.querySelectorAll('.background-option');
        
        // Toggle panel
        toggle.addEventListener('click', () => {
            panel.classList.toggle('active');
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const selector = document.getElementById('background-selector-component');
            if (selector && !selector.contains(e.target)) {
                panel.classList.remove('active');
            }
        });
        
        // Background selection
        backgroundOptions.forEach(option => {
            option.addEventListener('click', () => {
                const bgIndex = parseInt(option.dataset.bgIndex);
                this.setBackground(bgIndex);
                
                // Update active state
                backgroundOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Close panel
                panel.classList.remove('active');
            });
        });
    }
    
    setBackground(index) {
        if (index >= 0 && index < this.backgrounds.length) {
            this.currentBackground = this.backgrounds[index];
            this.updateBackground();
            this.saveBackgroundPreference();
        }
    }
    
    updateBackground() {
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.style.background = `url('${this.currentBackground.url}') center/cover`;
            heroSection.style.backgroundAttachment = 'fixed';
            
            // Add a subtle fade transition
            heroSection.style.transition = 'background 0.5s ease';
        }
    }
    
    saveBackgroundPreference() {
        const preferences = {
            backgroundId: this.currentBackground.id,
            timestamp: Date.now()
        };
        localStorage.setItem('backgroundPreference', JSON.stringify(preferences));
    }
    
    loadBackgroundPreference() {
        const saved = localStorage.getItem('backgroundPreference');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                const savedBackground = this.backgrounds.find(bg => bg.id === preferences.backgroundId);
                if (savedBackground) {
                    this.currentBackground = savedBackground;
                    this.updateBackground();
                    
                    // Update UI
                    const bgIndex = this.backgrounds.findIndex(bg => bg.id === preferences.backgroundId);
                    const backgroundOptions = document.querySelectorAll('.background-option');
                    backgroundOptions.forEach(opt => opt.classList.remove('active'));
                    if (backgroundOptions[bgIndex]) {
                        backgroundOptions[bgIndex].classList.add('active');
                    }
                }
            } catch (e) {
                console.log('Could not load background preference');
            }
        }
    }
}

// Initialize background selector when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.hero')) {
        const bgSelector = new BackgroundSelector();
        bgSelector.loadBackgroundPreference();
    }
});