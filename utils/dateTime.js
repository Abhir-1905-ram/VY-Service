// Format date as dd/mm/yy
export const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

// Format time as 12-hour format (HH:MM AM/PM)
export const formatTime = (date) => {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
};

// Get current date and time formatted
export const getCurrentDateTime = () => {
  const now = new Date();
  const date = formatDate(now);
  const time = formatTime(now);
  return { date, time, fullDateTime: `${date} ${time}` };
};

// Parse dd/mm/yy HH:MM AM/PM back to Date object
export const parseDateTime = (dateTimeString) => {
  // Format: "dd/mm/yy HH:MM AM/PM"
  const parts = dateTimeString.split(' ');
  if (parts.length < 3) return new Date();
  
  const datePart = parts[0]; // dd/mm/yy
  const timePart = parts[1]; // HH:MM
  const ampm = parts[2]; // AM/PM
  
  const [day, month, year] = datePart.split('/');
  let [hours, minutes] = timePart.split(':');
  
  hours = parseInt(hours);
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  
  const fullYear = 2000 + parseInt(year);
  return new Date(fullYear, parseInt(month) - 1, parseInt(day), hours, parseInt(minutes));
};



