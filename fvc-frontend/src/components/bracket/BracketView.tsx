import React from "react";

export type BracketMatch = {
  id: string;
  name: string;
  round: number;
  matchNumber: number;
  redAthlete: {
    id: string;
    name: string;
    seedNumber?: number;
    score?: number;
    isWinner?: boolean;
  } | null;
  blueAthlete: {
    id: string;
    name: string;
    seedNumber?: number;
    score?: number;
    isWinner?: boolean;
  } | null;
  isBye?: boolean;
  byeAthlete?: {
    id: string;
    name: string;
    seedNumber?: number;
  };
};

export type BracketRound = {
  roundNumber: number;
  roundName: string;
  matches: BracketMatch[];
};

interface BracketViewProps {
  rounds: BracketRound[];
  totalRounds: number;
}

export const BracketView: React.FC<BracketViewProps> = ({ rounds, totalRounds }) => {
  if (!rounds || rounds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Chưa có dữ liệu bracket để hiển thị
      </div>
    );
  }

  // Calculate spacing between matches based on round - more compact
  const getMatchSpacing = (roundNumber: number) => {
    const baseSpacing = 40;
    return baseSpacing * Math.pow(1.5, totalRounds - roundNumber);
  };

  return (
    <div className="w-full overflow-auto py-4">
      <div className="flex gap-6 min-w-max px-2" style={{ minHeight: "300px" }}>
        {rounds.map((round, roundIndex) => {
          const isLastRound = roundIndex === rounds.length - 1;
          const matchSpacing = getMatchSpacing(round.roundNumber);

          return (
            <div
              key={round.roundNumber}
              className="flex flex-col gap-2 relative"
              style={{ width: "180px" }}
            >
              {/* Round Header */}
              <div className="text-center mb-2 sticky top-0 bg-white z-10 pb-1">
                <h3 className="text-base font-semibold text-gray-800">
                  {round.roundName}
                </h3>
                <p className="text-xs text-gray-500">
                  {round.matches.length} trận
                </p>
              </div>

              {/* Matches */}
              <div className="flex flex-col justify-center flex-1">
                {round.matches.map((match, matchIndex) => {
                  const isByeMatch = match.isBye;
                  const hasWinner = match.redAthlete?.isWinner || match.blueAthlete?.isWinner;

                  return (
                    <div
                      key={match.id}
                      className="relative"
                      style={{
                        marginTop: matchIndex === 0 ? 0 : `${matchSpacing}px`,
                      }}
                    >
                      {/* Match Card */}
                      <div
                        className={`
                          bg-white border-2 rounded-md shadow-sm p-2 w-[170px]
                          transition-all duration-200
                          ${isByeMatch ? "border-yellow-400 bg-yellow-50" : "border-gray-300 hover:shadow-md"}
                          ${hasWinner ? "border-green-500 shadow-green-200" : ""}
                        `}
                      >
                        {/* Match Number */}
                        <div className="text-xs text-gray-500 mb-1 text-center font-medium">
                          T{match.matchNumber}
                        </div>

                        {/* Bye Match */}
                        {isByeMatch && match.byeAthlete ? (
                          <div className="text-center py-2">
                            <div className="text-xs font-medium text-gray-700 truncate">
                              {match.byeAthlete.name}
                            </div>
                            {match.byeAthlete.seedNumber && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                #{match.byeAthlete.seedNumber}
                              </div>
                            )}
                            <div className="text-xs text-yellow-600 mt-1 font-semibold bg-yellow-100 px-1.5 py-0.5 rounded inline-block">
                              BYE
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Red Athlete */}
                            <div
                              className={`
                                flex items-center justify-between p-1.5 mb-0.5 rounded text-xs transition-colors
                                ${match.redAthlete?.isWinner 
                                  ? "bg-green-100 border border-green-500" 
                                  : "bg-red-50 border border-red-200"}
                                ${!match.redAthlete ? "bg-gray-100 border border-gray-300" : ""}
                              `}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-800 truncate">
                                  {match.redAthlete?.name || "TBD"}
                                </div>
                                {match.redAthlete?.seedNumber && (
                                  <div className="text-xs text-gray-500">
                                    #{match.redAthlete.seedNumber}
                                  </div>
                                )}
                              </div>
                              {match.redAthlete?.score !== undefined && (
                                <div className="text-sm font-bold text-gray-700 ml-1">
                                  {match.redAthlete.score}
                                </div>
                              )}
                            </div>

                            {/* VS Divider */}
                            <div className="text-center text-xs text-gray-400 py-0.5 font-semibold">
                              VS
                            </div>

                            {/* Blue Athlete */}
                            <div
                              className={`
                                flex items-center justify-between p-1.5 rounded text-xs transition-colors
                                ${match.blueAthlete?.isWinner 
                                  ? "bg-green-100 border border-green-500" 
                                  : "bg-blue-50 border border-blue-200"}
                                ${!match.blueAthlete ? "bg-gray-100 border border-gray-300" : ""}
                              `}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-800 truncate">
                                  {match.blueAthlete?.name || "TBD"}
                                </div>
                                {match.blueAthlete?.seedNumber && (
                                  <div className="text-xs text-gray-500">
                                    #{match.blueAthlete.seedNumber}
                                  </div>
                                )}
                              </div>
                              {match.blueAthlete?.score !== undefined && (
                                <div className="text-sm font-bold text-gray-700 ml-1">
                                  {match.blueAthlete.score}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Connector Lines to Next Round */}
                      {!isLastRound && (
                        <>
                          {/* Horizontal line to next round */}
                          <div className="absolute top-1/2 -right-3 w-3 h-0.5 bg-gray-400 z-0" />
                          {/* Vertical connector - connect pairs of matches */}
                          {/* In tournament bracket, matches are paired: (0,1)->0, (2,3)->1, etc. */}
                          {matchIndex % 2 === 0 && matchIndex + 1 < round.matches.length && (
                            <div 
                              className="absolute top-1/2 -right-3 w-0.5 bg-gray-400 z-0"
                              style={{ 
                                height: `${matchSpacing + 60}px`,
                                top: '50%'
                              }}
                            />
                          )}
                          {/* If this is the last match in an odd-numbered round, extend connector */}
                          {matchIndex === round.matches.length - 1 && round.matches.length % 2 === 1 && (
                            <div 
                              className="absolute top-1/2 -right-3 w-0.5 bg-gray-400 z-0"
                              style={{ 
                                height: `${matchSpacing / 2}px`,
                                bottom: '-30px'
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


