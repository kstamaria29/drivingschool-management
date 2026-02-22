import { Pressable, View } from "react-native";
import { DrawerActions, type NavigationProp, type ParamListBase, useNavigation } from "@react-navigation/native";
import { ChevronLeft, Menu } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { Avatar } from "../../components/Avatar";
import { theme } from "../../theme/theme";
import { useCurrentUser } from "../../features/auth/current-user";
import { getProfileFullName } from "../../utils/profileName";
import { useNavigationLayout } from "../useNavigationLayout";

export function HeaderLeftHamburger() {
  const navigation = useNavigation();
  const { isSidebar, isTablet } = useNavigationLayout();
  const { colorScheme } = useColorScheme();

  if (isSidebar) return null;

  const isTabletPortrait = isTablet && !isSidebar;
  const buttonSize = isTabletPortrait ? 48 : 44;
  const iconColor = colorScheme === "dark" ? theme.colors.mutedDark : theme.colors.mutedLight;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      hitSlop={10}
    >
      <View
        className="items-center justify-center rounded-xl border border-border bg-card dark:border-borderDark dark:bg-cardDark"
        style={{ height: buttonSize, width: buttonSize }}
      >
        <Menu color={iconColor} size={isTabletPortrait ? 26 : 24} />
      </View>
    </Pressable>
  );
}

type HeaderLeftMenuWithBackProps = {
  showBack?: boolean;
};

export function HeaderLeftMenuWithBack({ showBack = true }: HeaderLeftMenuWithBackProps) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { isSidebar, isTablet } = useNavigationLayout();
  const { colorScheme } = useColorScheme();
  const canGoBack = navigation.canGoBack();
  const isTabletPortrait = isTablet && !isSidebar;
  const buttonSize = isTabletPortrait ? 48 : 44;
  const iconSize = isTabletPortrait ? 26 : 24;
  const iconColor = colorScheme === "dark" ? theme.colors.mutedDark : theme.colors.mutedLight;

  function onBackPress() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const parentNavigation = navigation.getParent<NavigationProp<ParamListBase>>();
    parentNavigation?.navigate("Home", { screen: "HomeDashboard" });
  }

  const showHamburger = !isSidebar && !canGoBack;
  const showBackButton = showBack && canGoBack;

  if (!showHamburger && !showBackButton) return null;

  return (
    <View className="flex-row items-center gap-2">
      {showHamburger ? <HeaderLeftHamburger /> : null}
      {showBackButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBackPress}
          hitSlop={10}
        >
          <View
            className="items-center justify-center rounded-xl border border-border bg-card dark:border-borderDark dark:bg-cardDark"
            style={{ height: buttonSize, width: buttonSize }}
          >
            <ChevronLeft color={iconColor} size={iconSize} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

export function HeaderRightAvatar() {
  const navigation = useNavigation();
  const { profile } = useCurrentUser();
  const { isSidebar, isTablet } = useNavigationLayout();
  const isTabletPortrait = isTablet && !isSidebar;
  const avatarSize = isTabletPortrait ? 48 : 44;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      onPress={() => navigation.getParent()?.navigate("Settings")}
      hitSlop={10}
    >
      <Avatar uri={profile.avatar_url} size={avatarSize} label={getProfileFullName(profile)} />
    </Pressable>
  );
}
