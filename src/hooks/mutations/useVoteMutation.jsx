import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voteApi } from '../../api/voteApi';

export const useVoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, candidateId }) => voteApi.castVote(categoryId, candidateId),
    onSuccess: () => {
      // Invalidate relevant queries so the UI updates
      queryClient.invalidateQueries({ queryKey: ['election'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['tally'] });
      queryClient.invalidateQueries({ queryKey: ['voterStatus'] });
      queryClient.invalidateQueries({ queryKey: ['votes'] });
    },
  });
};
