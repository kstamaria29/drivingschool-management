import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { User } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { AppStack } from "../../components/AppStack";
import { AppText, type AppTextVariant } from "../../components/AppText";
import type { Student } from "../../features/students/api";
import { useThemeFonts } from "../../providers/ThemeFontsProvider";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";

type Props = {
  students: Student[];
  selectedStudentId: string | null;
  currentUserId: string;
  onSelectStudent: (student: Student) => void;
  disabled?: boolean;
  error?: string;
  selectedStudentNameVariant?: AppTextVariant;
  selectedStudentNameClassName?: string;
};

const MAX_VISIBLE_STUDENT_ROWS = 6;
const STUDENT_ROW_HEIGHT = 52;

function fullNameOf(student: Student) {
  return `${student.first_name} ${student.last_name}`.trim() || "Student";
}

function sortStudentsWithOwnFirst(students: Student[], currentUserId: string) {
  return [...students].sort((a, b) => {
    const aRank = a.assigned_instructor_id === currentUserId ? 0 : 1;
    const bRank = b.assigned_instructor_id === currentUserId ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;

    const aLast = (a.last_name ?? "").trim();
    const bLast = (b.last_name ?? "").trim();
    const byLast = aLast.localeCompare(bLast, undefined, { sensitivity: "base" });
    if (byLast !== 0) return byLast;

    return (a.first_name ?? "").trim().localeCompare((b.first_name ?? "").trim(), undefined, {
      sensitivity: "base",
    });
  });
}

export function AssessmentStudentDropdown({
  students,
  selectedStudentId,
  currentUserId,
  onSelectStudent,
  disabled = false,
  error,
  selectedStudentNameVariant = "body",
  selectedStudentNameClassName,
}: Props) {
  const { colorScheme } = useColorScheme();
  const { fonts } = useThemeFonts();
  const [search, setSearch] = useState("");
  const [isChangingStudent, setIsChangingStudent] = useState(() => !selectedStudentId);
  const searchInputRef = useRef<TextInput | null>(null);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [selectedStudentId, students],
  );

  useEffect(() => {
    if (selectedStudentId) {
      setIsChangingStudent(false);
      setSearch("");
      return;
    }
    setIsChangingStudent(true);
  }, [selectedStudentId]);

  const sortedStudents = useMemo(
    () => sortStudentsWithOwnFirst(students, currentUserId),
    [currentUserId, students],
  );

  const filteredStudents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return [];
    return sortedStudents.filter((student) => {
      const haystack = [
        student.first_name,
        student.last_name,
        student.email ?? "",
        student.phone ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [search, sortedStudents]);
  const hasSearchInput = search.trim().length > 0;

  const iconColor = colorScheme === "dark" ? theme.colors.mutedDark : theme.colors.mutedLight;

  useEffect(() => {
    if (!isChangingStudent) return;
    const handle = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(handle);
  }, [isChangingStudent]);

  function onSelect(student: Student) {
    setIsChangingStudent(false);
    setSearch("");
    onSelectStudent(student);
  }

  return (
    <AppStack gap="sm">
      {error ? <AppText variant="error">{error}</AppText> : null}

      <View
        accessibilityLabel={
          selectedStudent
            ? `Selected student ${fullNameOf(selectedStudent)}`
            : "Select student"
        }
        className={cn(
          "rounded-xl border border-border bg-background px-3 py-3 dark:border-borderDark dark:bg-backgroundDark",
          disabled && "opacity-60",
        )}
      >
        <AppText variant="label">Select student</AppText>

        {selectedStudent && !isChangingStudent ? (
          <View className="mt-1 flex-row items-center justify-between gap-3">
            <AppText
              className={cn("flex-1", selectedStudentNameClassName)}
              variant={selectedStudentNameVariant}
            >
              {fullNameOf(selectedStudent)}
            </AppText>
            {selectedStudentId && !disabled ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setIsChangingStudent(true);
                  setSearch("");
                }}
              >
                <AppText className="!text-blue-600 dark:!text-blue-400" variant="button">
                  Change student
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <TextInput
            ref={searchInputRef}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled}
            value={search}
            onChangeText={setSearch}
            placeholder="Name, email, or phone"
            placeholderTextColor={iconColor}
            className={cn(theme.input.base, error && theme.input.error)}
            style={[{ fontFamily: fonts.regular }, { paddingVertical: 0, textAlignVertical: "center" }]}
          />
        )}

        {isChangingStudent ? (
          !hasSearchInput ? (
            <AppText className="mt-3" variant="caption">
              Start typing to search students.
            </AppText>
          ) : filteredStudents.length === 0 ? (
            <AppText className="mt-3" variant="caption">
              No students match this search.
            </AppText>
          ) : (
            <ScrollView
              className="mt-3"
              style={{ maxHeight: MAX_VISIBLE_STUDENT_ROWS * STUDENT_ROW_HEIGHT }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <AppStack gap="sm">
                {filteredStudents.map((student) => {
                  const isSelected = student.id === selectedStudentId;
                  return (
                    <Pressable
                      key={student.id}
                      accessibilityRole="button"
                      className={cn(
                        "mt-1 flex-row items-center justify-between rounded-lg border px-3 py-3",
                        isSelected
                          ? "border-primary bg-primary/10 dark:border-primaryDark dark:bg-primaryDark/20"
                          : "border-border bg-background dark:border-borderDark dark:bg-backgroundDark",
                      )}
                      onPress={() => onSelect(student)}
                    >
                      <AppText variant="body">{fullNameOf(student)}</AppText>
                      <User size={16} color={iconColor} />
                    </Pressable>
                  );
                })}
              </AppStack>
            </ScrollView>
          )
        ) : null}
      </View>
    </AppStack>
  );
}
