import type { HskLevel, ScenarioId } from "./types";

export interface Scenario {
  id: ScenarioId;
  label: string;
  labelZh: string;
  description: string;
  // Given to the model as its role and setting.
  roleBrief: string;
}

export const SCENARIOS: readonly Scenario[] = [
  {
    id: "free-chat",
    label: "Free chat",
    labelZh: "自由聊天",
    description: "Talk about anything you like.",
    roleBrief:
      "You are a friendly Chinese friend having a relaxed chat. Follow the learner's interests; if they have none, ask about their day, hobbies, or plans.",
  },
  {
    id: "ordering-food",
    label: "Ordering food",
    labelZh: "点菜",
    description: "Order a meal at a restaurant.",
    roleBrief:
      "You are a waiter or waitress at a Chinese restaurant. Greet the learner, help them order dishes and drinks, and handle the bill.",
  },
  {
    id: "introducing-yourself",
    label: "Introducing yourself",
    labelZh: "自我介绍",
    description: "Meet someone new.",
    roleBrief:
      "You are a friendly person meeting the learner for the first time. Ask their name, where they are from, what they do, and what they like.",
  },
  {
    id: "travel",
    label: "Travel",
    labelZh: "旅行",
    description: "Directions, hotels, tickets.",
    roleBrief:
      "You are a helpful local in a Chinese city (or a hotel or station clerk). Help the learner with directions, tickets, or booking a room.",
  },
  {
    id: "shopping",
    label: "Shopping",
    labelZh: "购物",
    description: "Buy things and bargain.",
    roleBrief:
      "You are a shopkeeper. Help the learner find things, talk about size, colour and price, and bargain politely.",
  },
  {
    id: "work-small-talk",
    label: "Work small talk",
    labelZh: "工作闲聊",
    description: "Chat with a colleague.",
    roleBrief:
      "You are a friendly colleague at a Chinese company. Make small talk about work, the weekend, lunch, and plans.",
  },
  {
    id: "job-interview",
    label: "Job interview",
    labelZh: "面试",
    description: "Answer interview questions.",
    roleBrief:
      "You are an interviewer at a Chinese company. Ask the learner about their background, strengths, and why they want the job, one question at a time.",
  },
];

export const HSK_LEVELS: readonly { level: HskLevel; hint: string }[] = [
  { level: 1, hint: "Absolute beginner: about 150 words" },
  { level: 2, hint: "Basic phrases: about 300 words" },
  { level: 3, hint: "Everyday topics: about 600 words" },
  { level: 4, hint: "Comfortable conversation: about 1,200 words" },
  { level: 5, hint: "Fluent on most topics: about 2,500 words" },
  { level: 6, hint: "Advanced: about 5,000 words" },
];

export const DEFAULT_SCENARIO: ScenarioId = "free-chat";
export const DEFAULT_LEVEL: HskLevel = 2;

export function isScenarioId(value: unknown): value is ScenarioId {
  return SCENARIOS.some((s) => s.id === value);
}

export function isHskLevel(value: unknown): value is HskLevel {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 6
  );
}

export function getScenario(id: ScenarioId): Scenario {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}
