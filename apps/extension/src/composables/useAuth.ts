import { computed } from "vue";

export function useAuth() {
  const isLoggedIn = computed(() => true);
  const displayName = computed(() => "Dev");
  const isLoaded = computed(() => true);

  async function login(): Promise<{ error?: string }> {
    return {};
  }

  async function logout() {}

  return { isLoaded, isLoggedIn, displayName, login, logout };
}
