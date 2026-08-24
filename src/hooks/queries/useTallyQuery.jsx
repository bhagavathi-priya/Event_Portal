import { useQuery } from '@tanstack/react-query';
import { managerApi } from '../../api/managerApi';

export const useTallyQuery = (electionId = 'election-1', module = 'club', isOpen = false) => {
  return useQuery({
    queryKey: ['tally', electionId, module],
    queryFn: () => managerApi.getLiveTally(electionId, module),
    // Poll the server every 3 seconds for updates
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });
};
