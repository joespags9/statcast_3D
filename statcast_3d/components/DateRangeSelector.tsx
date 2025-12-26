'use client';

interface DateRangeSelectorProps {
    startDate: string;
    endDate: string;
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
}

const DateRangeSelector = ({startDate, endDate, setStartDate, setEndDate}: DateRangeSelectorProps) => {
    return(
        <div className="md-6">
            <label className="block text-sm font-medium mb-2">
                Date Range
            </label>
            <div className="flex gap-4">
                <input
                    type="date"
                    value = {startDate}
                    onChange = {(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="self-center">to</span>
                <input
                    type="date"
                    value = {endDate}
                    onChange = {(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            {startDate && endDate && (
                <p className = "mt-2 text-sm text-gray-600">
                    Range: {startDate} to {endDate}
                </p>
            )}
        </div>
    )
}

export default DateRangeSelector