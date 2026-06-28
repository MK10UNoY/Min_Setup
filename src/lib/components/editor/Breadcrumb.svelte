<script lang="ts">
	/**
	 * Breadcrumb — shows the path to the active file.
	 * Uses phosphor-svelte icons.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';

	let segments = $derived(
		$editorStore.activeFilePath
			? $editorStore.activeFilePath.split('/').filter(Boolean)
			: []
	);
</script>

<div class="breadcrumb">
	{#if segments.length > 0}
		{#each segments as segment, i}
			{#if i > 0}
				<span class="breadcrumb-separator">
					<CaretRight size={10} />
				</span>
			{/if}
			<span class="breadcrumb-segment" class:active={i === segments.length - 1}>
				{segment}
			</span>
		{/each}
	{:else}
		<span class="breadcrumb-empty">No file open</span>
	{/if}
</div>

<style>
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 16px;
		background: var(--bg-paper);
		border-bottom: 2px solid var(--border-color);
		font-family: var(--font-handwritten);
		font-size: 15px;
		color: var(--text-secondary);
		min-height: 28px;
	}

	.breadcrumb-separator {
		display: flex;
		align-items: center;
		color: var(--text-muted);
		margin: 0 1px;
	}

	.breadcrumb-segment {
		cursor: default;
		transition: color 0.1s;
	}

	.breadcrumb-segment:hover {
		color: var(--text-primary);
	}

	.breadcrumb-segment.active {
		color: var(--text-primary);
		font-weight: bold;
	}

	.breadcrumb-empty {
		color: var(--text-muted);
		font-style: italic;
	}
</style>
