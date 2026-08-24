import { useQuery } from '@tanstack/react-query';
import { voteApi } from '../../api/voteApi';

export const useVoterStatusQuery = (role, studentId) => {
  return useQuery({
    queryKey: ['voterStatus', studentId],
    queryFn: () => voteApi.getVoterStatus(),
    enabled: role === 'student' && !!studentId,
    refetchInterval: 3000,
  });
};
