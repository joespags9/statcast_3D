'use client';

import { useState } from 'react';
import PlayerSelector from '@/components/PlayerSelector';
import DateRangeSelector from '@/components/DateRangeSelector';
import SprayChart from '@/components/SprayChart';
import { parseStatcastCSV, BattedBall } from '@/lib/csvParser';

const Home = () => {
  const [playerName, setPlayerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [battedBalls, setBattedBalls] = useState<BattedBall[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setBattedBalls([]);
    
    try {
      const response = await fetch(
        `/api/batted-balls?player=${encodeURIComponent(playerName)}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch data');
        return;
      }
      
      const csvData = await response.text();
      const parsedData = parseStatcastCSV(csvData);
      
      console.log('Parsed batted balls:', parsedData.length);
      setBattedBalls(parsedData);
      
    } catch (error) {
      console.error('Error:', error);
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Baseball Spray Charts</h1>
      
      <div className="max-w-4xl">
        <PlayerSelector 
          playerName={playerName}
          setPlayerName={setPlayerName}
        />
        <DateRangeSelector 
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed border border-blue-700"
          disabled={!playerName || !startDate || !endDate || loading}
        >
          {loading ? 'Loading data from Baseball Savant...' : 'Generate Spray Chart'}
        </button>
        
        {loading && (
          <p className="mt-4 text-sm text-gray-600">
            This may take 10-30 seconds depending on the amount of data...
          </p>
        )}
        
        {battedBalls.length > 0 && <SprayChart data={battedBalls} />}
      </div>
    </main>
  );
};

export default Home;