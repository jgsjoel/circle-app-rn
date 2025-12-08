export function formatChatTime(ts: number|string) {
    const date = new Date(ts);
    const now = new Date();
  
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
  
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  
    // Yesterday check
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
  
    if (isYesterday) return "Yesterday";
  
    // Same year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
      });
    }
  
    // Older
    return date.toLocaleDateString();
  }
  