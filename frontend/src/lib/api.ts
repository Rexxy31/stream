const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('token', token);
            } else {
                localStorage.removeItem('token');
            }
        }
    }

    getToken(): string | null {
        if (this.token) return this.token;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    // Generic Methods
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint);
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: HeadersInit = {
            ...options.headers,
        };

        if (!(options.body instanceof FormData)) {
            (headers as Record<string, string>)['Content-Type'] = 'application/json';
        }

        const token = this.getToken();
        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `HTTP ${response.status}`);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return response.json();
    }

    // Auth
    async register(email: string, password: string, name: string) {
        return this.request<{ token: string; userId: string; email: string; name: string; profilePicture: string | null }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
    }

    async login(email: string, password: string) {
        return this.request<{ token: string; userId: string; email: string; name: string; profilePicture: string | null }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getMe() {
        return this.request<{ id: string; email: string; name: string; profilePicture: string | null; authProvider: string; roles: string[]; createdAt: string }>('/api/auth/me');
    }

    // Admin Content Updates
    async updateCourse(id: string, data: { title?: string; description?: string; category?: string }) {
        return this.request<import('@/types').Course>(`/api/admin/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async updateModule(id: string, data: { title?: string; orderIndex?: number }) {
        return this.request<import('@/types').Module>(`/api/admin/modules/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async updateLesson(id: string, data: { title?: string; description?: string; videoKey?: string; orderIndex?: number }) {
        return this.request<import('@/types').Lesson>(`/api/admin/lessons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Courses
    async getCourses() {
        return this.request<{ id: string; title: string; description: string; category: string; createDate: string }[]>('/api/courses');
    }

    async getCourseHierarchy(courseId: string) {
        return this.request<import('@/types').CourseHierarchy>(`/api/streaming/courses/${courseId}/hierarchy`);
    }

    // Search
    async search(query: string) {
        return this.request<import('@/types').SearchResult>(`/api/search?q=${encodeURIComponent(query)}`);
    }

    // Progress
    async updateProgress(lessonId: string, watchedSeconds: number, completed: boolean = false) {
        return this.request<{ id: string; lessonId: string; watchedSeconds: number; completed: boolean }>('/api/progress', {
            method: 'POST',
            body: JSON.stringify({ lessonId, watchedSeconds, completed }),
        });
    }

    async getProgressForLesson(lessonId: string) {
        return this.request<{ lessonId: string; watchedSeconds: number; completed: boolean }>(`/api/progress/lesson/${lessonId}`);
    }

    async markLessonComplete(lessonId: string) {
        return this.request<{ lessonId: string; completed: boolean }>(`/api/progress/complete/${lessonId}`, {
            method: 'POST',
        });
    }

    async getProgressStats() {
        return this.request<{ completedLessons: number }>('/api/progress/stats');
    }

    // Enrollments
    async enroll(courseId: string) {
        return this.request<{ id: string; courseId: string; status: string }>(`/api/enrollments/enroll/${courseId}`, {
            method: 'POST',
        });
    }

    async getEnrollments() {
        return this.request<import('@/types').Enrollment[]>('/api/enrollments');
    }

    async checkEnrollment(courseId: string) {
        return this.request<{ enrolled: boolean }>(`/api/enrollments/check/${courseId}`);
    }

    // CSV Import
    async importCourse(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request<{ message: string; importedCount: number; errors: string[] }>('/api/csv-import/course', {
            method: 'POST',
            body: formData,
        });
    }

    // Video streaming URL
    getStreamUrl(fileId: string) {
        return `${API_BASE}/api/drive/stream/${fileId}`;
    }
}

export const api = new ApiClient();
