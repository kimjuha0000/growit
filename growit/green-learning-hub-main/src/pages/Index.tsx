import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PopularCourses from "@/components/PopularCourses";
import Categories from "@/components/Categories";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <PopularCourses />
        <Categories />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
