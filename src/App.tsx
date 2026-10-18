import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/* ───────── Types ───────── */
interface Song {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
  category: string;
  isFavorite: boolean;
  createdAt: number;
}

type Screen = 'home' | 'view' | 'editor' | 'search' | 'categories';

/* ───────── Helpers ───────── */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const CATEGORIES = [
  { id: 'all', label: 'Все', icon: 'fa-layer-group', color: '#007aff' },
  { id: 'rock', label: 'Рок', icon: 'fa-guitar', color: '#ff3b30' },
  { id: 'pop', label: 'Поп', icon: 'fa-music', color: '#ff9500' },
  { id: 'rap', label: 'Рэп', icon: 'fa-microphone-lines', color: '#af52de' },
  { id: 'indie', label: 'Инди', icon: 'fa-heart', color: '#30d158' },
  { id: 'electronic', label: 'Электроника', icon: 'fa-bolt', color: '#5ac8fa' },
  { id: 'other', label: 'Другое', icon: 'fa-ellipsis', color: '#8e8e93' },
];

const getCat = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

const DEMO_SONGS: Song[] = [
  {
    id: uid(),
    title: 'Перемен',
    artist: 'Кино',
    lyrics: `Вместо тепла — зелень стекла,\nВместо огня — дым.\nСетка калькулятора\nВычертила, в чём была сила.\n\nЭто было так просто,\nЭто было так сложно.\nЭто было так понятно,\nЧто это было так непонятно.\n\nМы ждём перемен!\n\nСердце стучит в ритме\nТакой большой —\nМы все хотим перемен.\n\nМы ждём перемен!`,
    category: 'rock',
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: uid(),
    title: 'Выдыхай',
    artist: 'Скриптонит',
    lyrics: `Я выдыхаю дым, он улетает в небо.\nМне нечего терять, мне нечего и помнить.\n\nГород спит, а мы с тобой не спим.\nВремя лечит, но мы не хотим.\n\nВыдыхай, выдыхай.\nВсё что было — отпускай.`,
    category: 'rap',
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: uid(),
    title: 'Медуза',
    artist: 'Matrang',
    lyrics: `Ты — моя медуза,\nЯ твой водолаз.\nНа дне океана\nТолько ты и я.\n\nКап-кап-кап — капли по стеклу.\nЯ тебя одну люблю.\n\nТы — моя медуза,\nЯ твой водолаз.\nМы на дне,\nНо это не беда.`,
    category: 'pop',
    isFavorite: true,
    createdAt: Date.now() - 86400000,
  },
];

/* ───────── Telegram helpers ───────── */
function useTelegram() {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<{ name: string; photo?: string }>({ name: 'Друг' });

  useEffect(() => {
    const w = (window as any).Telegram?.WebApp;
    if (w) {
      w.ready();
      w.expand();
      setTg(w);
      if (w.initDataUnsafe?.user) {
        const u = w.initDataUnsafe.user;
        setUser({
          name: u.first_name || 'Друг',
          photo: u.photo_url,
        });
      }
    }
  }, []);

  const haptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light') => {
      if (!tg) return;
      if (type === 'selection') tg.HapticFeedback?.selectionChanged();
      else if (['success', 'warning', 'error'].includes(type))
        tg.HapticFeedback?.notificationOccurred(type);
      else tg.HapticFeedback?.impactOccurred(type);
    },
    [tg],
  );

  return { tg, user, haptic };
}

/* ───────── Storage ───────── */
function loadSongs(): Song[] {
  try {
    const raw = localStorage.getItem('lyrics-box-songs');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEMO_SONGS;
}

function saveSongs(songs: Song[]) {
  localStorage.setItem('lyrics-box-songs', JSON.stringify(songs));
}

/* ───────── Components ───────── */

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--tg-hint)' }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Поиск...'}
        className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
        style={{ backgroundColor: 'var(--tg-bg2)', color: 'var(--tg-text)' }}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tg-hint)' }}>
          <i className="fa-solid fa-xmark text-[10px]" style={{ color: 'var(--tg-bg)' }} />
        </button>
      )}
    </div>
  );
}

function SongCard({ song, onClick, index }: { song: Song; onClick: () => void; index: number }) {
  const cat = getCat(song.category);
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3.5 p-3.5 rounded-2xl transition-all active:scale-[0.97] animate-fade-in"
      style={{ backgroundColor: 'var(--tg-bg2)', animationDelay: `${index * 40}ms` }}
    >
      {/* Cover */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${cat.color}33, ${cat.color}11)` }}
      >
        <i className={`fa-solid ${cat.icon} text-lg`} style={{ color: cat.color }} />
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] truncate" style={{ color: 'var(--tg-text)' }}>
          {song.title}
        </p>
        <p className="text-[13px] truncate mt-0.5" style={{ color: 'var(--tg-hint)' }}>
          {song.artist}
        </p>
      </div>
      {/* Favorite */}
      {song.isFavorite && (
        <i className="fa-solid fa-heart text-sm flex-shrink-0" style={{ color: '#ff3b30' }} />
      )}
      {/* Chevron */}
      <i className="fa-solid fa-chevron-right text-xs flex-shrink-0" style={{ color: 'var(--tg-hint)' }} />
    </button>
  );
}

function CategoryPill({ cat, active, count, onClick }: { cat: typeof CATEGORIES[0]; active: boolean; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all active:scale-95 flex-shrink-0"
      style={{
        backgroundColor: active ? cat.color : 'var(--tg-bg2)',
        color: active ? '#fff' : 'var(--tg-text)',
      }}
    >
      <i className={`fa-solid ${cat.icon} text-[11px]`} />
      {cat.label}
      {count > 0 && (
        <span
          className="ml-0.5 text-[11px] rounded-full px-1.5 py-0.5 font-semibold"
          style={{ backgroundColor: active ? 'rgba(255,255,255,0.25)' : `${cat.color}22`, color: active ? '#fff' : cat.color }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: 'var(--tg-bg2)' }}
      >
        <i className={`fa-solid ${icon} text-3xl`} style={{ color: 'var(--tg-hint)' }} />
      </div>
      <p className="text-lg font-semibold mb-1" style={{ color: 'var(--tg-text)' }}>{title}</p>
      <p className="text-sm text-center max-w-[250px]" style={{ color: 'var(--tg-hint)' }}>{subtitle}</p>
    </div>
  );
}

/* ───────── Screens ───────── */

function HomeScreen({
  songs,
  search,
  setSearch,
  activeCat,
  setActiveCat,
  onSongClick,
  onAddClick,
  showFavorites,
  setShowFavorites,
  haptic,
}: {
  songs: Song[];
  search: string;
  setSearch: (v: string) => void;
  activeCat: string;
  setActiveCat: (v: string) => void;
  onSongClick: (s: Song) => void;
  onAddClick: () => void;
  showFavorites: boolean;
  setShowFavorites: (v: boolean) => void;
  haptic: (t?: any) => void;
}) {
  const filtered = useMemo(() => {
    let list = songs;
    if (showFavorites) list = list.filter(s => s.isFavorite);
    if (activeCat !== 'all') list = list.filter(s => s.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.lyrics.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [songs, search, activeCat, showFavorites]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight">Lyrics Box</h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--tg-hint)' }}>
              {songs.length} {songs.length === 1 ? 'песня' : songs.length < 5 ? 'песни' : 'песен'} в коллекции
            </p>
          </div>
          <button
            onClick={() => { haptic('selection'); setShowFavorites(!showFavorites); }}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              backgroundColor: showFavorites ? '#ff3b3022' : 'var(--tg-bg2)',
            }}
          >
            <i
              className={`${showFavorites ? 'fa-solid' : 'fa-regular'} fa-heart text-lg`}
              style={{ color: showFavorites ? '#ff3b30' : 'var(--tg-hint)' }}
            />
          </button>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Название, исполнитель или текст..." />
      </div>

      {/* Categories */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {CATEGORIES.map(cat => {
            const count = songs.filter(s => (cat.id === 'all' ? true : s.category === cat.id)).length;
            return (
              <CategoryPill
                key={cat.id}
                cat={cat}
                active={activeCat === cat.id}
                count={cat.id === 'all' ? 0 : count}
                onClick={() => { haptic('selection'); setActiveCat(cat.id); }}
              />
            );
          })}
        </div>
      </div>

      {/* Song list */}
      <div className="px-5 space-y-2 pb-28">
        {filtered.length === 0 ? (
          <EmptyState
            icon={search ? 'fa-magnifying-glass' : showFavorites ? 'fa-heart' : 'fa-music'}
            title={search ? 'Ничего не найдено' : showFavorites ? 'Нет избранных' : 'Пока пусто'}
            subtitle={
              search
                ? 'Попробуйте другой запрос'
                : showFavorites
                ? 'Нажмите ♡ чтобы добавить песню в избранное'
                : 'Нажмите + чтобы добавить первую песню'
            }
          />
        ) : (
          filtered.map((song, i) => (
            <SongCard key={song.id} song={song} index={i} onClick={() => onSongClick(song)} />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { haptic('medium'); onAddClick(); }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-30 active:scale-90 transition-transform"
        style={{
          background: 'linear-gradient(135deg, var(--tg-btn), #5856d6)',
          boxShadow: '0 8px 24px rgba(0,122,255,0.35)',
        }}
      >
        <i className="fa-solid fa-plus text-white text-xl" />
      </button>
    </div>
  );
}

function ViewSongScreen({
  song,
  onBack,
  onEdit,
  onDelete,
  onToggleFav,
  haptic,
}: {
  song: Song;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFav: () => void;
  haptic: (t?: any) => void;
}) {
  const cat = getCat(song.category);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="animate-slide-in min-h-screen pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'color-mix(in srgb, var(--tg-bg) 80%, transparent)' }}>
        <button onClick={() => { haptic('light'); onBack(); }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tg-bg2)' }}>
          <i className="fa-solid fa-chevron-left text-sm" style={{ color: 'var(--tg-text)' }} />
        </button>
        <div className="flex gap-2">
          <button onClick={() => { haptic('selection'); onToggleFav(); }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tg-bg2)' }}>
            <i className={`${song.isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`} style={{ color: song.isFavorite ? '#ff3b30' : 'var(--tg-hint)' }} />
          </button>
          <button onClick={() => { haptic('light'); onEdit(); }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tg-bg2)' }}>
            <i className="fa-solid fa-pen-to-square text-sm" style={{ color: 'var(--tg-text)' }} />
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tg-bg2)' }}>
            <i className="fa-solid fa-trash-can text-sm text-red-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-4">
        {/* Cover & Title */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${cat.color}44, ${cat.color}11)` }}
          >
            <i className={`fa-solid ${cat.icon} text-2xl`} style={{ color: cat.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[22px] font-bold leading-tight">{song.title}</h2>
            <p className="text-[15px] mt-1" style={{ color: 'var(--tg-hint)' }}>{song.artist}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
              >
                <i className={`fa-solid ${cat.icon} mr-1 text-[9px]`} />
                {cat.label}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--tg-hint)' }}>
                {new Date(song.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>
        </div>

        {/* Lyrics */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--tg-bg2)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-quote-left text-sm" style={{ color: 'var(--tg-hint)' }} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--tg-hint)' }}>Текст песни</span>
          </div>
          <div className="lyricsText" style={{ color: 'var(--tg-text)' }}>
            {song.lyrics}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in" onClick={() => setShowDeleteConfirm(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full max-w-md mx-4 mb-8 rounded-2xl p-5 animate-scale-in"
            style={{ backgroundColor: 'var(--tg-bg2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <i className="fa-solid fa-trash-can text-red-500" />
              </div>
              <div>
                <p className="font-bold">Удалить песню?</p>
                <p className="text-[13px]" style={{ color: 'var(--tg-hint)' }}>«{song.title}» — {song.artist}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-[15px]"
                style={{ backgroundColor: 'var(--tg-bg)' }}
              >
                Отмена
              </button>
              <button
                onClick={() => { haptic('error'); onDelete(); }}
                className="flex-1 py-3 rounded-xl font-semibold text-[15px] bg-red-500 text-white"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditorScreen({
  song,
  onSave,
  onBack,
  haptic,
}: {
  song: Song | null;
  onSave: (data: Omit<Song, 'id' | 'createdAt'>) => void;
  onBack: () => void;
  haptic: (t?: any) => void;
}) {
  const [title, setTitle] = useState(song?.title || '');
  const [artist, setArtist] = useState(song?.artist || '');
  const [lyrics, setLyrics] = useState(song?.lyrics || '');
  const [category, setCategory] = useState(song?.category || 'other');
  const [isFavorite, setIsFavorite] = useState(song?.isFavorite || false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEdit = !!song;

  const canSave = title.trim() && lyrics.trim();

  const handleSave = () => {
    if (!canSave) return;
    haptic('success');
    onSave({
      title: title.trim(),
      artist: artist.trim(),
      lyrics: lyrics.trim(),
      category,
      isFavorite,
    });
  };

  return (
    <div className="animate-slide-in min-h-screen pb-28">
      {/* Top bar */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'color-mix(in srgb, var(--tg-bg) 80%, transparent)' }}>
        <button onClick={() => { haptic('light'); onBack(); }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tg-bg2)' }}>
          <i className="fa-solid fa-xmark text-lg" style={{ color: 'var(--tg-text)' }} />
        </button>
        <h2 className="font-bold text-[17px]">{isEdit ? 'Редактировать' : 'Новая песня'}</h2>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="px-4 py-2 rounded-full font-semibold text-[14px] transition-all active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: 'var(--tg-btn)', color: 'var(--tg-btn-text)' }}
        >
          Сохранить
        </button>
      </div>

      <div className="px-5 pt-4 space-y-5">
        {/* Title */}
        <div>
          <label className="text-[13px] font-semibold mb-1.5 block" style={{ color: 'var(--tg-hint)' }}>
            <i className="fa-solid fa-heading mr-1.5" /> Название
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Название песни"
            className="w-full px-4 py-3.5 rounded-xl text-[15px] outline-none"
            style={{ backgroundColor: 'var(--tg-bg2)', color: 'var(--tg-text)' }}
            autoFocus={!isEdit}
          />
        </div>

        {/* Artist */}
        <div>
          <label className="text-[13px] font-semibold mb-1.5 block" style={{ color: 'var(--tg-hint)' }}>
            <i className="fa-solid fa-user mr-1.5" /> Исполнитель
          </label>
          <input
            type="text"
            value={artist}
            onChange={e => setArtist(e.target.value)}
            placeholder="Имя исполнителя"
            className="w-full px-4 py-3.5 rounded-xl text-[15px] outline-none"
            style={{ backgroundColor: 'var(--tg-bg2)', color: 'var(--tg-text)' }}
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-[13px] font-semibold mb-2 block" style={{ color: 'var(--tg-hint)' }}>
            <i className="fa-solid fa-tag mr-1.5" /> Жанр
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <button
                key={cat.id}
                onClick={() => { haptic('selection'); setCategory(cat.id); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all active:scale-95"
                style={{
                  backgroundColor: category === cat.id ? cat.color : 'var(--tg-bg2)',
                  color: category === cat.id ? '#fff' : 'var(--tg-text)',
                }}
              >
                <i className={`fa-solid ${cat.icon} text-[11px]`} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lyrics */}
        <div>
          <label className="text-[13px] font-semibold mb-1.5 block" style={{ color: 'var(--tg-hint)' }}>
            <i className="fa-solid fa-align-left mr-1.5" /> Текст песни
          </label>
          <textarea
            ref={textareaRef}
            value={lyrics}
            onChange={e => setLyrics(e.target.value)}
            placeholder="Вставьте текст песни сюда..."
            rows={12}
            className="w-full px-4 py-3.5 rounded-xl text-[15px] outline-none lyricsText"
            style={{ backgroundColor: 'var(--tg-bg2)', color: 'var(--tg-text)' }}
          />
        </div>

        {/* Favorite toggle */}
        <button
          onClick={() => { haptic('selection'); setIsFavorite(!isFavorite); }}
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]"
          style={{ backgroundColor: 'var(--tg-bg2)' }}
        >
          <div className="flex items-center gap-3">
            <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-lg`} style={{ color: isFavorite ? '#ff3b30' : 'var(--tg-hint)' }} />
            <span className="font-medium">В избранном</span>
          </div>
          <div
            className="w-12 h-7 rounded-full relative transition-all"
            style={{ backgroundColor: isFavorite ? '#ff3b30' : 'var(--tg-hint)' }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all shadow"
              style={{ left: isFavorite ? '26px' : '4px' }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}

/* ───────── Main App ───────── */
export default function App() {
  const { tg, user, haptic } = useTelegram();
  const [songs, setSongs] = useState<Song[]>(loadSongs);
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);

  // Persist
  useEffect(() => { saveSongs(songs); }, [songs]);

  // Back button
  useEffect(() => {
    const w = (window as any).Telegram?.WebApp;
    if (!w) return;
    const handle = () => {
      if (screen === 'view') { setScreen('home'); setSelectedSong(null); }
      else if (screen === 'editor') { setScreen(selectedSong ? 'view' : 'home'); setEditingSong(null); }
    };
    if (screen !== 'home') { w.BackButton.show(); w.BackButton.onClick(handle); }
    else { w.BackButton.hide(); }
    return () => { w.BackButton.offClick(handle); };
  }, [screen, selectedSong]);

  // Handlers
  const openSong = (song: Song) => {
    haptic('light');
    setSelectedSong(song);
    setScreen('view');
  };

  const openEditor = (song?: Song) => {
    setEditingSong(song || null);
    setScreen('editor');
  };

  const saveSong = (data: Omit<Song, 'id' | 'createdAt'>) => {
    if (editingSong) {
      setSongs(prev => prev.map(s => (s.id === editingSong.id ? { ...s, ...data } : s)));
      setSelectedSong({ ...editingSong, ...data });
    } else {
      const newSong: Song = { ...data, id: uid(), createdAt: Date.now() };
      setSongs(prev => [newSong, ...prev]);
    }
    setScreen(selectedSong || !editingSong ? 'home' : 'view');
    setEditingSong(null);
  };

  const deleteSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    setSelectedSong(null);
    setScreen('home');
  };

  const toggleFav = (id: string) => {
    setSongs(prev => prev.map(s => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)));
    if (selectedSong?.id === id) {
      setSelectedSong(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  // Keep selectedSong in sync with songs state
  useEffect(() => {
    if (selectedSong) {
      const updated = songs.find(s => s.id === selectedSong.id);
      if (updated) setSelectedSong(updated);
    }
  }, [songs]);

  return (
    <div className="min-h-screen min-h-[100dvh] transition-colors" style={{ backgroundColor: 'var(--tg-bg)', color: 'var(--tg-text)' }}>
      {screen === 'home' && (
        <HomeScreen
          songs={songs}
          search={search}
          setSearch={setSearch}
          activeCat={activeCat}
          setActiveCat={setActiveCat}
          onSongClick={openSong}
          onAddClick={() => openEditor()}
          showFavorites={showFavorites}
          setShowFavorites={setShowFavorites}
          haptic={haptic}
        />
      )}

      {screen === 'view' && selectedSong && (
        <ViewSongScreen
          song={selectedSong}
          onBack={() => { setScreen('home'); setSelectedSong(null); }}
          onEdit={() => openEditor(selectedSong)}
          onDelete={() => deleteSong(selectedSong.id)}
          onToggleFav={() => { haptic('selection'); toggleFav(selectedSong.id); }}
          haptic={haptic}
        />
      )}

      {screen === 'editor' && (
        <EditorScreen
          song={editingSong}
          onSave={saveSong}
          onBack={() => { setScreen(selectedSong ? 'view' : 'home'); setEditingSong(null); }}
          haptic={haptic}
        />
      )}
    </div>
  );
}
