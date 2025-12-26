import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerName = searchParams.get('player');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!playerName || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    const playerId = '592450'; // Aaron Judge
    
    // Extract year from startDate (format: YYYY-MM-DD)
    const year = startDate.split('-')[0];
    
    // Format dates for Baseball Savant (they want YYYY-MM-DD)
    const formattedStart = startDate;
    const formattedEnd = endDate;
    
    // Baseball Savant CSV download endpoint with proper date filtering
    const csvUrl = `https://baseballsavant.mlb.com/statcast_search/csv?all=true&type=details&player_type=batter&player_id=${playerId}&game_date_gt=${formattedStart}&game_date_lt=${formattedEnd}&hfSea=${year}%7C`;

    console.log('Fetching URL:', csvUrl);
    console.log('Date range:', formattedStart, 'to', formattedEnd);

    const response = await fetch(csvUrl);
    const csvData = await response.text();

    console.log('Response status:', response.status);
    console.log('Data length:', csvData.length);
    
    // Count lines to verify data
    const lineCount = csvData.split('\n').length;
    console.log('CSV lines:', lineCount);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
      },
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}