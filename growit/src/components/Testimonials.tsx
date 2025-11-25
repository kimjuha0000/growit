import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Testimonials = () => {
  const testimonials = [
    {
      id: "1",
      name: "김수영",
      role: "웹 개발자",
      content: "러닝그린에서 React를 배우고 실무에 바로 적용할 수 있었습니다. 강의 퀄리티가 정말 훌륭해요!",
      rating: 5,
      avatar: "김",
    },
    {
      id: "2",
      name: "박지훈",
      role: "UI/UX 디자이너",
      content: "디자인 감각을 키우는 데 큰 도움이 되었습니다. 실무 예제가 풍부해서 좋았어요.",
      rating: 5,
      avatar: "박",
    },
    {
      id: "3",
      name: "이민준",
      role: "데이터 분석가",
      content: "데이터 분석 강의를 듣고 커리어 전환에 성공했습니다. 체계적인 커리큘럼이 인상적이었어요.",
      rating: 5,
      avatar: "이",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold">학습자 후기</h2>
          <p className="text-muted-foreground">
            러닝그린과 함께 성장한 학습자들의 이야기
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="border-2">
              <CardContent className="p-6">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="mb-4 text-sm leading-relaxed text-foreground">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
