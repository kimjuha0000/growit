import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, TrendingUp } from "lucide-react";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const trendingKeywords = [
    "React", "TypeScript", "Python", "UI/UX", "데이터 분석", 
    "AI", "프론트엔드", "백엔드"
  ];

  const searchResults = [
    {
      id: "1",
      title: "React와 TypeScript로 시작하는 웹 개발",
      instructor: "김개발",
      thumbnail: "",
      price: 49000,
      rating: 4.8,
      level: "초급",
      students: 1250,
    },
    {
      id: "2",
      title: "Vue.js 3 완벽 가이드",
      instructor: "정프론트",
      thumbnail: "",
      price: 45000,
      rating: 4.6,
      level: "중급",
      students: 670,
    },
  ];

  const hasResults = searchResults.length > 0;

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
                {trendingKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setSearchQuery(keyword)}
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
                  '{searchQuery}' 검색 결과 {hasResults && `(${searchResults.length})`}
                </h2>
              </div>

              {hasResults ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {searchResults.map((course) => (
                    <CourseCard key={course.id} {...course} />
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
                        <a href="/courses?category=dev">개발</a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/courses?category=design">디자인</a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/courses?category=ai">AI</a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/courses?category=data">데이터 분석</a>
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
