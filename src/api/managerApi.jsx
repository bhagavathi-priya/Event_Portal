import axiosClient from './axiosClient';

export const managerApi = {
  createCandidate: (candidateData) => axiosClient.post('/api/manager/candidates', candidateData),
  updateCandidate: (id, candidateData) => axiosClient.patch(`/api/manager/candidates/${id}`, candidateData),
  deleteCandidate: (id) => axiosClient.delete(`/api/manager/candidates/${id}`),
  toggleVotingStatus: (electionId, status) => axiosClient.patch(`/api/manager/elections/${electionId}/status`, { status }),
  getLiveTally: (electionId) => axiosClient.get(`/api/manager/elections/${electionId}/tally`),
  getVoteHistory: () => axiosClient.get('/api/manager/votes'),
};
