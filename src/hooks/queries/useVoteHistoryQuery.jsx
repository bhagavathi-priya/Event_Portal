import { useQuery } from '@tanstack/react-query';
import { managerApi } from '../../api/managerApi';

export const useVoteHistoryQuery = () => {
  return useQuery({
    queryKey: ['votes'],
    queryFn: () => managerApi.getVoteHistory(),
    refetchInterval: 3000,
  });
};
export default useVoteHistoryQuery;
