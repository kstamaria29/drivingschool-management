import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAssessment,
  deleteAssessment,
  listAssessments,
  listRecentAssessments,
  type AssessmentInsert,
  type ListAssessmentsInput,
  type ListRecentAssessmentsInput,
} from "./api";
import { sendAssessmentEmail, type SendAssessmentEmailInput } from "./email-assessment";

export const assessmentKeys = {
  list: (input: ListAssessmentsInput) => ["assessments", input] as const,
  recent: (input: ListRecentAssessmentsInput) => ["assessments", "recent", input] as const,
};

export function useAssessmentsQuery(input: ListAssessmentsInput) {
  return useQuery({
    queryKey: assessmentKeys.list(input),
    queryFn: () => listAssessments(input),
  });
}

export function useRecentAssessmentsQuery(input: ListRecentAssessmentsInput) {
  return useQuery({
    queryKey: assessmentKeys.recent(input),
    queryFn: () => listRecentAssessments(input),
  });
}

export function useCreateAssessmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssessmentInsert) => createAssessment(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useDeleteAssessmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) => deleteAssessment(assessmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useSendAssessmentEmailMutation() {
  return useMutation({
    mutationFn: (input: SendAssessmentEmailInput) => sendAssessmentEmail(input),
  });
}
