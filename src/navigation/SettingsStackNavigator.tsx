import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMemo } from "react";

import { useAppColorScheme } from "../providers/ColorSchemeProvider";

import { HeaderLeftMenuWithBack, HeaderRightAvatar } from "./components/HeaderButtons";
import { getNativeStackScreenOptions } from "./navigationTheme";
import { AddInstructorScreen } from "./screens/AddInstructorScreen";
import { ChangePasswordScreen } from "./screens/ChangePasswordScreen";
import { EditDetailsScreen } from "./screens/EditDetailsScreen";
import { EditOrganizationEmailScreen } from "./screens/EditOrganizationEmailScreen";
import { EditOrganizationNameScreen } from "./screens/EditOrganizationNameScreen";
import { EditRoleDisplayScreen } from "./screens/EditRoleDisplayScreen";
import { MemberProfileScreen } from "./screens/MemberProfileScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { ThemesScreen } from "./screens/ThemesScreen";
import { ViewMembersScreen } from "./screens/ViewMembersScreen";

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Notifications: undefined;
  Themes: undefined;
  EditDetails: undefined;
  ChangePassword: undefined;
  EditOrganizationName: undefined;
  EditOrganizationEmail: undefined;
  ViewMembers: undefined;
  MemberProfile: { memberId: string };
  EditRoleDisplay: undefined;
  AddInstructor: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  const { scheme, themeKey } = useAppColorScheme();
  const baseOptions = useMemo(() => getNativeStackScreenOptions(scheme), [scheme, themeKey]);

  return (
      <Stack.Navigator
        initialRouteName="SettingsMain"
        screenOptions={{
          ...baseOptions,
          headerTitle: "",
          headerLeft: () => <HeaderLeftMenuWithBack />,
        }}
      >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{
          headerTitle: "",
          headerRight: () => <HeaderRightAvatar />,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name="Themes"
        component={ThemesScreen}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name="EditDetails"
        component={EditDetailsScreen}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name="EditOrganizationName"
        component={EditOrganizationNameScreen}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name="EditOrganizationEmail"
        component={EditOrganizationEmailScreen}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name="ViewMembers"
        component={ViewMembersScreen}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name="MemberProfile"
        component={MemberProfileScreen}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name="EditRoleDisplay"
        component={EditRoleDisplayScreen}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name="AddInstructor"
        component={AddInstructorScreen}
        options={{ headerTitle: "" }}
      />
    </Stack.Navigator>
  );
}
