// lib/serverSettings.ts
type Settings = {
  agentOn: boolean;
  autoAssign: boolean;
};

const settings: Settings = {
  agentOn: false,
  autoAssign: false
};

export function getSettings(): Settings {
  return settings;
}

export function updateSettings(patch: Partial<Settings>) {
  Object.assign(settings, patch);
}