import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import matchScoringService, { type MatchScoreboard, type MatchEvent } from '../../services/matchScoringService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatEventTime(timestampInRoundSeconds: number): string {
  return formatTime(timestampInRoundSeconds);
}

function getEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case 'SCORE_PLUS_1':
      return '+1';
    case 'SCORE_PLUS_2':
      return '+2';
    case 'SCORE_MINUS_1':
      return '-1';
    case 'MEDICAL_TIMEOUT':
      return 'Tạm dừng y tế';
    case 'WARNING':
      return 'Cảnh cáo';
    default:
      return eventType;
  }
}

function getCornerLabel(corner: string | null): string {
  switch (corner) {
    case 'RED':
      return 'Đỏ';
    case 'BLUE':
      return 'Xanh';
    default:
      return '-';
  }
}

export default function MatchScoringPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  
  const [scoreboard, setScoreboard] = useState<MatchScoreboard | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState<string>('');

  // Fetch scoreboard data
  const fetchScoreboard = useCallback(async () => {
    if (!matchId) {
      setError('Match ID không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await matchScoringService.getScoreboard(matchId);
      setScoreboard(data);
      
      // Also fetch events
      const eventData = await matchScoringService.getEventHistory(matchId);
      setEvents(eventData);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu trận đấu');
      console.error('Error fetching scoreboard:', err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchScoreboard();
    
    // Refresh every 5 seconds to get latest state
    const interval = setInterval(fetchScoreboard, 5000);
    return () => clearInterval(interval);
  }, [fetchScoreboard]);

  // Load and persist notes per match in localStorage
  useEffect(() => {
    if (!matchId) return;
    const saved = localStorage.getItem(`match:${matchId}:notes`);
    setNotes(saved ?? '');
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    try {
      localStorage.setItem(`match:${matchId}:notes`, notes);
    } catch {}
  }, [matchId, notes]);

  // Handle score event
  const handleScoreEvent = async (
    corner: 'RED' | 'BLUE',
    eventType: 'SCORE_PLUS_1' | 'SCORE_PLUS_2' | 'SCORE_MINUS_1' | 'MEDICAL_TIMEOUT' | 'WARNING'
  ) => {
    if (!matchId || !scoreboard || actionLoading) return;

    try {
      setActionLoading(true);
      const timestampInRoundSeconds = scoreboard.roundDurationSeconds - scoreboard.timeRemainingSeconds;
      
      await matchScoringService.recordScoreEvent(matchId, {
        round: scoreboard.currentRound,
        timestampInRoundSeconds: Math.max(0, timestampInRoundSeconds),
        corner,
        eventType,
      });

      // Refresh data after action
      await fetchScoreboard();
    } catch (err: any) {
      setError(err?.message || 'Không thể ghi nhận sự kiện');
      console.error('Error recording score event:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle match control
  const handleMatchControl = async (action: 'START' | 'PAUSE' | 'RESUME' | 'END') => {
    if (!matchId || !scoreboard || actionLoading) return;

    try {
      setActionLoading(true);
      await matchScoringService.controlMatch(matchId, {
        action,
        currentRound: scoreboard.currentRound,
        timeRemainingSeconds: scoreboard.timeRemainingSeconds,
      });

      await fetchScoreboard();
    } catch (err: any) {
      setError(err?.message || 'Không thể điều khiển trận đấu');
      console.error('Error controlling match:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle winner selection
  const handleWinner = async (corner: 'RED' | 'BLUE') => {
    if (!matchId || actionLoading) return;

    try {
      setActionLoading(true);
      // End match and set winner (you might need to adjust this based on your API)
      await matchScoringService.controlMatch(matchId, {
        action: 'END',
      });
      
      // Navigate back or show success message
      alert(`Vận động viên ${corner === 'RED' ? 'Đỏ' : 'Xanh'} thắng!`);
      navigate(-1);
    } catch (err: any) {
      setError(err?.message || 'Không thể kết thúc trận đấu');
      console.error('Error ending match:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle undo
  const handleUndo = async () => {
    if (!matchId || actionLoading) return;

    try {
      setActionLoading(true);
      await matchScoringService.undoLastEvent(matchId);
      await fetchScoreboard();
    } catch (err: any) {
      setError(err?.message || 'Không thể hoàn tác');
      console.error('Error undoing:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !scoreboard) {
    return (
      <div className="p-6">
        <ErrorMessage error={error} onRetry={fetchScoreboard} />
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!scoreboard) {
    return (
      <div className="p-6">
        <p>Không tìm thấy dữ liệu trận đấu</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const statusColor = scoreboard.status === 'ĐANG ĐẤU' ? 'text-green-600' : 
                      scoreboard.status === 'TẠM DỪNG' ? 'text-yellow-600' : 
                      'text-gray-600';

  return (
    <div className="font-sans bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-2xl">{scoreboard.matchName}</div>
          <div className="text-sm">
            <span className="mr-4 text-green-600">Hạng cân: {scoreboard.weightClass}</span>
            <span className="mr-4 text-purple-600">Vòng: {scoreboard.roundType}</span>
            Hiệp: {scoreboard.currentRound} / {scoreboard.totalRounds}
            <span className="ml-4 text-blue-600">
              Thời lượng hiệp: {formatTime(scoreboard.roundDurationSeconds)}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Quay lại
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4">
          <ErrorMessage error={error} />
        </div>
      )}

      {/* Main content - Athletes and timer */}
      <div className="flex gap-8 justify-center">
        {/* RED athlete */}
        <div className="flex-1 bg-white rounded-xl shadow-md text-center">
          <div className="bg-red-600 text-white rounded-t-xl px-4 py-4">
            <div className="font-bold text-xl">{scoreboard.redAthlete.name}</div>
            <div className="text-sm">{scoreboard.redAthlete.unit} | SBT {scoreboard.redAthlete.sbtNumber}</div>
          </div>
          <div className="text-6xl text-white bg-red-700 py-5">{scoreboard.redAthlete.score}</div>
          <div className="p-2">
            <button
              onClick={() => handleScoreEvent('RED', 'SCORE_PLUS_1')}
              disabled={actionLoading}
              className="mx-2 my-1 text-xl bg-red-50 text-red-600 rounded-lg border-none px-5 py-2 font-semibold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +1
            </button>
            <button
              onClick={() => handleScoreEvent('RED', 'SCORE_MINUS_1')}
              disabled={actionLoading}
              className="mx-2 my-1 text-xl bg-red-50 text-red-600 rounded-lg border-none px-5 py-2 font-semibold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -1
            </button>
            <button
              onClick={() => handleScoreEvent('RED', 'MEDICAL_TIMEOUT')}
              disabled={actionLoading}
              className="mx-2 my-1 text-sm bg-yellow-100 text-yellow-800 rounded-lg border-none px-4 py-2 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tạm dừng y tế: {scoreboard.redAthlete.medicalTimeoutCount}
            </button>
            <button
              onClick={() => handleScoreEvent('RED', 'WARNING')}
              disabled={actionLoading}
              className="mx-2 my-1 text-sm bg-gray-300 text-gray-800 rounded-lg border-none px-4 py-2 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cảnh cáo: {scoreboard.redAthlete.warningCount}
            </button>
            <button
              onClick={() => handleWinner('RED')}
              disabled={actionLoading}
              className="mx-2 my-1 text-base bg-green-600 text-white rounded-lg border-none px-5 py-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ĐỎ THẮNG
            </button>
          </div>
        </div>

        {/* CENTER - Status and timer */}
        <div className="flex-shrink-0 w-[360px] bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center">
          <div className="font-semibold text-lg mb-1">
            Trạng thái:{' '}
            <span className={statusColor}>{scoreboard.status}</span>
          </div>
          <div className="text-lg mb-3">Hiệp {scoreboard.currentRound} / {scoreboard.totalRounds}</div>
          <div className="text-7xl font-extrabold tracking-wider">
            {formatTime(scoreboard.timeRemainingSeconds)}
          </div>
          
          {/* Match control buttons */}
          <div className="mt-4 flex gap-2">
            {scoreboard.status === 'CHỜ BẮT ĐẦU' && (
              <button
                onClick={() => handleMatchControl('START')}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Bắt đầu
              </button>
            )}
            {scoreboard.status === 'ĐANG ĐẤU' && (
              <button
                onClick={() => handleMatchControl('PAUSE')}
                disabled={actionLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Tạm dừng
              </button>
            )}
            {scoreboard.status === 'TẠM DỪNG' && (
              <button
                onClick={() => handleMatchControl('RESUME')}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Tiếp tục
              </button>
            )}
            <button
              onClick={handleUndo}
              disabled={actionLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Hoàn tác
            </button>
          </div>
        </div>

        {/* BLUE athlete */}
        <div className="flex-1 bg-white rounded-xl shadow-md text-center">
          <div className="bg-blue-600 text-white rounded-t-xl px-4 py-4">
            <div className="font-bold text-xl">{scoreboard.blueAthlete.name}</div>
            <div className="text-sm">{scoreboard.blueAthlete.unit} | SBT {scoreboard.blueAthlete.sbtNumber}</div>
          </div>
          <div className="text-6xl text-white bg-blue-700 py-5">{scoreboard.blueAthlete.score}</div>
          <div className="p-2">
            <button
              onClick={() => handleScoreEvent('BLUE', 'SCORE_PLUS_1')}
              disabled={actionLoading}
              className="mx-2 my-1 text-xl bg-blue-50 text-blue-600 rounded-lg border-none px-5 py-2 font-semibold hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +1
            </button>
            <button
              onClick={() => handleScoreEvent('BLUE', 'SCORE_MINUS_1')}
              disabled={actionLoading}
              className="mx-2 my-1 text-xl bg-blue-50 text-blue-600 rounded-lg border-none px-5 py-2 font-semibold hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -1
            </button>
            <button
              onClick={() => handleScoreEvent('BLUE', 'MEDICAL_TIMEOUT')}
              disabled={actionLoading}
              className="mx-2 my-1 text-sm bg-yellow-100 text-yellow-800 rounded-lg border-none px-4 py-2 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tạm dừng y tế: {scoreboard.blueAthlete.medicalTimeoutCount}
            </button>
            <button
              onClick={() => handleScoreEvent('BLUE', 'WARNING')}
              disabled={actionLoading}
              className="mx-2 my-1 text-sm bg-gray-300 text-gray-800 rounded-lg border-none px-4 py-2 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cảnh cáo: {scoreboard.blueAthlete.warningCount}
            </button>
            <button
              onClick={() => handleWinner('BLUE')}
              disabled={actionLoading}
              className="mx-2 my-1 text-base bg-blue-600 text-white rounded-lg border-none px-5 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              XANH THẮNG
            </button>
          </div>
        </div>
      </div>

      {/* Event history */}
      <div className="bg-white rounded-xl shadow-md mt-6 p-5">
        <div className="font-bold text-lg mb-2">Lịch sử sự kiện</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Hiệp</th>
                <th className="p-2 text-left">Thời gian</th>
                <th className="p-2 text-left">Giám định</th>
                <th className="p-2 text-left">Góc</th>
                <th className="p-2 text-left">Sự kiện</th>
                <th className="p-2 text-left">Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    Chưa có sự kiện nào
                  </td>
                </tr>
              ) : (
                events.map((event, idx) => (
                  <tr key={event.id} className="border-b border-gray-200">
                    <td className="p-2 text-center">{idx + 1}</td>
                    <td className="p-2 text-center">{event.round}</td>
                    <td className="p-2 text-center">
                      {formatEventTime(event.timestampInRoundSeconds)}
                    </td>
                    <td className="p-2 text-center">{event.judgeId || '-'}</td>
                    <td className="p-2 text-center">{getCornerLabel(event.corner)}</td>
                    <td className="p-2 text-center">{getEventTypeLabel(event.eventType)}</td>
                    <td className="p-2 text-center">{event.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-md mt-6 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-lg">Ghi chú</div>
          <button
            type="button"
            onClick={() => setNotes('')}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Xóa ghi chú
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nhập ghi chú cho trận đấu này..."
          className="w-full min-h-[120px] border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-gray-500 mt-1">
          Ghi chú được lưu tự động trên thiết bị cho trận đấu hiện tại.
        </div>
      </div>
    </div>
  );
}
