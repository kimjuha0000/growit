import { Search, ShoppingCart, Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">GI</span>
          </div>
          <span className="hidden text-xl font-bold text-foreground sm:inline-block">
            GrowIt
          </span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden flex-1 items-center justify-center px-8 md:flex">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="배우고 싶은 내용을 검색해보세요"
              className="pl-10"
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 md:flex">
          <Link to="/courses" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            강의
          </Link>
          <Link to="/categories" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            카테고리
          </Link>
          <Link to="/my-page" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            마이페이지
          </Link>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth">로그인</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">회원가입</Link>
          </Button>
        </nav>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="검색"
                  className="pl-10"
                />
              </div>
              <Link to="/courses" className="text-sm font-medium">강의</Link>
              <Link to="/categories" className="text-sm font-medium">카테고리</Link>
              <div className="flex space-x-2 pt-4">
                <Button variant="outline" className="flex-1">로그인</Button>
                <Button className="flex-1">회원가입</Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Navbar;
