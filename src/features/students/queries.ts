import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { invalidateQueriesByKey } from "../../utils/query";
import {
  archiveStudent,
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  removeStudentLicenseImage,
  unarchiveStudent,
  uploadStudentLicenseImage,
  updateStudent,
  type ListStudentsInput,
  type RemoveStudentLicenseImageInput,
  type StudentInsert,
  type UploadStudentLicenseImageInput,
  type StudentUpdate,
} from "./api";

export const studentKeys = {
  list: (input: ListStudentsInput) => ["students", input] as const,
  detail: (studentId: string) => ["student", { studentId }] as const,
};

const studentsRootKey = ["students"] as const;

function invalidateStudentListAndDetail(
  queryClient: QueryClient,
  studentId: string,
) {
  return invalidateQueriesByKey(queryClient, [
    studentsRootKey,
    studentKeys.detail(studentId),
  ]);
}

export function useStudentsQuery(input: ListStudentsInput) {
  return useQuery({
    queryKey: studentKeys.list(input),
    queryFn: () => listStudents(input),
  });
}

export function useStudentQuery(studentId?: string) {
  return useQuery({
    queryKey: studentId
      ? studentKeys.detail(studentId)
      : (["student", { studentId: null }] as const),
    queryFn: () => getStudent(studentId!),
    enabled: !!studentId,
  });
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StudentInsert) => createStudent(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentsRootKey });
    },
  });
}

export function useUpdateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      input,
    }: {
      studentId: string;
      input: StudentUpdate;
    }) => updateStudent(studentId, input),
    onSuccess: async (student) => {
      await invalidateStudentListAndDetail(queryClient, student.id);
    },
  });
}

export function useArchiveStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => archiveStudent(studentId),
    onSuccess: async (student) => {
      await invalidateStudentListAndDetail(queryClient, student.id);
    },
  });
}

export function useUnarchiveStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => unarchiveStudent(studentId),
    onSuccess: async (student) => {
      await invalidateStudentListAndDetail(queryClient, student.id);
    },
  });
}

export function useDeleteStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => deleteStudent(studentId),
    onSuccess: async (_data, studentId) => {
      await Promise.all([
        invalidateStudentListAndDetail(queryClient, studentId),
        queryClient.invalidateQueries({ queryKey: ["assessments"] }),
        queryClient.invalidateQueries({ queryKey: ["studentSessions"] }),
        queryClient.invalidateQueries({ queryKey: ["studentReminders"] }),
        queryClient.invalidateQueries({ queryKey: ["lessons"] }),
        queryClient.invalidateQueries({ queryKey: ["map-pins"] }),
        queryClient.invalidateQueries({ queryKey: ["map-annotations"] }),
      ]);
    },
  });
}

export function useUploadStudentLicenseImageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadStudentLicenseImageInput) =>
      uploadStudentLicenseImage(input),
    onSuccess: async (student) => {
      await invalidateStudentListAndDetail(queryClient, student.id);
    },
  });
}

export function useRemoveStudentLicenseImageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RemoveStudentLicenseImageInput) =>
      removeStudentLicenseImage(input),
    onSuccess: async (student) => {
      await invalidateStudentListAndDetail(queryClient, student.id);
    },
  });
}
