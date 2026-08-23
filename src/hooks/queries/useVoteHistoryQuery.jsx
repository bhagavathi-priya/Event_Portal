import { useQuery } from '@tanstack/react-query';
import { managerApi } from '../../api/managerApi';

export const useVoteHistoryQuery = () => {
  return useQuery({
    queryKey: ['votes'],
    queryFn: () => managerApi.getVoteHistory(),
  });
};
export default useVoteHistoryQuery;
