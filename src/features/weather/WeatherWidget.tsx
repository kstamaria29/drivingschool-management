import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import * as Location from "expo-location";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  LocateFixed,
  MapPin,
  RefreshCw,
  Sun,
  Wind,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { AppStack } from "../../components/AppStack";
import { AppText } from "../../components/AppText";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";
import { toErrorMessage } from "../../utils/errors";

import { describeWeatherCode } from "./api";
import { useOpenMeteoForecastQuery } from "./queries";

const DEFAULT_NZ_COORDS = { latitude: -36.8485, longitude: 174.7633, label: "Auckland" };

type Coords = { latitude: number; longitude: number; source: "default" | "device" };

function formatTemp(value: number) {
  const rounded = Math.round(value);
  return `${rounded}°C`;
}

type AdvisoryTone = "good" | "caution" | "avoid";

function getDrivingAdvisory(input: {
  weatherCode: number;
  windSpeedKph: number;
  precipitationProbabilityPercent: number | null;
}): { tone: AdvisoryTone; title: string; message: string } {
  const { weatherCode, windSpeedKph, precipitationProbabilityPercent } = input;

  const precipLikely =
    typeof precipitationProbabilityPercent === "number" && precipitationProbabilityPercent >= 60;
  const veryWindy = windSpeedKph >= 45;

  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    return {
      tone: "avoid",
      title: "Not recommended",
      message: "Thunderstorms increase risk. Consider postponing lessons and avoid exposed routes.",
    };
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return {
      tone: "caution",
      title: "Low visibility",
      message: "Fog reduces visibility. Use dipped headlights, slow down, and increase following distance.",
    };
  }

  if (weatherCode >= 71 && weatherCode <= 86) {
    return {
      tone: "avoid",
      title: "Not recommended",
      message: "Snow/ice conditions are unsafe for lessons. Reschedule if possible.",
    };
  }

  if (
    (weatherCode >= 51 && weatherCode <= 57) ||
    (weatherCode >= 61 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82)
  ) {
    return {
      tone: precipLikely || veryWindy ? "avoid" : "caution",
      title: precipLikely || veryWindy ? "Not ideal" : "Use caution",
      message: "Wet roads increase stopping distance. Drive smoothly, reduce speed, and keep extra space.",
    };
  }

  if (veryWindy) {
    return {
      tone: "caution",
      title: "Gusty",
      message: "Strong winds can affect steering and cyclists. Keep both hands on the wheel and allow extra room.",
    };
  }

  if (weatherCode === 0 || weatherCode === 1 || weatherCode === 2) {
    return {
      tone: "good",
      title: "Good conditions",
      message: "Great for lessons. Watch for sun glare and keep scanning for hazards.",
    };
  }

  return {
    tone: "good",
    title: "OK conditions",
    message: "Stay alert and keep a safe following distance.",
  };
}

function WeatherIcon({
  code,
  size,
  color,
  strokeWidth = 2,
}: {
  code: number;
  size: number;
  color: string;
  strokeWidth?: number;
}) {
  if (code === 0) return <Sun size={size} color={color} strokeWidth={strokeWidth} />;
  if (code === 1 || code === 2)
    return <CloudSun size={size} color={color} strokeWidth={strokeWidth} />;
  if (code === 3) return <Cloud size={size} color={color} strokeWidth={strokeWidth} />;
  if (code === 45 || code === 48)
    return <CloudFog size={size} color={color} strokeWidth={strokeWidth} />;
  if (code >= 51 && code <= 57)
    return <CloudDrizzle size={size} color={color} strokeWidth={strokeWidth} />;
  if (code >= 61 && code <= 67)
    return <CloudRain size={size} color={color} strokeWidth={strokeWidth} />;
  if (code >= 71 && code <= 77)
    return <CloudSnow size={size} color={color} strokeWidth={strokeWidth} />;
  if (code >= 80 && code <= 82)
    return <CloudRain size={size} color={color} strokeWidth={strokeWidth} />;
  if (code === 85 || code === 86)
    return <CloudSnow size={size} color={color} strokeWidth={strokeWidth} />;
  if (code === 95 || code === 96 || code === 99)
    return <CloudLightning size={size} color={color} strokeWidth={strokeWidth} />;
  return <Cloud size={size} color={color} strokeWidth={strokeWidth} />;
}

function isShowersCode(code: number) {
  return code >= 80 && code <= 82;
}

function isThunderstormCode(code: number) {
  return code === 95 || code === 96 || code === 99;
}

function getForecastBorderClassName(code: number) {
  if (isThunderstormCode(code)) return "!border-red-600 dark:!border-red-500";
  if (isShowersCode(code)) return "!border-amber-700 dark:!border-amber-500";
  return "";
}

function getWeatherIconColor(code: number, colorScheme: "light" | "dark" | undefined) {
  const isDark = colorScheme === "dark";

  if (isThunderstormCode(code)) return isDark ? "#f87171" : "#dc2626";
  if (isShowersCode(code) || (code >= 51 && code <= 57) || (code >= 61 && code <= 67))
    return isDark ? "#60a5fa" : "#2563eb";
  if (code === 85 || code === 86 || (code >= 71 && code <= 77)) return isDark ? "#67e8f9" : "#0891b2";
  if (code === 0 || code === 1 || code === 2) return isDark ? "#fbbf24" : "#d97706";
  if (code === 45 || code === 48) return isDark ? "#c4b5fd" : "#6d28d9";
  if (code === 3) return isDark ? "#cbd5e1" : "#64748b";

  return isDark ? theme.colors.mutedDark : theme.colors.mutedLight;
}

export function WeatherWidget() {
  const { colorScheme } = useColorScheme();
  const [coords, setCoords] = useState<Coords>({
    latitude: DEFAULT_NZ_COORDS.latitude,
    longitude: DEFAULT_NZ_COORDS.longitude,
    source: "default",
  });
  const [place, setPlace] = useState<string>(DEFAULT_NZ_COORDS.label);
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied">(
    "unknown",
  );

  const query = useOpenMeteoForecastQuery({
    latitude: coords.latitude,
    longitude: coords.longitude,
    timezone: "Pacific/Auckland",
    days: 5,
    enabled: true,
  });

  async function syncDeviceLocation({ request }: { request: boolean }) {
    try {
      const permissions = request
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();

      if (!permissions.granted) {
        setPermissionStatus("denied");
        setCoords((prev) => ({ ...prev, source: "default" }));
        setPlace(DEFAULT_NZ_COORDS.label);
        return;
      }

      setPermissionStatus("granted");

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: "device" as const,
      };
      setCoords(nextCoords);

      const reversed = await Location.reverseGeocodeAsync({
        latitude: nextCoords.latitude,
        longitude: nextCoords.longitude,
      });
      const first = reversed[0] ?? null;
      const city = first?.city || first?.subregion || first?.region || "";
      const region = first?.region || "";
      const country = first?.country || "";
      const label = [city, region].filter(Boolean).join(", ").trim();

      if (country && country !== "New Zealand") {
        setPlace(label || country);
        return;
      }

      setPlace(label || DEFAULT_NZ_COORDS.label);
    } catch (error) {
      if (request) {
        Alert.alert("Couldn't get location", toErrorMessage(error));
      }
      setPermissionStatus("denied");
    }
  }

  useEffect(() => {
    void syncDeviceLocation({ request: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forecast = query.data ?? null;
  const nextFourDays = useMemo(() => {
    if (!forecast) return [];
    return forecast.days.slice(1, 5);
  }, [forecast]);

  const currentText = useMemo(() => {
    if (!forecast) return null;
    const description = describeWeatherCode(forecast.current.weatherCode);
    return `${formatTemp(forecast.current.temperatureC)} • ${description}`;
  }, [forecast]);

  const updatedAtText = useMemo(() => {
    if (!forecast?.current.timeISO) return null;
    return `Updated ${dayjs(forecast.current.timeISO).format("h:mm A")}`;
  }, [forecast?.current.timeISO]);

  const nextFiveHours = useMemo(() => {
    if (!forecast) return [];
    const now = dayjs();
    const start = now.startOf("hour").valueOf();

    const upcoming = forecast.hourly
      .map((hour) => ({ ...hour, timeMs: dayjs(hour.timeISO).valueOf() }))
      .filter((hour) => Number.isFinite(hour.timeMs) && hour.timeMs >= start)
      .sort((a, b) => a.timeMs - b.timeMs);

    return upcoming.slice(0, 5);
  }, [forecast]);

  const advisory = useMemo(() => {
    if (!forecast) return null;
    const nextHourPrecip =
      typeof nextFiveHours[0]?.precipitationProbabilityPercent === "number"
        ? nextFiveHours[0].precipitationProbabilityPercent
        : null;

    return getDrivingAdvisory({
      weatherCode: forecast.current.weatherCode,
      windSpeedKph: forecast.current.windSpeedKph,
      precipitationProbabilityPercent: nextHourPrecip,
    });
  }, [forecast, nextFiveHours]);

  const iconMuted = colorScheme === "dark" ? theme.colors.mutedDark : theme.colors.mutedLight;
  const iconAccent = getWeatherIconColor(forecast?.current.weatherCode ?? 0, colorScheme);

  const subtitle = useMemo(() => {
    const usingLocation = coords.source === "device";
    if (usingLocation) return `Now in ${place}`;
    if (permissionStatus === "denied") {
      return `Using ${DEFAULT_NZ_COORDS.label} (enable location for local weather)`;
    }
    return `Using ${DEFAULT_NZ_COORDS.label}`;
  }, [coords.source, permissionStatus, place]);

  return (
    <AppStack gap="md">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <AppText variant="heading">Weather</AppText>
          <AppText className="mt-1" variant="caption">
            {subtitle}
          </AppText>
        </View>

        <View className="flex-row gap-2">
          <AppButton
            width="auto"
            variant="secondary"
            label=""
            icon={RefreshCw}
            accessibilityLabel={query.isFetching ? "Refreshing weather" : "Refresh weather"}
            disabled={query.isFetching}
            onPress={() => query.refetch()}
          />
          <AppButton
            width="auto"
            variant="secondary"
            label=""
            icon={LocateFixed}
            accessibilityLabel="Use my location"
            onPress={() => void syncDeviceLocation({ request: true })}
          />
        </View>
      </View>

      {query.isPending ? (
        <View className={cn("items-center justify-center py-10", theme.text.base)}>
          <ActivityIndicator />
          <AppText className="mt-3 text-center" variant="body">
            Loading weather...
          </AppText>
        </View>
      ) : query.isError ? (
        <AppCard className="gap-2">
          <AppText variant="heading">Couldn't load weather</AppText>
          <AppText variant="body">{toErrorMessage(query.error)}</AppText>
          <AppButton width="auto" label="Retry" variant="secondary" icon={RefreshCw} onPress={() => query.refetch()} />
        </AppCard>
      ) : !forecast ? (
        <AppCard className="gap-2">
          <AppText variant="heading">Weather unavailable</AppText>
          <AppText variant="body">Try again in a moment.</AppText>
        </AppCard>
      ) : (
        <View className="flex-row flex-wrap items-stretch gap-3">
          <AppCard className="flex-1 min-w-64 self-stretch gap-3">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <View className="flex-row items-center justify-between gap-3">
                  <AppText variant="heading">Right now</AppText>
                  {coords.source === "device" ? <MapPin size={18} color={iconMuted} /> : null}
                </View>

                {updatedAtText ? (
                  <AppText className="mt-1" variant="caption">
                    {updatedAtText}
                  </AppText>
                ) : null}

                <AppText className="mt-2" variant="body">
                  {currentText}
                </AppText>
                <View className="mt-2 flex-row items-center gap-2">
                  <Wind size={16} color={iconMuted} />
                  <AppText variant="caption">
                    Wind: {Math.round(forecast.current.windSpeedKph)} km/h
                  </AppText>
                </View>
              </View>

              <View className="h-20 w-20 items-center justify-center">
                <WeatherIcon
                  code={forecast.current.weatherCode}
                  size={56}
                  color={iconAccent}
                  strokeWidth={1.5}
                />
              </View>
            </View>

            {advisory ? (
              <View
                className={cn(
                  "rounded-xl border px-3 py-2",
                  advisory.tone === "good" && "border-emerald-500/30 bg-emerald-500/10",
                  advisory.tone === "caution" && "border-amber-500/30 bg-amber-500/10",
                  advisory.tone === "avoid" && "border-red-500/30 bg-red-500/10",
                )}
              >
                <AppText variant="label">{advisory.title}</AppText>
                <AppText className="mt-1" variant="caption">
                  {advisory.message}
                </AppText>
              </View>
            ) : null}

            {nextFiveHours.length > 0 ? (
              <View className="gap-2">
                <AppText variant="label">Next 5 hours</AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                >
                  <View className="flex-row gap-2">
                    {nextFiveHours.map((hour) => (
                      <View
                        key={hour.timeISO}
                        className={cn(
                          "w-24 rounded-xl border border-border bg-background px-3 py-2 dark:border-borderDark dark:bg-backgroundDark",
                          getForecastBorderClassName(hour.weatherCode),
                        )}
                      >
                        <AppText variant="caption">{dayjs(hour.timeISO).format("h A")}</AppText>
                        <View className="mt-2 flex-row items-center justify-between">
                          <WeatherIcon
                            code={hour.weatherCode}
                            size={18}
                            color={getWeatherIconColor(hour.weatherCode, colorScheme)}
                          />
                          <AppText variant="body">{formatTemp(hour.temperatureC)}</AppText>
                        </View>
                        {typeof hour.precipitationProbabilityPercent === "number" ? (
                          <AppText className="mt-1" variant="caption">
                            {hour.precipitationProbabilityPercent}% rain
                          </AppText>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : null}
          </AppCard>

          <AppCard className="flex-1 min-w-64 self-stretch gap-2">
            <AppText variant="heading">Next 4 days</AppText>
            {nextFourDays.length === 0 ? (
              <AppText variant="body">Forecast unavailable.</AppText>
            ) : (
              <AppStack gap="sm">
                {nextFourDays.map((day) => (
                  <View
                    key={day.dateISO}
                    className={cn(
                      "flex-row items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 dark:border-borderDark dark:bg-backgroundDark",
                      getForecastBorderClassName(day.weatherCode),
                    )}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <WeatherIcon
                          code={day.weatherCode}
                          size={18}
                          color={getWeatherIconColor(day.weatherCode, colorScheme)}
                        />
                        <AppText variant="body">{dayjs(day.dateISO).format("ddd")}</AppText>
                      </View>
                      <AppText variant="caption">{describeWeatherCode(day.weatherCode)}</AppText>
                    </View>
                    <AppText variant="body">
                      {formatTemp(day.maxC)} / {formatTemp(day.minC)}
                    </AppText>
                  </View>
                ))}
              </AppStack>
            )}
          </AppCard>
        </View>
      )}
    </AppStack>
  );
}
