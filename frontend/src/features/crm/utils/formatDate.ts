export function formatCrmDate(dateInput?: string | Date | null, options?: { showTime?: boolean }): string {
  if (!dateInput) return 'N/A';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return 'N/A';

    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    if (options?.showTime) {
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    }

    return `${day} ${month} ${year}`;
  } catch {
    return 'N/A';
  }
}
