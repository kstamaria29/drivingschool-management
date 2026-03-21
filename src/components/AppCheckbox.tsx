import { Check } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Pressable, View, type PressableProps } from "react-native";

import { theme } from "../theme/theme";
import { cn } from "../utils/cn";

import { AppText } from "./AppText";

type BaseProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  labelClassName?: string;
};

type Props = BaseProps &
  Omit<PressableProps, "children" | "accessibilityRole" | "accessibilityState">;

function CheckboxContent({
  checked,
  label,
  labelClassName,
}: Pick<Props, "checked" | "label" | "labelClassName">) {
  const { colorScheme } = useColorScheme();
  const checkColor = theme.colors.primaryForeground;
  const uncheckedBorderColor =
    colorScheme === "dark" ? theme.colors.borderDark : theme.colors.borderLight;

  return (
    <>
      <View
        className={cn(
          "mt-0.5 h-6 w-6 items-center justify-center rounded-md border",
          checked
            ? "border-primary bg-primary dark:border-primaryDark dark:bg-primaryDark"
            : "bg-background dark:bg-backgroundDark",
        )}
        style={checked ? undefined : { borderColor: uncheckedBorderColor }}
      >
        {checked ? <Check size={16} color={checkColor} strokeWidth={3} /> : null}
      </View>
      <AppText className={cn("flex-1 leading-6", labelClassName)} variant="body">
        {label}
      </AppText>
    </>
  );
}

export function AppCheckbox({
  label,
  checked,
  disabled = false,
  readOnly = false,
  className,
  labelClassName,
  onPress,
  ...props
}: Props) {
  const disabledState = disabled || readOnly || !onPress;
  const sharedClassName = cn(
    "flex-row items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 dark:border-borderDark dark:bg-cardDark",
    !readOnly && !disabled && "active:opacity-80",
    disabled && "opacity-60",
    className,
  );

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: disabledState }}
      disabled={disabledState}
      className={sharedClassName}
      onPress={onPress}
      {...props}
    >
      <CheckboxContent checked={checked} label={label} labelClassName={labelClassName} />
    </Pressable>
  );
}
