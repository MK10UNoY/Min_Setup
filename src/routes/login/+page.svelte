<script lang="ts">
  let email = '';
  let password = '';
  function login(e: Event) {
    e.preventDefault();
    // Placeholder for login logic
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center p-4">
  <form class="p-8 w-full max-w-sm bg-[var(--bg-card)] border-2 border-[var(--border-color)] shadow-[4px_4px_0_var(--border-color)]" style="border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;" on:submit|preventDefault={login}>
    <h2 class="text-3xl font-bold mb-6 text-center text-[var(--text-primary)]" style="font-family: var(--font-handwritten);">Login</h2>
    
    <div class="mb-4">
      <label class="block mb-1 text-lg text-[var(--text-primary)]" style="font-family: var(--font-handwritten);" for="email">Email</label>
      <input class="w-full p-2 border-2 border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:scale-[1.01] transition-transform" style="font-family: var(--font-handwritten);" type="email" id="email" bind:value={email} required />
    </div>
    
    <div class="mb-6">
      <label class="block mb-1 text-lg text-[var(--text-primary)]" style="font-family: var(--font-handwritten);" for="password">Password</label>
      <input class="w-full p-2 border-2 border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:scale-[1.01] transition-transform" style="font-family: var(--font-handwritten);" type="password" id="password" bind:value={password} required />
    </div>
    
    <button class="w-full py-2 border-2 border-[var(--border-color)] text-[var(--text-primary)] font-bold text-lg cursor-pointer transition-all active:translate-y-[2px] active:shadow-[1px_1px_0_var(--border-color)] bg-[var(--primary)] shadow-[3px_3px_0_var(--border-color)]" style="font-family: var(--font-handwritten); border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;">Login</button>
  </form>
</div> 