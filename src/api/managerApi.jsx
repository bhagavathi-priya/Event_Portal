import axiosClient from './axiosClient';

export const managerApi = {
  createCandidate: (candidateData) => axiosClient.post('/api/manager/candidates', candidateData),
  updateCandidate: (id, candidateData) => axiosClient.patch(`/api/manager/candidates/${id}`, candidateData),
  deleteCandidate: (id) => axiosClient.delete(`/api/manager/candidates/${id}`),
  toggleVotingStatus: (electionId, status, module = 'club') => axiosClient.patch(`/api/manager/elections/${electionId}/status?module=${module}`, { status }),
  getLiveTally: (electionId, module = 'club') => axiosClient.get(`/api/manager/elections/${electionId}/tally?module=${module}`),
  getVoteHistory: () => axiosClient.get('/api/manager/votes'),
};
