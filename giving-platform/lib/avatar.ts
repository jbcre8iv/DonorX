// Generate a consistent color based on a string (name/email)
function stringToColor(str: string): string {
  const colors = [
    "#3B82F6", // blue
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#EF4444", // red
    "#F97316", // orange
    "#EAB308", // yellow
    "#22C55E", // green
    "#14B8A6", // teal
    "#06B6D4", // cyan
    "#6366F1", // indigo
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Get initials from first name, last name, or email
function getInitials(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  return email.charAt(0).toUpperCase();
}

// Generate an SVG avatar with initials
export function generateInitialsAvatar(firstName: string | null, lastName: string | null, email: string): string {
  const initials = getInitials(firstName, lastName, email);
  const bgColor = stringToColor(email);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${bgColor}"/>
      <text
        x="100"
        y="100"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        font-size="80"
        font-weight="600"
        fill="white"
        text-anchor="middle"
        dominant-baseline="central"
      >${initials}</text>
    </svg>
  `.trim();

  return svg;
}

// Convert SVG to a data URL for direct use
export function generateInitialsAvatarDataUrl(firstName: string | null, lastName: string | null, email: string): string {
  const svg = generateInitialsAvatar(firstName, lastName, email);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

// Generate avatar as a Blob for uploading to storage
export function generateInitialsAvatarBlob(firstName: string | null, lastName: string | null, email: string): Blob {
  const svg = generateInitialsAvatar(firstName, lastName, email);
  return new Blob([svg], { type: "image/svg+xml" });
}
