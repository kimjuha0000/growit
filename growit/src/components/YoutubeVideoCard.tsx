import { YoutubeVideo, getYoutubeThumbnail } from "@/lib/youtube-data";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play } from "lucide-react";

interface YoutubeVideoCardProps {
  video: YoutubeVideo;
  onOpen?: (video: YoutubeVideo) => void;
}

const YoutubeVideoCard = ({ video, onOpen }: YoutubeVideoCardProps) => {
  const handleClick = () => {
    onOpen?.(video);
  };

  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      onClick={handleClick}
    >
      <div className="relative aspect-video">
        <img
          src={getYoutubeThumbnail(video)}
          alt={video.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-primary">
            <Play className="h-4 w-4" />
            시청하기
          </div>
        </div>
        <Badge className="absolute left-3 top-3 bg-black/70 text-white hover:bg-black/70">
          {video.duration}
        </Badge>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight text-foreground">
            {video.title}
          </h3>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-sm text-muted-foreground">
          {video.channel} · 조회수 {video.views}
        </div>
        <div className="flex flex-wrap gap-2">
          {video.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>
    </a>
  );
};

export default YoutubeVideoCard;
