# Мини-игры

Сборник мини-игр для малышей. Устанавливается на телефон как PWA
(иконка на домашнем экране, полноэкранный режим, работа офлайн).

## Стек

- **Vite + TypeScript** (vanilla, без UI-фреймворка)
- **Canvas 2D** для игр
- **vite-plugin-pwa** — манифест, service worker, офлайн-кэш

## Команды

```bash
npm install       # установить зависимости
npm run dev       # dev-сервер (доступен по сети: --host)
npm run build     # проверка типов + production-сборка в dist/
npm run preview   # локальный просмотр сборки
npm run icons     # перегенерировать иконки PWA
```

## Структура

```
src/
├─ main.ts                 # точка входа и роутер (#/ и #/game/<id>)
├─ home.ts                 # главный экран с тайлами
├─ types.ts                # интерфейсы игры
├─ engine/
│  ├─ CanvasGame.ts        # общий canvas-движок (цикл, resize, тапы)
│  ├─ particles.ts         # искры, звёздочки, сердечки
│  └─ sound.ts             # синтез звуков WebAudio + mute
├─ art/
│  ├─ characters.ts        # мордочки и сидящие зверята
│  └─ food.ts              # арт еды
├─ ui/
│  ├─ backButton.ts        # кнопка «назад»
│  ├─ soundButton.ts       # кнопка звука 🔊/🔇
│  └─ hud.ts               # счётчик-пилюля
└─ games/
   ├─ registry.ts          # список игр
   ├─ runner/              # 🐰 Бегунок
   ├─ bubbles/             # 🫧 Пузырики
   ├─ peekaboo/            # 🐾 Найди зверюшку
   ├─ music/               # 🎵 Музыкальная полянка
   ├─ feed/                # 🍎 Покорми зверят
   ├─ drive/               # 🚗 Покатушки
   ├─ dressup/             # 🎀 Одень зайчика
   └─ coloring/            # 🎨 Раскраска
docs/games/                # спеки игр
scripts/generate-icons.mjs # генератор иконок (без внешних зависимостей)
public/icons/              # готовые иконки 192/512/maskable/apple
```

## Как добавить игру

1. Создайте `src/games/<id>/index.ts` и экспортируйте `GameDefinition`:

   ```ts
   import { CanvasGame } from '../../engine/CanvasGame';
   import type { GameDefinition } from '../../types';

   class MyGame extends CanvasGame {
     protected update(dt: number) { /* логика */ }
     protected draw(ctx: CanvasRenderingContext2D) { /* отрисовка */ }
     protected onTap(x: number, y: number) { /* реакция на тап */ }
   }

   export const myGame: GameDefinition = {
     id: 'my-game',
     title: 'Название',
     icon: '⭐',
     colors: ['#a0e7ff', '#5aa9ff'],
     create: () => new MyGame(),
   };
   ```

   `CanvasGame` сам отвечает за canvas, DPR, resize, цикл и очистку.
   Для звуков используйте `sound` из `src/engine/sound.ts`, для искр —
   `Particles`, для счётчика — `createHud`.

2. Добавьте игру в `src/games/registry.ts`:

   ```ts
   export const games: readonly GameDefinition[] = [runnerGame, myGame];
   ```

Тайл на главном экране и маршрут `#/game/my-game` появятся автоматически.
Кнопка «назад» общая и уже отображается поверх любой игры.

## Игры

| Игра | Что делать |
|------|-----------|
| 🐰 **Бегунок** | Прыгать, собирать вкусняшки, уворачиваться от препятствий |
| 🫧 **Пузырики** | Лопать пузыри со зверятами |
| 🐾 **Найди зверюшку** | Открывать укрытия и находить спрятавшихся зверят |
| 🎵 **Музыкальная полянка** | Играть мелодию на цветах-нотах |
| 🍎 **Покорми зверят** | Выбрать угощение и покормить зверя |
| 🚗 **Покатушки** | Рулить машинкой и собирать звёздочки |
| 🎀 **Одень зайчика** | Наряжать зайчика шапочками, шарфиками, очками и бантиками |
| 🎨 **Раскраска** | Раскрашивать картинки и открывать следующие |

Все игры **бесконечные**, **без проигрыша**, управление — крупный тап.
Есть общая кнопка звука 🔊/🔇 с сохранением настройки.

Подробные спеки каждой игры — в [`docs/games/`](docs/games/README.md).

## Деплой на GitHub Pages

- Репозиторий: `git@github.com:alexserov/v.git`
- Сайт: https://alexserov.github.io/v/

Деплой автоматический: workflow `.github/workflows/deploy.yml` собирает проект
и публикует `dist/` при каждом пуше в `main`.

Первичная настройка (один раз):

1. Открыть **Settings → Pages → Build and deployment**.
2. В **Source** выбрать **GitHub Actions**.
3. Запушить в `main` (или вручную: **Actions → Deploy to GitHub Pages →
   Run workflow**).

За счёт `base: './'` и hash-роутинга приложение корректно работает из
подпапки `/v/`.

## Установка на телефон

PWA устанавливается с **HTTPS** (или `localhost`). Обычный `http://<ip-адрес>`
по локальной сети не подойдёт для service worker.

Варианты:

1. Задеплоить `dist/` на любой HTTPS-хостинг (Netlify, Vercel, GitHub Pages
   и т.п.).
2. Открыть адрес на телефоне → «Поделиться» → «На экран “Домой”» (iOS)
   или меню браузера → «Установить приложение» (Android).

Для локальной проверки на телефоне можно использовать HTTPS-туннель
(например, `npx localtunnel --port 4173` или `cloudflared`).
