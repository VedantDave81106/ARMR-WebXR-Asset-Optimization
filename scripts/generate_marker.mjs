/**
 * Hiro Marker SVG & Printable Generator
 * Generates official Hiro marker for AR.js tracking
 */
import fs from 'fs';

// Standard AR.js Hiro marker SVG representation
const hiroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <!-- Outer White Margin / Quiet Zone -->
  <rect width="1000" height="1000" fill="#FFFFFF"/>
  <!-- Outer Black Tracking Border (Width: 700x700, margin: 150) -->
  <rect x="150" y="150" width="700" height="700" fill="#000000"/>
  <!-- Inner White Active Area (Width: 400x400, margin: 300) -->
  <rect x="300" y="300" width="400" height="400" fill="#FFFFFF"/>
  
  <!-- HIRO Pattern Inner Black Glyph -->
  <!-- Top horizontal roof bar -->
  <rect x="375" y="360" width="250" height="40" fill="#000000"/>
  
  <!-- Left vertical pillar -->
  <rect x="375" y="360" width="40" height="280" fill="#000000"/>
  
  <!-- Right vertical pillar -->
  <rect x="585" y="360" width="40" height="280" fill="#000000"/>
  
  <!-- Center cross bar -->
  <rect x="375" y="475" width="250" height="40" fill="#000000"/>
  
  <!-- Bottom bar -->
  <rect x="375" y="600" width="250" height="40" fill="#000000"/>
  
  <!-- Center vertical spine connector -->
  <rect x="480" y="400" width="40" height="150" fill="#000000"/>
</svg>`;

fs.writeFileSync('marker.svg', hiroSvg);
console.log('Generated marker.svg');
