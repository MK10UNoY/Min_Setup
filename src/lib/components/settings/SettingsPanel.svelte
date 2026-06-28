<script lang="ts">
	/**
	 * SettingsPanel — Side drawer/modal containing all IDE preferences.
	 * Configures Appearance, Editor, Terminal, Workspace, and Accessibility options.
	 */
	import { settingsStore } from '$lib/stores/settingsStore';
	import { FONT_STYLE_OPTIONS } from '$lib/stores/settingsStore';
	import { uiStore } from '$lib/stores/uiStore';
	import X from 'phosphor-svelte/lib/X';
	import Palette from 'phosphor-svelte/lib/Palette';
	import Code from 'phosphor-svelte/lib/Code';
	import Terminal from 'phosphor-svelte/lib/Terminal';
	import Shield from 'phosphor-svelte/lib/Shield';
	import HandWaving from 'phosphor-svelte/lib/HandWaving';

	let activeSection = $state<'appearance' | 'editor' | 'terminal' | 'accessibility'>('appearance');

	function handleClose() {
		uiStore.setSettingsOpen(false);
	}

	function handleResetAll() {
		if (confirm('Are you sure you want to reset all settings to defaults?')) {
			settingsStore.reset();
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="settings-backdrop" onclick={handleClose} role="dialog" aria-modal="true" aria-label="Settings Modal">
	<div class="settings-container" onclick={(e) => e.stopPropagation()}>
		<header class="settings-header">
			<div class="header-title">
				<Palette size={20} class="header-icon" />
				<h2>Settings</h2>
			</div>
			<button class="close-btn" onclick={handleClose} title="Close Settings (Esc)" aria-label="Close settings">
				<X size={18} />
			</button>
		</header>

		<div class="settings-body">
			<!-- Sidebar navigation -->
			<nav class="settings-nav" aria-label="Settings Categories">
				<button 
					class="nav-item" 
					class:active={activeSection === 'appearance'} 
					onclick={() => activeSection = 'appearance'}
				>
					<Palette size={16} />
					<span>Appearance</span>
				</button>
				<button 
					class="nav-item" 
					class:active={activeSection === 'editor'} 
					onclick={() => activeSection = 'editor'}
				>
					<Code size={16} />
					<span>Editor</span>
				</button>
				<button 
					class="nav-item" 
					class:active={activeSection === 'terminal'} 
					onclick={() => activeSection = 'terminal'}
				>
					<Terminal size={16} />
					<span>Terminal</span>
				</button>
				<button 
					class="nav-item" 
					class:active={activeSection === 'accessibility'} 
					onclick={() => activeSection = 'accessibility'}
				>
					<Shield size={16} />
					<span>Accessibility</span>
				</button>
			</nav>

			<!-- Content Panel -->
			<div class="settings-content">
				{#if activeSection === 'appearance'}
					<section class="settings-section">
						<h3>Appearance Settings</h3>
						
						<!-- Theme selector -->
						<div class="setting-group">
							<label for="setting-theme">Theme</label>
							<div class="select-wrapper">
								<select 
									id="setting-theme" 
									value={$settingsStore.theme}
									onchange={(e) => settingsStore.updateSetting('theme', e.currentTarget.value as any)}
								>
									<option value="system">System Preference</option>
									<option value="light">Light Mode</option>
									<option value="dark">Dark Mode</option>
								</select>
							</div>
							<p class="description">Select the UI color scheme. System mode auto-matches OS settings.</p>
						</div>

						<!-- Accent color -->
						<div class="setting-group">
							<label for="setting-accent">Accent Color</label>
							<div class="accent-picker">
								{#each ['blue', 'green', 'purple', 'red', 'orange'] as color}
									<button 
										class="accent-btn color-{color}" 
										class:selected={$settingsStore.accentColor === color}
										onclick={() => settingsStore.updateSetting('accentColor', color)}
										title={color}
										aria-label={`Accent ${color}`}
									></button>
								{/each}
							</div>
							<p class="description">Choose the primary highlight color for buttons, selections, and active states.</p>
						</div>

						<!-- Density -->
						<div class="setting-group">
							<label for="setting-density">Sidebar Density</label>
							<div class="select-wrapper">
								<select 
									id="setting-density" 
									value={$settingsStore.sidebarDensity}
									onchange={(e) => settingsStore.updateSetting('sidebarDensity', e.currentTarget.value as any)}
								>
									<option value="compact">Compact (Dense list)</option>
									<option value="comfortable">Comfortable (Spaced list)</option>
								</select>
							</div>
							<p class="description">Adjusts the vertical spacing of the Explorer sidebar files.</p>
						</div>

						<!-- Font Style -->
						<div class="setting-group">
							<label for="setting-font-style">Font Style</label>
							<div class="select-wrapper">
								<select 
									id="setting-font-style" 
									value={$settingsStore.fontStyle}
									onchange={(e) => settingsStore.updateSetting('fontStyle', e.currentTarget.value)}
								>
									{#each Object.entries(FONT_STYLE_OPTIONS) as [key, opt]}
										<option value={key}>{opt.label}</option>
									{/each}
								</select>
							</div>
							<p class="description font-preview" style="font-family: {FONT_STYLE_OPTIONS[$settingsStore.fontStyle]?.family || 'inherit'}; font-size: 16px;">The quick brown fox jumps over the lazy dog</p>
						</div>

						<!-- UI Scale -->
						<div class="setting-group">
							<label for="setting-scale">UI Zoom Scale ({($settingsStore.uiScale * 100).toFixed(0)}%)</label>
							<div class="range-wrapper">
								<input 
									id="setting-scale" 
									type="range" 
									min="0.8" 
									max="1.3" 
									step="0.05" 
									value={$settingsStore.uiScale}
									oninput={(e) => settingsStore.updateSetting('uiScale', parseFloat(e.currentTarget.value))}
								/>
							</div>
							<p class="description">Zoom the entire layout scale up or down.</p>
						</div>

						<!-- Corner radius -->
						<div class="setting-group">
							<label for="setting-radius">Corner Roundedness</label>
							<div class="select-wrapper">
								<select 
									id="setting-radius" 
									value={$settingsStore.roundedCorners}
									onchange={(e) => settingsStore.updateSetting('roundedCorners', e.currentTarget.value)}
								>
									<option value="0px">Sharp Corners (0px)</option>
									<option value="4px">Subtle Rounded (4px)</option>
									<option value="8px">Standard (8px)</option>
									<option value="16px">Chunky Notebook (16px)</option>
								</select>
							</div>
						</div>
					</section>
				{/if}

				{#if activeSection === 'editor'}
					<section class="settings-section">
						<h3>Editor Settings</h3>

						<!-- Font size -->
						<div class="setting-group">
							<label for="setting-editor-font">Font Size (px)</label>
							<div class="number-wrapper">
								<input 
									id="setting-editor-font" 
									type="number" 
									min="10" 
									max="24" 
									value={$settingsStore.editorFontSize}
									oninput={(e) => settingsStore.updateSetting('editorFontSize', parseInt(e.currentTarget.value) || 14)}
								/>
							</div>
						</div>

						<!-- Tab Size -->
						<div class="setting-group">
							<label for="setting-editor-tab">Tab Spacing Size</label>
							<div class="select-wrapper">
								<select 
									id="setting-editor-tab" 
									value={$settingsStore.editorTabSize}
									onchange={(e) => settingsStore.updateSetting('editorTabSize', parseInt(e.currentTarget.value))}
								>
									<option value="2">2 spaces</option>
									<option value="4">4 spaces</option>
									<option value="8">8 spaces</option>
								</select>
							</div>
						</div>

						<!-- Word Wrap -->
						<div class="setting-group toggle-row">
							<div class="toggle-info">
								<label for="setting-editor-wrap">Word Wrap</label>
								<p class="description">Wraps long lines inside the editor boundaries.</p>
							</div>
							<label class="switch">
								<input 
									id="setting-editor-wrap"
									type="checkbox" 
									checked={$settingsStore.editorWordWrap === 'on'}
									onchange={(e) => settingsStore.updateSetting('editorWordWrap', e.currentTarget.checked ? 'on' : 'off')}
								/>
								<span class="slider"></span>
							</label>
						</div>

						<!-- Line Numbers -->
						<div class="setting-group toggle-row">
							<div class="toggle-info">
								<label for="setting-editor-lines">Line Numbers</label>
								<p class="description">Display line numbers in the editor margin gutter.</p>
							</div>
							<label class="switch">
								<input 
									id="setting-editor-lines"
									type="checkbox" 
									checked={$settingsStore.editorLineNumbers === 'on'}
									onchange={(e) => settingsStore.updateSetting('editorLineNumbers', e.currentTarget.checked ? 'on' : 'off')}
								/>
								<span class="slider"></span>
							</label>
						</div>

						<!-- Minimap -->
						<div class="setting-group toggle-row">
							<div class="toggle-info">
								<label for="setting-editor-minimap">Show Minimap</label>
								<p class="description">Displays a high-level visual code minimap on the right gutter.</p>
							</div>
							<label class="switch">
								<input 
									id="setting-editor-minimap"
									type="checkbox" 
									checked={$settingsStore.editorMinimap}
									onchange={(e) => settingsStore.updateSetting('editorMinimap', e.currentTarget.checked)}
								/>
								<span class="slider"></span>
							</label>
						</div>

						<!-- Auto Save -->
						<div class="setting-group toggle-row">
							<div class="toggle-info">
								<label for="setting-editor-autosave">Auto Save (500ms debounce)</label>
								<p class="description">Save active workspace file code automatically on edit.</p>
							</div>
							<label class="switch">
								<input 
									id="setting-editor-autosave"
									type="checkbox" 
									checked={$settingsStore.editorAutoSave}
									onchange={(e) => settingsStore.updateSetting('editorAutoSave', e.currentTarget.checked)}
								/>
								<span class="slider"></span>
							</label>
						</div>

						<!-- Cursor style -->
						<div class="setting-group">
							<label for="setting-editor-cursor">Cursor Blink Style</label>
							<div class="select-wrapper">
								<select 
									id="setting-editor-cursor" 
									value={$settingsStore.editorCursorStyle}
									onchange={(e) => settingsStore.updateSetting('editorCursorStyle', e.currentTarget.value as any)}
								>
									<option value="line">Solid Line (Vertical bar)</option>
									<option value="block">Retro Block</option>
									<option value="underline">Underline horizontal</option>
								</select>
							</div>
						</div>
					</section>
				{/if}

				{#if activeSection === 'terminal'}
					<section class="settings-section">
						<h3>Terminal settings</h3>

						<!-- Font Size -->
						<div class="setting-group">
							<label for="setting-term-font">Terminal Font Size (px)</label>
							<div class="number-wrapper">
								<input 
									id="setting-term-font" 
									type="number" 
									min="10" 
									max="20" 
									value={$settingsStore.terminalFontSize}
									oninput={(e) => settingsStore.updateSetting('terminalFontSize', parseInt(e.currentTarget.value) || 13)}
								/>
							</div>
						</div>

						<!-- Scrollback size -->
						<div class="setting-group">
							<label for="setting-term-scrollback">Terminal Scrollback Size (lines)</label>
							<div class="number-wrapper">
								<input 
									id="setting-term-scrollback" 
									type="number" 
									min="100" 
									max="5000" 
									value={$settingsStore.terminalScrollbackSize}
									oninput={(e) => settingsStore.updateSetting('terminalScrollbackSize', parseInt(e.currentTarget.value) || 1000)}
								/>
							</div>
						</div>

						<!-- Cursor blink -->
						<div class="setting-group toggle-row">
							<div class="toggle-info">
								<label for="setting-term-blink">Cursor Blink animation</label>
								<p class="description">Flashes the terminal command prompt cursor.</p>
							</div>
							<label class="switch">
								<input 
									id="setting-term-blink"
									type="checkbox" 
									checked={$settingsStore.terminalCursorBlink}
									onchange={(e) => settingsStore.updateSetting('terminalCursorBlink', e.currentTarget.checked)}
								/>
								<span class="slider"></span>
							</label>
						</div>

						<!-- Clear on run -->
						<div class="setting-group toggle-row">
							<div class="toggle-info">
								<label for="setting-term-clear">Clear Terminal on Execution</label>
								<p class="description">Automatically clear previous logs before executing code.</p>
							</div>
							<label class="switch">
								<input 
									id="setting-term-clear"
									type="checkbox" 
									checked={$settingsStore.terminalClearOnRun}
									onchange={(e) => settingsStore.updateSetting('terminalClearOnRun', e.currentTarget.checked)}
								/>
								<span class="slider"></span>
							</label>
						</div>
					</section>
				{/if}

				{#if activeSection === 'accessibility'}
					<section class="settings-section">
						<h3>Accessibility settings</h3>

						<!-- High Contrast -->
						<div class="setting-group toggle-row">
							<div class="toggle-info">
								<label for="setting-access-contrast">High Contrast Mode</label>
								<p class="description">Applies pure black and white colors for maximum visual contrast.</p>
							</div>
							<label class="switch">
								<input 
									id="setting-access-contrast"
									type="checkbox" 
									checked={$settingsStore.highContrast}
									onchange={(e) => settingsStore.updateSetting('highContrast', e.currentTarget.checked)}
								/>
								<span class="slider"></span>
							</label>
						</div>

						<!-- Reduced Motion -->
						<div class="setting-group toggle-row">
							<div class="toggle-info">
								<label for="setting-access-motion">Reduced Motion</label>
								<p class="description">Stops all panels scaling, layout sliding, and cursor flashing transitions.</p>
							</div>
							<label class="switch">
								<input 
									id="setting-access-motion"
									type="checkbox" 
									checked={$settingsStore.reducedMotion}
									onchange={(e) => settingsStore.updateSetting('reducedMotion', e.currentTarget.checked)}
								/>
								<span class="slider"></span>
							</label>
						</div>

						<!-- Larger UI text -->
						<div class="setting-group toggle-row">
							<div class="toggle-info">
								<label for="setting-access-large">Larger UI Controls</label>
								<p class="description">Enhances button hit areas and increases text readability scales.</p>
							</div>
							<label class="switch">
								<input 
									id="setting-access-large"
									type="checkbox" 
									checked={$settingsStore.largerUI}
									onchange={(e) => {
										settingsStore.updateSetting('largerUI', e.currentTarget.checked);
										if (e.currentTarget.checked) {
											settingsStore.updateSetting('uiScale', 1.1);
										} else {
											settingsStore.updateSetting('uiScale', 1.0);
										}
									}}
								/>
								<span class="slider"></span>
							</label>
						</div>
					</section>
				{/if}
			</div>
		</div>

		<footer class="settings-footer">
			<button class="reset-all-btn" onclick={handleResetAll}>Reset Defaults</button>
			<button class="done-btn" onclick={handleClose}>Done</button>
		</footer>
	</div>
</div>

<style>
	.settings-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		animation: fade-in 0.15s ease-out;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.settings-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 650px;
		height: 480px;
		max-height: calc(100% - 32px);
		background: var(--bg-card);
		border: 2px solid var(--border-color);
		border-radius: var(--border-radius);
		box-shadow: 6px 6px 0 var(--border-color);
		overflow: hidden;
		animation: slide-up 0.18s ease-out;
	}

	@keyframes slide-up {
		from { transform: translateY(12px) scale(0.98); }
		to { transform: translateY(0) scale(1); }
	}

	.settings-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 18px;
		border-bottom: 2px solid var(--border-color);
		background: var(--bg-paper);
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.header-title h2 {
		font-family: var(--font-handwritten);
		font-size: 20px;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
	}

	.header-icon {
		color: var(--primary);
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		transition: all 0.1s ease;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: var(--text-primary);
	}

	.settings-body {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.settings-nav {
		width: 160px;
		border-right: 2px solid var(--border-color);
		background: var(--bg-paper);
		padding: 12px 6px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border: 1.5px solid transparent;
		border-radius: 4px;
		background: transparent;
		color: var(--text-secondary);
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.nav-item:hover {
		background: var(--bg-card);
		border-color: var(--border-color);
		color: var(--text-primary);
	}

	.nav-item.active {
		background: var(--bg-card);
		border-color: var(--border-color);
		color: var(--primary);
		box-shadow: 2px 2px 0 var(--border-color);
	}

	.settings-content {
		flex: 1;
		min-width: 0;
		padding: 16px 20px;
		overflow-y: auto;
		background: var(--bg-card);
	}

	.settings-section h3 {
		font-family: var(--font-handwritten);
		font-size: 18px;
		font-weight: 700;
		margin: 0 0 16px 0;
		border-bottom: 1.5px dashed var(--border-color);
		padding-bottom: 6px;
		color: var(--text-primary);
	}

	.setting-group {
		margin-bottom: 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.setting-group label {
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.description {
		font-size: 11px;
		color: var(--text-muted);
		margin: 2px 0 0 0;
	}

	/* Inputs & selects styling */
	.select-wrapper {
		position: relative;
	}

	select, input[type="number"] {
		width: 100%;
		padding: 6px 10px;
		font-family: var(--font-sans);
		font-size: 13px;
		color: var(--text-primary);
		background: var(--bg-paper);
		border: 2px solid var(--border-color);
		border-radius: 4px;
		outline: none;
		cursor: pointer;
		appearance: none;
	}

	select:focus, input[type="number"]:focus {
		border-color: var(--primary);
	}

	.select-wrapper::after {
		content: '▼';
		font-size: 8px;
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--text-secondary);
	}

	/* Range */
	.range-wrapper input {
		width: 100%;
		accent-color: var(--primary);
		cursor: pointer;
	}

	/* Accent Color Button Picker */
	.accent-picker {
		display: flex;
		gap: 10px;
		margin: 4px 0;
	}

	.accent-btn {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid var(--border-color);
		cursor: pointer;
		transition: transform 0.15s ease;
		position: relative;
	}

	.accent-btn:hover {
		transform: scale(1.15);
	}

	.accent-btn.selected::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 12px;
		font-weight: bold;
		text-shadow: 0px 1px 2px rgba(0,0,0,0.5);
	}

	.color-blue { background: #3b82f6; }
	.color-green { background: #22c55e; }
	.color-purple { background: #a855f7; }
	.color-red { background: #ef4444; }
	.color-orange { background: #f97316; }

	/* Toggle Switches */
	.toggle-row {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
	}

	.toggle-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		max-width: 80%;
	}

	/* Custom slider toggle styles */
	.switch {
		position: relative;
		display: inline-block;
		width: 36px;
		height: 20px;
		flex-shrink: 0;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--bg-paper);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		transition: .2s;
	}

	.slider:before {
		position: absolute;
		content: "";
		height: 12px;
		width: 12px;
		left: 2px;
		bottom: 2px;
		background-color: var(--border-color);
		border-radius: 50%;
		transition: .2s;
	}

	input:checked + .slider {
		background-color: var(--primary);
	}

	input:checked + .slider:before {
		transform: translateX(16px);
		background-color: var(--bg-card);
	}

	/* Footer */
	.settings-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 18px;
		border-top: 2px solid var(--border-color);
		background: var(--bg-paper);
	}

	.reset-all-btn {
		font-family: var(--font-handwritten);
		background: transparent;
		border: none;
		color: var(--danger);
		font-size: 14px;
		cursor: pointer;
		text-decoration: underline;
	}

	.done-btn {
		font-family: var(--font-handwritten);
		background: var(--primary);
		border: 2px solid var(--border-color);
		border-radius: 4px;
		color: var(--text-primary);
		padding: 4px 16px;
		font-size: 15px;
		font-weight: 600;
		box-shadow: 2px 2px 0 var(--border-color);
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.done-btn:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 var(--border-color);
	}

	.done-btn:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0 var(--border-color);
	}
</style>
