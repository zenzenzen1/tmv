import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import matchScoringService, { type MatchListItem } from '../../services/matchScoringService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import { useToast } from '../../components/common/ToastContext';
import apiClient from '../../config/axios';
import { API_ENDPOINTS } from '../../config/endpoints';

interface User {
  id: string;
  fullName: string;
  personalMail?: string;
  eduMail?: string;
  systemRole: string;
}

interface AssessorAssignment {
  userId: string;
  position: number;
  role: 'ASSESSOR' | 'JUDGER';
  notes?: string;
}

export default function AssignAssessorsPage() {
  const { matchId: matchIdParam } = useParams<{ matchId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedMatchId, setSelectedMatchId] = useState<string>(matchIdParam || '');
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [existingAssessors, setExistingAssessors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalMatches, setTotalMatches] = useState(0);

  // Assessor assignments: position 1-6 (1-5: ASSESSOR, 6: JUDGER)
  const [assignments, setAssignments] = useState<Record<number, AssessorAssignment | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });

  // Fetch matches
  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        const data = await matchScoringService.listMatches();
        setMatches(data);
        setTotalMatches(data.length);
      } catch (err: any) {
        toast.error(err?.message || 'Không thể tải danh sách trận đấu');
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);
  
  // Calculate paginated matches
  const paginatedMatches = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return matches.slice(start, end);
  }, [matches, page, pageSize]);
  
  const totalPages = Math.ceil(totalMatches / pageSize);

  // Fetch users when needed
  useEffect(() => {
    async function fetchUsers() {
      try {
        setUsersLoading(true);
        // Fetch all users with a large page size to get all TEACHER and EXECUTIVE_BOARD users
        const response = await apiClient.get(API_ENDPOINTS.USERS.BASE, {
          params: {
            page: 0,
            size: 1000 // Large size to get all users
          }
        });
        const usersData = response.data?.data?.content || response.data?.data || [];
        setUsers(usersData);
        console.log('Fetched users:', usersData.length, usersData.map((u: User) => ({ id: u.id, name: u.fullName, role: u.systemRole })));
      } catch (err: any) {
        console.error('Error fetching users:', err);
        toast.error('Không thể tải danh sách users');
      } finally {
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Fetch existing assessors when match is selected
  useEffect(() => {
    if (!selectedMatchId) {
      setExistingAssessors([]);
      setAssignments({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
      return;
    }

    async function fetchExistingAssessors() {
      try {
        const response = await apiClient.get(
          API_ENDPOINTS.MATCH_ASSESSORS.LIST.replace('{matchId}', selectedMatchId)
        );
        const assessors = response.data.data || [];
        setExistingAssessors(assessors);

        // Populate assignments from existing assessors
        const newAssignments: Record<number, AssessorAssignment | null> = {
          1: null,
          2: null,
          3: null,
          4: null,
          5: null,
          6: null,
        };

        assessors.forEach((a: any) => {
          if (a.position >= 1 && a.position <= 6) {
            newAssignments[a.position] = {
              userId: a.userId,
              position: a.position,
              role: a.role,
              notes: a.notes || '',
            };
          }
        });

        setAssignments(newAssignments);
      } catch (err: any) {
        console.error('Error fetching existing assessors:', err);
        // Don't set error, just clear
        setExistingAssessors([]);
      }
    }

    fetchExistingAssessors();
  }, [selectedMatchId]);

  const handleAssignUser = (position: number, userId: string, role: 'ASSESSOR' | 'JUDGER' = 'ASSESSOR') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setAssignments((prev) => ({
      ...prev,
      [position]: {
        userId,
        position,
        role: position === 6 ? 'JUDGER' : role, // Position 6 is JUDGER by default
        notes: '',
      },
    }));
  };

  const handleRemoveAssessor = (position: number) => {
    setAssignments((prev) => ({
      ...prev,
      [position]: null,
    }));
  };

  const handleAssign = async () => {
    if (!selectedMatchId) {
      toast.error('Vui lòng chọn trận đấu');
      return;
    }

    // Collect all assignments (positions 1-6, all need to be assigned)
    // Only include positions that have been assigned (not null)
    const assessorsList: AssessorAssignment[] = [];
    for (let pos = 1; pos <= 6; pos++) {
      if (assignments[pos]) {
        assessorsList.push(assignments[pos]!);
      }
    }

    if (assessorsList.length === 0) {
      toast.error('Vui lòng gán ít nhất 1 giám định');
      return;
    }
    
    // Check minimum assessors for consensus (need at least 3 to reach consensus)
    if (assessorsList.length < 3) {
      toast.error('Cần ít nhất 3 giám định để có thể chấm điểm (cần đạt consensus)');
      return;
    }

    // Check if user is trying to reassign (there are existing assessors)
    // Show confirmation if they are about to replace existing assignments
    if (existingAssessors.length > 0 && assessorsList.length > 0) {
      const hasChanges = assessorsList.some(newAss => {
        const existing = existingAssessors.find(e => e.position === newAss.position);
        return !existing || existing.userId !== newAss.userId;
      });
      
      if (hasChanges) {
        const confirmed = window.confirm(
          'Bạn đang thay đổi giám định. Tất cả giám định cũ sẽ bị xóa và thay thế bằng danh sách mới. Tiếp tục?'
        );
        if (!confirmed) {
          return;
        }
      }
    }

    // Check for duplicate users
    const userIds = assessorsList.map(a => a.userId);
    if (new Set(userIds).size !== userIds.length) {
      toast.error('Mỗi user chỉ có thể được gán 1 lần');
      return;
    }

    // Check for duplicate positions
    const positions = assessorsList.map(a => a.position);
    if (new Set(positions).size !== positions.length) {
      toast.error('Mỗi vị trí chỉ có thể có 1 giám định');
      return;
    }

    try {
      setAssigning(true);

      await apiClient.post(API_ENDPOINTS.MATCH_ASSESSORS.ASSIGN, {
        matchId: selectedMatchId,
        assessors: assessorsList,
      });

      toast.success('Chỉ định giám định viên thành công!');
      
      // Refresh existing assessors
      const response = await apiClient.get(
        API_ENDPOINTS.MATCH_ASSESSORS.LIST.replace('{matchId}', selectedMatchId)
      );
      setExistingAssessors(response.data.data || []);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể chỉ định giám định viên';
      toast.error(errorMessage);
      console.error('Error assigning assessors:', err);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Quay lại"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Quay lại</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Chỉ định giám định viên cho trận đấu</h1>
        <p className="text-sm text-gray-600">
          Chọn trận đấu và chỉ định 5 giám định (vị trí 1-4: ASSESSOR, vị trí 5: JUDGER)
        </p>
      </div>

      {/* Match Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Chọn trận đấu
        </label>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Không có trận đấu nào
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {paginatedMatches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatchId(match.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMatchId === match.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {match.roundType}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {match.redAthleteName} vs {match.blueAthleteName}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        match.status === 'KẾT THÚC' || match.status === 'ENDED' || match.status === 'FINISHED'
                          ? 'bg-green-100 text-green-800'
                          : match.status === 'ĐANG ĐẤU' || match.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : match.status === 'CHỜ BẮT ĐẦU' || match.status === 'PENDING'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {match.status}
                      </span>
                      {selectedMatchId === match.id && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalMatches > pageSize && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalMatches}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                showPageSizeSelector={true}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            )}
          </>
        )}
      </div>

      {/* Assign Assessors */}
      {selectedMatchId && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Chỉ định giám định viên (5 giám định + 1 trọng tài máy)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Vị trí 1-5: Giám định | Vị trí 6: Trọng tài máy
          </p>
          
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((position) => {
                const assignment = assignments[position];
                const role = position === 6 ? 'JUDGER' : 'ASSESSOR';
                const isAutoJudge = position === 6;
                
                return (
                  <div key={position} className={`flex items-center gap-4 p-4 border rounded-lg ${isAutoJudge ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="w-20 text-sm font-medium">
                      Vị trí {position}:<br />
                      <span className="text-xs text-gray-500">
                        {isAutoJudge ? 'Trọng tài máy' : 'Giám định'}
                      </span>
                    </div>
                    
                    {assignment ? (
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {users.find(u => u.id === assignment.userId)?.fullName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {users.find(u => u.id === assignment.userId)?.personalMail || 
                             users.find(u => u.id === assignment.userId)?.eduMail || ''}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAssessor(position)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Xóa
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignUser(position, e.target.value, role);
                            }
                          }}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Chọn giám định --</option>
                          {users
                            .filter(user => {
                              // Only show users with TEACHER or EXECUTIVE_BOARD role
                              const hasValidRole = user.systemRole === 'TEACHER' || user.systemRole === 'EXECUTIVE_BOARD';
                              if (!hasValidRole) {
                                console.log('User filtered out - invalid role:', user.fullName, user.systemRole);
                                return false;
                              }
                              
                              // Don't show users already assigned
                              const alreadyAssigned = Object.values(assignments)
                                .some(a => a && a.userId === user.id);
                              if (alreadyAssigned) {
                                console.log('User filtered out - already assigned:', user.fullName);
                                return false;
                              }
                              
                              console.log('User available for selection:', user.fullName, user.systemRole);
                              return true;
                            })
                            .map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.fullName} ({user.personalMail || user.eduMail || 'No email'})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4 justify-end">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? 'Đang chỉ định...' : 'Chỉ định giám định'}
            </button>
          </div>
        </div>
      )}

      {/* Existing Assessors Info */}
      {selectedMatchId && existingAssessors.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Giám định hiện tại:</h3>
          <div className="space-y-1">
            {existingAssessors.map((a) => (
              <div key={a.id} className="text-sm text-blue-800">
                Vị trí {a.position}: {a.userFullName} ({a.role === 'JUDGER' ? 'Trọng tài' : 'Giám định'})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

