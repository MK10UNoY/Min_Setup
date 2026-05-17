<script lang="ts">
	/**
	 * Error page — displays SvelteKit errors with a dark theme.
	 */
	import { page } from '$app/stores';
</script>

<div class="error-page">
	<div class="error-card">
		<div class="error-code">{$page.status}</div>
		<h1 class="error-title">Something went wrong</h1>
		<p class="error-message">{$page.error?.message || 'An unexpected error occurred.'}</p>
		<a href="/" class="error-link">← Back to Editor</a>
	</div>
</div>

<style>
	.error-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: #16161e;
		padding: 2rem;
	}

	.error-card {
		text-align: center;
		max-width: 400px;
	}

	.error-code {
		font-size: 72px;
		font-weight: 700;
		color: #f44747;
		line-height: 1;
		margin-bottom: 12px;
		text-shadow: 0 0 40px rgba(244, 71, 71, 0.3);
	}

	.error-title {
		font-size: 20px;
		color: #e0e0e0;
		margin: 0 0 8px;
		font-weight: 500;
	}

	.error-message {
		font-size: 14px;
		color: #808080;
		margin: 0 0 24px;
		line-height: 1.5;
	}

	.error-link {
		display: inline-block;
		color: #569cd6;
		text-decoration: none;
		font-size: 14px;
		padding: 8px 20px;
		border: 1px solid #2d2d2d;
		border-radius: 6px;
		transition: background 0.15s, border-color 0.15s;
	}

	.error-link:hover {
		background: rgba(0, 122, 204, 0.1);
		border-color: #569cd6;
	}
</style>