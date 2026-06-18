/**
 * Standalone Code 39 vector SVG barcode generator.
 * Encodes standard digits, uppercase alphabets, spaces, and '-' signs.
 * Highly robust, lightweight, and perfect clean look.
 */
export function getBarcodeSvg(text: string): string {
  const chars: Record<string, string> = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
    '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
    'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
    'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100111010101',
    '-': '100101011101', '.': '110010101101', ' ': '100110101101', '*': '100101101101',
    '$': '100100100101', '/': '100100101001', '+': '100101001001', '%': '101001001001'
  };

  // Code 39 start and stop character is '*'
  const cleanText = text.replace(/[^A-Z0-9\-\.\s\$\/\+\%]/gi, '').toUpperCase();
  const code = '*' + (cleanText || 'ANTRAN') + '*';
  
  let pattern = '';
  for (let i = 0; i < code.length; i++) {
    const charCodeHex = chars[code[i]] || chars[' '];
    pattern += charCodeHex + '0'; // '0' acts as narrow space between characters
  }

  // Generate SVG path coordinate drawing
  const elemWidth = 1.5;
  const height = 50;
  let paths = '';
  let x = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      paths += `M${x},0 h${elemWidth} v${height} h-${elemWidth} Z `;
    }
    x += elemWidth;
  }

  return `<svg width="100%" height="80" viewBox="0 0 ${x} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#ffffff" />
    <path d="${paths}" fill="#000000" />
  </svg>`;
}

/**
 * React Component that renders the SVG barcode dynamically.
 */
export function Barcode({ value }: { value: string }) {
  const svgMarkup = getBarcodeSvg(value);
  return (
    <div 
      className="w-full flex items-center justify-center p-2 bg-white rounded-lg border border-slate-150"
      dangerouslySetInnerHTML={{ __html: svgMarkup }} 
    />
  );
}
