import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingCart } from "lucide-react";

const Cart = () => {
  const cartItems = [
    {
      id: "1",
      title: "React와 TypeScript로 시작하는 웹 개발",
      instructor: "김개발",
      price: 49000,
      thumbnail: "",
    },
    {
      id: "2",
      title: "Vue.js 3 완벽 가이드",
      instructor: "정프론트",
      price: 45000,
      thumbnail: "",
    },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
  const discount = 0;
  const total = subtotal - discount;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/30">
        <div className="container px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold">장바구니</h1>

          {cartItems.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="h-24 w-32 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20"></div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <h3 className="mb-1 font-semibold">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.instructor}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">
                              ₩{item.price.toLocaleString()}
                            </span>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-xl font-semibold">주문 요약</h2>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">소계</span>
                        <span className="font-medium">₩{subtotal.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input placeholder="쿠폰 코드" />
                        <Button variant="outline">적용</Button>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">할인</span>
                          <span className="font-medium text-primary">
                            -₩{discount.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between text-lg font-bold">
                        <span>총 결제금액</span>
                        <span className="text-primary">₩{total.toLocaleString()}</span>
                      </div>
                    </div>

                    <Button className="w-full" size="lg">
                      결제하기
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      30일 환불 보장
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">장바구니가 비어있습니다</h3>
              <p className="mb-6 text-muted-foreground">
                마음에 드는 강의를 장바구니에 담아보세요
              </p>
              <Button asChild>
                <a href="/courses">강의 둘러보기</a>
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
