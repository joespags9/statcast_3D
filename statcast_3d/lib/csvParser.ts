export interface BattedBall {
  hc_x: number;
  hc_y: number;
  launch_speed: number;
  launch_angle: number;
  events: string;
  bb_type: string;
  game_date: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function parseStatcastCSV(csvText: string): BattedBall[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  console.log('CSV Headers:', header.slice(0, 20));
  
  const hcXIndex = header.indexOf('hc_x');
  const hcYIndex = header.indexOf('hc_y');
  const launchSpeedIndex = header.indexOf('launch_speed');
  const launchAngleIndex = header.indexOf('launch_angle');
  const eventsIndex = header.indexOf('events');
  const bbTypeIndex = header.indexOf('bb_type');
  const gameDateIndex = header.indexOf('game_date');
  
  const battedBalls: BattedBall[] = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseCSVLine(lines[i]);
    
    const hcX = parseFloat(values[hcXIndex]);
    const hcY = parseFloat(values[hcYIndex]);
    
    // Only include rows with valid coordinate data
    if (!isNaN(hcX) && !isNaN(hcY)) {
      battedBalls.push({
        hc_x: hcX,
        hc_y: hcY,
        launch_speed: parseFloat(values[launchSpeedIndex]) || 0,
        launch_angle: parseFloat(values[launchAngleIndex]) || 0,
        events: values[eventsIndex] || '',
        bb_type: values[bbTypeIndex] || '',
        game_date: values[gameDateIndex] || '',
      });
    }
  }
  
  console.log('Successfully parsed batted balls:', battedBalls.length);
  console.log('First 3 valid balls:', battedBalls.slice(0, 3));
  console.log('Date range in data:', 
    battedBalls[0]?.game_date, 
    'to', 
    battedBalls[battedBalls.length - 1]?.game_date
  );
  
  return battedBalls;
}