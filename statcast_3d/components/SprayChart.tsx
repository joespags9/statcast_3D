'use client';

import { useEffect, useRef } from 'react';
import { BattedBall } from '@/lib/csvParser';

interface SprayChartProps {
  data: BattedBall[];
}

const SprayChart = ({ data }: SprayChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#8BC34A'; // Grass green
    ctx.fillRect(0, 0, width, height);
    
    // Draw infield dirt
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.arc(width / 2, height, 180, Math.PI, 0);
    ctx.fill();
    
    // Draw home plate
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(width / 2, height - 10);
    ctx.lineTo(width / 2 - 8, height - 18);
    ctx.lineTo(width / 2 - 8, height - 28);
    ctx.lineTo(width / 2, height - 35);
    ctx.lineTo(width / 2 + 8, height - 28);
    ctx.lineTo(width / 2 + 8, height - 18);
    ctx.closePath();
    ctx.fill();
    
    // Draw bases
    const baseSize = 10;
    ctx.fillStyle = '#fff';
    // First base (right)
    ctx.save();
    ctx.translate(width / 2 + 127, height - 127);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-baseSize / 2, -baseSize / 2, baseSize, baseSize);
    ctx.restore();
    
    // Second base (top)
    ctx.save();
    ctx.translate(width / 2, height - 180);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-baseSize / 2, -baseSize / 2, baseSize, baseSize);
    ctx.restore();
    
    // Third base (left)
    ctx.save();
    ctx.translate(width / 2 - 127, height - 127);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-baseSize / 2, -baseSize / 2, baseSize, baseSize);
    ctx.restore();
    
    // Draw foul lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Left foul line (third base line)
    ctx.moveTo(width / 2, height);
    ctx.lineTo(20, 20);
    ctx.stroke();
    // Right foul line (first base line)
    ctx.beginPath();
    ctx.moveTo(width / 2, height);
    ctx.lineTo(width - 20, 20);
    ctx.stroke();
    
    // Analyze coordinate ranges
    const xCoords = data.map(b => b.hc_x).filter(x => !isNaN(x));
    const yCoords = data.map(b => b.hc_y).filter(y => !isNaN(y));
    
    console.log('X range:', Math.min(...xCoords), 'to', Math.max(...xCoords));
    console.log('Y range:', Math.min(...yCoords), 'to', Math.max(...yCoords));
    
    // Draw each batted ball
    data.forEach(ball => {
      if (isNaN(ball.hc_x) || isNaN(ball.hc_y)) return;
      
      // Baseball Savant coordinates:
      // hc_x: distance from home plate (increases toward outfield)
      // hc_y: horizontal position (125 is center, <125 is pull side for RHH, >125 is opposite field)
      
      // For a right-handed batter like Aaron Judge:
      // Pull side (left field) has lower hc_y values
      // Opposite field (right field) has higher hc_y values
      
      // Transform to canvas coordinates
      // Map hc_y (0-250) to canvas width, but flip it so pull is on left
      const x = width - ((ball.hc_y / 250) * width); // Flip horizontal
      
      // Map hc_x to canvas height (home plate at bottom, outfield at top)
      const y = height - ((ball.hc_x / 250) * (height - 50)) - 50;
      
      // Color by hit type
      let color = '#666';
      if (ball.events === 'home_run') color = '#ff0000';
      else if (ball.events === 'double' || ball.events === 'triple') color = '#ff9900';
      else if (ball.events === 'single') color = '#00cc00';
      
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1.0;
    
  }, [data]);
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Spray Chart ({data.length} batted balls)</h2>
      <canvas 
        ref={canvasRef}
        width={600}
        height={600}
        className="border border-gray-300"
      />
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded-full"></div>
          <span>Home Run</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
          <span>Double/Triple</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded-full"></div>
          <span>Single</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          <span>Out</span>
        </div>
      </div>
    </div>
  );
};

export default SprayChart;