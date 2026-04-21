import { Product } from '@/components/ProductCard';
import product1 from '@/assets/product-1.jpg';
import product2 from '@/assets/product-2.jpg';
import product3 from '@/assets/product-3.jpg';
import product4 from '@/assets/product-4.jpg';
import product5 from '@/assets/product-5.jpg';
import product6 from '@/assets/product-6.jpg';

export interface ExtendedProduct extends Product {
  featured?: boolean;
}

export const products: ExtendedProduct[] = [
  {
    id: '1',
    name: 'Rosewood Embroidered Lehenga',
    price: 45000,
    image: product1,
    category: 'Lehengas',
    featured: true,
  },
  {
    id: '2',
    name: 'Azure Silk Drape',
    price: 28000,
    image: product2,
    category: 'Sarees',
    featured: true,
  },
  {
    id: '3',
    name: 'Pearl White Anarkali',
    price: 32000,
    image: product3,
    category: 'Anarkalis',
    featured: true,
  },
  {
    id: '4',
    name: 'Blush Shimmer Sharara',
    price: 38000,
    image: product4,
    category: 'Shararas',
    featured: true,
  },
  {
    id: '5',
    name: 'Sage Zari Kurta Set',
    price: 24000,
    image: product5,
    category: 'Kurta Sets',
  },
  {
    id: '6',
    name: 'Champagne Evening Gown',
    price: 55000,
    image: product6,
    category: 'Gowns',
    featured: true,
  },
];

export interface Collection {
  id: string;
  name: string;
  mood?: string;
  image: string;
}

export const collections: Collection[] = [
  { 
    id: 'bridal', 
    name: 'Bridal', 
    mood: 'For your forever moment',
    image: product1,
  },
  { 
    id: 'festive', 
    name: 'Festive', 
    mood: 'Celebrate in elegance',
    image: product3,
  },
  { 
    id: 'evening', 
    name: 'Evening', 
    mood: 'After dark allure',
    image: product6,
  },
  { 
    id: 'casual', 
    name: 'Casual Luxe', 
    mood: 'Effortless refinement',
    image: product5,
  },
];

export const sizes = ['XS', 'S', 'M', 'L', 'XL'];
