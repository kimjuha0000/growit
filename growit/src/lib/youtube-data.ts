export type YoutubeCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
};

export type YoutubeVideo = {
  id: string;
  title: string;
  channel: string;
  youtubeId: string;
  views: string;
  duration: string;
  categoryId: string;
  tags: string[];
};

const thumbnail = (youtubeId: string) => `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

export const youtubeCategories: YoutubeCategory[] = [
  { id: "data-engineering", name: "데이터 엔지니어링", description: "ETL, 파이프라인 실습", icon: "🧱", accent: "#4f46e5" },
  { id: "ai-labs", name: "AI 랩 실습", description: "생성형 AI · 모델 서빙", icon: "🤖", accent: "#f97316" },
  { id: "marketing", name: "그로스 마케팅", description: "퍼널 분석 · 캠페인 최적화", icon: "📈", accent: "#10b981" },
  { id: "product-design", name: "프로덕트 디자인", description: "UX 흐름 · 디자인 시스템", icon: "🎨", accent: "#ec4899" },
  { id: "backend", name: "백엔드 엔지니어링", description: "API, DB, 스케일링", icon: "🛠️", accent: "#0ea5e9" },
  { id: "cloud-platforms", name: "클라우드 플랫폼", description: "AWS·GCP·Azure 실전", icon: "☁️", accent: "#38bdf8" },
];

export const youtubeVideos: YoutubeVideo[] = [
  { id: "yt-react-hooks", title: "React Hook 완전 정복", channel: "Nomad Coders", youtubeId: "mxS64NyP0Gk", views: "1.1M", duration: "36:12", categoryId: "backend", tags: ["react", "frontend", "hooks"] },
  { id: "yt-ts-patterns", title: "TypeScript 디자인 패턴 10분 요약", channel: "드림코딩 by 엘리", youtubeId: "qE7wHBH3ZRI", views: "640K", duration: "18:02", categoryId: "backend", tags: ["typescript", "patterns", "architecture"] },
  { id: "yt-data-build", title: "데이터 파이프라인 from Scratch", channel: "따라하며 배우는 데이터", youtubeId: "w9Xyzk5dW2M", views: "98K", duration: "29:44", categoryId: "data-engineering", tags: ["pipeline", "spark", "airflow"] },
  { id: "yt-airflow", title: "Airflow DAG 핵심 개념 15분", channel: "데이터마이닝", youtubeId: "l0w8BAs6zXk", views: "120K", duration: "15:37", categoryId: "data-engineering", tags: ["airflow", "scheduler"] },
  { id: "yt-llm-prod", title: "LLM 서비스 운영 시 고려사항 5가지", channel: "Upstage AI", youtubeId: "C71E6kGZ1Ss", views: "210K", duration: "21:12", categoryId: "ai-labs", tags: ["llm", "serving", "prod"] },
  { id: "yt-prompt", title: "프롬프트 엔지니어링 101", channel: "코딩애플", youtubeId: "dYpQ5G7gSdE", views: "480K", duration: "14:22", categoryId: "ai-labs", tags: ["prompt", "chatgpt"] },
  { id: "yt-growth", title: "CAC 낮추는 그로스 실험", channel: "Hypergrowth", youtubeId: "4N2P5cVbV3Q", views: "65K", duration: "19:10", categoryId: "marketing", tags: ["growth", "marketing"] },
  { id: "yt-funnel", title: "마케팅 퍼널 세팅 실전", channel: "FastCampus", youtubeId: "Fks0-1dQYUg", views: "150K", duration: "25:03", categoryId: "marketing", tags: ["funnel", "analysis"] },
  { id: "yt-ux", title: "UX 플로우 설계 3단계", channel: "brunch design", youtubeId: "n1Xz0zJzJxc", views: "87K", duration: "11:59", categoryId: "product-design", tags: ["ux", "flow"] },
  { id: "yt-figma", title: "Figma 컴포넌트 시스템 만들기", channel: "Product Bakery", youtubeId: "Ws3xVBDSGzY", views: "132K", duration: "23:01", categoryId: "product-design", tags: ["figma", "design-system"] },
  { id: "yt-serverless", title: "AWS 서버리스 구조 이해", channel: "AWSKRUG", youtubeId: "Q1dC5WfOYlM", views: "175K", duration: "26:42", categoryId: "cloud-platforms", tags: ["aws", "serverless"] },
  { id: "yt-gcp", title: "GCP BigQuery 베스트 프랙티스", channel: "Google Cloud Tech", youtubeId: "4aiJZgUMpCg", views: "205K", duration: "17:35", categoryId: "cloud-platforms", tags: ["gcp", "bigquery"] },
];

export const getVideosByCategory = (categoryId: string) =>
  youtubeVideos.filter((video) => video.categoryId === categoryId);

export const getYoutubeThumbnail = (video: YoutubeVideo) => thumbnail(video.youtubeId);

export const youtubeTrendingKeywords = [
  "React",
  "데이터 파이프라인",
  "LLM",
  "Figma",
  "Airflow",
  "BigQuery",
];
