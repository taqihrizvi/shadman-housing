import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  collapsed?: boolean;
}

export function LanguageToggle({ collapsed = false }: LanguageToggleProps) {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Update HTML direction for RTL support
    document.documentElement.dir = lng === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    // Apply lang to body for immediate font switching
    document.body.setAttribute('lang', lng);
  };

  const currentLanguage = i18n.language;

  if (collapsed) {
    return (
      <div className="inline-flex flex-col rounded-full bg-primary p-1 gap-1">
        <button
          onClick={() => changeLanguage('en')}
          className={cn(
            "px-2 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
            currentLanguage === 'en'
              ? 'bg-white text-primary shadow-sm'
              : 'text-white hover:text-white/80'
          )}
          title="English"
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage('ur')}
          className={cn(
            "px-2 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
            currentLanguage === 'ur'
              ? 'bg-white text-primary shadow-sm'
              : 'text-white hover:text-white/80'
          )}
          title="اردو"
        >
          UR
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex rounded-full bg-primary p-1 gap-1">
      <button
        onClick={() => changeLanguage('en')}
        className={cn(
          "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
          currentLanguage === 'en'
            ? 'bg-white text-primary shadow-sm'
            : 'text-white hover:text-white/80'
        )}
      >
        English
      </button>
      <button
        onClick={() => changeLanguage('ur')}
        className={cn(
          "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
          currentLanguage === 'ur'
            ? 'bg-white text-primary shadow-sm'
            : 'text-white hover:text-white/80'
        )}
      >
        اردو
      </button>
    </div>
  );
}
