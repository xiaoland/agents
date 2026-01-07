---
placedTo: "src/store/AGENTS.md"
---

# AGENTS.md for store

This project uses Pinia for state management.

Use setup store syntax, scaffold:

```ts
export const useAuthStore = defineStore("auth", () => {
  // --- state ---
  const token = ref<string | undefined>(undefined);

  // --- getters ---
  const bearerToken = computed(() => (token.value ? `Bearer ${token.value}` : ""));

  // --- actions ---
  async function newToken(): Promise<string> {
    ...
  }

  // --- watchers ---

  return {
    token,
    bearerToken,
    newToken,
    getToken,
    refreshToken,
  };
});
```
