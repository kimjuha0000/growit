export interface LoginResponse {
  ok: boolean;
  username: string;
  full_name: string;
  interests: string[];
}

export interface CategorySummary {
  id: string;
  name: string;
  description: string;
  courseCount: number;
  icon?: string;
  accent?: string;
  sampleUrl?: string;
}

export interface CourseInfo {
  title: string;
  provider: string;
  duration: string;
  level: string;
  url: string;
}

export interface RecommendationResponse {
  category: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    accent?: string;
  };
  courses: CourseInfo[];
}
