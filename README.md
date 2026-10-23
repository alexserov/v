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
├─ ui/backButton.ts        # кнопка «назад»
└─ games/
   ├─ registry.ts          # список игр
   └─ runner/index.ts      # первая игра — «Бегунок»
scripts/generate-icons.mjs # генератор иконок (без внешних зависимостей)
public/icons/              # готовые иконки 192/512/maskable/apple
```

## Как добавить игру

1. Создайте `src/games/<id>/index.ts` и экспортируйте `GameDefinition`:

   ```ts
   import type { GameDefinition, GameInstance } from '../../types';

   class MyGame implements GameInstance {
     mount(host: HTMLElement) { /* нарисовать игру в host */ }
     destroy() { /* остановить таймеры и слушатели */ }
   }

   export const myGame: GameDefinition = {
     id: 'my-game',
     title: 'Название',
     icon: '⭐',
     colors: ['#a0e7ff', '#5aa9ff'],
     create: () => new MyGame(),
   };
   ```

2. Добавьте игру в `src/games/registry.ts`:

   ```ts
   export const games: readonly GameDefinition[] = [runnerGame, myGame];
   ```

Тайл на главном экране и маршрут `#/game/my-game` появятся автоматически.
Кнопка «назад» общая и уже отображается поверх любой игры.

## Первая игра — «Бегунок» 🐰

- Персонаж бесконечно бежит, тап в любом месте — прыжок
  (доступен двойной прыжок).
- По пути появляются вкусняшки: морковка, брокколи, яблоко, земляника
  и голубика. Зайчик собирает их, счётчик в корзинке растёт, при сборе
  летят искры.
- Вкусняшки бывают низко, на высоте обычного прыжка и высоко — чтобы
  дотянуться до высоких, нужен двойной прыжок. Группы по три появляются
  редко.
- Бесконечный режим **без проигрыша**: столкновение с препятствием
  даёт мягкий подскок и искры, игра продолжается.
- Поддержка клавиатуры (Пробел / ↑) для проверки на компьютере.

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
