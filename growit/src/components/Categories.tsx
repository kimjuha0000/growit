import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { CategorySummary } from "@/types/pipeline";

const HomeCategories = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.listCategories(),
  });

  const categories = useMemo<CategorySummary[]>(() => data?.items ?? [], [data]);
  const display = categories.slice(0, 6);

  return (
    <section className="py-16">
      <div className="container px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold">카테고리</h2>
          <p className="text-muted-foreground">
            파이프라인에 등록된 10개 트랙 중 일부를 미리 살펴보세요.
          </p>
        </div>

        {isError && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            카테고리를 불러오는 중 문제가 발생했습니다.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx} className="p-6">
                  <Skeleton className="mx-auto mb-3 h-10 w-10 rounded-full" />
                  <Skeleton className="mx-auto mb-1 h-4 w-24" />
                  <Skeleton className="mx-auto h-4 w-20" />
                </Card>
              ))
            : display.map((category) => (
                <Card
                  key={category.id}
                  className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/70"
                >
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                    <div className="rounded-full bg-primary/10 p-4 text-2xl transition group-hover:bg-primary/20">
                      {category.icon || "📘"}
                    </div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.courseCount}개 강의
                    </p>
                    {category.sampleUrl && (
                      <Badge variant="outline" className="text-xs">
                        <a href={category.sampleUrl} target="_blank" rel="noopener noreferrer">
                          샘플 보기
                        </a>
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </section>
  );
};

export default HomeCategories;
