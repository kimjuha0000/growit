import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, CheckCircle, Clock, MessageSquare, BookOpen, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Player = () => {
  const [currentLesson, setCurrentLesson] = useState("1-1");
  const [note, setNote] = useState("");

  const curriculum = [
    {
      id: "1",
      title: "섹션 1: 시작하기",
      lessons: [
        { id: "1-1", title: "강의 소개", duration: "5:30", completed: true },
        { id: "1-2", title: "개발 환경 설정", duration: "12:45", completed: true },
        { id: "1-3", title: "첫 프로젝트 생성", duration: "8:20", completed: false },
      ],
    },
    {
      id: "2",
      title: "섹션 2: 기초 다지기",
      lessons: [
        { id: "2-1", title: "컴포넌트 이해하기", duration: "15:30", completed: false },
        { id: "2-2", title: "Props와 State", duration: "18:45", completed: false },
        { id: "2-3", title: "이벤트 핸들링", duration: "12:20", completed: false },
      ],
    },
    {
      id: "3",
      title: "섹션 3: 실전 프로젝트",
      lessons: [
        { id: "3-1", title: "프로젝트 기획", duration: "10:30", completed: false },
        { id: "3-2", title: "API 연동", duration: "20:45", completed: false },
        { id: "3-3", title: "배포하기", duration: "15:20", completed: false },
      ],
    },
  ];

  const totalLessons = curriculum.reduce((acc, section) => acc + section.lessons.length, 0);
  const completedLessons = curriculum.reduce(
    (acc, section) => acc + section.lessons.filter((l) => l.completed).length,
    0
  );
  const progress = (completedLessons / totalLessons) * 100;

  return (
    <div className="flex h-screen flex-col">
      {/* Top Bar */}
      <header className="flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/course/1">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">React와 TypeScript로 시작하는 웹 개발</h1>
            <p className="text-xs text-muted-foreground">김개발</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-sm text-muted-foreground">진행률</span>
            <span className="text-sm font-semibold">{Math.round(progress)}%</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Curriculum */}
        <aside className="w-80 border-r bg-muted/30 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">전체 진행률</span>
                <span className="font-semibold">
                  {completedLessons}/{totalLessons}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-2">
              {curriculum.map((section) => (
                <div key={section.id} className="space-y-1">
                  <h3 className="mb-2 px-2 text-sm font-semibold">{section.title}</h3>
                  {section.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLesson(lesson.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        currentLesson === lesson.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {lesson.completed ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                      ) : (
                        <PlayCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex-1">{lesson.title}</span>
                      <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center - Video Player */}
        <main className="flex flex-1 flex-col">
          <div className="flex-1 bg-black">
            <div className="flex h-full items-center justify-center">
              <div className="aspect-video w-full max-w-5xl bg-gradient-to-br from-primary/20 to-accent/20">
                <div className="flex h-full items-center justify-center">
                  <PlayCircle className="h-20 w-20 text-white opacity-80" />
                </div>
              </div>
            </div>
          </div>

          {/* Video Controls & Info */}
          <div className="border-t bg-background p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">강의 소개</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>5:30</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              이 강의에서는 React와 TypeScript의 기초부터 실전까지 배웁니다.
            </p>
          </div>
        </main>

        {/* Right Sidebar - Notes & Questions */}
        <aside className="w-80 border-l bg-background overflow-y-auto">
          <Tabs defaultValue="notes" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="notes" className="flex-1">
                <BookOpen className="mr-2 h-4 w-4" />
                노트
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex-1">
                <MessageSquare className="mr-2 h-4 w-4" />
                질문
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="flex-1 p-4 space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold">메모 작성</h3>
                <Textarea
                  placeholder="학습 내용을 메모하세요..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[120px]"
                />
                <Button className="mt-2 w-full">저장</Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">내 노트</h3>
                <Card>
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="secondary">1-1 강의 소개</Badge>
                      <span className="text-xs text-muted-foreground">2분 전</span>
                    </div>
                    <p className="text-sm">React는 컴포넌트 기반 라이브러리입니다.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="flex-1 p-4 space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold">질문하기</h3>
                <Textarea
                  placeholder="강사님께 질문하세요..."
                  className="min-h-[120px]"
                />
                <Button className="mt-2 w-full">질문 등록</Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">질문 목록</h3>
                <Card>
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">김수영</span>
                      <span className="text-xs text-muted-foreground">1시간 전</span>
                    </div>
                    <p className="mb-2 text-sm">TypeScript 타입 정의는 어떻게 하나요?</p>
                    <Badge>답변 대기중</Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
};

export default Player;
