<script lang="ts">
  let email = '';
  let password = '';
  let confirmPassword = '';
  function register(e: Event) {
    e.preventDefault();
    // Placeholder for register logic
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
  <form class="bg-white p-8 rounded shadow-md w-full max-w-sm" on:submit|preventDefault={register}>
    <h2 class="text-2xl font-bold mb-6 text-center">Register</h2>
    <div class="mb-4">
      <label class="block mb-1">Email</label>
      <input class="border rounded w-full p-2" type="email" bind:value={email} required />
    </div>
    <div class="mb-4">
      <label class="block mb-1">Password</label>
      <input class="border rounded w-full p-2" type="password" bind:value={password} required />
    </div>
    <div class="mb-6">
      <label class="block mb-1">Confirm Password</label>
      <input class="border rounded w-full p-2" type="password" bind:value={confirmPassword} required />
    </div>
    <button class="bg-blue-600 text-white px-4 py-2 rounded w-full">Register</button>
  </form>
</div> 