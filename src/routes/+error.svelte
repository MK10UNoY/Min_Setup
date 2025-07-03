<script>
  export let error;
  export let status;
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-red-50">
  <h1 class="text-5xl font-bold text-red-600 mb-4">{status}</h1>
  <p class="text-xl text-gray-700 mb-2">{error?.message || 'An unexpected error occurred.'}</p>
  <a href="/" class="mt-4 text-blue-600 underline">Go Home</a>
</div> 