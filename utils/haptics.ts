
export const Haptics = {
  // Jemné klepnutí (přepínání tabů, výběr ze seznamu)
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  
  // Střední odezva (kliknutí na tlačítko, aktivace funkce)
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
  
  // Silná odezva (mazání, důležité akce)
  heavy: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }
  },
  
  // Úspěch (dvojité klepnutí)
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10, 30, 10]);
    }
  },
  
  // Chyba (delší zavrnění)
  error: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  }
};
