import axiosClient from './axiosClient';

export const electionApi = {
  getElection: (id, module = 'club') => axiosClient.get(`/api/elections/${id}?module=${module}`),
};
