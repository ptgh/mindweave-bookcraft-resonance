
export const cleanupAuthState = () => {
  console.log('Starting auth state cleanup...');
  
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log(`Removing localStorage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        console.log(`Removing sessionStorage key: ${key}`);
        sessionStorage.removeItem(key);
      }
    });
  }
  
  console.log('Auth state cleanup completed');
};

export const forceSignOut = async (supabase: any) => {
  try {
    console.log('Forcing global sign out...');
    cleanupAuthState();
    
    // Attempt global sign out
    await supabase.auth.signOut({ scope: 'global' });
    
    // Additional cleanup after sign out
    setTimeout(() => {
      cleanupAuthState();
    }, 100);
    
    console.log('Global sign out completed');
  } catch (error) {
    console.warn('Error during force sign out:', error);
    // Continue with cleanup even if sign out fails
    cleanupAuthState();
  }
};
