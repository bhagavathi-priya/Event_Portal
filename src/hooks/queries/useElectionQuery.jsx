import { useQuery } from '@tanstack/react-query';
import { electionApi } from '../../api/electionApi';

export const useElectionQuery = (module = 'club', electionId = 'election-1') => {
  return useQuery({
    queryKey: ['election', electionId, module],
    queryFn: () => electionApi.getElection(electionId, module),
    refetchInterval: 3000,
  });
};
