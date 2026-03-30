import type { ImageSourcePropType } from "react-native";

export const restrictedMockTestTaskItems = [
  { id: "observation", label: "Observation" },
  { id: "signalling", label: "Signalling" },
  { id: "gap", label: "Gap selection" },
  { id: "speed", label: "Speed choice" },
  { id: "following", label: "Following distance" },
  { id: "lateral", label: "Lateral position" },
  { id: "parkObs", label: "Parking observation" },
  { id: "parkMove", label: "Parking movement" },
  { id: "leavePark", label: "Leaving park" },
  { id: "turnMovement", label: "Turning movement (3pt turn)" },
] as const;

export type RestrictedMockTestTaskItemId = (typeof restrictedMockTestTaskItems)[number]["id"];

export const restrictedMockTestStages = [
  {
    id: "stage1",
    name: "Stage 1 - Basic Tasks(approx 10min)",
    note: "Screening stage in simpler traffic. If performance is clearly unsafe, don’t continue to Stage 2.",
    badge: "Screening stage",
    tasks: [
      { id: "s1_rt", name: "Right turn giving way", speed: "≤60", targetReps: 10 },
      { id: "s1_rtOncoming1", name: "Right turn across 1 lane oncoming", speed: "≤60", targetReps: 10 },
      { id: "s1_lt", name: "Left turn giving way", speed: "≤60", targetReps: 10 },
      { id: "s1_ltPrio", name: "Left turn with priority", speed: "≤60", targetReps: 10 },
      { id: "s1_lcr", name: "Lane change right", speed: "≤60", targetReps: 5 },
      { id: "s1_lcl", name: "Lane change left", speed: "≤60", targetReps: 5 },
      { id: "s1_rpp", name: "Reverse Parallel Park", speed: "Low / kerbside", targetReps: 3 },
      { id: "s1_extra", name: "Extra task/variation", speed: "Custom", targetReps: 5 },
    ],
  },
  {
    id: "stage2",
    name: "Stage 2 - Higher-Demand Tasks (approx 35min)",
    note: "Moderate to heavy traffic, wider range of turns, lane changes, merges, roundabouts and speeds.",
    badge: "Main assessment",
    tasks: [
      { id: "s2_rt1", name: "Right turn giving way (1 lane each way)", speed: "50–60", targetReps: 10 },
      { id: "s2_rt2", name: "Right turn giving way (2 lanes each way)", speed: "50–60", targetReps: 10 },
      { id: "s2_rtOncoming1", name: "Right turn across 1 lane oncoming", speed: "50–60", targetReps: 10 },
      { id: "s2_rtOncoming2", name: "Right turn across 2 lanes oncoming", speed: "50–60", targetReps: 10 },
      { id: "s2_lt1", name: "Left turn giving way (1 lane each way)", speed: "50–60", targetReps: 10 },
      { id: "s2_lt2", name: "Left turn giving way (2 lanes each way)", speed: "50–60", targetReps: 10 },
      { id: "s2_ltPrio", name: "Left turn with priority", speed: "50–60", targetReps: 10 },
      { id: "s2_lcr", name: "Lane change right", speed: "50–80", targetReps: 5 },
      { id: "s2_lcl", name: "Lane change left", speed: "50–80", targetReps: 5 },
      { id: "s2_lcrTurn", name: "Lane change right for upcoming turn", speed: "50–80", targetReps: 5 },
      { id: "s2_lclTurn", name: "Lane change left for upcoming turn", speed: "50–80", targetReps: 5 },
      { id: "s2_merge", name: "Merge lanes", speed: "70–100", targetReps: 6 },
      { id: "s2_stMed", name: "Straight drive - medium speed", speed: "60–80", targetReps: 4 },
      { id: "s2_stArt", name: "Straight drive - arterial road / 100-110", speed: "80–110", targetReps: 4 },
      { id: "s2_rbLeft", name: "Left turn at roundabout", speed: "Varies", targetReps: 4 },
      { id: "s2_rbRight", name: "Right turn at roundabout", speed: "Varies", targetReps: 4 },
      { id: "s2_rbStraight", name: "Straight through at roundabout", speed: "Varies", targetReps: 4 },
      { id: "s2_extra1", name: "Extra complex task / variation 1", speed: "Custom", targetReps: 5 },
      { id: "s2_extra2", name: "Extra complex task / variation 2", speed: "Custom", targetReps: 5 },
    ],
  },
] as const;

export type RestrictedMockTestStageId = (typeof restrictedMockTestStages)[number]["id"];
export type RestrictedMockTestTaskId = (typeof restrictedMockTestStages)[number]["tasks"][number]["id"];

export type RestrictedMockTestTaskMedia = {
  source: ImageSourcePropType;
  accessibilityLabel: string;
};

export const restrictedMockTestTaskMedia: Partial<Record<RestrictedMockTestTaskId, RestrictedMockTestTaskMedia>> = {
  s1_rt: {
    source: require("../../../../assets/mocktest-images/restricted/s1-rt-givingway.jpg"),
    accessibilityLabel:
      "Reference diagram for Stage 1 right turn giving way at a T intersection with stop control.",
  },
};

export const restrictedMockTestLegacyCriticalErrors = [
  "Too slow",
  "Too fast (minor)",
  "Failing to look",
  "Failing to signal",
  "Blocking pedestrian crossing",
  "Mounting kerb (single wheel, low risk)",
  "Stalling vehicle",
  "Incomplete stop at Stop sign",
  "Other illegal action",
] as const;

export const restrictedMockTestLegacyImmediateErrors = [
  "Testing officer / support person intervention",
  "Failing to carry out instruction",
  "Collision (kerb, object, vehicle, cyclist, pedestrian)",
  "Failing to give way (other road user takes evasive action)",
  "Excessive speed (≥5 km/h for 5+ sec, or ≥10 km/h)",
  "Stopping at dangerous position",
  "Failing to stop (Stop sign, red/yellow, rail)",
  "Other dangerous action",
] as const;

export type CategorizedSuggestion = {
  category: string;
  text: string;
};

export const restrictedMockTestTaskCriticalErrorSuggestions = [
  { category: "Kerb", text: "You must not mount the kerb when parking" },
  {
    category: "No signal",
    text: "Before diverging, you must signal your intention to move left or right for at least 3 seconds",
  },
  { category: "No signal", text: "You must signal for at least 3 seconds before leaving the kerb" },
  {
    category: "No signal",
    text: "You must signal for at least 3 seconds before pulling up to stop beside a vehicle",
  },
  { category: "No signal", text: "You must signal before changing lanes" },
  {
    category: "No look",
    text: "You must check your mirrors and do a head check when joining the traffic flow, merging or diverging",
  },
  {
    category: "Too slow",
    text: "Ensure you keep up to the posted speed limit so that surrounding traffic is not affected",
  },
  {
    category: "Too slow",
    text: "You must not remain stationary when you have ample opportunity to proceed safely",
  },
  { category: "Too fast", text: "Ensure you do not exceed the posted speed limit" },
  {
    category: "Too fast",
    text: "When passing a stopped marked School Bus, ensure you do not exceed 20 km/h",
  },
  {
    category: "Too fast",
    text: "When driving through a designated roadworks area, ensure you do not exceed the temporary speed limit",
  },
  {
    category: "Other illegal",
    text: "When turning, you must not drive partly or wholly on the wrong side of the road",
  },
  { category: "Other illegal", text: "You must position the vehicle entirely within the lane" },
] as const satisfies readonly CategorizedSuggestion[];

export const restrictedMockTestTaskImmediateFailureErrorSuggestions = [
  { category: "Excessive speed", text: "Ensure you do not exceed the posted speed limit" },
  {
    category: "Too fast",
    text: "When driving through a designated roadworks area, ensure you do not exceed the temporary speed limit",
  },
  {
    category: "Fail to give way",
    text: "You must obey the Give Way rules so as not to cause other road users to take evasive action to avoid a collision",
  },
] as const satisfies readonly CategorizedSuggestion[];

export const restrictedMockTestGeneralFeedbackSuggestions = [
  { category: "Gap selection", text: "You must choose the first safe gap available" },
  { category: "Observation", text: "Immediately prior to diverging, you must perform a head check" },
  { category: "Observation", text: "Immediately prior to merging, you must perform a head check" },
  { category: "Observation", text: "You must check your relevant mirrors before braking" },
  { category: "Observation", text: "You must check your mirrors before performing a manoeuvre" },
  { category: "Observation", text: "Before changing lanes, you must perform a head check" },
  {
    category: "Speed",
    text: "When safe to do so, you should try to maintain a consistent speed that is close to the posted speed limit",
  },
  {
    category: "Signal",
    text: "You must cancel the signal as necessary when your turn or diverge has completed",
  },
  { category: "Signal", text: "You must signal for at least 3 seconds before changing direction" },
  {
    category: "Signal",
    text: "You must signal for at least 3 seconds before pulling up beside a vehicle",
  },
  {
    category: "Parking movement",
    text: "You must be parallel to kerb and within 300mm when you have parked your vehicle",
  },
  {
    category: "Parking movement",
    text: "You must not hit or mount the kerb when reverse parallel parking",
  },
  {
    category: "Parking movement",
    text: "When you have completed parking, you must be between 1\u20132 metres from the vehicle in front",
  },
  {
    category: "Parking observation",
    text: "When reversing, you must do a head check immediately before moving off",
  },
  {
    category: "Lateral position",
    text: "You should turn from the correct position within your lane when turning",
  },
  { category: "Lateral position", text: "You must keep left of the centre line when turning" },
  { category: "Leaving park", text: "When reversing, you must do a head check immediately before moving off" },
  { category: "Other illegal", text: "You must position the vehicle entirely within the lane" },
] as const satisfies readonly CategorizedSuggestion[];

export const restrictedMockTestImprovementNeededSuggestions = [
  { category: "Observation", text: "Doing head checks" },
  { category: "Observation", text: "Using your mirrors" },
  { category: "Observation", text: "You must look out for conflicting traffic at all times" },
  {
    category: "Positioning the car",
    text: "You should keep to the left-hand side of the road when driving on an unmarked road, if it is safe to do so.",
  },
  { category: "Positioning the car", text: "When stopped" },
  {
    category: "Positioning the car",
    text: "When turning left, remain on the left-hand side of your lane. When turning right, stay on the right-hand side of your lane",
  },
  {
    category: "Positioning the car",
    text: "You should maintain a distance of 1.2 metres on either side of the vehicle",
  },
  { category: "Speed choice", text: "Choosing a safe, legal speed for the traffic conditions" },
  { category: "Gap selection", text: "Judging gaps in traffic" },
  {
    category: "Hazard Detection and Response",
    text: "You must be able to describe your actions in response to identified hazards when asked by the Driver Testing Officer",
  },
  { category: "Signalling", text: "When turning" },
  { category: "Signalling", text: "When diverging" },
  { category: "Vehicle control", text: "Braking" },
  { category: "Vehicle control", text: "Acceleration" },
  { category: "Vehicle control", text: "You should choose the correct gear for the right situation" },
  { category: "Vehicle control", text: "Steering" },
  { category: "Low speed manoeuvre", text: "Reverse parallel park" },
] as const satisfies readonly CategorizedSuggestion[];
