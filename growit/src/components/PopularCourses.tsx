import YoutubeVideoCard from "./YoutubeVideoCard";
import { youtubeVideos } from "@/lib/youtube-data";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";

const PopularCourses = () => {
  const { user } = useAuth();
  const topVideos = youtubeVideos.slice(0, 4);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold">인기 유튜브 강의</h2>
          <p className="text-muted-foreground">
            실제 유튜브에서 조회수가 높은 실습형 강의를 바로 시청하세요
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {topVideos.map((video) => (
            <YoutubeVideoCard
              key={video.id}
              video={video}
              onOpen={(item) =>
                trackEvent(
                  "video_open",
                  { videoId: item.id, source: "popular_banner" },
                  user?.username,
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCourses;
