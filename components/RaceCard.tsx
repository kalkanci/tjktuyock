import React from 'react';
import { Clock, Map, Star, AlertCircle } from 'lucide-react';
import { Race } from '../types';
import { DashboardChart } from './DashboardChart';

interface RaceCardProps {
  race: Race;
}

export const RaceCard: React.FC<RaceCardProps> = ({ race }) => {
  return (
    <div className="bg-racing-800 rounded-xl border border-racing-700 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="bg-racing-900/50 p-4 border-b border-racing-700 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-racing-gold font-bold text-lg">#{race.id}</span>
            <span className="px-2 py-0.5 bg-racing-700 rounded text-xs text-gray-300">{race.time}</span>
          </div>
          <h3 className="font-semibold text-gray-100">{race.name}</h3>
        </div>
        <div className="flex flex-col items-end text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Map size={12} />
            <span>{race.distance}</span>
          </div>
          <div className="mt-1 px-2 py-0.5 rounded-full bg-racing-700/50 text-gray-300 border border-racing-600">
            {race.trackType}
          </div>
        </div>
      </div>

      {/* Main Pick */}
      <div className="p-4">
        {race.bestPick && (
          <div className="flex items-start gap-3 mb-4 bg-gradient-to-r from-racing-accent/10 to-transparent p-3 rounded-lg border-l-4 border-racing-accent">
            <Star className="text-racing-accent fill-racing-accent shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-xs text-racing-accent font-bold uppercase tracking-wider">Favori</p>
              <p className="text-xl font-bold text-white">{race.bestPick}</p>
            </div>
          </div>
        )}

        {/* Horses List */}
        <div className="space-y-3">
          {race.horses.map((horse, idx) => (
            <div key={idx} className="bg-racing-900/30 rounded-lg p-3 border border-racing-700/50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-200">{horse.name}</span>
                    {horse.jockey && <span className="text-xs text-gray-500">({horse.jockey})</span>}
                  </div>
                </div>
                {horse.score > 0 && (
                   <div className="flex items-center gap-1 bg-racing-800 px-2 py-1 rounded text-xs font-mono">
                     <span className={horse.score > 80 ? 'text-green-400' : 'text-yellow-400'}>{horse.score}%</span>
                   </div>
                )}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed border-t border-racing-700/50 pt-2 mt-1">
                <AlertCircle size={10} className="inline mr-1 mb-0.5 text-racing-600" />
                {horse.reasoning}
              </p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {race.horses.length > 1 && (
          <DashboardChart horses={race.horses} />
        )}
      </div>
    </div>
  );
};