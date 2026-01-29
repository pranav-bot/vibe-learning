import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "~/components/ui/card";

const ProductCard = ({
  title,
  description,
  onPayClick,
  price,
  currency,
}: {
  title?: string | null;
  description?: string | null;
  onPayClick?: () => void;
  price?: number | null;
  currency?: string | null;
}) => {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {/* <CardTitle className="text-accent-foreground text-xl text-center">
          {price} {currency}
        </CardTitle> */}
        <CardTitle className="text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>

        <CardFooter className="justify-center">
          <Button onClick={onPayClick} className="w-56">
            Pay
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default ProductCard;