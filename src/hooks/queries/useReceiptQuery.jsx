import { useQuery } from '@tanstack/react-query';
import { voteApi } from '../../api/voteApi';

export const useReceiptQuery = (receiptId) => {
  return useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: () => voteApi.getReceipt(receiptId),
    enabled: !!receiptId,
    refetchInterval: 3000,
  });
};
