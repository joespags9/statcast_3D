'use client';

interface PlayerSelectorProps {
    playerName: string;
    setPlayerName: (name: string) => void;
}

const PlayerSelector = ({playerName, setPlayerName}: PlayerSelectorProps) => {
    return(
        <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
                Select Player
            </label>
            <input
                type = "text"
                placeholder="Enter a player name..."
                value = {playerName}
                onChange = {(e) => setPlayerName(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {playerName && (
                <p className='mt-2 text-sm text-gray-600'>
                    Searching for: {playerName}
                </p>
            )}
        </div>
    )
}

export default PlayerSelector