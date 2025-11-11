import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/common/ToastContext';
import apiClient from '../../config/axios';
import { API_ENDPOINTS } from '../../config/endpoints';
import matchScoringService from '../../services/matchScoringService';
import { useAuthStore } from '../../stores/authStore';

interface AssessorInfo {
  id: string;
  position: number;
  userFullName: string;
  userEmail: string;
  role: 'ASSESSOR' | 'JUDGER';
  notes?: string | null;
  matchId: string;
  matchName: string;
  matchInfo?: {
    redAthlete: string;
    blueAthlete: string;
    weightClass?: string;
    round?: number;
    status?: string;
  };
}

interface VoteResponse {
  matchId: string;
  corner: 'RED' | 'BLUE';
  score: number;
  voteCount: number;
  totalAssessors: number;
  scoreAccepted: boolean;
  votes: Record<string, number>;
}

export default function AssessorPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  
  const [assessorInfo, setAssessorInfo] = useState<AssessorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [selectedCorner, setSelectedCorner] = useState<'RED' | 'BLUE' | null>(null);
  const [selectedScore, setSelectedScore] = useState<1 | 2 | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteResponse | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [connectedCount, setConnectedCount] = useState<number>(0);
  const requiredAssessors = 5;
  
  const stompClientRef = useRef<Client | null>(null);

  // Fetch assessor info
  useEffect(() => {
    async function fetchAssessorInfo() {
      if (!matchId) {
        toast.error('Match ID không hợp lệ');
        setLoading(false);
        return;
      }

      if (!user || !user.id) {
        toast.error('Bạn cần đăng nhập để truy cập màn hình giám định');
        setLoading(false);
        return;
      }

      try {
        // Get all assessors for this match
        const assessorsRes = await apiClient.get(
          `${API_ENDPOINTS.MATCH_ASSESSORS.LIST.replace('{matchId}', matchId)}`
        );
        
        const assessors = assessorsRes.data.data;
        console.log('All assessors for match:', assessors);
        console.log('Current user ID:', user.id);
        
        const assessor = assessors.find((a: any) => a.userId === user.id);
        
        if (!assessor) {
          console.error('Assessor not found. User ID:', user.id, 'Available assessors:', assessors.map((a: any) => ({ id: a.id, userId: a.userId, position: a.position })));
          toast.error('Bạn chưa được gán làm giám định cho trận đấu này');
          setLoading(false);
          return;
        }
        
        console.log('Found assessor:', assessor);

        // Get match info
        const scoreboardRes = await matchScoringService.getScoreboard(matchId).catch(() => null);
        const matchName = scoreboardRes?.matchName || `Trận đấu ${matchId.substring(0, 8)}`;
        
        setAssessorInfo({
          id: assessor.id,
          position: assessor.position,
          userFullName: assessor.userFullName || user.fullName || 'Giám định',
          userEmail: assessor.userEmail || user.personalMail || user.eduMail || '',
          role: assessor.role || 'ASSESSOR',
          notes: assessor.notes || null,
          matchId: matchId,
          matchName: matchName,
          matchInfo: scoreboardRes ? {
            redAthlete: scoreboardRes.redAthlete.name || 'Đỏ',
            blueAthlete: scoreboardRes.blueAthlete.name || 'Xanh',
            weightClass: scoreboardRes.weightClass || undefined,
            round: scoreboardRes.currentRound || undefined,
            status: scoreboardRes.status || undefined,
          } : undefined
        });

        // Connect WebSocket
        connectWebSocket(matchId, assessor.id);
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể tải thông tin giám định';
        toast.error(errorMessage);
        console.error('Error fetching assessor info:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssessorInfo();
  }, [matchId, user]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (stompClientRef.current?.connected) {
        // Unregister assessor connection on disconnect
        if (matchId && assessorInfo?.id) {
          stompClientRef.current.publish({
            destination: '/app/assessor/unregister',
            body: JSON.stringify({ matchId, assessorId: assessorInfo.id }),
          });
        }
        stompClientRef.current.deactivate();
      }
    };
  }, [matchId, assessorInfo?.id]);

  const connectWebSocket = (matchId: string, assessorId: string) => {
    // WebSocket endpoint (no /api prefix, it's a separate endpoint)
    const wsUrl = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') + '/ws'
      : 'http://localhost:8080/ws';
    const socket = new SockJS(wsUrl);
    const stompClient = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Notify server about assessor connection after a short delay to ensure connection is stable
        setTimeout(() => {
          if (matchId && assessorId && stompClient.connected) {
            console.log('Sending register message:', { matchId, assessorId });
            try {
              stompClient.publish({
                destination: '/app/assessor/register',
                body: JSON.stringify({ matchId, assessorId }),
              });
              console.log('Register message sent successfully');
            } catch (err) {
              console.error('Error sending register message:', err);
            }
          } else {
            console.warn('Cannot send register - missing params or not connected:', {
              matchId, assessorId, connected: stompClient.connected
            });
          }
        }, 500);

        // Subscribe to vote responses
        stompClient.subscribe(`/topic/match/${matchId}/assessor-votes`, (message) => {
          try {
            const response: VoteResponse = JSON.parse(message.body);
            setVoteStatus(response);
            
            if (response.scoreAccepted) {
              // Score was accepted, reset selection
              setSelectedCorner(null);
              setSelectedScore(null);
              setIsConfirming(false);
              // Show success notification
              toast.success(`✅ Điểm đã được chấp nhận! (${response.voteCount}/${response.totalAssessors} giám định)`);
            }
          } catch (e) {
            console.error('Error parsing vote response', e);
          }
        });

        // Subscribe to errors
        stompClient.subscribe(`/topic/match/${matchId}/assessor-error`, (message) => {
          toast.error(message.body);
        });

        // Subscribe to vote reset
        stompClient.subscribe(`/topic/match/${matchId}/assessor-votes-reset`, () => {
          setSelectedCorner(null);
          setSelectedScore(null);
          setVoteStatus(null);
        });

        // Subscribe to match ended notification
        stompClient.subscribe(`/topic/match/${matchId}/match-ended`, (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log('Match ended notification received:', data);
            
            // Show notification
            const winnerMessage = data.winner === 'HÒA' 
              ? `Trận đấu kết thúc! Hòa ${data.redScore} - ${data.blueScore}`
              : `Trận đấu kết thúc! ${data.winner} thắng ${data.redScore} - ${data.blueScore}`;
            
            toast.success(winnerMessage);
            
            // Disconnect WebSocket
            if (stompClient.connected) {
              // Unregister before disconnect
              if (matchId && assessorInfo?.id) {
                try {
                  stompClient.publish({
                    destination: '/app/assessor/unregister',
                    body: JSON.stringify({ matchId, assessorId: assessorInfo.id }),
                  });
                } catch (e) {
                  console.error('Error unregistering assessor:', e);
                }
              }
              
              // Deactivate connection
              setTimeout(() => {
                stompClient.deactivate();
                setConnected(false);
                console.log('WebSocket disconnected due to match end');
              }, 1000);
            }
          } catch (e) {
            console.error('Error parsing match ended message', e);
          }
        });

        // Subscribe to connection status to know how many assessors are online
        stompClient.subscribe(`/topic/match/${matchId}/assessor-connections`, (message) => {
          try {
            const status = JSON.parse(message.body) as { connectedCount?: number; connectedAssessors?: string[] };
            if (typeof status.connectedCount === 'number') {
              setConnectedCount(status.connectedCount);
            } else if (Array.isArray(status.connectedAssessors)) {
              setConnectedCount(status.connectedAssessors.length);
            }
          } catch (e) {
            console.error('Error parsing connection status', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        toast.error('Lỗi kết nối WebSocket: ' + frame.headers['message']);
        setConnected(false);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        setConnected(false);
      },
    });

    stompClient.activate();
    stompClientRef.current = stompClient;
  };

  useEffect(() => {
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  const handleScoreSelect = (corner: 'RED' | 'BLUE', score: 1 | 2) => {
    setSelectedCorner(corner);
    setSelectedScore(score);
    setVoteStatus(null); // Reset previous vote status
  };

  const handleConfirm = () => {
    if (!selectedCorner || !selectedScore || !matchId || !assessorInfo || !stompClientRef.current || isConfirming) {
      return;
    }

    setIsConfirming(true);

    try {
      const voteRequest = {
        matchId,
        assessorId: assessorInfo.id,
        corner: selectedCorner,
        score: selectedScore,
      };
      
      console.log('Sending vote request:', voteRequest);

      stompClientRef.current.publish({
        destination: '/app/assessor/vote',
        body: JSON.stringify(voteRequest),
      });

      // Reset confirmation state after a delay
      setTimeout(() => {
        setIsConfirming(false);
      }, 1000);
    } catch (err: any) {
      toast.error('Không thể gửi vote: ' + err.message);
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading && !assessorInfo) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  const matchStarted = assessorInfo?.matchInfo?.status === 'ĐANG ĐẤU';
  const hasEnoughAssessors = connectedCount >= requiredAssessors;
  const canScore = connected && matchStarted && hasEnoughAssessors;

  return (
    <div className="font-sans bg-gray-50 min-h-screen p-6">
      {/* Header - Full Assessor Information */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {assessorInfo?.matchName || 'Trận đấu'}
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              {assessorInfo?.matchInfo && (
                <>
                  <div>
                    <span className="font-semibold text-red-600">Đỏ:</span> {assessorInfo.matchInfo.redAthlete}
                    {' vs '}
                    <span className="font-semibold text-blue-600">Xanh:</span> {assessorInfo.matchInfo.blueAthlete}
                  </div>
                  {assessorInfo.matchInfo.weightClass && (
                    <div>
                      <span className="font-semibold">Hạng cân:</span> {assessorInfo.matchInfo.weightClass}
                    </div>
                  )}
                  {assessorInfo.matchInfo.round !== undefined && (
                    <div>
                      <span className="font-semibold">Hiệp:</span> {assessorInfo.matchInfo.round}
                    </div>
                  )}
                  {assessorInfo.matchInfo.status && (
                    <div>
                      <span className="font-semibold">Trạng thái trận đấu:</span>{' '}
                      <span className={
                        assessorInfo.matchInfo.status === 'ĐANG ĐẤU' ? 'text-green-600 font-bold' :
                        assessorInfo.matchInfo.status === 'TẠM DỪNG' ? 'text-yellow-600 font-bold' :
                        assessorInfo.matchInfo.status === 'KẾT THÚC' ? 'text-red-600 font-bold' :
                        'text-gray-600'
                      }>
                        {assessorInfo.matchInfo.status}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            connected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            Kết nối: {connected ? 'ĐÃ KẾT NỐI' : 'ĐANG KẾT NỐI...'}
          </div>
        </div>

        {/* Assessor Details Card */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Thông tin giám định</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600 mb-1">Tên đầy đủ:</div>
              <div className="font-semibold text-gray-800">{assessorInfo?.userFullName || '-'}</div>
            </div>
            
            <div>
              <div className="text-gray-600 mb-1">Email:</div>
              <div className="font-semibold text-gray-800">{assessorInfo?.userEmail || '-'}</div>
            </div>
            
            <div>
              <div className="text-gray-600 mb-1">Vị trí:</div>
              <div className="font-semibold text-gray-800">
                Vị trí số {assessorInfo?.position || '-'}
                {assessorInfo?.role === 'JUDGER' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    Trọng tài máy
                  </span>
                )}
                {assessorInfo?.role === 'ASSESSOR' && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    Giám định
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <div className="text-gray-600 mb-1">Vai trò:</div>
              <div className="font-semibold text-gray-800">
                {assessorInfo?.role === 'JUDGER' ? 'Trọng tài máy' : 'Giám định'}
              </div>
            </div>
            
            {assessorInfo?.notes && (
              <div className="md:col-span-2">
                <div className="text-gray-600 mb-1">Ghi chú:</div>
                <div className="font-semibold text-gray-800">{assessorInfo.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Guard conditions information */}
      <div className="mb-4">
        {!hasEnoughAssessors && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm mb-2">
            Cần tối thiểu {requiredAssessors} giám định kết nối. Hiện tại: <strong>{connectedCount}</strong>.
          </div>
        )}
        {!matchStarted && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm">
            Trận đấu chưa ở trạng thái <strong>ĐANG ĐẤU</strong>. Vui lòng chờ trọng tài bắt đầu trận đấu.
          </div>
        )}
      </div>

      {/* Vote Status */}
      {voteStatus && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            Đã có <strong>{voteStatus.voteCount}/{voteStatus.totalAssessors}</strong> giám định vote{' '}
            <strong>{voteStatus.score} điểm</strong> cho{' '}
            <strong>{voteStatus.corner === 'RED' ? 'ĐỎ' : 'XANH'}</strong>
            {voteStatus.scoreAccepted && ' - ✅ Đã chấp nhận!'}
          </div>
        </div>
      )}

      {/* Score Input Buttons - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
        {/* +1 ĐỎ */}
        <button
          onClick={() => handleScoreSelect('RED', 1)}
          disabled={isConfirming || !canScore}
          className={`h-32 rounded-xl text-white font-bold text-3xl transition-all ${
            selectedCorner === 'RED' && selectedScore === 1
              ? 'bg-red-700 shadow-lg ring-4 ring-red-300'
              : 'bg-red-600 hover:bg-red-700'
          } disabled:opacity-50`}
        >
          <div>+1</div>
          <div className="text-xl mt-2">ĐỎ</div>
        </button>

        {/* +1 XANH */}
        <button
          onClick={() => handleScoreSelect('BLUE', 1)}
          disabled={isConfirming || !canScore}
          className={`h-32 rounded-xl text-white font-bold text-3xl transition-all ${
            selectedCorner === 'BLUE' && selectedScore === 1
              ? 'bg-blue-700 shadow-lg ring-4 ring-blue-300'
              : 'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          <div>+1</div>
          <div className="text-xl mt-2">XANH</div>
        </button>

        {/* +2 ĐỎ */}
        <button
          onClick={() => handleScoreSelect('RED', 2)}
          disabled={isConfirming || !canScore}
          className={`h-32 rounded-xl text-white font-bold text-3xl transition-all ${
            selectedCorner === 'RED' && selectedScore === 2
              ? 'bg-red-700 shadow-lg ring-4 ring-red-300'
              : 'bg-red-600 hover:bg-red-700'
          } disabled:opacity-50`}
        >
          <div>+2</div>
          <div className="text-xl mt-2">ĐỎ</div>
        </button>

        {/* +2 XANH */}
        <button
          onClick={() => handleScoreSelect('BLUE', 2)}
          disabled={isConfirming || !canScore}
          className={`h-32 rounded-xl text-white font-bold text-3xl transition-all ${
            selectedCorner === 'BLUE' && selectedScore === 2
              ? 'bg-blue-700 shadow-lg ring-4 ring-blue-300'
              : 'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          <div>+2</div>
          <div className="text-xl mt-2">XANH</div>
        </button>
      </div>

      {/* Confirm Button */}
      <div className="flex justify-center">
        <button
          onClick={handleConfirm}
          disabled={!selectedCorner || !selectedScore || !connected || isConfirming || !canScore}
          className={`px-12 py-4 rounded-xl text-white font-bold text-xl transition-all ${
            selectedCorner && selectedScore && connected && !isConfirming && canScore
              ? 'bg-green-600 hover:bg-green-700 shadow-lg'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isConfirming ? 'Đang gửi...' : 'XÁC NHẬN'}
        </button>
      </div>
    </div>
  );
}

