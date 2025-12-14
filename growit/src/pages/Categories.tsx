import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { CategorySummary } from "@/types/pipeline";
import { ArrowRight, ActivitySquare, Database, ServerCog, Share2 } from "lucide-react";
import YoutubeVideoCard from "@/components/YoutubeVideoCard";
import { youtubeCategories, getVideosByCategory, YoutubeVideo } from "@/lib/youtube-data";
import { trackEvent } from "@/lib/analytics";

const pipelineSteps = [
  {
    title: "FastAPI Edge",
    icon: ActivitySquare,
    description: "사용자 인증 이벤트와 관심 카테고리 요청을 수집합니다.",
  },
  {
    title: "Airflow",
    icon: Share2,
    description: "로그 파일을 주기적으로 스캔하며 Spark 작업을 트리거합니다.",
  },
  {
    title: "Spark + Delta",
    icon: ServerCog,
    description: "Bronze JSONL을 Silver/Gold로 정제한 뒤 추천 지표를 생성합니다.",
  },
  {
    title: "Postgres Sink",
    icon: Database,
    description: "최종 집계 결과를 대시보드와 모바일 앱에 제공하는 데이터마트로 적재합니다.",
  },
];

const Categories = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.get("category"));
  const [recommendation, setRecommendation] = useState<{
    id: string;
    name: string;
    description?: string;
    icon?: string;
    videos: YoutubeVideo[];
  } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.listCategories(),
  });

  const categories = useMemo<CategorySummary[]>(() => data?.items ?? [], [data]);

  const enrichedCategories = useMemo(() => {
    if (!categories.length) {
      return youtubeCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        accent: cat.accent,
        courseCount: getVideosByCategory(cat.id).length,
      }));
    }
    return categories.map((cat) => {
      const fallback = youtubeCategories.find((y) => y.id === cat.id);
      return {
        ...cat,
        icon: fallback?.icon ?? cat.icon,
        description: cat.description ?? fallback?.description,
        accent: cat.accent ?? fallback?.accent,
        courseCount: getVideosByCategory(cat.id).length,
      };
    });
  }, [categories]);

  useEffect(() => {
    if (!selectedCategory && enrichedCategories.length) {
      setSelectedCategory(enrichedCategories[0].id);
    }
  }, [selectedCategory, enrichedCategories]);

  const mutation = useMutation({
    mutationFn: (categoryId: string) => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      return api.getRecommendations({
        username: user.username,
        category: categoryId,
      });
    },
    onSuccess: (payload) => {
      const videos = getVideosByCategory(payload.category.id);
      setRecommendation({
        id: payload.category.id,
        name: payload.category.name,
        description: payload.category.description ?? undefined,
        icon: payload.category.icon ?? undefined,
        videos,
      });
      trackEvent(
        "category_recommendation",
        { categoryId: payload.category.id, videoCount: videos.length },
        user?.username,
      );
      toast({
        title: `${payload.category.name} 인기 유튜브 강의`,
        description: `${videos.length}개의 영상을 불러왔습니다.`,
      });
    },
    onError: (err: Error) => {
      trackEvent(
        "recommendation_error",
        { categoryId: selectedCategory, message: err.message },
        user?.username,
      );
      toast({
        title: "추천 요청 실패",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCategorySelect = (categoryId: string) => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "샘플 계정으로 로그인 후 관심 분야를 고를 수 있어요.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setSelectedCategory(categoryId);
    trackEvent("category_select", { categoryId }, user?.username);
  };

  const handleRecommend = () => {
    if (!selectedCategory) {
      toast({
        title: "카테고리를 선택해주세요",
        description: "10개의 트랙 중 하나를 선택하면 추천을 불러옵니다.",
      });
      return;
    }
    mutation.mutate(selectedCategory);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30">
        <div className="container px-4 py-10 space-y-8">
          <section className="rounded-3xl border bg-background/80 p-6 md:p-10 shadow-sm">
            <div className="flex flex-col gap-4">
              <Badge variant="outline" className="w-fit">
                Learning Pipeline Hub
              </Badge>
              <div>
                <h1 className="text-4xl font-bold leading-tight">
                  카테고리를 선택하면 1,000개의 가상 강의 링크가 파이프라인을 따라 흘러갑니다.
                </h1>
                <p className="mt-3 text-lg text-muted-foreground">
                  로그인한 사용자만 추천을 요청할 수 있으며, FastAPI → Airflow → Spark/Delta → Postgres로 이어지는 이벤트 로그가 자동으로 기록됩니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="rounded-2xl border px-4 py-2">
                  <span className="text-sm text-muted-foreground">카테고리</span>
                  <p className="text-2xl font-semibold">10</p>
                </div>
                <div className="rounded-2xl border px-4 py-2">
                  <span className="text-sm text-muted-foreground">강의 URL</span>
                  <p className="text-2xl font-semibold">1,000+</p>
                </div>
                <div className="rounded-2xl border px-4 py-2">
                  <span className="text-sm text-muted-foreground">Bronze 이벤트</span>
                  <p className="text-2xl font-semibold">JSONL 기록</p>
                </div>
              </div>
            </div>
          </section>

          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              카테고리를 불러오는 중 문제가 발생했습니다. API가 준비되었는지 확인해주세요.
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card className="bg-background/80">
              <CardHeader>
                <CardTitle>관심 분야 선택</CardTitle>
                <CardDescription>
                  {user
                    ? `${user.full_name} 님, 관심 있는 트랙을 골라 추천을 받아보세요.`
                    : "샘플 계정(datafan/pass1234 등)으로 로그인하면 추천을 요청할 수 있습니다."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-32 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {enrichedCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category.id)}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary",
                          selectedCategory === category.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background/60",
                        )}
                        style={
                          category.accent
                            ? {
                                borderColor: selectedCategory === category.id ? category.accent : undefined,
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{category.icon || "📘"}</span>
                          <Badge variant="secondary">{category.courseCount}개</Badge>
                        </div>
                        <p className="mt-3 text-lg font-semibold">{category.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    onClick={handleRecommend}
                    disabled={!user || mutation.isLoading}
                    className="gap-2"
                  >
                    추천 강의 요청
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  {!user && (
                    <p className="text-sm text-muted-foreground">
                      아직 계정이 없나요? <span className="text-primary">datafan/pass1234</span> 등 샘플 계정을 활용해보세요.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/80">
              <CardHeader>
                <CardTitle>파이프라인 흐름</CardTitle>
                <CardDescription>선택한 트랙은 아래 순서로 저장 및 전송됩니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipelineSteps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <p className="font-semibold">{step.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-background/80 lg:col-span-2">
              <CardHeader>
                <CardTitle>추천 결과</CardTitle>
                <CardDescription>
                  추천 버튼을 누르면 선택한 트랙의 인기 유튜브 강의를 한 번에 모아서 보여줍니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!recommendation ? (
                  <div className="rounded-2xl border border-dashed border-muted-foreground/40 p-6 text-center text-muted-foreground">
                    추천을 요청하면 이곳에 강의가 표시됩니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-2xl border bg-primary/5 p-4">
                      <span className="text-2xl">{recommendation.icon || "📘"}</span>
                      <div>
                        <p className="font-semibold">
                          {recommendation.name} ({recommendation.id})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {recommendation.description}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {recommendation.videos.map((video) => (
                        <YoutubeVideoCard
                          key={video.id}
                          video={video}
                          onOpen={(item) =>
                            trackEvent(
                              "video_open",
                              {
                                videoId: item.id,
                                categoryId: recommendation.id,
                                source: "category_recommendation",
                              },
                              user?.username,
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
