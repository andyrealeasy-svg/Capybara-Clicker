declare global {
  interface Window {
    YaGames: any;
  }
}

let ysdk: any = null;
let player: any = null;

export const initYandexSDK = async () => {
  if (window.YaGames) {
    try {
      console.log("Attempting to initialize Yandex SDK...");
      // Add a 2-second timeout because YaGames.init() hangs indefinitely 
      // when run inside an iframe outside of the actual Yandex Games platform.
      ysdk = await Promise.race([
        window.YaGames.init(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Yandex SDK init timeout")), 2000))
      ]);
      
      if (ysdk && ysdk.features && ysdk.features.LoadingAPI) {
        ysdk.features.LoadingAPI.ready();
      }
      
      try {
        player = await Promise.race([
          ysdk.getPlayer({ scopes: false }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("getPlayer timeout")), 2000))
        ]);
      } catch (e) {
        console.log("Player not initialized (might be unauthorized or timed out).");
      }
      console.log("Yandex SDK initialized successfully");
    } catch (e) {
      console.log("Yandex SDK is not available in this environment. Using local mode.");
      ysdk = null;
      player = null;
    }
  } else {
    console.log("Running outside of Yandex Games environment. Using local mode.");
  }
};

export const showRewardedAd = (onReward: () => void, onOpen?: () => void, onClose?: () => void) => {
  if (ysdk && ysdk.adv) {
    ysdk.adv.showRewardedVideo({
      callbacks: {
        onOpen: () => {
          console.log('Video ad open.');
          if (onOpen) onOpen();
        },
        onRewarded: () => {
          console.log('Rewarded!');
          onReward();
        },
        onClose: () => {
          console.log('Video ad closed.');
          if (onClose) onClose();
        },
        onError: (e: any) => {
          console.error('Error while open video ad:', e);
          if (onClose) onClose();
        }
      }
    });
  } else {
    // Fallback for local testing
    console.log("Mocking rewarded ad...");
    if (onOpen) onOpen();
    setTimeout(() => {
      onReward();
      if (onClose) onClose();
    }, 1000);
  }
};

export const saveData = (data: any) => {
  if (player) {
    player.setData(data).catch(console.error);
  } else {
    localStorage.setItem('capybara_save', JSON.stringify(data));
  }
};

export const loadData = async () => {
  if (player) {
    try {
      const data = await player.getData();
      return Object.keys(data).length > 0 ? data : null;
    } catch (e) {
      console.error("Failed to load from Yandex", e);
      return null;
    }
  } else {
    try {
      const data = localStorage.getItem('capybara_save');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to parse local save", e);
      return null;
    }
  }
};
