import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import YoutubeVideoCard from "@/components/YoutubeVideoCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, TrendingUp } from "lucide-react";
import { youtubeVideos, youtubeTrendingKeywords } from "@/lib/youtube-data";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowered = searchQuery.toLowerCase();
    return youtubeVideos.filter(
      (video) =>
        video.title.toLowerCase().includes(lowered) ||
        video.channel.toLowerCase().includes(lowered) ||
        video.tags.some((tag) => tag.toLowerCase().includes(lowered)),
    );
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(() => {
      trackEvent(
        "search_query",
        { query: searchQuery },
        user?.username,
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.username]);

  const handleTrendingClick = (keyword: string) => {
    setSearchQuery(keyword);
    trackEvent("search_keyword_click", { keyword }, user?.username);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/30">
        <div className="container px-4 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="mb-4 text-3xl font-bold">강의 검색</h1>
            <div className="relative max-w-3xl">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="배우고 싶은 내용을 검색해보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
          </div>

          {/* Trending Keywords */}
          {!searchQuery && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">인기 검색어</h2>
              </div>
              <div className="flex flex-wrap gap-2">
          {youtubeTrendingKeywords.map((keyword) => (
            <Badge
              key={keyword}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handleTrendingClick(keyword)}
            >
              {keyword}
            </Badge>
          ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">
                  '{searchQuery}' 검색 결과 ({searchResults.length})
                </h2>
              </div>

              {searchResults.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {searchResults.map((video) => (
                    <YoutubeVideoCard
                      key={video.id}
                      video={video}
                      onOpen={(item) =>
                        trackEvent(
                          "video_open",
                          { videoId: item.id, source: "search_results", query: searchQuery },
                          user?.username,
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 rounded-full bg-muted p-6">
                    <SearchIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">검색 결과가 없습니다</h3>
                  <p className="mb-6 text-muted-foreground">
                    다른 키워드로 검색하거나 추천 카테고리를 둘러보세요
                  </p>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">추천 카테고리</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" asChild>
                        <a href="/categories?category=data-engineering">데이터 엔지니어링</a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/categories?category=product-design">디자인</a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/categories?category=ai-labs">AI</a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/categories?category=cloud-platforms">클라우드</a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;
