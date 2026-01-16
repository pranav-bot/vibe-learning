export type Product = {


  product_id: string;


  name: string;


  description: string;


  price: number;


  features: string[];


};





export const products: Product[] = [


  {


    product_id: "pdt_0NW8SzWqOgaUKUbv9QWbx",


    name: "1 Credit",


    description: "Adds 1 credit to your account",


    price: 100, // 100.00


    features: [

        "1 Roadmap Generation",
    ],


  },


  {


    product_id: "pdt_0NW8bYSGgYoigI26uBq9b",


    name: "5 Credits",


    description: "Adds 5 credits to your account",

    price: 500, // 500.00


    features: [

        "5 Roadmap Generations",
    ],


  },


];