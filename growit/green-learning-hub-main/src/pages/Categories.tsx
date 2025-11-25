import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Palette, Brain, BarChart3, Briefcase, MoreHorizontal, Cpu, Camera, Megaphone, DollarSign, Globe, Wrench } from "lucide-react";

const Categories = () => {
  const categories = [
    {
      id: "dev",
      name: "개발",
      icon: Code,
      count: 150,
      subcategories: ["웹 개발", "앱 개발", "게임 개발", "백엔드", "프론트엔드"],
      color: "from-blue-500/20 to-cyan-500/20",
    },
    {
      id: "design",
      name: "디자인",
      icon: Palette,
      count: 80,
      subcategories: ["UI/UX", "그래픽 디자인", "3D 디자인", "제품 디자인"],
      color: "from-pink-500/20 to-purple-500/20",
    },
    {
      id: "ai",
      name: "AI",
      icon: Brain,
      count: 45,
      subcategories: ["머신러닝", "딥러닝", "ChatGPT", "이미지 AI"],
      color: "from-violet-500/20 to-indigo-500/20",
    },
    {
      id: "data",
      name: "데이터 분석",
      icon: BarChart3,
      count: 60,
      subcategories: ["데이터 시각화", "빅데이터", "SQL", "Python"],
      color: "from-emerald-500/20 to-green-500/20",
    },
    {
      id: "career",
      name: "커리어",
      icon: Briefcase,
      count: 95,
      subcategories: ["이력서", "면접", "자기소개서", "포트폴리오"],
      color: "from-amber-500/20 to-orange-500/20",
    },
    {
      id: "hardware",
      name: "하드웨어",
      icon: Cpu,
      count: 35,
      subcategories: ["IoT", "임베디드", "로봇", "전자회로"],
      color: "from-red-500/20 to-rose-500/20",
    },
    {
      id: "photo",
      name: "사진/영상",
      icon: Camera,
      count: 55,
      subcategories: ["포토샵", "프리미어", "유튜브", "사진 촬영"],
      color: "from-teal-500/20 to-cyan-500/20",
    },
    {
      id: "marketing",
      name: "마케팅",
      icon: Megaphone,
      count: 70,
      subcategories: ["SNS 마케팅", "콘텐츠 마케팅", "SEO", "광고"],
      color: "from-fuchsia-500/20 to-pink-500/20",
    },
    {
      id: "finance",
      name: "재무/회계",
      icon: DollarSign,
      count: 40,
      subcategories: ["재무제표", "세무", "투자", "가계부"],
      color: "from-lime-500/20 to-green-500/20",
    },
    {
      id: "language",
      name: "외국어",
      icon: Globe,
      count: 85,
      subcategories: ["영어", "중국어", "일본어", "스페인어"],
      color: "from-sky-500/20 to-blue-500/20",
    },
    {
      id: "hobby",
      name: "취미",
      icon: Wrench,
      count: 65,
      subcategories: ["요리", "음악", "그림", "운동"],
      color: "from-yellow-500/20 to-amber-500/20",
    },
    {
      id: "etc",
      name: "기타",
      icon: MoreHorizontal,
      count: 70,
      subcategories: ["자기계발", "생산성", "비즈니스", "창업"],
      color: "from-gray-500/20 to-slate-500/20",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/30">
        <div className="container px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-bold">카테고리</h1>
            <p className="text-lg text-muted-foreground">
              관심 있는 분야의 강의를 찾아보세요
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary"
                >
                  <div className={`h-32 bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <Icon className="h-16 w-16 text-foreground/70" />
                  </div>
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-xl font-bold">{category.name}</h3>
                      <Badge variant="secondary">{category.count}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.map((sub) => (
                        <Badge key={sub} variant="outline" className="text-xs">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Categories;
