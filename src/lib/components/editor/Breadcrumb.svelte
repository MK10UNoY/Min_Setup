<script lang="ts">
	/**
	 * Breadcrumb — shows the path to the active file.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import { getFileIcon } from '$lib/utils/fileTypes';

	let segments = $derived(
		$editorStore.activeFilePath
			? $editorStore.activeFilePath.split('/').filter(Boolean)
			: []
	);

	let filename = $derived(segments.length > 0 ? segments[segments.length - 1] : '');
</script>

<div class="breadcrumb">
	{#if segments.length > 0}
		<span class="breadcrumb-icon">{getFileIcon(filename)}</span>
		{#each segments as segment, i}
			{#if i > 0}
				<span class="breadcrumb-separator">›</span>
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
		background: #1e1e1e;
		border-bottom: 1px solid #2d2d2d;
		font-size: 12px;
		color: #8e8e8e;
		min-height: 26px;
	}

	.breadcrumb-icon {
		font-size: 12px;
	}

	.breadcrumb-separator {
		color: #5e5e5e;
		margin: 0 1px;
	}

	.breadcrumb-segment {
		cursor: default;
		transition: color 0.1s;
	}

	.breadcrumb-segment:hover {
		color: #cccccc;
	}

	.breadcrumb-segment.active {
		color: #cccccc;
	}

	.breadcrumb-empty {
		color: #5e5e5e;
		font-style: italic;
	}
</style>
