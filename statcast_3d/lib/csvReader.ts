export interface StatcastHit {
  game_date: string;
  player_name: string;
  events: string;
  description: string;
  launch_speed: number;
  launch_angle: number;
  hc_x: number;
  hc_y: number;
  hit_distance_sc: number;
  spray_angle: number;
  bb_type: string;
  spin_rate: number;
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

export async function loadPlayerCSV(playerName: string, year: number): Promise<StatcastHit[]> {
  // Create safe filename (same logic as Python script)
  const safeName = playerName.toLowerCase().replace(/ /g, '_').replace(/\./g, '').replace(/'/g, '');
  const filename = `${safeName}_${year}.csv`;
  
  try {
    const response = await fetch(`/data/players/${filename}`);
    
    if (!response.ok) {
      throw new Error(`File not found: ${filename}`);
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    if (lines.length < 2) return [];
    
    // Parse header
    const header = parseCSVLine(lines[0]);
    
    const hits: StatcastHit[] = [];
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = parseCSVLine(lines[i]);
      const hit: any = {};
      
      header.forEach((col, idx) => {
        hit[col] = values[idx];
      });
      
      // Only include rows with valid data
      hits.push({
        game_date: hit.game_date || '',
        player_name: hit.player_name || '',
        events: hit.events || '',
        description: hit.description || '',
        launch_speed: parseFloat(hit.launch_speed),
        launch_angle: parseFloat(hit.launch_angle),
        hc_x: parseFloat(hit.hc_x),
        hc_y: parseFloat(hit.hc_y),
        hit_distance_sc: parseFloat(hit.hit_distance_sc || 0),
        spray_angle: parseFloat(hit.spray_angle || 0),
        bb_type: hit.bb_type || '',
        spin_rate: parseFloat(hit.release_spin_rate || hit.spin_rate_deprecated || 2000),
        });
    }
    
    return hits;
  } catch (error) {
    console.error('Error loading CSV:', error);
    return [];
  }
}