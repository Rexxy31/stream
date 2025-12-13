// API Types matching backend DTOs

export interface User {
    id: string;
    email: string;
    name: string;
    profilePicture: string | null;
    authProvider: 'LOCAL' | 'GOOGLE';
    roles: ('USER' | 'ADMIN')[];
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    userId: string;
    email: string;
    name: string;
    profilePicture: string | null;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    category: string;
    createDate: string;
}

export interface Module {
    id: string;
    courseId: string;
    title: string;
    duration: string | null;
    orderIndex: number | null;
}

export interface LessonGroup {
    id: string;
    moduleId: string;
    title: string;
    orderIndex: number | null;
}

export interface Lesson {
    id: string;
    lessonGroupId: string;
    title: string;
    duration: string | null;
    resourcePath: string | null;
    orderIndex: number | null;
}

// Hierarchy DTOs
export interface LessonHierarchy {
    id: string;
    title: string;
    duration: string | null;
    description?: string;
    resourcePath: string | null;
}

export interface LessonGroupHierarchy {
    id: string;
    title: string;
    duration: string | null;
    lessons: LessonHierarchy[];
}

export interface ModuleHierarchy {
    id: string;
    title: string;
    duration: string | null;
    lessonGroups: LessonGroupHierarchy[];
}

export interface CourseHierarchy {
    id: string;
    title: string;
    description: string;
    category: string;
    duration: string | null;
    createdAt: string;
    modules: ModuleHierarchy[];
}

// Progress
export interface Progress {
    id: string;
    lessonId: string;
    lessonTitle: string;
    watchedSeconds: number;
    totalDurationSeconds: number | null;
    completed: boolean;
    lastWatchedAt: string | null;
    completedAt: string | null;
}

// Enrollment
export interface Enrollment {
    id: string;
    courseId: string;
    courseTitle: string;
    courseDescription?: string;
    courseCategory?: string;
    status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
    enrolledAt: string;
    completedAt: string | null;
}

// Search
export interface SearchResult {
    courses: { id: string; title: string; description: string; category: string }[];
    modules: { id: string; title: string; courseId: string; courseTitle: string }[];
    lessons: { id: string; title: string; lessonGroupId: string; lessonGroupTitle: string; moduleTitle: string; courseTitle: string }[];
    totalResults: number;
}
