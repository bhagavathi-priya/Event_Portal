import { useQuery } from '@tanstack/react-query';
import { candidateApi } from '../../api/candidateApi';

export const useCandidateQuery = (candidateId) => {
  return useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => candidateApi.getCandidate(candidateId),
    enabled: !!candidateId,
    refetchInterval: 3000,
  });
};
