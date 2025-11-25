import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Courses = () => {
  const [selectedLevel, setSelectedLevel] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);

  const courses = [
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
      title: "UI/UX 디자인 기초부터 실전까지",
      instructor: "박디자인",
      thumbnail: "",
      price: 0,
      rating: 4.9,
      level: "입문",
      students: 2340,
    },
    {
      id: "3",
      title: "Python 데이터 분석 완벽 가이드",
      instructor: "이분석",
      thumbnail: "",
      price: 59000,
      rating: 4.7,
      level: "중급",
      students: 890,
    },
    {
      id: "4",
      title: "ChatGPT 활용 실전 AI 프로젝트",
      instructor: "최인공",
      thumbnail: "",
      price: 39000,
      rating: 4.9,
      level: "초급",
      students: 3200,
    },
    {
      id: "5",
      title: "Vue.js 3 완벽 가이드",
      instructor: "정프론트",
      thumbnail: "",
      price: 45000,
      rating: 4.6,
      level: "중급",
      students: 670,
    },
    {
      id: "6",
      title: "Figma로 시작하는 UI 디자인",
      instructor: "김디자인",
      thumbnail: "",
      price: 0,
      rating: 4.8,
      level: "입문",
      students: 1890,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-muted/30">
        <div className="container px-4 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">전체 강의</h1>
            <p className="text-muted-foreground">
              {courses.length}개의 강의가 있습니다
            </p>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Filters Sidebar */}
            <aside className="w-full lg:w-64 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">필터</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Level Filter */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">난이도</h3>
                    <div className="space-y-2">
                      {["입문", "초급", "중급", "고급"].map((level) => (
                        <div key={level} className="flex items-center space-x-2">
                          <Checkbox
                            id={`level-${level}`}
                            checked={selectedLevel.includes(level)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLevel([...selectedLevel, level]);
                              } else {
                                setSelectedLevel(selectedLevel.filter((l) => l !== level));
                              }
                            }}
                          />
                          <Label htmlFor={`level-${level}`} className="text-sm cursor-pointer">
                            {level}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">가격</h3>
                    <div className="space-y-2">
                      {["무료", "유료"].map((price) => (
                        <div key={price} className="flex items-center space-x-2">
                          <Checkbox
                            id={`price-${price}`}
                            checked={selectedPrice.includes(price)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPrice([...selectedPrice, price]);
                              } else {
                                setSelectedPrice(selectedPrice.filter((p) => p !== price));
                              }
                            }}
                          />
                          <Label htmlFor={`price-${price}`} className="text-sm cursor-pointer">
                            {price}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedLevel([]);
                      setSelectedPrice([]);
                    }}
                  >
                    필터 초기화
                  </Button>
                </CardContent>
              </Card>
            </aside>

            {/* Course Grid */}
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  총 {courses.length}개의 강의
                </p>
                <Select defaultValue="popular">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="정렬" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">인기순</SelectItem>
                    <SelectItem value="recent">최신순</SelectItem>
                    <SelectItem value="rating">평점순</SelectItem>
                    <SelectItem value="price-low">낮은 가격순</SelectItem>
                    <SelectItem value="price-high">높은 가격순</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;
