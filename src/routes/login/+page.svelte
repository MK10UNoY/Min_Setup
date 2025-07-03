<script lang="ts">
  let email = '';
  let password = '';
  function login(e: Event) {
    e.preventDefault();
    // Placeholder for login logic
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
  <form class="bg-white p-8 rounded shadow-md w-full max-w-sm" on:submit|preventDefault={login}>
    <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
    <div class="mb-4">
      <label class="block mb-1">Email</label>
      <input class="border rounded w-full p-2" type="email" bind:value={email} required />
    </div>
    <div class="mb-6">
      <label class="block mb-1">Password</label>
      <input class="border rounded w-full p-2" type="password" bind:value={password} required />
    </div>
    <button class="bg-blue-600 text-white px-4 py-2 rounded w-full">Login</button>
  </form>
</div> 