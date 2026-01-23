import React from 'react';
import { CompetitionMode, Team } from '../../../types';

interface ScoreOverlayProps {
  competitionMode: CompetitionMode;
  onUpdateScore?: (teamIndex: number, delta: number) => void;
}

/**
 * Teacher-side score display with manual adjustment buttons.
 * Positioned in top-right corner during gameplay.
 * Shows player name (individual) or team scores with +/- controls (team).
 */
const ScoreOverlay: React.FC<ScoreOverlayProps> = ({
  competitionMode,
  onUpdateScore
}) => {
  if (competitionMode.mode === 'individual') {
    // Individual mode - just show player name badge
    const displayName = competitionMode.playerName || 'Player';

    return (
      <div className="fixed top-4 right-4 z-40">
        <div className="px-4 py-2 rounded-xl bg-slate-900/80 backdrop-blur-sm border-2 border-amber-400 shadow-lg">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Playing</div>
          <div className="text-lg font-bold text-white">{displayName}</div>
        </div>
      </div>
    );
  }

  // Team mode - show all teams with scores and adjustment buttons
  const { teams, activeTeamIndex } = competitionMode;

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-wrap gap-2 max-w-md">
      {teams.map((team, index) => {
        const isActive = index === activeTeamIndex;

        return (
          <div
            key={team.id}
            className={`
              px-3 py-2 rounded-xl bg-slate-900/80 backdrop-blur-sm
              border-2 transition-all duration-300
              ${isActive
                ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-lg shadow-amber-400/30'
                : 'border-slate-600'
              }
            `}
          >
            {/* Team name */}
            <div className={`text-[10px] uppercase tracking-wider mb-1 ${
              isActive ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {team.name}
            </div>

            {/* Score with +/- buttons */}
            <div className="flex items-center gap-1">
              {onUpdateScore && (
                <button
                  onClick={() => onUpdateScore(index, -1)}
                  className="w-5 h-5 rounded bg-slate-700 hover:bg-red-600 text-white text-xs font-bold transition-colors"
                  title="Decrease score"
                >
                  -
                </button>
              )}
              <span className="text-xl font-bold text-white min-w-[2ch] text-center">
                {team.score}
              </span>
              {onUpdateScore && (
                <button
                  onClick={() => onUpdateScore(index, 1)}
                  className="w-5 h-5 rounded bg-slate-700 hover:bg-green-600 text-white text-xs font-bold transition-colors"
                  title="Increase score"
                >
                  +
                </button>
              )}
            </div>

            {/* Active indicator */}
            {isActive && (
              <div className="text-[8px] text-amber-400 text-center mt-1 animate-pulse">
                PLAYING
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ScoreOverlay;
