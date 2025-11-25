import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Award } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-background py-20">
      <div className="container px-4">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border bg-secondary px-4 py-1.5 text-sm">
              <span className="mr-2">🌱</span>
              <span className="font-medium text-secondary-foreground">새로운 학습의 시작</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              당신의 성장을 응원하는,{" "}
              <span className="text-primary">그로우잇</span>
            </h1>
            
            <p className="text-lg text-muted-foreground">
              원하는 강의를 자유롭게 배우세요. 전문가들이 만든 다양한 강좌로
              여러분의 성장을 응원합니다.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2">
                지금 시작하기
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                강의 둘러보기
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">500+</span>
                </div>
                <p className="text-sm text-muted-foreground">강의</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">10K+</span>
                </div>
                <p className="text-sm text-muted-foreground">수강생</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">4.8</span>
                </div>
                <p className="text-sm text-muted-foreground">평균 평점</p>
              </div>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="relative lg:h-[500px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-full w-full max-w-lg">
                <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl"></div>
                <div className="relative flex h-full items-center justify-center">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 w-32 rounded-2xl bg-primary/30 backdrop-blur-sm"></div>
                    <div className="h-32 w-32 rounded-2xl bg-accent/30 backdrop-blur-sm"></div>
                    <div className="h-32 w-32 rounded-2xl bg-accent/30 backdrop-blur-sm"></div>
                    <div className="h-32 w-32 rounded-2xl bg-primary/30 backdrop-blur-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
