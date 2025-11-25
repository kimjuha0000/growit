import { Star, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useState } from "react";

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  price: number;
  rating: number;
  level: string;
  students: number;
}

const CourseCard = ({
  title,
  instructor,
  thumbnail,
  price,
  rating,
  level,
  students,
}: CourseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="group overflow-hidden transition-all hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20"></div>
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 transition-all">
            <Button size="icon" variant="secondary" className="h-10 w-10">
              <Heart className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="secondary" className="h-10 w-10">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        )}
        <Badge className="absolute top-2 right-2">{level}</Badge>
      </div>

      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-2 font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">{instructor}</p>
        
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating}</span>
          </div>
          <span className="text-muted-foreground">({students.toLocaleString()})</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex w-full items-center justify-between">
          <span className="text-xl font-bold text-primary">
            {price === 0 ? "무료" : `₩${price.toLocaleString()}`}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
