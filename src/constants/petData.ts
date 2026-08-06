import { PenTool, BookOpen, Mic2, GraduationCap, Hammer, Gamepad2 } from 'lucide-react';

export const PET_TIERS = [
  {
    id: 'common', label: 'Common', cost: 100, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',
    pets: [
      { id: 'luna', name: 'Luna', emoji: '🌙' },
      { id: 'astro', name: 'Astro', emoji: '🚀' },
      { id: 'cosmo', name: 'Cosmo', emoji: '🪐' },
      { id: 'nova', name: 'Nova', emoji: '🌟' },
      { id: 'nebula', name: 'Nebula', emoji: '🌌' },
      { id: 'stella', name: 'Stella', emoji: '⭐' },
      { id: 'orion', name: 'Orion', emoji: '☄️' },
      { id: 'solar', name: 'Solar', emoji: '☀️' },
      { id: 'hamster', name: 'Hamster', emoji: '🐹' },
      { id: 'rabbit', name: 'Rabbit', emoji: '🐰' },
      { id: 'chick', name: 'Baby Chick', emoji: '🐥' },
      { id: 'cat', name: 'Cat', emoji: '🐱' },
      { id: 'dog', name: 'Dog', emoji: '🐶' },
      { id: 'duck', name: 'Duck', emoji: '🦆' },
      { id: 'frog', name: 'Frog', emoji: '🐸' },
      { id: 'turtle', name: 'Turtle', emoji: '🐢' },
      { id: 'mouse', name: 'Mouse', emoji: '🐭' },
      { id: 'hedgehog', name: 'Hedgehog', emoji: '🦔' },
      { id: 'snail', name: 'Snail', emoji: '🐌' },
      { id: 'butterfly', name: 'Butterfly', emoji: '🦋' },
      { id: 'bee', name: 'Bee', emoji: '🐝' },
      { id: 'ladybug', name: 'Ladybug', emoji: '🐞' },
      { id: 'fish', name: 'Fish', emoji: '🐟' },
      { id: 'goldfish', name: 'Goldfish', emoji: '🐠' },
      { id: 'crab', name: 'Crab', emoji: '🦀' },
      { id: 'parrot', name: 'Parrot', emoji: '🦜' },
      { id: 'owl', name: 'Owl', emoji: '🦉' },
      { id: 'penguin', name: 'Penguin', emoji: '🐧' }
    ]
  },
  {
    id: 'rare', label: 'Rare', cost: 300, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
    pets: [
      { id: 'fox', name: 'Fox', emoji: '🦊' },
      { id: 'raccoon', name: 'Raccoon', emoji: '🦝' },
      { id: 'koala', name: 'Koala', emoji: '🐨' },
      { id: 'panda', name: 'Panda', emoji: '🐼' },
      { id: 'deer', name: 'Deer', emoji: '🦌' },
      { id: 'flamingo', name: 'Flamingo', emoji: '🦩' },
      { id: 'capybara', name: 'Capybara', emoji: '🦫' },
      { id: 'sloth', name: 'Sloth', emoji: '🦥' },
      { id: 'otter', name: 'Otter', emoji: '🦦' }
    ]
  },
  {
    id: 'precious', label: 'Precious', cost: 500, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20',
    pets: [
      { id: 'redpanda', name: 'Red Panda', emoji: '🦊' },
      { id: 'tiger', name: 'Tiger Cub', emoji: '🐯' },
      { id: 'lion', name: 'Lion Cub', emoji: '🦁' },
      { id: 'elephant', name: 'Elephant', emoji: '🐘' },
      { id: 'giraffe', name: 'Giraffe', emoji: '🦒' },
      { id: 'zebra', name: 'Zebra', emoji: '🦓' },
      { id: 'dolphin', name: 'Dolphin', emoji: '🐬' },
      { id: 'whale', name: 'Whale', emoji: '🐳' },
      { id: 'seal', name: 'Seal', emoji: '🦭' },
      { id: 'octopus', name: 'Octopus', emoji: '🐙' }
    ]
  },
  {
    id: 'unique', label: 'Unique', cost: 800, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20',
    pets: [
      { id: 'polarbear', name: 'Polar Bear', emoji: '🐻‍❄️' },
      { id: 'narwhal', name: 'Narwhal', emoji: '🐋' },
      { id: 'eagle', name: 'Eagle', emoji: '🦅' },
      { id: 'shark', name: 'Great Shark', emoji: '🦈' },
      { id: 'peacock', name: 'Peacock', emoji: '🦚' }
    ]
  },
  {
    id: 'legendary', label: 'Legendary', cost: 1000, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
    pets: [
      { id: 'dragon', name: 'Dragon', emoji: '🐉' },
      { id: 'red_phoenix', name: 'Red Phoenix', emoji: '🐦‍🔥' },
      { id: 'unicorn', name: 'Unicorn', emoji: '🦄' },
      { id: 'axolotl', name: 'Axolotl', emoji: '🦎' },
      { id: 'chimera', name: 'Chimera', emoji: '🦁' }
    ]
  }
];

export const PET_TYPES = PET_TIERS.flatMap(tier => 
  tier.pets.map(p => ({
    name: p.name,
    type: `${tier.label} ${p.name}`,
    image: "", // emoji-driven rendering
    emoji: p.emoji,
    tierId: tier.id,
    cost: tier.cost
  }))
);

export const FOOD_TIERS = [
  {
    id: 'common', label: 'Common Food', cost: 20, growthPts: 5, color: 'text-emerald-400',
    items: [
      { name: 'Cabbage', emoji: '🥬' },
      { name: 'Carrot', emoji: '🥕' },
      { name: 'Leaves', emoji: '🍃' },
      { name: 'Apple', emoji: '🍎' }
    ]
  },
  {
    id: 'rare', label: 'Rare Food', cost: 50, growthPts: 12, color: 'text-blue-400',
    items: [
      { name: 'Beans', emoji: '🫘' },
      { name: 'Cucumber', emoji: '🥒' },
      { name: 'Strawberry', emoji: '🍓' },
      { name: 'Insects', emoji: '🐛' }
    ]
  },
  {
    id: 'precious', label: 'Precious Food', cost: 100, growthPts: 25, color: 'text-purple-400',
    items: [
      { name: 'Blueberries', emoji: '🫐' },
      { name: 'Grapes', emoji: '🍇' },
      { name: 'Tomato', emoji: '🍅' },
      { name: 'Egg', emoji: '🥚' }
    ]
  },
  {
    id: 'hi-protein', label: 'Hi-Protein Food', cost: 200, growthPts: 45, color: 'text-pink-400',
    items: [
      { name: 'Fish', emoji: '🐟' },
      { name: 'Shrimp', emoji: '🍤' },
      { name: 'Chicken', emoji: '🍗' },
      { name: 'Beef', emoji: '🥩' },
      { name: 'Cranberry', emoji: '🍒' }
    ]
  },
  {
    id: 'superfood', label: 'Super Food', cost: 300, growthPts: 80, color: 'text-amber-400',
    items: [
      { name: 'Salmon', emoji: '🐠' },
      { name: 'Lobster', emoji: '🦞' },
      { name: 'Lamb', emoji: '🍖' },
      { name: 'Turkey', emoji: '🦃' },
      { name: 'Durian', emoji: '🍈' }
    ]
  }
];

export const STRANDS = {
  grammar: { name: 'E Grammar', nameZh: '核心文法', planet: 'Mercury', color: '#a9a9a9', icon: PenTool, class: 'planet-mercury', size: 0.45, orbit: 1 },
  vocabulary: { name: 'E Vocabulary', nameZh: '核心字彙', planet: 'Venus', color: '#ffd700', icon: BookOpen, class: 'planet-venus', size: 0.75, orbit: 2 },
  pronunciation: { name: 'Pronunciation', nameZh: '發音練習', planet: 'Mars', color: '#ff4500', icon: Mic2, class: 'planet-mars', size: 0.6, orbit: 3 },
  tests: { name: 'ST.Tests', nameZh: '標準測驗', planet: 'Jupiter', color: '#deb887', icon: GraduationCap, class: 'planet-jupiter', size: 1.25, orbit: 4 },
  saturn: { name: 'Bi-lingual Subjects', nameZh: '雙語學科', planet: 'Saturn', color: '#f4a460', icon: GraduationCap, class: 'planet-saturn', size: 0.95, orbit: 5 },
  uranus: { name: 'Handy Tools', nameZh: '實用工具', planet: 'Uranus', color: '#40e0d0', icon: Hammer, class: 'planet-uranus', size: 0.8, orbit: 6 },
  neptune: { name: 'Fun Games', nameZh: '輕鬆遊戲', planet: 'Neptune', color: '#1e90ff', icon: Gamepad2, class: 'planet-neptune', size: 0.78, orbit: 7 },
};
