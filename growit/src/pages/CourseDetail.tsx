import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Clock, Users, PlayCircle, Heart, ShoppingCart, Share2 } from "lucide-react";

const CourseDetail = () => {
  const curriculum = [
    {
      id: "1",
      title: "섹션 1: 시작하기",
      lessons: [
        { id: "1-1", title: "강의 소개", duration: "5:30" },
        { id: "1-2", title: "개발 환경 설정", duration: "12:45" },
        { id: "1-3", title: "첫 프로젝트 생성", duration: "8:20" },
      ],
    },
    {
      id: "2",
      title: "섹션 2: 기초 다지기",
      lessons: [
        { id: "2-1", title: "컴포넌트 이해하기", duration: "15:30" },
        { id: "2-2", title: "Props와 State", duration: "18:45" },
        { id: "2-3", title: "이벤트 핸들링", duration: "12:20" },
      ],
    },
    {
      id: "3",
      title: "섹션 3: 실전 프로젝트",
      lessons: [
        { id: "3-1", title: "프로젝트 기획", duration: "10:30" },
        { id: "3-2", title: "API 연동", duration: "20:45" },
        { id: "3-3", title: "배포하기", duration: "15:20" },
      ],
    },
  ];

  const reviews = [
    {
      id: "1",
      name: "김수영",
      rating: 5,
      date: "2024-01-15",
      content: "정말 체계적이고 이해하기 쉬운 강의입니다. 실무에 바로 적용할 수 있는 내용들이 많아서 좋았어요!",
      avatar: "김",
    },
    {
      id: "2",
      name: "이민준",
      rating: 5,
      date: "2024-01-10",
      content: "초보자도 따라하기 쉽게 설명해주셔서 감사합니다. 강사님의 열정이 느껴지는 강의였습니다.",
      avatar: "이",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/20 via-accent/10 to-background py-12">
          <div className="container px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>초급</Badge>
                  <Badge variant="secondary">개발</Badge>
                </div>
                
                <h1 className="text-3xl font-bold md:text-4xl">
                  React와 TypeScript로 시작하는 웹 개발
                </h1>

                <p className="text-lg text-muted-foreground">
                  최신 React와 TypeScript를 활용하여 실무에서 바로 사용 가능한 모던 웹 애플리케이션을 만들어보세요.
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.8</span>
                    <span className="text-muted-foreground">(1,250명)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>1,250명 수강중</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>총 12시간</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">김</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">김개발</p>
                    <p className="text-sm text-muted-foreground">시니어 프론트엔드 개발자</p>
                  </div>
                </div>
              </div>

              {/* Sticky Price Card */}
              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg"></div>
                  <CardContent className="p-6 space-y-4">
                    <div className="text-3xl font-bold text-primary">₩49,000</div>
                    
                    <div className="space-y-2">
                      <Button className="w-full" size="lg">
                        <PlayCircle className="mr-2 h-5 w-5" />
                        수강하기
                      </Button>
                      <Button variant="outline" className="w-full" size="lg">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        장바구니
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="flex-1">
                        <Heart className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="flex-1">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="border-t pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">강의 수</span>
                        <span className="font-medium">45개</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">총 시간</span>
                        <span className="font-medium">12시간</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">평생 수강</span>
                        <span className="font-medium">✓</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Content Tabs */}
        <section className="py-12">
          <div className="container px-4">
            <div className="lg:pr-[400px]">
              <Tabs defaultValue="curriculum" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger value="curriculum" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                    커리큘럼
                  </TabsTrigger>
                  <TabsTrigger value="intro" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                    소개
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                    수강평
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="curriculum" className="mt-6">
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {curriculum.map((section) => (
                      <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <span className="font-semibold">{section.title}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {section.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{lesson.title}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="intro" className="mt-6 space-y-6">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-xl font-semibold">강의 소개</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        이 강의는 React와 TypeScript를 처음 접하는 분들을 위한 입문 강의입니다. 
                        기초부터 실전 프로젝트까지 체계적으로 학습하며, 실무에서 바로 활용할 수 있는 
                        최신 웹 개발 기술을 배웁니다.
                      </p>
                      
                      <h3 className="text-xl font-semibold pt-4">학습 목표</h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>React의 기본 개념과 컴포넌트 이해</li>
                        <li>TypeScript를 활용한 타입 안정성 확보</li>
                        <li>상태 관리와 라이프사이클 이해</li>
                        <li>실전 프로젝트를 통한 실무 경험</li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6 space-y-4">
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-4xl font-bold">4.8</div>
                      <div>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">1,250개의 수강평</p>
                      </div>
                    </div>
                  </div>

                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {review.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">{review.name}</p>
                              <p className="text-sm text-muted-foreground">{review.date}</p>
                            </div>
                            <div className="flex gap-1">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {review.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;
