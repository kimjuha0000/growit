import CourseCard from "./CourseCard";

const PopularCourses = () => {
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
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold">인기 강의</h2>
          <p className="text-muted-foreground">
            가장 많은 수강생이 선택한 베스트 강의를 만나보세요
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCourses;
