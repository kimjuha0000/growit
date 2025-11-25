import { Code, Palette, Brain, BarChart3, Briefcase, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Categories = () => {
  const categories = [
    {
      id: "1",
      name: "개발",
      icon: Code,
      count: 150,
    },
    {
      id: "2",
      name: "디자인",
      icon: Palette,
      count: 80,
    },
    {
      id: "3",
      name: "AI",
      icon: Brain,
      count: 45,
    },
    {
      id: "4",
      name: "데이터 분석",
      icon: BarChart3,
      count: 60,
    },
    {
      id: "5",
      name: "커리어",
      icon: Briefcase,
      count: 95,
    },
    {
      id: "6",
      name: "기타",
      icon: MoreHorizontal,
      count: 70,
    },
  ];

  return (
    <section className="py-16">
      <div className="container px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold">카테고리</h2>
          <p className="text-muted-foreground">
            관심 있는 분야의 강의를 찾아보세요
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="group cursor-pointer transition-all hover:shadow-md hover:border-primary"
              >
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-3 rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-1 font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.count}개 강의
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
