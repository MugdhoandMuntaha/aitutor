export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  category: "student" | "developer" | "both";
  icon: string;
  badge: string;
  features: string[];
}

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: "semester-setup",
    name: "Semester Setup",
    description: "Full academic tracking: Course schedules, credit hours, weighted syllabus, and CGPA calculator.",
    category: "student",
    icon: "GraduationCap",
    badge: "Academics",
    features: ["Course timetable", "Grade weights & CGPA", "Exam countdowns", "Syllabus topic mastery"],
  },
  {
    id: "sprint-planning",
    name: "Sprint Planning",
    description: "Agile developer workflow: Product backlog, 2-week active sprint, story points, and burndown chart.",
    category: "developer",
    icon: "GitBranch",
    badge: "Agile",
    features: ["Sprint cycles", "Story point estimation", "Burndown metrics", "Issue & PR tracker"],
  },
  {
    id: "final-year-project",
    name: "Final Year Project / Capstone",
    description: "Manage large-scale undergraduate thesis or capstone: Milestones, paper draft notes, lab experiments, and defense prep.",
    category: "both",
    icon: "FolderGit2",
    badge: "Capstone",
    features: ["Defense countdown", "Chapter notes & backlinks", "Advisor feedback tasks", "Architecture design"],
  },
  {
    id: "exam-prep-2-weeks",
    name: "Exam Prep (2 Weeks Sprint)",
    description: "Intensive 14-day study plan: SM-2 spaced repetition flashcards, topic revision checklist, and Pomodoro deep work.",
    category: "student",
    icon: "Brain",
    badge: "Intensive Study",
    features: ["Flashcard decks", "Spaced-repetition scheduling", "Topic mastery tracker", "Timed Pomodoro logs"],
  },
  {
    id: "open-source-contribution",
    name: "Open Source Contribution",
    description: "Streamline contributions to OSS repos: Good-first-issues, pull request reviews, automated CI checks, and release notes.",
    category: "developer",
    icon: "Code2",
    badge: "Open Source",
    features: ["GitHub PR linking", "Code review checklists", "Documentation tasks", "Release notes generator"],
  },
  {
    id: "job-internship-hunt",
    name: "Job & Internship Hunt",
    description: "SWE recruiting pipeline: Daily LeetCode/DSA habit tracker, resume iteration, system design topics, and interview stages.",
    category: "both",
    icon: "Briefcase",
    badge: "Career",
    features: ["DSA habit streak & heatmap", "Company application pipeline", "Behavioral viva prep", "Portfolio tasks"],
  },
  {
    id: "hackathon-weekend",
    name: "Hackathon Weekend (48h)",
    description: "High-velocity sprint: Brainstorming, MVP feature triage, live demo deployment, and pitch deck rehearsal.",
    category: "developer",
    icon: "Zap",
    badge: "Hackathon",
    features: ["48-hour deadline timer", "Urgent/Important Eisenhower matrix", "Demo deploy checklist", "Pitch deck review"],
  },
];
