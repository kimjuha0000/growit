import { Card, CardContent } from "@/components/ui/card";
import { youtubeCategories, getVideosByCategory } from "@/lib/youtube-data";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";

const Categories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
          {youtubeCategories.map((category) => {
            const videoCount = getVideosByCategory(category.id).length;
            return (
              <Card
                key={category.id}
                className="group cursor-pointer transition-all hover:shadow-md hover:border-primary"
                onClick={() => {
                  trackEvent(
                    "home_category_click",
                    { categoryId: category.id },
                    user?.username,
                  );
                  navigate(`/categories?category=${category.id}`);
                }}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-3 rounded-full bg-primary/10 p-4 text-2xl transition-colors group-hover:bg-primary/20">
                    {category.icon}
                  </div>
                  <h3 className="mb-1 font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    인기 유튜브 강의 {videoCount}개
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
