import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Sparkles,
  Download,
  Volume2,
  BookOpen,
  Megaphone,
  Gift,
  X,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useI18n, type TranslationKey } from '@/i18n';
import {
  getCachedInboxMessages,
  getReadMessageIds,
  markMessageRead,
  markAllMessagesRead,
  markMessagePopped,
  fetchInboxMessages,
  markBirthdayCelebratedThisYear,
  INBOX_UPDATED_EVENT,
  type InboxMessage,
  type InboxCategory,
} from '@/lib/inboxService';

const CAT_META: Record<InboxCategory, { labelKey: TranslationKey; color: string; Icon: typeof Bell }> = {
  update: { labelKey: 'inbox.catUpdate', color: '#38bdf8', Icon: Download },
  dhikr: { labelKey: 'inbox.catDhikr', color: '#34d399', Icon: Sparkles },
  audio: { labelKey: 'inbox.catAudio', color: '#fbbf24', Icon: Volume2 },
  occasion: { labelKey: 'inbox.catOccasion', color: '#c084fc', Icon: Sparkles },
  news: { labelKey: 'inbox.catNews', color: '#34d399', Icon: Megaphone },
  tip: { labelKey: 'inbox.catTip', color: '#60a5fa', Icon: BookOpen },
  birthday: { labelKey: 'inbox.catBirthday', color: '#f472b6', Icon: Gift },
};

export function executeInboxAction(
  target: string,
  onNavigate?: (tab: 'home' | 'tasbih' | 'library' | 'reminders' | 'settings') => void,
  onClose?: () => void
) {
  const tr = (target || '').trim();
  if (!tr) return;
  if (tr.startsWith('http://') || tr.startsWith('https://')) {
    window.open(tr, '_blank', 'noopener,noreferrer');
    return;
  }
  if (tr === 'tasbih' || tr === 'library' || tr === 'reminders' || tr === 'settings' || tr === 'home') {
    onNavigate?.(tr);
    onClose?.();
    return;
  }
  if (tr === 'sync_hub') {
    onNavigate?.('settings');
    onClose?.();
  }
}

export function InboxModal({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate?: (tab: 'home' | 'tasbih' | 'library' | 'reminders' | 'settings') => void;
}) {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { dir, isRtl, t, formatDate } = useI18n();
  const [messages, setMessages] = useState<InboxMessage[]>(() =>
    getCachedInboxMessages(profile?.display_name)
  );
  const [readIds, setReadIds] = useState<string[]>(() => getReadMessageIds());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const sync = () => {
      setMessages(getCachedInboxMessages(profile?.display_name));
      setReadIds(getReadMessageIds());
    };
    window.addEventListener(INBOX_UPDATED_EVENT, sync);
    void fetchInboxMessages(profile?.display_name).then((res) => {
      setMessages(res.messages);
      setReadIds(getReadMessageIds());
    });
    return () => window.removeEventListener(INBOX_UPDATED_EVENT, sync);
  }, [profile?.display_name]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetchInboxMessages(profile?.display_name);
      setMessages(res.messages);
      setReadIds(getReadMessageIds());
    } finally {
      setRefreshing(false);
    }
  };

  const unreadCount = messages.filter((m) => !readIds.includes(m.id)).length;

  const node = (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      dir={dir}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg min-h-[100dvh] sm:min-h-0 sm:max-h-[86vh] sm:rounded-3xl p-5 border-0 sm:border shadow-2xl flex flex-col"
        style={{ background: theme.surface, borderColor: theme.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between gap-2 pb-3.5 mb-3 border-b shrink-0"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{
                background: 'linear-gradient(135deg, ' + theme.primary + ', ' + theme.accent + ')',
                color: theme.bg,
              }}
            >
              <Bell size={19} />
            </div>
            <div>
              <h2 className="text-base font-black text-app">{t('inbox.title')}</h2>
              <p className="text-[11px] text-muted mt-0.5">
                {unreadCount > 0 ? t('inbox.unreadHint') : t('inbox.allReadHint')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              aria-label="Refresh inbox"
              className="w-8 h-8 rounded-xl border flex items-center justify-center text-muted"
              style={{ borderColor: theme.border }}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="w-8 h-8 rounded-xl border flex items-center justify-center text-muted"
              style={{ borderColor: theme.border }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllMessagesRead(messages.map((m) => m.id))}
            className="mb-3 py-2 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border shrink-0"
            style={{
              borderColor: 'color-mix(in srgb, ' + theme.primary + ' 45%, ' + theme.border + ')',
              background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
              color: theme.primary,
            }}
          >
            <CheckCheck size={14} />
            <span>{t('inbox.markAllRead')}</span>
          </button>
        )}

        <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
          {messages.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bell size={34} color={theme.textMuted} className="mx-auto opacity-35" />
              <p className="text-xs font-bold text-app">{t('inbox.emptyTitle')}</p>
              <p className="text-[11px] text-muted">{t('inbox.emptyDesc')}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isRead = readIds.includes(msg.id);
              const meta = CAT_META[msg.category] || CAT_META.news;
              const IconComp = meta.Icon;
              const dateLabel = (() => {
                try {
                  return formatDate(new Date(msg.created_at));
                } catch {
                  return '';
                }
              })();

              return (
                <div
                  key={msg.id}
                  onClick={() => markMessageRead(msg.id)}
                  role="button"
                  tabIndex={0}
                  className="rounded-2xl p-3.5 border space-y-2 transition-all cursor-pointer"
                  style={{
                    background: isRead
                      ? theme.bg
                      : 'color-mix(in srgb, ' + theme.primary + ' 10%, ' + theme.bg + ')',
                    borderColor: isRead ? theme.border : theme.primary,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: meta.color + '22', color: meta.color }}
                      >
                        <IconComp size={15} />
                      </div>
                      <div className="min-w-0">
                        <span
                          className="text-[9.5px] font-black px-2 py-0.5 rounded-full inline-block"
                          style={{ background: meta.color + '20', color: meta.color }}
                        >
                          {t(meta.labelKey)}
                        </span>
                        <h3 className="text-xs font-black text-app mt-1 leading-snug">
                          {msg.title_fa}
                        </h3>
                      </div>
                    </div>

                    <div className={(isRtl ? 'text-left' : 'text-right') + ' shrink-0'}>
                      {isRead ? (
                        <span className="text-[10px] font-bold text-emerald-400 inline-flex items-center gap-0.5">
                          <Check size={12} /> {t('inbox.read')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          {t('inbox.new')}
                        </span>
                      )}
                      {dateLabel && <p className="text-[9.5px] text-muted mt-0.5">{dateLabel}</p>}
                    </div>
                  </div>

                  <p className="text-[11.5px] text-muted leading-relaxed">{msg.body_fa}</p>

                  {msg.action_label_fa && msg.action_target && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markMessageRead(msg.id);
                        executeInboxAction(msg.action_target, onNavigate, onClose);
                      }}
                      className="mt-1 px-3 py-1.5 rounded-xl text-[11px] font-black inline-flex items-center gap-1.5"
                      style={{ background: theme.primary, color: theme.bg }}
                    >
                      <span>{msg.action_label_fa}</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3.5 py-2.5 rounded-2xl text-xs font-bold border shrink-0"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          {t('inbox.closeBtn')}
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}

export function LiveNotificationPopup({
  message,
  onClose,
  onNavigate,
}: {
  message: InboxMessage;
  onClose: () => void;
  onNavigate?: (tab: 'home' | 'tasbih' | 'library' | 'reminders' | 'settings') => void;
}) {
  const { theme } = useTheme();
  const { dir, t } = useI18n();
  const meta = CAT_META[message.category] || CAT_META.news;
  const IconComp = meta.Icon;

  const dismiss = () => {
    markMessagePopped(message.id);
    markMessageRead(message.id);
    onClose();
  };

  const node = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      dir={dir}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-3.5 text-center"
        style={{
          background:
            'radial-gradient(circle at top, color-mix(in srgb, ' +
            theme.accent +
            ' 18%, ' +
            theme.surface +
            '), ' +
            theme.surface +
            ')',
          borderColor: theme.accent,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg"
          style={{ background: meta.color + '24', color: meta.color }}
        >
          <IconComp size={28} />
        </div>
        <span
          className="text-[10.5px] font-black px-3 py-1 rounded-full inline-block"
          style={{ background: meta.color + '22', color: meta.color }}
        >
          {t(meta.labelKey)}
        </span>
        <h3 className="text-base font-black text-app leading-snug">{message.title_fa}</h3>
        <p className="text-xs text-muted leading-relaxed">{message.body_fa}</p>

        <div className="flex gap-2 pt-1">
          {message.action_label_fa && message.action_target && (
            <button
              type="button"
              onClick={() => {
                markMessagePopped(message.id);
                markMessageRead(message.id);
                executeInboxAction(message.action_target, onNavigate, onClose);
              }}
              className="flex-1 py-3 rounded-2xl text-xs font-black"
              style={{ background: theme.primary, color: theme.bg }}
            >
              {message.action_label_fa}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className={
              message.action_label_fa
                ? 'px-4 py-3 rounded-2xl text-xs font-bold border'
                : 'w-full py-3 rounded-2xl text-xs font-black'
            }
            style={
              message.action_label_fa
                ? { borderColor: theme.border, color: theme.text }
                : { background: theme.primary, color: theme.bg }
            }
          >
            {t('inbox.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}

export function BirthdayCelebrationModal({
  displayName,
  onClose,
}: {
  displayName?: string | null;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { dir, t } = useI18n();
  const name = displayName?.trim() || t('birthday.defaultName');

  const handleClose = () => {
    markBirthdayCelebratedThisYear();
    onClose();
  };

  const node = (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(10px)' }}
      dir={dir}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-[30px] p-6 border shadow-2xl text-center space-y-4"
        style={{
          background:
            'radial-gradient(circle at top, rgba(244, 114, 182, 0.24), ' + theme.surface + ' 65%)',
          borderColor: '#f472b6',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f472b6, #fbbf24)', color: '#0b131e' }}
        >
          <Gift size={32} />
        </div>
        <h2 className="text-xl font-black text-app">
          {t('birthday.titlePrefix')} {name} {t('birthday.titleSuffix')}
        </h2>
        <p className="text-xs text-muted leading-relaxed">{t('birthday.body')}</p>
        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3.5 rounded-2xl text-xs font-black shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f472b6, #fbbf24)', color: '#0b131e' }}
        >
          {t('birthday.btn')}
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
