export const getDateRange = (range: string) => {
  const now = new Date();
  let start: Date;

  switch (range) {
    case 'Today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight today
      break;
    case 'Last 7 Days':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'Last 30 Days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'Last 3 Months':
      start = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'Last Year':
      start = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start, end: new Date() };
};
