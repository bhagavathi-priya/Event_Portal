import { useQuery } from '@tanstack/react-query';
import { candidateApi } from '../../api/candidateApi';

export const useCandidatesQuery = (categoryId) => {
  return useQuery({
    queryKey: ['candidates', categoryId],
    queryFn: () => candidateApi.getCandidatesForCategory(categoryId),
    enabled: !!categoryId, // Only execute query if categoryId is provided
    refetchInterval: 3000,
  });
};
