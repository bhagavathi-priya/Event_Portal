import { useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '../../api/managerApi';

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryData) => managerApi.createCategory(categoryData),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['election'] });
      }
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, categoryData }) => managerApi.updateCategory(id, categoryData),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['election'] });
      }
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => managerApi.deleteCategory(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['election'] });
        queryClient.invalidateQueries({ queryKey: ['candidates'] });
      }
    },
  });
};
