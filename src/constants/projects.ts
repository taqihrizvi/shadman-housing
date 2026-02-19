/**
 * Centralized project configuration
 * Single source of truth for all project-related data
 */

export enum ProjectName {
  SHADMAN_GREENS = "SHADMAN_GREENS"
}

// Project list for dropdowns (with "All Projects" option for filters)
export const PROJECTS = [ProjectName.SHADMAN_GREENS];

// Project list with "All Projects" filter option
export const PROJECTS_WITH_ALL = ["All Projects", ...PROJECTS];

// Project display names (for formatting without translation)
export const PROJECT_DISPLAY_NAMES: Record<ProjectName, string> = {
  [ProjectName.SHADMAN_GREENS]: "Shadman Greens"
};

// Translation keys for projects
export const PROJECT_TRANSLATION_KEYS: Record<ProjectName, string> = {
  [ProjectName.SHADMAN_GREENS]: "projects.shadmanGreens"
};

/**
 * Get display name for a project
 * @param project - Project enum value
 * @returns Formatted display name
 */
export function getProjectDisplayName(project: ProjectName | string): string {
  return PROJECT_DISPLAY_NAMES[project as ProjectName] || project;
}

/**
 * Get translation key for a project
 * @param project - Project enum value
 * @returns Translation key
 */
export function getProjectTranslationKey(project: ProjectName | string): string {
  return PROJECT_TRANSLATION_KEYS[project as ProjectName] || "";
}
