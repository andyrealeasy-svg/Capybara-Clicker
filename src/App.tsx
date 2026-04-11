import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MousePointer2, Baby, Citrus, Briefcase, PlaySquare, Trophy, 
  Star, ShoppingCart, Zap, Crown, Award, CalendarDays, Target, CheckCircle, Gift, Flame, X, Sparkles, Dna, Clock
} from 'lucide-react';
import { initYandexSDK, loadData, saveData, showRewardedAd } from './lib/ysdk';
import { initAudio, playPopSound, playBuySound } from './lib/audio';

// --- Types & Constants ---
const getCurrentWeekId = () => Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
const getCurrentDayId = () => Math.floor(Date.now() / (1000 * 60 * 60 * 24));

type UpgradeType = 'click' | 'auto';

interface Upgrade {
  id: string;
  name: string;
  baseCost: number;
  power: number;
  type: UpgradeType;
  icon: React.ElementType;
  description: string;
}

interface Skin {
  id: string;
  name: string;
  description: string;
  cost: number;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  bonuses: {
    clickMultiplier?: number;
    autoMultiplier?: number;
    flatClick?: number;
    flatAuto?: number;
  };
  visuals: {
    body: string;
    snout: string;
    border: string;
    accessory?: string;
    glow?: string;
    opacity?: number;
  };
}

const SKINS: Skin[] = [
  { id: 'default', name: 'Обычная', description: 'Просто милая капибара.', cost: 0, emoji: '🦦', rarity: 'common', bonuses: {}, visuals: { body: '#8B5A2B', snout: '#A06B38', border: '#5C3A21' } },
  { id: 'albino', name: 'Альбинос', description: 'Редкая белая капибара.', cost: 2000, emoji: '🤍', rarity: 'common', bonuses: { autoMultiplier: 1.05 }, visuals: { body: '#FFFFFF', snout: '#FFC0CB', border: '#DDDDDD' } },
  { id: 'melanistic', name: 'Меланист', description: 'Темная как ночь.', cost: 3000, emoji: '🖤', rarity: 'common', bonuses: { clickMultiplier: 1.05 }, visuals: { body: '#222222', snout: '#333333', border: '#000000' } },
  { id: 'worker', name: 'Работяга', description: 'Носит каску. Безопасность превыше всего!', cost: 5000, emoji: '👷', rarity: 'common', bonuses: { autoMultiplier: 1.1 }, visuals: { body: '#8B5A2B', snout: '#A06B38', border: '#5C3A21', accessory: 'hard_hat' } },
  { id: 'chef', name: 'Шеф-повар', description: 'Готовит лучшие мандарины.', cost: 7500, emoji: '👨‍🍳', rarity: 'common', bonuses: { flatAuto: 10 }, visuals: { body: '#8B5A2B', snout: '#A06B38', border: '#5C3A21', accessory: 'chef_hat' } },
  { id: 'clown', name: 'Клоун', description: 'Смешит всех вокруг.', cost: 10000, emoji: '🤡', rarity: 'common', bonuses: { flatClick: 50 }, visuals: { body: '#FFFFFF', snout: '#FFFFFF', border: '#FF0000', accessory: 'clown_nose' } },
  { id: 'ninja', name: 'Ниндзя', description: 'Быстрая как ветер.', cost: 25000, emoji: '🥷', rarity: 'rare', bonuses: { clickMultiplier: 1.2 }, visuals: { body: '#111111', snout: '#222222', border: '#000000', accessory: 'ninja_band' } },
  { id: 'pirate', name: 'Пират', description: 'Ищет мандариновые сокровища.', cost: 35000, emoji: '🏴‍☠️', rarity: 'rare', bonuses: { flatClick: 200 }, visuals: { body: '#8B5A2B', snout: '#A06B38', border: '#5C3A21', accessory: 'eyepatch' } },
  { id: 'gentleman', name: 'Джентльмен', description: 'Очень вежливая капибара.', cost: 50000, emoji: '🎩', rarity: 'rare', bonuses: { autoMultiplier: 1.3 }, visuals: { body: '#8B5A2B', snout: '#A06B38', border: '#5C3A21', accessory: 'top_hat' } },
  { id: 'wizard', name: 'Маг', description: 'Колдует мандарины из воздуха.', cost: 100000, emoji: '🧙', rarity: 'rare', bonuses: { autoMultiplier: 1.5 }, visuals: { body: '#4B0082', snout: '#6A5ACD', border: '#2E0854', accessory: 'wizard_hat' } },
  { id: 'zombie', name: 'Зомби', description: 'Восстала ради мандаринов.', cost: 250000, emoji: '🧟', rarity: 'epic', bonuses: { clickMultiplier: 1.5 }, visuals: { body: '#4C5E3D', snout: '#3A472E', border: '#1A2411', accessory: 'scar' } },
  { id: 'robot', name: 'Киборг', description: 'Механизированная капибара.', cost: 500000, emoji: '🤖', rarity: 'epic', bonuses: { autoMultiplier: 2 }, visuals: { body: '#C0C0C0', snout: '#A9A9A9', border: '#808080', accessory: 'cyber_eye' } },
  { id: 'ghost', name: 'Призрак', description: 'Проходит сквозь стены.', cost: 750000, emoji: '👻', rarity: 'epic', bonuses: { clickMultiplier: 2 }, visuals: { body: '#F8F8FF', snout: '#E6E6FA', border: '#B0C4DE', opacity: 0.7, glow: '#E6E6FA' } },
  { id: 'king', name: 'Король', description: 'Правит мандариновой империей.', cost: 1000000, emoji: '👑', rarity: 'epic', bonuses: { clickMultiplier: 2, autoMultiplier: 2 }, visuals: { body: '#8B5A2B', snout: '#A06B38', border: '#5C3A21', accessory: 'crown' } },
  { id: 'golden', name: 'Золотая', description: 'Сделана из чистого золота.', cost: 5000000, emoji: '✨', rarity: 'epic', bonuses: { flatAuto: 5000 }, visuals: { body: '#FFD700', snout: '#DAA520', border: '#B8860B', glow: '#FFD700' } },
  { id: 'astronaut', name: 'Космонавт', description: 'Собирает космические мандарины.', cost: 10000000, emoji: '👨‍🚀', rarity: 'legendary', bonuses: { clickMultiplier: 3, autoMultiplier: 3 }, visuals: { body: '#FFFFFF', snout: '#E0E0E0', border: '#CCCCCC', accessory: 'helmet' } },
  { id: 'alien', name: 'Пришелец', description: 'Прилетела с планеты Мандарин.', cost: 25000000, emoji: '👽', rarity: 'legendary', bonuses: { flatClick: 10000 }, visuals: { body: '#39FF14', snout: '#32CD32', border: '#006400', accessory: 'antenna' } },
  { id: 'demon', name: 'Демон', description: 'Питается огненными мандаринами.', cost: 50000000, emoji: '😈', rarity: 'legendary', bonuses: { clickMultiplier: 4, autoMultiplier: 4 }, visuals: { body: '#8B0000', snout: '#A52A2A', border: '#4A0000', accessory: 'horns_wings', glow: '#FF0000' } },
  { id: 'cyberpunk', name: 'Киберпанк', description: 'Капибара из будущего.', cost: 75000000, emoji: '🕶️', rarity: 'legendary', bonuses: { autoMultiplier: 5 }, visuals: { body: '#1A1A1A', snout: '#333333', border: '#FF00FF', accessory: 'cyber_glasses', glow: '#00FFFF' } },
  { id: 'god', name: 'Божество', description: 'Истинная форма капибары.', cost: 100000000, emoji: '🌟', rarity: 'mythic', bonuses: { clickMultiplier: 5, autoMultiplier: 5, flatClick: 50000, flatAuto: 50000 }, visuals: { body: '#FFFFE0', snout: '#FFFACD', border: '#FFD700', accessory: 'halo_wings', glow: '#FFFF00' } }
];

const UPGRADES: Upgrade[] = [
  { id: 'click1', name: 'Сильный клик', baseCost: 15, power: 1, type: 'click', icon: MousePointer2, description: '+1 за клик' },
  { id: 'auto1', name: 'Малыш Капи', baseCost: 50, power: 1, type: 'auto', icon: Baby, description: '+1 в секунду' },
  { id: 'auto2', name: 'Любитель мандаринов', baseCost: 500, power: 10, type: 'auto', icon: Citrus, description: '+10 в секунду' },
  { id: 'auto3', name: 'Капи-Бизнесмен', baseCost: 5000, power: 100, type: 'auto', icon: Briefcase, description: '+100 в секунду' },
  { id: 'click2', name: 'Супер лапка', baseCost: 10000, power: 50, type: 'click', icon: MousePointer2, description: '+50 за клик' },
  { id: 'auto4', name: 'Капи-Король', baseCost: 50000, power: 1000, type: 'auto', icon: Trophy, description: '+1000 в секунду' },
];

interface GameState {
  mandarins: number;
  totalMandarins: number;
  ownedUpgrades: Record<string, number>;
  lastSaveTime: number;
  unlockedAchievements: string[];
  stats: {
    upgradesBought: number;
    boostsActivated: number;
    permanentClickBonus: number;
    permanentAutoBonus: number;
    weeklyCompletedTotal: number;
  };
  weekly: {
    weekId: number;
    mandarinsCollected: number;
    upgradesBought: number;
    clicks: number;
    boostsActivated: number;
    completed: string[];
  };
  daily: {
    lastLoginDayId: number;
    consecutiveDays: number;
    claimedToday: boolean;
  };
  autoClicker: {
    permanent: boolean;
    adActiveUntil: number;
    level: number;
  };
  ownedSkins: string[];
  equippedSkin: string;
  chests: number;
  chestBonuses: {
    clickMultiplier: number;
    autoMultiplier: number;
  };
  skipChestAnimation?: boolean;
  prestige: {
    level: number;
    multiplier: number;
    startingMandarins: number;
  };
}

const DEFAULT_STATE: GameState = {
  mandarins: 0,
  totalMandarins: 0,
  ownedUpgrades: {},
  lastSaveTime: Date.now(),
  unlockedAchievements: [],
  stats: {
    upgradesBought: 0,
    boostsActivated: 0,
    permanentClickBonus: 0,
    permanentAutoBonus: 0,
    weeklyCompletedTotal: 0
  },
  weekly: {
    weekId: getCurrentWeekId(),
    mandarinsCollected: 0,
    upgradesBought: 0,
    clicks: 0,
    boostsActivated: 0,
    completed: []
  },
  daily: {
    lastLoginDayId: getCurrentDayId(),
    consecutiveDays: 1,
    claimedToday: false
  },
  autoClicker: {
    permanent: false,
    adActiveUntil: 0,
    level: 1
  },
  ownedSkins: ['default'],
  equippedSkin: 'default',
  chests: 0,
  chestBonuses: {
    clickMultiplier: 0,
    autoMultiplier: 0
  },
  skipChestAnimation: false,
  prestige: {
    level: 0,
    multiplier: 1,
    startingMandarins: 0
  }
};

interface Achievement {
  id: string;
  name: string;
  description: string;
  rewardDesc: string;
  icon: React.ElementType;
  check: (state: GameState, consecutiveClicks: number) => boolean;
  onUnlock: (state: GameState) => GameState;
  tierGroup?: string;
  tierLevel?: number;
  bonusClick?: number;
  bonusAuto?: number;
  bonusChests?: number;
  target: number;
  getProgress: (state: GameState, consecutiveClicks: number) => number;
}

const generateAchievements = (): Achievement[] => {
  const achievements: Achievement[] = [];

  // 1. Collect Mandarins (Infinite)
  for (let i = 1; i <= 100; i++) {
    let target = Math.pow(10, i + 2);
    if (i === 6) target = 1000000000; // Match original ID
    if (i > 6) target = Math.pow(10, i + 2);

    const isEarly = i <= 3;
    const bClick = i === 1 ? 1 : i === 2 ? 5 : i === 3 ? 50 : 50 * (i - 2);
    const bAuto = i >= 4 ? 500 * (i - 3) : 0;
    const bChests = i >= 4 ? (i === 4 ? 1 : i === 5 ? 3 : i === 6 ? 10 : Math.floor(i * 1.5)) : 0;
    const mandReward = target / (i >= 5 ? 10 : 2);

    achievements.push({
      id: `collect_${target}`,
      tierGroup: 'collect',
      tierLevel: i,
      name: i === 1 ? 'Первая тысяча' : i === 2 ? 'Десять тысяч' : i === 3 ? 'Сотня тысяч' : i === 4 ? 'Миллионер' : i === 5 ? 'Мультимиллионер' : i === 6 ? 'Мандариновый Бог' : `Мандариновый Бог ур. ${i - 5}`,
      description: `Собрать ${target.toLocaleString('ru-RU')} мандаринов за всё время.`,
      rewardDesc: `+${bClick.toLocaleString('ru-RU')} к клику${bAuto ? `, +${bAuto.toLocaleString('ru-RU')} авто` : ''}${bChests ? ` и ${bChests} сундуков` : ''}`,
      icon: i >= 4 ? Crown : Star,
      bonusClick: bClick,
      bonusAuto: bAuto,
      bonusChests: bChests,
      target: target,
      getProgress: (state) => state.totalMandarins,
      check: (state) => state.totalMandarins >= target,
      onUnlock: (state) => ({ ...state, mandarins: state.mandarins + mandReward })
    });
  }

  // 2. Upgrades Bought
  const upgradeTargets = [5, 25, 100];
  for (let i = 4; i <= 100; i++) {
    upgradeTargets.push(upgradeTargets[i-2] + (i < 10 ? 150 : 500));
  }
  upgradeTargets.forEach((target, index) => {
    const i = index + 1;
    const bClick = i === 1 ? 5 : i === 2 ? 25 : i === 3 ? 100 : i * 50;
    const bChests = i >= 3 ? Math.floor(i / 2) : 0;
    achievements.push({
      id: `buy_${target}_upgrades`,
      tierGroup: 'upgrades',
      tierLevel: i,
      name: i === 1 ? 'Шопоголик' : i === 2 ? 'Инвестор' : i === 3 ? 'Магнат' : `Магнат ур. ${i - 2}`,
      description: `Купить ${target} любых улучшений.`,
      rewardDesc: `+${bClick.toLocaleString('ru-RU')} к силе клика навсегда${bChests ? ` и ${bChests} сундуков` : ''}`,
      icon: ShoppingCart,
      bonusClick: bClick,
      bonusChests: bChests,
      target: target,
      getProgress: (state) => state.stats.upgradesBought,
      check: (state) => state.stats.upgradesBought >= target,
      onUnlock: (state) => state
    });
  });

  // 3. Consecutive Clicks
  const clickTargets = [100, 500, 1000];
  for (let i = 4; i <= 100; i++) {
    clickTargets.push(clickTargets[i-2] + 1000);
  }
  clickTargets.forEach((target, index) => {
    const i = index + 1;
    const bClick = i === 1 ? 5 : i === 2 ? 25 : i === 3 ? 100 : i * 50;
    const bAuto = bClick;
    const bChests = i >= 3 ? i - 1 : 0;
    achievements.push({
      id: `click_${target}_row`,
      tierGroup: 'clicks',
      tierLevel: i,
      name: i === 1 ? 'Пулемёт' : i === 2 ? 'Турбо-лапки' : i === 3 ? 'Бог кликов' : `Бог кликов ур. ${i - 2}`,
      description: `Кликнуть ${target.toLocaleString('ru-RU')} раз подряд (перерыв < 2 сек).`,
      rewardDesc: `+${bClick.toLocaleString('ru-RU')} к клику, +${bAuto.toLocaleString('ru-RU')} авто навсегда${bChests ? ` и ${bChests} сундуков` : ''}`,
      icon: Zap,
      bonusClick: bClick,
      bonusAuto: bAuto,
      bonusChests: bChests,
      target: target,
      getProgress: (state, consecutive) => consecutive,
      check: (state, consecutive) => consecutive >= target,
      onUnlock: (state) => state
    });
  });

  // 4. Boosts
  const boostTargets = [3, 10, 50];
  for (let i = 4; i <= 100; i++) {
    boostTargets.push(boostTargets[i-2] + 50);
  }
  boostTargets.forEach((target, index) => {
    const i = index + 1;
    const bAuto = i === 1 ? 25 : i === 2 ? 100 : i === 3 ? 500 : i * 250;
    const bChests = i >= 3 ? i : 0;
    achievements.push({
      id: `boost_${target}_times`,
      tierGroup: 'boosts',
      tierLevel: i,
      name: i === 1 ? 'Любитель рекламы' : i === 2 ? 'Спонсор' : i === 3 ? 'Рекламный барон' : `Рекламный барон ур. ${i - 2}`,
      description: `Активировать буст ${target} раз.`,
      rewardDesc: `+${bAuto.toLocaleString('ru-RU')} авто-дохода навсегда${bChests ? ` и ${bChests} сундуков` : ''}`,
      icon: PlaySquare,
      bonusAuto: bAuto,
      bonusChests: bChests,
      target: target,
      getProgress: (state) => state.stats.boostsActivated,
      check: (state) => state.stats.boostsActivated >= target,
      onUnlock: (state) => state
    });
  });

  // 5. Autoclicker
  const autoTargets = [1, 5, 10];
  for (let i = 4; i <= 100; i++) {
    autoTargets.push(autoTargets[i-2] + 5);
  }
  autoTargets.forEach((target, index) => {
    const i = index + 1;
    const bClick = i === 1 ? 250 : i === 2 ? 1000 : i === 3 ? 5000 : i * 2500;
    const bChests = i >= 1 ? (i === 1 ? 1 : i === 2 ? 1 : i === 3 ? 3 : i) : 0;
    achievements.push({
      id: i === 1 ? 'buy_autoclicker' : `upgrade_autoclicker_${target}`,
      tierGroup: 'autoclicker',
      tierLevel: i,
      name: i === 1 ? 'Автоматизация' : i === 2 ? 'Кибер-капибара' : i === 3 ? 'ИИ-Капибара' : `ИИ-Капибара ур. ${i - 2}`,
      description: i === 1 ? 'Купить авто-кликер навсегда.' : `Прокачать авто-кликер до ${target} уровня.`,
      rewardDesc: `+${bClick.toLocaleString('ru-RU')} к клику навсегда${bChests ? ` и ${bChests} сундуков` : ''}`,
      icon: Zap,
      bonusClick: bClick,
      bonusChests: bChests,
      target: target,
      getProgress: (state) => i === 1 ? (state.autoClicker.permanent ? 1 : 0) : state.autoClicker.level,
      check: (state) => i === 1 ? state.autoClicker.permanent : state.autoClicker.level >= target,
      onUnlock: (state) => state
    });
  });

  return achievements;
};

const ACHIEVEMENTS: Achievement[] = generateAchievements();

interface WeeklyChallenge {
  id: string;
  name: string;
  description: string;
  target: number;
  rewardDesc: string;
  bonusChests?: number;
  icon: React.ElementType;
  getProgress: (state: GameState) => number;
  onComplete: (state: GameState) => GameState;
}

const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'weekly_clicks',
    name: 'Трудолюбивые лапки',
    description: 'Сделать 1 000 кликов за неделю.',
    target: 1000,
    rewardDesc: '+50 к клику (на неделю) и +5 навсегда',
    icon: MousePointer2,
    getProgress: (state) => state.weekly.clicks,
    onComplete: (state) => ({
      ...state,
      stats: {
        ...state.stats,
        permanentClickBonus: (state.stats.permanentClickBonus || 0) + 5,
        weeklyCompletedTotal: (state.stats.weeklyCompletedTotal || 0) + 1
      }
    })
  },
  {
    id: 'weekly_mandarins',
    name: 'Урожайная неделя',
    description: 'Собрать 50 000 мандаринов за неделю.',
    target: 50000,
    rewardDesc: '+10 000 🍊 и +20 авто-дохода навсегда',
    icon: Citrus,
    getProgress: (state) => state.weekly.mandarinsCollected,
    onComplete: (state) => ({ 
      ...state, 
      mandarins: state.mandarins + 10000,
      stats: {
        ...state.stats,
        permanentAutoBonus: (state.stats.permanentAutoBonus || 0) + 20,
        weeklyCompletedTotal: (state.stats.weeklyCompletedTotal || 0) + 1
      }
    })
  },
  {
    id: 'weekly_upgrades',
    name: 'Инвестор',
    description: 'Купить 15 любых улучшений за неделю.',
    target: 15,
    rewardDesc: '+200 авто (на неделю) и +50 навсегда',
    icon: Briefcase,
    getProgress: (state) => state.weekly.upgradesBought,
    onComplete: (state) => ({
      ...state,
      stats: {
        ...state.stats,
        permanentAutoBonus: (state.stats.permanentAutoBonus || 0) + 50,
        weeklyCompletedTotal: (state.stats.weeklyCompletedTotal || 0) + 1
      }
    })
  },
  {
    id: 'weekly_clicks_hard',
    name: 'Машина для кликов',
    description: 'Сделать 50 000 кликов за неделю.',
    target: 50000,
    rewardDesc: '+500 к клику (на неделю), +50 навсегда и 1 сундук',
    icon: MousePointer2,
    bonusChests: 1,
    getProgress: (state) => state.weekly.clicks,
    onComplete: (state) => ({
      ...state,
      stats: {
        ...state.stats,
        permanentClickBonus: (state.stats.permanentClickBonus || 0) + 50,
        weeklyCompletedTotal: (state.stats.weeklyCompletedTotal || 0) + 1
      }
    })
  },
  {
    id: 'weekly_mandarins_hard',
    name: 'Мандариновый рай',
    description: 'Собрать 1 000 000 мандаринов за неделю.',
    target: 1000000,
    rewardDesc: '+100 000 🍊, +500 авто навсегда и 2 сундука',
    icon: Citrus,
    bonusChests: 2,
    getProgress: (state) => state.weekly.mandarinsCollected,
    onComplete: (state) => ({ 
      ...state, 
      mandarins: state.mandarins + 100000,
      stats: {
        ...state.stats,
        permanentAutoBonus: (state.stats.permanentAutoBonus || 0) + 500,
        weeklyCompletedTotal: (state.stats.weeklyCompletedTotal || 0) + 1
      }
    })
  },
  {
    id: 'weekly_boosts',
    name: 'Энергичная неделя',
    description: 'Активировать буст 5 раз за неделю.',
    target: 5,
    rewardDesc: '+100 авто (на неделю), +20 навсегда и 1 сундук',
    icon: PlaySquare,
    bonusChests: 1,
    getProgress: (state) => state.weekly.boostsActivated || 0,
    onComplete: (state) => ({
      ...state,
      stats: {
        ...state.stats,
        permanentAutoBonus: (state.stats.permanentAutoBonus || 0) + 20,
        weeklyCompletedTotal: (state.stats.weeklyCompletedTotal || 0) + 1
      }
    })
  }
];

const getRewardForDay = (day: number, totalMandarins: number) => {
  let percent = 0;
  let minReward = 0;
  let rewardClick = 0;

  if (day === 1) { percent = 0.005; minReward = 100; }
  else if (day === 2) { percent = 0.01; minReward = 250; }
  else if (day === 3) { percent = 0.015; minReward = 500; }
  else if (day === 4) { percent = 0.02; minReward = 1000; }
  else if (day === 5) { percent = 0.025; minReward = 2500; }
  else if (day === 6) { percent = 0.03; minReward = 5000; }
  else { percent = 0.05; minReward = 10000; rewardClick = 1; }

  const calculatedReward = Math.floor(totalMandarins * percent);
  const isPercentage = calculatedReward > minReward;
  const rewardMandarins = Math.max(minReward, calculatedReward);
  
  return { rewardMandarins, rewardClick, percent: percent * 100, isPercentage };
};

const getDailyRewardInfo = (state: GameState) => {
  return getRewardForDay(state.daily.consecutiveDays, state.totalMandarins);
};

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  value: number;
}

interface ToastMsg {
  id: string;
  title: string;
  name: string;
  icon: React.ElementType;
}

// --- Main Component ---
export default function App() {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicks, setClicks] = useState<ClickEffect[]>([]);
  const [boostActive, setBoostActive] = useState(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'shop' | 'achievements' | 'challenges' | 'skins' | 'chests' | 'evolution'>('shop');
  const [chestReward, setChestReward] = useState<{ type: 'mandarins' | 'bonus' | 'skin' | 'flat_click' | 'flat_auto' | 'jackpot', value: any } | null>(null);
  const [chestSummary, setChestSummary] = useState<any>(null);
  const [isOpeningChest, setIsOpeningChest] = useState(false);
  const [isOpeningAll, setIsOpeningAll] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  
  const clickIdRef = useRef(0);
  const autoClickAccumulator = useRef(0);
  const lastTickRef = useRef(Date.now());
  const consecutiveClicksRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const prevUnlockedRef = useRef<string[]>([]);
  const prevWeeklyRef = useRef<string[]>([]);

  // Calculate achievement & weekly passive bonuses
  let achClickBonus = 0;
  let achAutoBonus = 0;
  
  // Achievements permanent bonuses
  ACHIEVEMENTS.forEach(ach => {
    if (state.unlockedAchievements.includes(ach.id)) {
      if (ach.bonusClick) achClickBonus += ach.bonusClick;
      if (ach.bonusAuto) achAutoBonus += ach.bonusAuto;
    }
  });

  // Weekly temporary bonuses (active only if completed this week)
  if (state.weekly.completed.includes('weekly_clicks')) achClickBonus += 50;
  if (state.weekly.completed.includes('weekly_clicks_hard')) achClickBonus += 500;
  if (state.weekly.completed.includes('weekly_upgrades')) achAutoBonus += 200;
  if (state.weekly.completed.includes('weekly_boosts')) achAutoBonus += 100;

  // Weekly permanent bonuses (accumulated over all weeks)
  achClickBonus += (state.stats.permanentClickBonus || 0);
  achAutoBonus += (state.stats.permanentAutoBonus || 0);

  // Skin bonuses
  const equippedSkinData = SKINS.find(s => s.id === state.equippedSkin) || SKINS[0];
  const skinFlatClick = equippedSkinData.bonuses.flatClick || 0;
  const skinFlatAuto = equippedSkinData.bonuses.flatAuto || 0;
  const skinClickMult = equippedSkinData.bonuses.clickMultiplier || 1;
  const skinAutoMult = equippedSkinData.bonuses.autoMultiplier || 1;

  // Calculate current powers
  const baseClickPower = 1 + achClickBonus + skinFlatClick + UPGRADES.filter(u => u.type === 'click').reduce((sum, u) => sum + (u.power * (state.ownedUpgrades[u.id] || 0)), 0);
  const baseAutoPower = achAutoBonus + skinFlatAuto + UPGRADES.filter(u => u.type === 'auto').reduce((sum, u) => sum + (u.power * (state.ownedUpgrades[u.id] || 0)), 0);
  
  const clickPower = baseClickPower * skinClickMult * (1 + state.chestBonuses.clickMultiplier);
  const autoPower = baseAutoPower * skinAutoMult * (1 + state.chestBonuses.autoMultiplier);
  
  const prestigeMultiplier = state.prestige?.multiplier || 1;
  const actualClickPower = (boostActive ? clickPower * 2 : clickPower) * prestigeMultiplier;
  const actualAutoPower = (boostActive ? autoPower * 2 : autoPower) * prestigeMultiplier;

  const checkTimeResets = (prevState: GameState): GameState => {
    let nextState = { ...prevState };
    let changed = false;

    // Sanitize broken save files from the exponential bug
    if (nextState.stats.permanentClickBonus > 1000000) {
      nextState.stats.permanentClickBonus = 1000000;
      changed = true;
    }
    if (nextState.stats.permanentAutoBonus > 10000000) {
      nextState.stats.permanentAutoBonus = 10000000;
      changed = true;
    }
    if (nextState.chestBonuses.clickMultiplier > 1000) {
      nextState.chestBonuses.clickMultiplier = 1000;
      changed = true;
    }
    if (nextState.chestBonuses.autoMultiplier > 1000) {
      nextState.chestBonuses.autoMultiplier = 1000;
      changed = true;
    }

    const currentWeek = getCurrentWeekId();
    if (nextState.weekly.weekId !== currentWeek) {
      nextState.weekly = {
        weekId: currentWeek,
        mandarinsCollected: 0,
        upgradesBought: 0,
        clicks: 0,
        boostsActivated: 0,
        completed: []
      };
      changed = true;
    }

    const currentDay = getCurrentDayId();
    if (currentDay > nextState.daily.lastLoginDayId) {
      nextState.daily = { ...nextState.daily };
      if (currentDay === nextState.daily.lastLoginDayId + 1) {
        nextState.daily.consecutiveDays += 1;
      } else {
        nextState.daily.consecutiveDays = 1;
      }
      nextState.daily.lastLoginDayId = currentDay;
      nextState.daily.claimedToday = false;
      changed = true;
    }

    return changed ? nextState : prevState;
  };

  const applyAchievements = (prevState: GameState, consecutive: number): GameState => {
    let nextState = { ...prevState };
    let newlyUnlocked = false;

    ACHIEVEMENTS.forEach(ach => {
      if (!nextState.unlockedAchievements.includes(ach.id) && ach.check(nextState, consecutive)) {
        if (!newlyUnlocked) {
          nextState.unlockedAchievements = [...nextState.unlockedAchievements];
          newlyUnlocked = true;
        }
        nextState.unlockedAchievements.push(ach.id);
        nextState = ach.onUnlock(nextState);
        if (ach.bonusChests) {
          nextState.chests = (nextState.chests || 0) + ach.bonusChests;
        }
      }
    });

    return nextState;
  };

  const applyWeeklyChallenges = (prevState: GameState): GameState => {
    let nextState = { ...prevState };
    let newlyCompleted = false;

    WEEKLY_CHALLENGES.forEach(challenge => {
      if (!nextState.weekly.completed.includes(challenge.id) && challenge.getProgress(nextState) >= challenge.target) {
        if (!newlyCompleted) {
          nextState.weekly = { ...nextState.weekly, completed: [...nextState.weekly.completed] };
          newlyCompleted = true;
        }
        nextState.weekly.completed.push(challenge.id);
        nextState = challenge.onComplete(nextState);
        if (challenge.bonusChests) {
          nextState.chests = (nextState.chests || 0) + challenge.bonusChests;
        }
      }
    });

    return nextState;
  };

  // Initialize SDK and Load Data
  useEffect(() => {
    const init = async () => {
      try {
        await initYandexSDK();
        const savedData = await loadData();
        if (savedData && typeof savedData.mandarins === 'number') {
          const now = Date.now();
          const offlineSeconds = Math.floor((now - (savedData.lastSaveTime || now)) / 1000);
          const validOfflineSeconds = Math.min(offlineSeconds, 3600); // Max 1 hour
          
          const savedAutoPower = UPGRADES.filter(u => u.type === 'auto').reduce((sum, u) => sum + (u.power * (savedData.ownedUpgrades[u.id] || 0)), 0);
          const savedAchAutoBonus = savedData.stats?.permanentAutoBonus || 0;
          const savedPrestigeMultiplier = savedData.prestige?.multiplier || 1;
          const totalOfflineAutoPower = (savedAutoPower + savedAchAutoBonus) * savedPrestigeMultiplier;
          const offlineEarnings = totalOfflineAutoPower * validOfflineSeconds;

          if (offlineEarnings > 0) {
            setTimeout(() => {
              const toastId = 'offline_' + Date.now();
              setToasts(prev => [...prev, { id: toastId, title: 'С возвращением!', name: `Вы заработали ${offlineEarnings.toLocaleString('ru-RU')} 🍊 пока вас не было.`, icon: Clock }]);
              setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toastId));
              }, 4000);
            }, 1000);
          }

          const currentDay = getCurrentDayId();
          let newDaily = savedData.daily || { lastLoginDayId: currentDay, consecutiveDays: 1, claimedToday: false };
          
          if (currentDay > newDaily.lastLoginDayId) {
            if (currentDay === newDaily.lastLoginDayId + 1) {
              newDaily.consecutiveDays += 1;
            } else {
              newDaily.consecutiveDays = 1;
            }
            newDaily.lastLoginDayId = currentDay;
            newDaily.claimedToday = false;
          }

          const loadedState = {
            ...DEFAULT_STATE,
            ...savedData,
            mandarins: savedData.mandarins + offlineEarnings,
            totalMandarins: (savedData.totalMandarins || savedData.mandarins) + offlineEarnings,
            lastSaveTime: now,
            unlockedAchievements: savedData.unlockedAchievements || [],
            stats: { 
              upgradesBought: savedData.stats?.upgradesBought || 0,
              boostsActivated: savedData.stats?.boostsActivated || 0,
              permanentClickBonus: savedData.stats?.permanentClickBonus || 0,
              permanentAutoBonus: savedData.stats?.permanentAutoBonus || 0,
              weeklyCompletedTotal: savedData.stats?.weeklyCompletedTotal || 0
            },
            weekly: {
              ...DEFAULT_STATE.weekly,
              ...(savedData.weekly || {}),
              boostsActivated: savedData.weekly?.boostsActivated || 0
            },
            daily: newDaily,
            autoClicker: savedData.autoClicker || DEFAULT_STATE.autoClicker,
            ownedSkins: savedData.ownedSkins || ['default'],
            equippedSkin: savedData.equippedSkin || 'default',
            chests: savedData.chests || 0,
            chestBonuses: savedData.chestBonuses || { clickMultiplier: 0, autoMultiplier: 0 },
            skipChestAnimation: savedData.skipChestAnimation || false,
            prestige: savedData.prestige || DEFAULT_STATE.prestige
          };
          
          setState(checkTimeResets(loadedState));
          prevUnlockedRef.current = loadedState.unlockedAchievements || [];
          prevWeeklyRef.current = loadedState.weekly?.completed || [];
        }
      } catch (error) {
        console.error("Error during game initialization:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  // Show Daily Modal
  useEffect(() => {
    if (isLoaded && !state.daily.claimedToday) {
      setShowDailyModal(true);
    }
  }, [isLoaded, state.daily.claimedToday]);

  // Handle new achievements & challenges toasts
  useEffect(() => {
    if (!isLoaded) return;
    const newAchievements = state.unlockedAchievements.filter(id => !prevUnlockedRef.current.includes(id));
    const newWeekly = state.weekly.completed.filter(id => !prevWeeklyRef.current.includes(id));
    
    if (newAchievements.length > 0 || newWeekly.length > 0) {
      const newToasts: ToastMsg[] = [];
      
      newAchievements.forEach(id => {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach) newToasts.push({ id: ach.id, title: 'Достижение получено!', name: ach.name, icon: ach.icon });
      });
      
      newWeekly.forEach(id => {
        const chal = WEEKLY_CHALLENGES.find(c => c.id === id);
        if (chal) newToasts.push({ id: chal.id, title: 'Испытание выполнено!', name: chal.name, icon: chal.icon });
      });

      setToasts(prev => [...prev, ...newToasts]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => !newToasts.find(nt => nt.id === t.id)));
      }, 4000);
      
      initAudio();
      playBuySound();
      
      prevUnlockedRef.current = state.unlockedAchievements;
      prevWeeklyRef.current = state.weekly.completed;
    }
  }, [state.unlockedAchievements, state.weekly.completed, isLoaded]);

  // Handle visibility change (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
        lastTickRef.current = Date.now(); // Reset tick to avoid huge jump
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-clicker loop & Boost timer
  useEffect(() => {
    if (!isLoaded || isPaused) {
      lastTickRef.current = Date.now(); // Keep tick updated while paused
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      if (delta > 2) return; // Prevent massive jumps if tab was frozen

      setState(prev => {
        let next = checkTimeResets(prev);
        let changed = false;
        
        const isAutoClickerActive = next.autoClicker.permanent || next.autoClicker.adActiveUntil > now;
        const autoClickRate = next.autoClicker.level * 2;
        
        let autoClickEarned = 0;
        let clicksDone = 0;
        
        if (isAutoClickerActive) {
          autoClickAccumulator.current += autoClickRate * delta;
          clicksDone = Math.floor(autoClickAccumulator.current);
          if (clicksDone > 0) {
            autoClickAccumulator.current -= clicksDone;
            autoClickEarned = clicksDone * actualClickPower;
            changed = true;
            
            // Spawn visual click effect (just one to avoid lag, but representing the value)
            const rect = document.getElementById('capybara-hitbox')?.getBoundingClientRect();
            if (rect) {
              const x = rect.left + rect.width / 2 + (Math.random() * 60 - 30);
              const y = rect.top + rect.height / 2 + (Math.random() * 60 - 30);
              const newClick = {
                id: clickIdRef.current++,
                x,
                y,
                value: autoClickEarned,
              };
              setClicks(cPrev => [...cPrev.slice(-15), newClick]);
              setTimeout(() => {
                setClicks(cPrev => cPrev.filter(c => c.id !== newClick.id));
              }, 1000);
            }
          }
        }

        const passiveEarned = actualAutoPower * delta;
        const totalEarned = passiveEarned + autoClickEarned;

        if (totalEarned > 0) {
          next = {
            ...next,
            mandarins: next.mandarins + totalEarned,
            totalMandarins: next.totalMandarins + totalEarned,
            weekly: {
              ...next.weekly,
              mandarinsCollected: next.weekly.mandarinsCollected + totalEarned,
              clicks: next.weekly.clicks + clicksDone
            }
          };
          changed = true;
        }

        if (changed) {
          next = applyAchievements(next, consecutiveClicksRef.current);
          next = applyWeeklyChallenges(next);
          return next;
        }
        
        return prev;
      });

      if (boostTimeLeft > 0) {
        setBoostTimeLeft(prev => {
          if (prev <= 1) {
            setBoostActive(false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 100); // 10 ticks per second for smoother numbers

    return () => clearInterval(interval);
  }, [isLoaded, isPaused, actualAutoPower, actualClickPower, boostTimeLeft]);

  // Auto-save loop (every 10 seconds)
  useEffect(() => {
    if (!isLoaded) return;
    const saveInterval = setInterval(() => {
      const stateToSave = { ...state, lastSaveTime: Date.now() };
      saveData(stateToSave);
    }, 10000);
    return () => clearInterval(saveInterval);
  }, [isLoaded, state]);

  const handleCapybaraClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    initAudio();
    playPopSound();

    const now = Date.now();
    if (now - lastClickTimeRef.current < 2000) {
      consecutiveClicksRef.current += 1;
    } else {
      consecutiveClicksRef.current = 1;
    }
    lastClickTimeRef.current = now;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Add floating text
    const newClick = {
      id: clickIdRef.current++,
      x: clientX + (Math.random() * 40 - 20) - 20, // offset left slightly to center text
      y: clientY + (Math.random() * 40 - 20) - 60, // offset up to avoid finger
      value: actualClickPower,
    };
    setClicks(prev => [...prev, newClick]);
    
    // Remove floating text after animation
    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== newClick.id));
    }, 1000);

    setState(prev => {
      let next = checkTimeResets(prev);
      next = {
        ...next,
        mandarins: next.mandarins + actualClickPower,
        totalMandarins: next.totalMandarins + actualClickPower,
        weekly: {
          ...next.weekly,
          clicks: next.weekly.clicks + 1,
          mandarinsCollected: next.weekly.mandarinsCollected + actualClickPower
        }
      };
      next = applyAchievements(next, consecutiveClicksRef.current);
      next = applyWeeklyChallenges(next);
      return next;
    });
  };

  const getUpgradeCost = (upgrade: Upgrade) => {
    const count = state.ownedUpgrades[upgrade.id] || 0;
    return Math.floor(upgrade.baseCost * Math.pow(1.15, count));
  };

  const buyChest = () => {
    const cost = 100000;
    if (state.mandarins >= cost) {
      initAudio();
      playBuySound();
      setState(prev => {
        let next = checkTimeResets(prev);
        next = { ...next, mandarins: next.mandarins - cost, chests: next.chests + 1 };
        saveData({ ...next, lastSaveTime: Date.now() });
        return next;
      });
    }
  };

  const buyChestAd = () => {
    showRewardedAd(() => {
      initAudio();
      playBuySound();
      setState(prev => {
        let next = checkTimeResets(prev);
        next = { ...next, chests: next.chests + 1 };
        saveData({ ...next, lastSaveTime: Date.now() });
        return next;
      });
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, { id: toastId, title: 'Успех!', name: 'Сундук получен за просмотр рекламы!', icon: Gift }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 4000);
    });
  };

  const processChestRewards = (count: number) => {
    setState(prev => {
      let next = checkTimeResets(prev);
      const chestsToOpen = Math.min(next.chests, count);
      if (chestsToOpen <= 0) return next;
      
      next = { ...next, chests: next.chests - chestsToOpen };
      
      const summary = {
        mandarins: 0,
        flat_click: 0,
        flat_auto: 0,
        multi_click: 0,
        multi_auto: 0,
        skins: [] as any[],
        jackpots: 0,
        openedCount: chestsToOpen
      };
      
      const upgradeClickPower = 1 + UPGRADES.filter(u => u.type === 'click').reduce((sum, u) => sum + (u.power * (next.ownedUpgrades[u.id] || 0)), 0);
      const upgradeAutoPower = UPGRADES.filter(u => u.type === 'auto').reduce((sum, u) => sum + (u.power * (next.ownedUpgrades[u.id] || 0)), 0);

      for (let i = 0; i < chestsToOpen; i++) {
        const rand = Math.random();
        if (rand < 0.40) {
          const amount = Math.min(Math.max(5000, actualAutoPower * 1800), 5000000);
          summary.mandarins += amount;
          next.mandarins += amount;
          next.totalMandarins += amount;
        } else if (rand < 0.65) {
          const amount = Math.min(Math.max(50000, actualAutoPower * 7200), 20000000);
          summary.mandarins += amount;
          next.mandarins += amount;
          next.totalMandarins += amount;
        } else if (rand < 0.75) {
          const amount = Math.floor(upgradeClickPower * (Math.random() * 0.1 + 0.05)) + 50;
          summary.flat_click += amount;
          next.stats.permanentClickBonus = (next.stats.permanentClickBonus || 0) + amount;
        } else if (rand < 0.85) {
          const amount = Math.floor(upgradeAutoPower * (Math.random() * 0.1 + 0.05)) + 500;
          summary.flat_auto += amount;
          next.stats.permanentAutoBonus = (next.stats.permanentAutoBonus || 0) + amount;
        } else if (rand < 0.93) {
          const isClick = Math.random() < 0.5;
          const amount = 0.05;
          if (isClick) summary.multi_click += amount;
          else summary.multi_auto += amount;
          next.chestBonuses = {
            ...next.chestBonuses,
            clickMultiplier: next.chestBonuses.clickMultiplier + (isClick ? amount : 0),
            autoMultiplier: next.chestBonuses.autoMultiplier + (!isClick ? amount : 0)
          };
        } else if (rand < 0.98) {
          const rarityRand = Math.random();
          let targetRarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' = 'common';
          if (rarityRand < 0.02) targetRarity = 'mythic';
          else if (rarityRand < 0.1) targetRarity = 'legendary';
          else if (rarityRand < 0.3) targetRarity = 'epic';
          else if (rarityRand < 0.6) targetRarity = 'rare';
          
          const availableSkins = SKINS.filter(s => s.rarity === targetRarity && !next.ownedSkins.includes(s.id));
          
          if (availableSkins.length > 0) {
            const skin = availableSkins[Math.floor(Math.random() * availableSkins.length)];
            summary.skins.push(skin);
            next.ownedSkins = [...next.ownedSkins, skin.id];
          } else {
            const isClick = Math.random() < 0.5;
            const amount = isClick ? Math.floor(upgradeClickPower * 0.1) + 50 : Math.floor(upgradeAutoPower * 0.1) + 500;
            if (isClick) summary.flat_click += amount;
            else summary.flat_auto += amount;
            if (isClick) {
              next.stats.permanentClickBonus = (next.stats.permanentClickBonus || 0) + amount;
            } else {
              next.stats.permanentAutoBonus = (next.stats.permanentAutoBonus || 0) + amount;
            }
          }
        } else {
          const amount = Math.min(Math.max(1000000, actualAutoPower * 86400), 50000000);
          const autoBonus = Math.floor(upgradeAutoPower * 0.5) + 2500;
          const clickBonus = Math.floor(upgradeClickPower * 0.5) + 250;
          summary.jackpots += 1;
          summary.mandarins += amount;
          next.mandarins += amount;
          next.totalMandarins += amount;
          summary.flat_auto += autoBonus;
          summary.flat_click += clickBonus;
          next.stats.permanentAutoBonus = (next.stats.permanentAutoBonus || 0) + autoBonus;
          next.stats.permanentClickBonus = (next.stats.permanentClickBonus || 0) + clickBonus;
        }
      }
      
      if (chestsToOpen === 1 && summary.skins.length === 0 && summary.jackpots === 0 && summary.multi_auto === 0 && summary.multi_click === 0 && summary.flat_auto === 0 && summary.flat_click === 0) {
         setChestReward({ type: 'mandarins', value: summary.mandarins });
      } else if (chestsToOpen === 1 && summary.skins.length > 0) {
         setChestReward({ type: 'skin', value: summary.skins[0] });
      } else if (chestsToOpen === 1 && summary.jackpots > 0) {
         setChestReward({ type: 'jackpot', value: summary.mandarins });
      } else if (chestsToOpen === 1 && summary.flat_click > 0) {
         setChestReward({ type: 'flat_click', value: summary.flat_click });
      } else if (chestsToOpen === 1 && summary.flat_auto > 0) {
         setChestReward({ type: 'flat_auto', value: summary.flat_auto });
      } else if (chestsToOpen === 1 && (summary.multi_click > 0 || summary.multi_auto > 0)) {
         setChestReward({ type: 'bonus', value: { isClick: summary.multi_click > 0, amount: summary.multi_click > 0 ? summary.multi_click : summary.multi_auto } });
      } else {
         setChestSummary(summary);
      }
      
      saveData({ ...next, lastSaveTime: Date.now() });
      return next;
    });
  };

  const openChest = () => {
    if (state.chests <= 0) return;
    initAudio();
    playPopSound();
    
    if (state.skipChestAnimation) {
      processChestRewards(1);
    } else {
      setIsOpeningChest(true);
      setTimeout(() => {
        setIsOpeningChest(false);
        processChestRewards(1);
      }, 1500);
    }
  };

  const openAllChests = () => {
    if (state.chests <= 0) return;
    initAudio();
    playPopSound();
    
    if (state.skipChestAnimation) {
      processChestRewards(state.chests);
    } else {
      setIsOpeningAll(true);
      setTimeout(() => {
        setIsOpeningAll(false);
        processChestRewards(state.chests);
      }, 2500);
    }
  };

  const buySkin = (skinId: string, cost: number) => {
    if (state.mandarins >= cost && !state.ownedSkins.includes(skinId)) {
      initAudio();
      playBuySound();
      setState(prev => {
        let next = checkTimeResets(prev);
        next = {
          ...next,
          mandarins: next.mandarins - cost,
          ownedSkins: [...next.ownedSkins, skinId],
          equippedSkin: skinId
        };
        saveData({ ...next, lastSaveTime: Date.now() });
        return next;
      });
    }
  };

  const equipSkin = (skinId: string) => {
    if (state.ownedSkins.includes(skinId)) {
      initAudio();
      playPopSound();
      setState(prev => {
        let next = checkTimeResets(prev);
        next = {
          ...next,
          equippedSkin: skinId
        };
        saveData({ ...next, lastSaveTime: Date.now() });
        return next;
      });
    }
  };

  const performPrestige = () => {
    initAudio();
    playBuySound();
    setState(prev => {
      const nextLevel = (prev.prestige?.level || 0) + 1;
      const nextMultiplier = 1 + (nextLevel * 0.5); // +50% per level
      const nextStartingMandarins = nextLevel * 10000;

      const nextState: GameState = {
        ...DEFAULT_STATE,
        weekly: prev.weekly, // Keep weekly challenges
        daily: prev.daily, // Keep daily streaks
        prestige: {
          level: nextLevel,
          multiplier: nextMultiplier,
          startingMandarins: nextStartingMandarins
        },
        mandarins: nextStartingMandarins,
        totalMandarins: nextStartingMandarins,
        lastSaveTime: Date.now()
      };
      
      saveData(nextState);
      return nextState;
    });
    
    // Show toast
    const toastId = Date.now().toString();
    setToasts(prev => [...prev, { id: toastId, title: 'Эволюция!', name: 'Вы переродились и стали сильнее!', icon: Sparkles }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4000);
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    const cost = getUpgradeCost(upgrade);
    if (state.mandarins >= cost) {
      initAudio();
      playBuySound();
      setState(prev => {
        let next = checkTimeResets(prev);
        next = {
          ...next,
          mandarins: next.mandarins - cost,
          ownedUpgrades: {
            ...next.ownedUpgrades,
            [upgrade.id]: (next.ownedUpgrades[upgrade.id] || 0) + 1
          },
          stats: {
            ...next.stats,
            upgradesBought: next.stats.upgradesBought + 1
          },
          weekly: {
            ...next.weekly,
            upgradesBought: next.weekly.upgradesBought + 1
          }
        };
        next = applyAchievements(next, consecutiveClicksRef.current);
        next = applyWeeklyChallenges(next);
        saveData({ ...next, lastSaveTime: Date.now() });
        return next;
      });
    }
  };

  const activateBoost = () => {
    showRewardedAd(
      () => {
        setBoostActive(true);
        setBoostTimeLeft(60); // 60 seconds of 2x boost
        setState(prev => {
          let next = checkTimeResets(prev);
          next = {
            ...next,
            stats: { ...next.stats, boostsActivated: next.stats.boostsActivated + 1 },
            weekly: { ...next.weekly, boostsActivated: (next.weekly.boostsActivated || 0) + 1 }
          };
          next = applyAchievements(next, consecutiveClicksRef.current);
          next = applyWeeklyChallenges(next);
          saveData({ ...next, lastSaveTime: Date.now() });
          return next;
        });
      },
      () => setIsPaused(true), // onOpen
      () => {
        setIsPaused(false);
        lastTickRef.current = Date.now(); // Reset tick after ad
      } // onClose
    );
  };

  const activateAutoClickerAd = () => {
    showRewardedAd(
      () => {
        setState(prev => ({
          ...prev,
          autoClicker: { ...prev.autoClicker, adActiveUntil: Date.now() + 60000 }
        }));
      },
      () => setIsPaused(true),
      () => {
        setIsPaused(false);
        lastTickRef.current = Date.now();
      }
    );
  };

  const buyAutoClickerWithMandarins = () => {
    const cost = 1000000;
    if (state.mandarins >= cost) {
      initAudio();
      playBuySound();
      setState(prev => ({
        ...prev,
        mandarins: prev.mandarins - cost,
        autoClicker: { ...prev.autoClicker, permanent: true }
      }));
    }
  };

  const buyAutoClickerWithYAN = () => {
    initAudio();
    playBuySound();
    setState(prev => ({
      ...prev,
      autoClicker: { ...prev.autoClicker, permanent: true }
    }));
  };

  const upgradeAutoClicker = () => {
    const cost = 500000 * Math.pow(2, state.autoClicker.level - 1);
    if (state.mandarins >= cost) {
      initAudio();
      playBuySound();
      setState(prev => ({
        ...prev,
        mandarins: prev.mandarins - cost,
        autoClicker: { ...prev.autoClicker, level: prev.autoClicker.level + 1 }
      }));
    }
  };

  const claimDailyReward = () => {
    const { rewardMandarins, rewardClick } = getDailyRewardInfo(state);
  
    initAudio();
    playBuySound();
  
    setState(prev => {
      const next = {
        ...prev,
        mandarins: prev.mandarins + rewardMandarins,
        totalMandarins: prev.totalMandarins + rewardMandarins,
        stats: {
          ...prev.stats,
          permanentClickBonus: (prev.stats.permanentClickBonus || 0) + rewardClick
        },
        daily: {
          ...prev.daily,
          claimedToday: true
        }
      };
      saveData({ ...next, lastSaveTime: Date.now() });
      return next;
    });
    setShowDailyModal(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 text-orange-800 font-bold text-2xl">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* Daily Reward Modal */}
      {showDailyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-orange-400 text-center"
          >
            <h2 className="text-2xl font-black text-orange-600 mb-2">Ежедневный бонус!</h2>
            <p className="text-gray-600 mb-6 font-medium">
              Вы заходите в игру <span className="text-orange-500 font-bold">{state.daily.consecutiveDays}</span> дней подряд.
            </p>
            
            <div className="flex justify-center mb-6">
              <div className="bg-orange-100 p-6 rounded-full border-4 border-orange-300 shadow-inner">
                <Gift size={64} className="text-orange-500" />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1 font-bold uppercase tracking-wider">Ваша награда:</div>
              <div className="text-2xl font-black text-orange-600">
                +{getDailyRewardInfo(state).rewardMandarins.toLocaleString('ru-RU')} 🍊
              </div>
              {getDailyRewardInfo(state).isPercentage && (
                <div className="text-xs text-orange-500 font-bold mt-1">
                  (Бонус за прогресс: {getDailyRewardInfo(state).percent}% от всех собранных!)
                </div>
              )}
              {getDailyRewardInfo(state).rewardClick > 0 && (
                <div className="text-sm font-bold text-green-600 mt-2">
                  +{getDailyRewardInfo(state).rewardClick} к силе клика навсегда!
                </div>
              )}
            </div>
            
            <button 
              onClick={claimDailyReward}
              className="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
            >
              Забрать награду
            </button>
          </motion.div>
        </div>
      )}

      {/* Chest Reward Modal */}
      {chestReward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setChestReward(null)}>
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden border-4 border-yellow-400"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-7xl mb-4 animate-bounce drop-shadow-lg">🎁</div>
            <h2 className="text-3xl font-black text-orange-800 mb-4 drop-shadow-sm">Награда!</h2>
            
            <div className="bg-white/60 rounded-2xl p-6 mb-6 shadow-inner">
              {chestReward.type === 'mandarins' && (
                <>
                  <div className="text-5xl mb-2">🍊</div>
                  <div className="text-2xl font-black text-orange-600">+{chestReward.value.toLocaleString('ru-RU')}</div>
                  <div className="text-sm font-bold text-orange-800/60 uppercase tracking-wider mt-1">Мандаринов</div>
                </>
              )}
              {chestReward.type === 'bonus' && (
                <>
                  <div className="text-5xl mb-2">⚡</div>
                  <div className="text-2xl font-black text-blue-600">+{chestReward.value.amount}x</div>
                  <div className="text-sm font-bold text-blue-800/60 uppercase tracking-wider mt-1">
                    К {chestReward.value.isClick ? 'клику' : 'авто-доходу'} навсегда
                  </div>
                </>
              )}
              {chestReward.type === 'flat_click' && (
                <>
                  <div className="text-5xl mb-2">👆</div>
                  <div className="text-2xl font-black text-red-500">+{chestReward.value.toLocaleString('ru-RU')}</div>
                  <div className="text-sm font-bold text-red-800/60 uppercase tracking-wider mt-1">
                    К силе клика навсегда
                  </div>
                </>
              )}
              {chestReward.type === 'flat_auto' && (
                <>
                  <div className="text-5xl mb-2">⚙️</div>
                  <div className="text-2xl font-black text-green-600">+{chestReward.value.toLocaleString('ru-RU')}</div>
                  <div className="text-sm font-bold text-green-800/60 uppercase tracking-wider mt-1">
                    К авто-доходу навсегда
                  </div>
                </>
              )}
              {chestReward.type === 'jackpot' && (
                <>
                  <div className="text-6xl mb-2 animate-pulse">🎰</div>
                  <div className="text-3xl font-black text-yellow-500 drop-shadow-md">ДЖЕКПОТ!</div>
                  <div className="text-xl font-bold text-orange-600 mt-2">+{chestReward.value.toLocaleString('ru-RU')} 🍊</div>
                  <div className="text-sm font-bold text-yellow-800/80 mt-1">
                    +500 к клику и +5000 к авто навсегда!
                  </div>
                </>
              )}
              {chestReward.type === 'skin' && (
                <>
                  <div className="text-6xl mb-2 drop-shadow-md">{chestReward.value.emoji}</div>
                  <div className="text-xl font-black text-purple-600 leading-tight mb-1">{chestReward.value.name}</div>
                  <div className="text-xs font-bold text-purple-800/60 uppercase tracking-wider">Новый скин!</div>
                </>
              )}
            </div>

            <button 
              onClick={() => setChestReward(null)}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg"
            >
              Забрать
            </button>
          </motion.div>
        </div>
      )}

      {/* Chest Summary Modal */}
      {chestSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setChestSummary(null)}>
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden border-4 border-yellow-400 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-6xl mb-2 drop-shadow-lg">🎁</div>
            <h2 className="text-2xl font-black text-orange-800 mb-1 drop-shadow-sm">Открыто сундуков: {chestSummary.openedCount}</h2>
            <p className="text-sm font-bold text-orange-600/80 mb-4 uppercase tracking-wider">Ваши награды</p>
            
            <div className="bg-white/60 rounded-2xl p-4 mb-6 shadow-inner overflow-y-auto flex-1 flex flex-col gap-3">
              {chestSummary.jackpots > 0 && (
                <div className="flex items-center gap-3 bg-yellow-100/80 p-3 rounded-xl border border-yellow-300">
                  <div className="text-3xl animate-pulse">🎰</div>
                  <div className="text-left flex-1">
                    <div className="font-black text-yellow-600">ДЖЕКПОТ x{chestSummary.jackpots}</div>
                    <div className="text-xs font-bold text-yellow-800/60">Невероятная удача!</div>
                  </div>
                </div>
              )}
              
              {chestSummary.mandarins > 0 && (
                <div className="flex items-center gap-3 bg-orange-50 p-3 rounded-xl border border-orange-200">
                  <div className="text-3xl">🍊</div>
                  <div className="text-left flex-1">
                    <div className="font-black text-orange-600">+{chestSummary.mandarins.toLocaleString('ru-RU')}</div>
                    <div className="text-xs font-bold text-orange-800/60">Мандаринов</div>
                  </div>
                </div>
              )}

              {chestSummary.flat_click > 0 && (
                <div className="flex items-center gap-3 bg-red-50 p-3 rounded-xl border border-red-200">
                  <div className="text-3xl">👆</div>
                  <div className="text-left flex-1">
                    <div className="font-black text-red-500">+{chestSummary.flat_click.toLocaleString('ru-RU')}</div>
                    <div className="text-xs font-bold text-red-800/60">К силе клика навсегда</div>
                  </div>
                </div>
              )}

              {chestSummary.flat_auto > 0 && (
                <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-200">
                  <div className="text-3xl">⚙️</div>
                  <div className="text-left flex-1">
                    <div className="font-black text-green-600">+{chestSummary.flat_auto.toLocaleString('ru-RU')}</div>
                    <div className="text-xs font-bold text-green-800/60">К авто-доходу навсегда</div>
                  </div>
                </div>
              )}

              {(chestSummary.multi_click > 0 || chestSummary.multi_auto > 0) && (
                <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-200">
                  <div className="text-3xl">⚡</div>
                  <div className="text-left flex-1">
                    {chestSummary.multi_click > 0 && <div className="font-black text-blue-600">+{chestSummary.multi_click.toFixed(2)}x к клику</div>}
                    {chestSummary.multi_auto > 0 && <div className="font-black text-blue-600">+{chestSummary.multi_auto.toFixed(2)}x к авто</div>}
                    <div className="text-xs font-bold text-blue-800/60">Постоянные множители</div>
                  </div>
                </div>
              )}

              {chestSummary.skins.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="text-sm font-black text-purple-800 text-left">Новые скины:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {chestSummary.skins.map((skin: any, idx: number) => (
                      <div key={idx} className="bg-purple-50 p-2 rounded-xl border border-purple-200 flex flex-col items-center justify-center">
                        <div className="text-3xl mb-1">{skin.emoji}</div>
                        <div className="text-xs font-bold text-purple-700 text-center leading-tight">{skin.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setChestSummary(null)}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg shrink-0"
            >
              Забрать всё
            </button>
          </motion.div>
        </div>
      )}

      {/* Opening Single Chest Animation */}
      {isOpeningChest && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1, 1.3, 0.9, 1.5],
              rotate: [0, -10, 10, -15, 15, 0],
              filter: ["brightness(1)", "brightness(1.2)", "brightness(1.5)", "brightness(2)"]
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="text-9xl drop-shadow-[0_0_30px_rgba(255,200,0,0.8)]"
          >
            🎁
          </motion.div>
        </div>
      )}

      {/* Opening All Chests Animation */}
      {isOpeningAll && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden">
          <motion.div
            animate={{ 
              scale: [1, 1.5, 2, 3, 5],
              rotate: [0, -5, 5, -10, 10, -20, 20, 0],
              opacity: [1, 1, 1, 1, 0]
            }}
            transition={{ duration: 2.5, ease: "easeIn" }}
            className="text-[150px] drop-shadow-[0_0_50px_rgba(255,150,0,1)] relative z-10"
          >
            🎁
          </motion.div>
          
          {/* Particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.5, 2, 0.5],
                x: (Math.random() - 0.5) * window.innerWidth,
                y: (Math.random() - 0.5) * window.innerHeight
              }}
              transition={{ duration: 2, delay: Math.random() * 0.5, ease: "easeOut" }}
              className="absolute text-4xl z-0"
            >
              {['✨', '🍊', '⚡', '🌟', '💎'][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </div>
      )}

      {/* Streak Modal */}
      {showStreakModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowStreakModal(false)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-orange-400 flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-orange-600 flex items-center gap-2">
                <Flame className="text-orange-500 fill-orange-500" /> Серия входов
              </h2>
              <button onClick={() => setShowStreakModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4 font-medium text-sm">
              Заходите каждый день, чтобы увеличивать награду! Текущая серия: <span className="text-orange-500 font-bold">{state.daily.consecutiveDays}</span>
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {[1, 2, 3, 4, 5, 6, 7].map(day => {
                const isCurrent = day === Math.min(state.daily.consecutiveDays, 7);
                const isPast = day < Math.min(state.daily.consecutiveDays, 7) || (isCurrent && state.daily.claimedToday);
                const rewardInfo = getRewardForDay(day, state.totalMandarins);
                
                return (
                  <div key={day} className={`flex items-center gap-4 p-3 rounded-2xl border-2 transition-all ${
                    isCurrent && !state.daily.claimedToday ? 'bg-orange-50 border-orange-400 shadow-md' :
                    isPast ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100'
                  }`}>
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black ${
                      isPast ? 'bg-green-100 text-green-600' : 
                      isCurrent && !state.daily.claimedToday ? 'bg-orange-500 text-white shadow-inner' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isPast ? <CheckCircle size={20} /> : day === 7 ? '7+' : day}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">День {day === 7 ? '7 и далее' : day}</div>
                      <div className="text-sm font-black text-orange-500">
                        +{rewardInfo.rewardMandarins.toLocaleString('ru-RU')} 🍊
                      </div>
                      {rewardInfo.rewardClick > 0 && (
                        <div className="text-xs font-bold text-green-600">+{rewardInfo.rewardClick} к клику навсегда!</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Toasts Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id} 
              initial={{ opacity: 0, y: 50, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.8 }} 
              className="bg-white border-2 border-orange-400 p-4 rounded-xl shadow-xl flex items-center gap-3 pointer-events-auto"
            >
              <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <t.icon size={24} />
              </div>
              <div>
                <div className="text-xs text-orange-500 font-bold uppercase tracking-wider">{t.title}</div>
                <div className="font-bold text-gray-800">{t.name}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Left Panel - Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative select-none">
        
        {/* Streak Button */}
        <button 
          onClick={() => setShowStreakModal(true)}
          className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-white/80 backdrop-blur-md border-2 border-orange-300 px-3 py-2 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all"
        >
          <Flame size={24} className="text-orange-500 fill-orange-500" />
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-orange-800/60 font-bold uppercase leading-none">Серия</span>
            <span className="text-lg font-black text-orange-600 leading-none">{state.daily.consecutiveDays}</span>
          </div>
        </button>

        {/* Score Header */}
        <div className="absolute top-8 text-center z-10">
          <h1 className="text-4xl md:text-6xl font-black text-orange-600 drop-shadow-sm">
            {Math.floor(state.mandarins).toLocaleString('ru-RU')}
          </h1>
          <p className="text-lg md:text-xl font-bold text-orange-400 mt-2">
            Мандаринов
          </p>
        </div>

        {/* Boost Timer */}
        {boostActive && (
          <div className="absolute top-36 bg-red-500 text-white px-4 py-2 rounded-full font-bold animate-pulse z-10 shadow-lg">
            🔥 2x БУСТ: {boostTimeLeft}с
          </div>
        )}

        {/* Clickable Capybara */}
        <motion.div
          id="capybara-hitbox"
          className="relative cursor-pointer mt-20 md:mt-0 z-20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCapybaraClick}
          onTouchStart={handleCapybaraClick}
        >
          {/* Simple CSS Capybara representation */}
          <div className="w-64 h-64 md:w-80 md:h-80 relative drop-shadow-2xl">
            {(() => {
              const skin = SKINS.find(s => s.id === state.equippedSkin) || SKINS[0];
              const v = skin.visuals;
              return (
                <>
                  {/* Body */}
                  <div className="absolute inset-0 rounded-[40%] border-4 shadow-inner" style={{ backgroundColor: v.body, borderColor: v.border, opacity: v.opacity || 1, boxShadow: v.glow ? `0 0 30px ${v.glow}` : undefined }}></div>
                  {/* Snout */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-24 rounded-[50%] border-4" style={{ backgroundColor: v.snout, borderColor: v.border, opacity: v.opacity || 1 }}></div>
                  {/* Nose */}
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-12 h-8 bg-[#3E2723] rounded-full"></div>
                  {/* Eyes */}
                  <div className="absolute top-24 left-16 w-6 h-6 bg-[#3E2723] rounded-full"></div>
                  <div className="absolute top-24 right-16 w-6 h-6 bg-[#3E2723] rounded-full"></div>
                  {/* Ears */}
                  <div className="absolute -top-4 left-12 w-16 h-16 rounded-full border-4 -z-10" style={{ backgroundColor: v.body, borderColor: v.border, opacity: v.opacity || 1 }}></div>
                  <div className="absolute -top-4 right-12 w-16 h-16 rounded-full border-4 -z-10" style={{ backgroundColor: v.body, borderColor: v.border, opacity: v.opacity || 1 }}></div>
                  
                  {/* Equipped Skin Emoji (Accessory) */}
                  {state.equippedSkin !== 'default' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl md:text-8xl z-30 drop-shadow-lg pointer-events-none">
                      {skin.emoji}
                    </div>
                  )}
                  
                  {/* Mandarin on head */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-500 rounded-full border-4 border-orange-700 shadow-lg flex items-center justify-center z-40">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full -mt-2"></div>
                  </div>
                </>
              );
            })()}
          </div>
        </motion.div>

        {/* Floating Clicks */}
        <AnimatePresence>
          {clicks.map(click => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: 0, x: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -100, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="fixed pointer-events-none text-3xl font-black text-orange-500 drop-shadow-2xl z-[9999]"
              style={{ left: click.x, top: click.y }}
            >
              +{click.value}
            </motion.div>
          ))}
        </AnimatePresence>

      </div>

      {/* Right Panel - Upgrades & Achievements */}
      <div className="w-full md:w-96 bg-white/80 backdrop-blur-md border-t md:border-t-0 md:border-l border-orange-200 flex flex-col h-[50vh] md:h-screen shadow-2xl z-30">
        
        <div className="p-4 bg-orange-100 border-b border-orange-200 flex flex-col gap-3 shrink-0">
          {/* Income Stats */}
          <div className="flex gap-2 justify-between text-sm font-bold text-orange-800/80">
            <div className="bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-orange-200 flex items-center gap-1.5 flex-1 justify-center">
              <Baby size={16} className="text-orange-500" />
              <span>{actualAutoPower.toLocaleString('ru-RU')} / сек</span>
            </div>
            <div className="bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-orange-200 flex items-center gap-1.5 flex-1 justify-center">
              <MousePointer2 size={16} className="text-orange-500" />
              <span>{actualClickPower.toLocaleString('ru-RU')} / клик</span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-1">
            <h2 className="text-xl font-black text-orange-800 uppercase tracking-wider">
              {activeTab === 'shop' ? 'Магазин' : activeTab === 'achievements' ? 'Достижения' : activeTab === 'skins' ? 'Скины' : activeTab === 'chests' ? 'Сундуки' : activeTab === 'evolution' ? 'Эволюция' : 'Испытания'}
            </h2>
            <button 
              onClick={activateBoost}
              disabled={boostActive}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              <PlaySquare size={16} />
              {boostActive ? 'Буст активен' : '2x БУСТ'}
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-orange-200/50 p-1 rounded-lg overflow-x-auto">
            <button 
              onClick={() => setActiveTab('shop')} 
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'shop' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-800/60 hover:bg-orange-200'}`}
            >
              Улучшения
            </button>
            <button 
              onClick={() => setActiveTab('achievements')} 
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'achievements' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-800/60 hover:bg-orange-200'}`}
            >
              Награды
            </button>
            <button 
              onClick={() => setActiveTab('challenges')} 
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'challenges' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-800/60 hover:bg-orange-200'}`}
            >
              Квесты
            </button>
            <button 
              onClick={() => setActiveTab('skins')} 
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'skins' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-800/60 hover:bg-orange-200'}`}
            >
              Скины
            </button>
            <button 
              onClick={() => setActiveTab('chests')} 
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'chests' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-800/60 hover:bg-orange-200'}`}
            >
              Сундуки
            </button>
            <button 
              onClick={() => setActiveTab('evolution')} 
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'evolution' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-800/60 hover:bg-orange-200'}`}
            >
              Эволюция
            </button>
          </div>
        </div>

        {/* Chests Tab */}
        {activeTab === 'chests' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm p-4 rounded-xl mb-4 text-center">
              У вас сундуков: <span className="font-black text-2xl ml-2">{state.chests}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={openChest}
                disabled={state.chests <= 0}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3
                  ${state.chests > 0 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                <Gift size={24} /> Открыть (1)
              </button>
              
              {state.chests > 1 && (
                <button 
                  onClick={openAllChests}
                  className="w-full py-3 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95"
                >
                  <Gift size={20} /> Открыть все ({state.chests})
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm font-bold text-orange-800/80 cursor-pointer justify-center mt-2">
              <input 
                type="checkbox" 
                checked={state.skipChestAnimation || false}
                onChange={(e) => {
                  setState(prev => {
                    const next = { ...prev, skipChestAnimation: e.target.checked };
                    saveData(next);
                    return next;
                  });
                }}
                className="w-4 h-4 rounded border-orange-300 text-orange-500 focus:ring-orange-500"
              />
              Пропустить анимации
            </label>

            <div className="pt-4 border-t border-orange-100">
              <h3 className="font-bold text-orange-800 mb-3 text-center">Получить сундуки</h3>
              <div className="space-y-3">
                <button 
                  onClick={buyChest}
                  disabled={state.mandarins < 100000}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                    ${state.mandarins >= 100000 
                      ? 'bg-white border-2 border-orange-300 text-orange-600 shadow-sm hover:bg-orange-50 active:scale-95' 
                      : 'bg-gray-50 border-2 border-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  Купить за 100,000 <Citrus size={16} />
                </button>
                <button 
                  onClick={buyChestAd}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  <PlaySquare size={16} /> Получить за рекламу
                </button>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-xl mt-4">
              <p className="font-bold mb-1">Что внутри?</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Малый запас мандаринов - 40%</li>
                <li>Большой запас мандаринов - 25%</li>
                <li>+ к силе клика навсегда - 10%</li>
                <li>+ к авто-доходу навсегда - 10%</li>
                <li>Постоянный множитель (+0.05x) - 8%</li>
                <li>Случайный скин (включая мифические!) - 5%</li>
                <li>🎰 ДЖЕКПОТ (Огромный бонус) - 2%</li>
              </ul>
            </div>
          </div>
        )}

        {/* Skins Tab */}
        {activeTab === 'skins' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="bg-purple-50 border border-purple-200 text-purple-800 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
              <Star size={16} className="shrink-0 mt-0.5" />
              <p>Скины меняют внешний вид капибары и дают мощные постоянные бонусы!</p>
            </div>
            
            {SKINS.map(skin => {
              const isOwned = state.ownedSkins.includes(skin.id);
              const isEquipped = state.equippedSkin === skin.id;
              const canAfford = state.mandarins >= skin.cost;
              
              const rarityColors = {
                common: 'bg-gray-100 border-gray-300 text-gray-700',
                rare: 'bg-blue-100 border-blue-300 text-blue-700',
                epic: 'bg-purple-100 border-purple-300 text-purple-700',
                legendary: 'bg-yellow-100 border-yellow-400 text-yellow-800'
              };
              
              const rarityNames = {
                common: 'Обычный',
                rare: 'Редкий',
                epic: 'Эпический',
                legendary: 'Легендарный'
              };

              return (
                <div 
                  key={skin.id} 
                  className={`w-full p-3 rounded-2xl border-2 transition-all
                    ${isEquipped ? 'bg-orange-50 border-orange-400 shadow-md' : 'bg-white border-gray-200 hover:border-orange-300'}`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-4xl bg-gray-50 p-2 rounded-xl border border-gray-100 shadow-inner w-16 h-16 flex items-center justify-center shrink-0">
                      {skin.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{skin.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${rarityColors[skin.rarity]}`}>
                          {rarityNames[skin.rarity]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{skin.description}</p>
                    </div>
                  </div>
                  
                  {/* Bonuses */}
                  {(skin.bonuses.clickMultiplier || skin.bonuses.autoMultiplier || skin.bonuses.flatClick || skin.bonuses.flatAuto) && (
                    <div className="bg-orange-50/50 rounded-xl p-2 mb-3 border border-orange-100/50">
                      <div className="text-[10px] font-bold text-orange-800/60 uppercase tracking-wider mb-1">Бонусы скина:</div>
                      <div className="grid grid-cols-2 gap-1 text-xs font-medium text-orange-900">
                        {skin.bonuses.clickMultiplier && <div>Клик: x{skin.bonuses.clickMultiplier}</div>}
                        {skin.bonuses.autoMultiplier && <div>Авто: x{skin.bonuses.autoMultiplier}</div>}
                        {skin.bonuses.flatClick && <div>Клик: +{skin.bonuses.flatClick.toLocaleString('ru-RU')}</div>}
                        {skin.bonuses.flatAuto && <div>Авто: +{skin.bonuses.flatAuto.toLocaleString('ru-RU')}</div>}
                      </div>
                    </div>
                  )}
                  
                  {isEquipped ? (
                    <button disabled className="w-full py-2 rounded-xl font-bold text-sm bg-orange-500 text-white shadow-inner flex items-center justify-center gap-2">
                      <CheckCircle size={16} /> Надето
                    </button>
                  ) : isOwned ? (
                    <button 
                      onClick={() => equipSkin(skin.id)}
                      className="w-full py-2 rounded-xl font-bold text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                    >
                      Надеть
                    </button>
                  ) : (
                    <button 
                      onClick={() => buySkin(skin.id, skin.cost)}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                        ${canAfford 
                          ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                      Купить за {skin.cost.toLocaleString('ru-RU')} <Citrus size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Shop Tab */}
        {activeTab === 'shop' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            
            {/* Auto-Clicker Special Card */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-1 shadow-lg mb-6">
              <div className="bg-white/95 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <Zap size={24} className="fill-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg leading-tight">Авто-кликер</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Кликает за вас! ({state.autoClicker.level * 2} клика/сек)
                    </p>
                  </div>
                </div>

                {!state.autoClicker.permanent ? (
                  <div className="space-y-2">
                    {state.autoClicker.adActiveUntil > Date.now() ? (
                      <div className="bg-purple-100 text-purple-700 text-xs font-bold p-2 rounded-lg text-center animate-pulse">
                        Активен еще {Math.ceil((state.autoClicker.adActiveUntil - Date.now()) / 1000)}с
                      </div>
                    ) : (
                      <button 
                        onClick={activateAutoClickerAd}
                        className="w-full py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <PlaySquare size={16} /> 60 сек за рекламу
                      </button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={buyAutoClickerWithMandarins}
                        disabled={state.mandarins < 1000000}
                        className="py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 disabled:hover:bg-orange-100 rounded-xl font-bold text-xs transition-colors flex flex-col items-center justify-center"
                      >
                        <span>Навсегда</span>
                        <span className="text-[10px]">{(1000000).toLocaleString('ru-RU')} 🍊</span>
                      </button>
                      <button 
                        onClick={buyAutoClickerWithYAN}
                        className="py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-xl font-bold text-xs transition-colors flex flex-col items-center justify-center"
                      >
                        <span>Купить (YAN)</span>
                        <span className="text-[10px]">99 Янов</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-green-100 text-green-700 text-xs font-bold p-2 rounded-lg text-center">
                      ✓ Куплен навсегда
                    </div>
                    <button 
                      onClick={upgradeAutoClicker}
                      disabled={state.mandarins < 500000 * Math.pow(2, state.autoClicker.level - 1)}
                      className="w-full py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 disabled:hover:bg-orange-100 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      Улучшить скорость ({(500000 * Math.pow(2, state.autoClicker.level - 1)).toLocaleString('ru-RU')} 🍊)
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-orange-200 w-full my-4"></div>

            {UPGRADES.map(upgrade => {
              const cost = getUpgradeCost(upgrade);
              const count = state.ownedUpgrades[upgrade.id] || 0;
              const canAfford = state.mandarins >= cost;
              const Icon = upgrade.icon;

              return (
                <button
                  key={upgrade.id}
                  onClick={() => buyUpgrade(upgrade)}
                  disabled={!canAfford}
                  className={`w-full flex items-center gap-4 p-3 rounded-2xl border-2 transition-all text-left
                    ${canAfford 
                      ? 'bg-white border-orange-300 hover:border-orange-500 hover:shadow-md cursor-pointer' 
                      : 'bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed'}`}
                >
                  <div className={`p-3 rounded-xl ${canAfford ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Icon size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">{upgrade.name}</h3>
                      <span className="text-2xl font-black text-gray-200">{count}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{upgrade.description}</p>
                    <div className={`font-bold text-sm ${canAfford ? 'text-orange-600' : 'text-red-400'}`}>
                      🍊 {cost.toLocaleString('ru-RU')}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {ACHIEVEMENTS.filter(ach => {
              if (!ach.tierGroup) return true;
              const groupAchs = ACHIEVEMENTS.filter(a => a.tierGroup === ach.tierGroup).sort((a, b) => (a.tierLevel || 0) - (b.tierLevel || 0));
              const firstLocked = groupAchs.find(a => !state.unlockedAchievements.includes(a.id));
              if (firstLocked) {
                return ach.id === firstLocked.id;
              } else {
                return ach.id === groupAchs[groupAchs.length - 1].id;
              }
            }).map(ach => {
              const isUnlocked = state.unlockedAchievements.includes(ach.id);
              const Icon = ach.icon;
              
              return (
                <div 
                  key={ach.id} 
                  className={`w-full flex items-center gap-4 p-3 rounded-2xl border-2 transition-all
                    ${isUnlocked ? 'bg-white border-orange-300 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'}`}
                >
                  <div className={`p-3 rounded-xl ${isUnlocked ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-400'}`}>
                    <Icon size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800">
                        {ach.name} {ach.tierLevel && <span className="text-xs text-orange-500 ml-1">Ур. {ach.tierLevel}</span>}
                      </h3>
                      {isUnlocked && <Award size={18} className="text-green-500" />}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{ach.description}</p>
                    <div className="font-bold text-sm text-orange-600 mb-2">Награда: {ach.rewardDesc}</div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-bold">
                        <span>Прогресс</span>
                        <span>
                          {Math.floor(Math.min(ach.getProgress(state, consecutiveClicksRef.current), ach.target)).toLocaleString('ru-RU')} / {ach.target.toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isUnlocked ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${isUnlocked ? 100 : Math.min(100, Math.max(0, (ach.getProgress(state, consecutiveClicksRef.current) / ach.target) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Evolution Tab */}
        {activeTab === 'evolution' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 text-purple-900 text-sm p-4 rounded-2xl mb-4 flex items-start gap-3 shadow-sm">
              <Dna size={24} className="shrink-0 mt-0.5 text-purple-600" />
              <div>
                <p className="font-bold mb-1">Мандариновый Дзен</p>
                <p className="text-xs opacity-80">
                  Перерождение сбросит ваши мандарины, улучшения, скины и достижения, но сохранит еженедельные квесты. 
                  Взамен вы получите постоянный множитель ко всему доходу и стартовый капитал!
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border-2 border-purple-100 shadow-sm">
              <h3 className="font-black text-lg text-purple-900 mb-4 text-center">Текущий уровень: {state.prestige?.level || 0}</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-purple-50 p-3 rounded-xl">
                  <span className="text-sm font-bold text-purple-800">Множитель дохода:</span>
                  <span className="font-black text-purple-600">x{state.prestige?.multiplier || 1}</span>
                </div>
                <div className="flex justify-between items-center bg-purple-50 p-3 rounded-xl">
                  <span className="text-sm font-bold text-purple-800">Стартовый капитал:</span>
                  <span className="font-black text-purple-600">{(state.prestige?.startingMandarins || 0).toLocaleString('ru-RU')} 🍊</span>
                </div>
              </div>

              <div className="border-t border-purple-100 pt-4">
                <h4 className="font-bold text-center text-purple-800 mb-3">Следующий уровень</h4>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Новый множитель:</span>
                    <span className="font-bold text-green-600">x{1 + (((state.prestige?.level || 0) + 1) * 0.5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Новый старт:</span>
                    <span className="font-bold text-green-600">{(((state.prestige?.level || 0) + 1) * 10000).toLocaleString('ru-RU')} 🍊</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm('Вы уверены, что хотите переродиться? Это сбросит ваш прогресс (кроме квестов), но даст постоянный бонус!')) {
                      performPrestige();
                    }
                  }}
                  disabled={state.mandarins < 1000000000 * Math.pow(100, state.prestige?.level || 0)}
                  className="w-full py-4 rounded-xl font-black text-white uppercase tracking-wider transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  {state.mandarins >= 1000000000 * Math.pow(100, state.prestige?.level || 0) ? (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles size={20} />
                      Эволюционировать
                    </span>
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-xs">
                      <span>Требуется мандаринов:</span>
                      <span className="text-sm">{(1000000000 * Math.pow(100, state.prestige?.level || 0)).toLocaleString('ru-RU')}</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
              <CalendarDays size={16} className="shrink-0 mt-0.5" />
              <p>Испытания обновляются каждую неделю. Выполняйте их, чтобы получать мощные бонусы до конца недели!</p>
            </div>
            
            {WEEKLY_CHALLENGES.map(challenge => {
              const isCompleted = state.weekly.completed.includes(challenge.id);
              const progress = Math.min(challenge.getProgress(state), challenge.target);
              const percent = (progress / challenge.target) * 100;
              const Icon = challenge.icon;
              
              return (
                <div 
                  key={challenge.id} 
                  className={`w-full p-3 rounded-2xl border-2 transition-all
                    ${isCompleted ? 'bg-white border-green-400 shadow-sm' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-500'}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800">{challenge.name}</h3>
                        {isCompleted && <CheckCircle size={18} className="text-green-500" />}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{challenge.description}</p>
                      <div className="font-bold text-sm text-blue-600 mb-2">Награда: {challenge.rewardDesc}</div>
                      
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-bold">
                          <span>Прогресс</span>
                          <span>
                            {Math.floor(progress).toLocaleString('ru-RU')} / {challenge.target.toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${isCompleted ? 100 : percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
