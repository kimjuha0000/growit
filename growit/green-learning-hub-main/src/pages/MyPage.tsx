import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, CreditCard, User, PlayCircle, Star } from "lucide-react";
import CourseCard from "@/components/CourseCard";

const MyPage = () => {
  const [activeTab, setActiveTab] = useState("courses");

  const myCourses = [
    {
      id: "1",
      title: "React와 TypeScript로 시작하는 웹 개발",
      instructor: "김개발",
      thumbnail: "",
      progress: 35,
      lastWatched: "1-3 첫 프로젝트 생성",
    },
    {
      id: "2",
      title: "Python 데이터 분석 완벽 가이드",
      instructor: "이분석",
      thumbnail: "",
      progress: 12,
      lastWatched: "1-1 강의 소개",
    },
  ];

  const wishlist = [
    {
      id: "3",
      title: "Vue.js 3 완벽 가이드",
      instructor: "정프론트",
      thumbnail: "",
      price: 45000,
      rating: 4.6,
      level: "중급",
      students: 670,
    },
    {
      id: "4",
      title: "Figma로 시작하는 UI 디자인",
      instructor: "김디자인",
      thumbnail: "",
      price: 0,
      rating: 4.8,
      level: "입문",
      students: 1890,
    },
  ];

  const payments = [
    {
      id: "1",
      date: "2024-01-15",
      course: "React와 TypeScript로 시작하는 웹 개발",
      amount: 49000,
      status: "완료",
    },
    {
      id: "2",
      date: "2024-01-10",
      course: "Python 데이터 분석 완벽 가이드",
      amount: 59000,
      status: "완료",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/30">
        <div className="container px-4 py-8">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    김
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="mb-2 text-2xl font-bold">김수영</h1>
                  <p className="text-muted-foreground">sueyoung@example.com</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>수강 중인 강의 2개</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      <span>관심 강의 2개</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline">프로필 수정</Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="courses">
                <BookOpen className="mr-2 h-4 w-4" />
                내 강의
              </TabsTrigger>
              <TabsTrigger value="wishlist">
                <Heart className="mr-2 h-4 w-4" />
                관심 강의
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="mr-2 h-4 w-4" />
                결제 내역
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="mr-2 h-4 w-4" />
                계정 정보
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-6">
              <div>
                <h2 className="mb-4 text-xl font-semibold">수강 중인 강의</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {myCourses.map((course) => (
                    <Card key={course.id} className="overflow-hidden">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20"></div>
                      <CardContent className="p-4">
                        <h3 className="mb-2 font-semibold">{course.title}</h3>
                        <p className="mb-3 text-sm text-muted-foreground">{course.instructor}</p>
                        
                        <div className="mb-3">
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">진행률</span>
                            <span className="font-semibold">{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>

                        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <PlayCircle className="h-4 w-4" />
                          <span>마지막 시청: {course.lastWatched}</span>
                        </div>

                        <Button className="w-full" asChild>
                          <a href="/player">이어서 학습하기</a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="wishlist">
              <div>
                <h2 className="mb-4 text-xl font-semibold">관심 강의</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {wishlist.map((course) => (
                    <CourseCard key={course.id} {...course} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div>
                <h2 className="mb-4 text-xl font-semibold">결제 내역</h2>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="p-4 text-left text-sm font-semibold">날짜</th>
                            <th className="p-4 text-left text-sm font-semibold">강의명</th>
                            <th className="p-4 text-left text-sm font-semibold">금액</th>
                            <th className="p-4 text-left text-sm font-semibold">상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id} className="border-b last:border-0">
                              <td className="p-4 text-sm">{payment.date}</td>
                              <td className="p-4 text-sm">{payment.course}</td>
                              <td className="p-4 text-sm font-semibold">
                                ₩{payment.amount.toLocaleString()}
                              </td>
                              <td className="p-4">
                                <Badge>{payment.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profile">
              <div className="mx-auto max-w-2xl">
                <h2 className="mb-6 text-xl font-semibold">계정 정보</h2>
                <Card>
                  <CardContent className="p-6">
                    <form className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">이름</Label>
                        <Input id="name" defaultValue="김수영" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">이메일</Label>
                        <Input id="email" type="email" defaultValue="sueyoung@example.com" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">전화번호</Label>
                        <Input id="phone" type="tel" defaultValue="010-1234-5678" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">자기소개</Label>
                        <Input id="bio" defaultValue="열심히 공부하는 개발자입니다." />
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1">저장</Button>
                        <Button variant="outline" className="flex-1">
                          취소
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">비밀번호 변경</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">현재 비밀번호</Label>
                      <Input id="current-password" type="password" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">새 비밀번호</Label>
                      <Input id="new-password" type="password" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">비밀번호 확인</Label>
                      <Input id="confirm-password" type="password" />
                    </div>

                    <Button className="w-full">비밀번호 변경</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyPage;
