import { useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '../../api/managerApi';

export const useElectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ electionId, status, module = 'club' }) => managerApi.toggleVotingStatus(electionId, status, module),
    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['election', variables.electionId, variables.module || 'club'] });
        queryClient.invalidateQueries({ queryKey: ['tally', variables.electionId, variables.module || 'club'] });
      }
    },
  });
};
