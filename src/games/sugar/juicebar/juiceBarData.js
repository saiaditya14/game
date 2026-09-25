import { Apple, Banana, Citrus, Cherry, Milk, Sparkles } from 'lucide-react';

// Prep station's fruit catalog. `icon` is the actual lucide component (not a
// name string) so PrepStation/BlendStation can render it directly.
export const FRUITS = [
  { id: 'apple', label: 'Apple', icon: Apple },
  { id: 'banana', label: 'Banana', icon: Banana },
  { id: 'citrus', label: 'Citrus', icon: Citrus },
  { id: 'cherry', label: 'Cherry', icon: Cherry },
];

export const TOPPINGS = [
  { id: 'cream', label: 'Cream', icon: Milk },
  { id: 'sprinkles', label: 'Sprinkles', icon: Sparkles },
];

export const fruitById = (id) => FRUITS.find((f) => f.id === id);
export const toppingById = (id) => TOPPINGS.find((t) => t.id === id);

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Picks 2-3 distinct fruits and one topping for a round's order.
export const generateOrder = () => {
  const comboSize = Math.random() < 0.5 ? 2 : 3;
  const pool = [...FRUITS];
  const combo = [];
  for (let i = 0; i < comboSize && pool.length > 0; i += 1) {
    const index = Math.floor(Math.random() * pool.length);
    combo.push(pool.splice(index, 1)[0].id);
  }
  return { combo, topping: pickRandom(TOPPINGS).id };
};

// Order is satisfied when the bin contains exactly the combo (any order,
// no extras, no missing) and the chosen topping matches.
export const isServeCorrect = (bin, selectedTopping, order) => {
  if (selectedTopping !== order.topping) return false;
  if (bin.length !== order.combo.length) return false;
  const sortedBin = [...bin].sort();
  const sortedCombo = [...order.combo].sort();
  return sortedBin.every((id, i) => id === sortedCombo[i]);
};
