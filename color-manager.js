// Color Manager for Portfolio Customization
class ColorManager {
    constructor() {
        this.accentColors = {
            blue: '#0066ff',
            purple: '#8b5cf6',
            green: '#10b981',
            orange: '#f59e0b',
            red: '#ef4444',
            pink: '#ec4899',
            cyan: '#06b6d4',
            lime: '#84cc16'
        };
        
        this.neuralBackgrounds = [
            'resources/neural-bg-1.jpg',
            'resources/neural-bg-2.jpg',
            'resources/neural-bg-3.jpg',
            'resources/neural-bg-4.jpg',
            'resources/neural-bg-5.jpg'
        ];
        
        this.currentBackgroundIndex = 0;
        this.currentAccentColor = this.accentColors.blue;
        
        this.init();
    }
    
    init() {
        this.createColorCustomizer();
        this.loadSavedPreferences();
        this.updateColors();
    }
    
    createColorCustomizer() {
        // Create floating color picker
        const customizer = document.createElement('div');
        customizer.id = 'color-customizer';
        customizer.innerHTML = `
            <div class="customizer-toggle" id="customizer-toggle">
                🎨
            </div>
            <div class="customizer-panel" id="customizer-panel">
                <h4>Customize Portfolio</h4>
                <div class="customizer-section">
                    <label>Accent Color:</label>
                    <div class="color-options">
                        ${Object.entries(this.accentColors).map(([name, color]) => `
                            <div class="color-option ${name === 'blue' ? 'active' : ''}" 
                                 data-color="${color}" 
                                 data-name="${name}"
                                 style="background-color: ${color}">
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="customizer-section">
                    <label>Background:</label>
                    <select id="background-selector">
                        ${this.neuralBackgrounds.map((bg, index) => `
                            <option value="${index}" ${index === 0 ? 'selected' : ''}>
                                Neural Network ${index + 1}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="customizer-actions">
                    <button id="save-preferences">Save Preferences</button>
                    <button id="reset-defaults">Reset to Default</button>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #color-customizer {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                z-index: 10000;
                font-family: 'Inter', sans-serif;
            }
            
            .customizer-toggle {
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
            
            .customizer-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 102, 255, 0.4);
            }
            
            .customizer-panel {
                position: absolute;
                top: 0;
                right: 60px;
                width: 250px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                opacity: 0;
                visibility: hidden;
                transform: translateX(20px);
                transition: all 0.3s ease;
            }
            
            .customizer-panel.active {
                opacity: 1;
                visibility: visible;
                transform: translateX(0);
            }
            
            .customizer-panel h4 {
                color: white;
                margin-bottom: 1rem;
                font-size: 1.1rem;
            }
            
            .customizer-section {
                margin-bottom: 1.5rem;
            }
            
            .customizer-section label {
                color: #6b7280;
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
                display: block;
            }
            
            .color-options {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 0.5rem;
            }
            
            .color-option {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.3s ease;
            }
            
            .color-option:hover {
                transform: scale(1.1);
            }
            
            .color-option.active {
                border-color: white;
                box-shadow: 0 0 0 2px var(--accent-color);
            }
            
            #background-selector {
                width: 100%;
                padding: 0.5rem;
                background: #0a0a0a;
                border: 1px solid #333;
                border-radius: 6px;
                color: white;
                font-size: 0.9rem;
            }
            
            .customizer-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .customizer-actions button {
                flex: 1;
                padding: 0.5rem;
                border: none;
                border-radius: 6px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            #save-preferences {
                background: var(--accent-color);
                color: white;
            }
            
            #save-preferences:hover {
                background: #0052cc;
            }
            
            #reset-defaults {
                background: #333;
                color: white;
            }
            
            #reset-defaults:hover {
                background: #555;
            }
            
            @media (max-width: 768px) {
                #color-customizer {
                    top: auto;
                    bottom: 20px;
                    right: 20px;
                }
                
                .customizer-panel {
                    right: auto;
                    left: 60px;
                    width: 200px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(customizer);
        
        // Add event listeners
        this.addCustomizerEvents();
    }
    
    addCustomizerEvents() {
        const toggle = document.getElementById('customizer-toggle');
        const panel = document.getElementById('customizer-panel');
        const colorOptions = document.querySelectorAll('.color-option');
        const backgroundSelector = document.getElementById('background-selector');
        const saveBtn = document.getElementById('save-preferences');
        const resetBtn = document.getElementById('reset-defaults');
        
        // Toggle panel
        toggle.addEventListener('click', () => {
            panel.classList.toggle('active');
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!customizer.contains(e.target)) {
                panel.classList.remove('active');
            }
        });
        
        // Color selection
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                this.currentAccentColor = option.dataset.color;
                this.updateColors();
            });
        });
        
        // Background selection
        backgroundSelector.addEventListener('change', (e) => {
            this.currentBackgroundIndex = parseInt(e.target.value);
            this.updateBackground();
        });
        
        // Save preferences
        saveBtn.addEventListener('click', () => {
            this.savePreferences();
            alert('Preferences saved! Your customization will be remembered.');
        });
        
        // Reset to defaults
        resetBtn.addEventListener('click', () => {
            this.resetToDefaults();
        });
    }
    
    updateColors() {
        const root = document.documentElement;
        root.style.setProperty('--accent-color', this.currentAccentColor);
        
        // Update gradient
        const r = parseInt(this.currentAccentColor.slice(1, 3), 16);
        const g = parseInt(this.currentAccentColor.slice(3, 5), 16);
        const b = parseInt(this.currentAccentColor.slice(5, 7), 16);
        
        const lighterColor = `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`;
        const gradient = `linear-gradient(135deg, ${this.currentAccentColor}, ${lighterColor})`;
        root.style.setProperty('--gradient-primary', gradient);
    }
    
    updateBackground() {
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            const newBackground = this.neuralBackgrounds[this.currentBackgroundIndex];
            heroSection.style.background = `url('${newBackground}') center/cover`;
            heroSection.style.backgroundAttachment = 'fixed';
        }
    }
    
    savePreferences() {
        const preferences = {
            accentColor: this.currentAccentColor,
            backgroundIndex: this.currentBackgroundIndex
        };
        localStorage.setItem('portfolioPreferences', JSON.stringify(preferences));
    }
    
    loadSavedPreferences() {
        const saved = localStorage.getItem('portfolioPreferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                
                // Apply saved accent color
                if (preferences.accentColor) {
                    this.currentAccentColor = preferences.accentColor;
                    const colorOption = document.querySelector(`[data-color="${preferences.accentColor}"]`);
                    if (colorOption) {
                        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                        colorOption.classList.add('active');
                    }
                }
                
                // Apply saved background
                if (preferences.backgroundIndex !== undefined) {
                    this.currentBackgroundIndex = preferences.backgroundIndex;
                    const backgroundSelector = document.getElementById('background-selector');
                    if (backgroundSelector) {
                        backgroundSelector.value = preferences.backgroundIndex;
                    }
                }
                
                this.updateColors();
                this.updateBackground();
            } catch (e) {
                console.log('Could not load saved preferences');
            }
        }
    }
    
    resetToDefaults() {
        // Reset to blue accent color
        this.currentAccentColor = this.accentColors.blue;
        this.currentBackgroundIndex = 0;
        
        // Update UI
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector('[data-name="blue"]').classList.add('active');
        
        const backgroundSelector = document.getElementById('background-selector');
        if (backgroundSelector) {
            backgroundSelector.value = 0;
        }
        
        this.updateColors();
        this.updateBackground();
        
        // Clear saved preferences
        localStorage.removeItem('portfolioPreferences');
        
        alert('Preferences reset to defaults!');
    }
}

// Initialize color manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ColorManager();
});