'use client';
import { useEffect, useState } from 'react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { HiOutlineGlobeAlt } from 'react-icons/hi2';

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi (हिंदी)' },
    { value: 'bn', label: 'Bengali (বাংলা)' },
    { value: 'te', label: 'Telugu (తెలుగు)' },
    { value: 'mr', label: 'Marathi (मराठी)' },
    { value: 'ta', label: 'Tamil (தமிழ்)' },
    { value: 'ur', label: 'Urdu (اردو)' },
    { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
    { value: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
    { value: 'ml', label: 'Malayalam (മലയാളം)' },
    { value: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
    { value: 'or', label: 'Odia (ଓଡ଼ିଆ)' },
    { value: 'as', label: 'Assamese (অসমীয়া)' },

];

export function GoogleTranslateWidget() {
    const [selectedLang, setSelectedLang] = useState('en');

    useEffect(() => {
        // Prevent adding multiple scripts if it re-renders
        if (document.getElementById('google-translate-script')) return;

        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);

        // Initialization callback
        (window as any).googleTranslateElementInit = () => {
            new (window as any).google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,bn,te,mr,ta,ur,gu,kn,ml,pa,or,as,mai,sd',
                    autoDisplay: false
                },
                'google_translate_element'
            );
        };
    }, []);

    const handleLanguageChange = (langCode: string) => {
        setSelectedLang(langCode);

        // Find the hidden Google Translate select dropdown
        const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement;

        if (selectEl) {
            selectEl.value = langCode;
            selectEl.dispatchEvent(new Event('change'));
        } else {
            // Fallback: if the widget isn't fully loaded yet, set cookie and reload
            document.cookie = `googtrans=/en/${langCode}; path=/;`;
            window.location.reload();
        }
    };

    return (
        <div className="flex items-center relative z-[60] min-w-[200px]">
            {/* The beautiful custom UI */}
            <div className="w-full">
                <SearchableSelect
                    options={LANGUAGES}
                    value="Change language"
                    onChange={handleLanguageChange}
                    placeholder="Translate page..."
                    icon={<HiOutlineGlobeAlt size={18} />}
                    direction="down"
                />
            </div>

            {/* The hidden Google Translate widget */}
            <div
                id="google_translate_element"
                style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}
            ></div>

            <style jsx global>{`
                /* Hide all the annoying Google Translate overlays and bars */
                .skiptranslate iframe {
                    display: none !important;
                }
                body {
                    top: 0px !important;
                }
                #goog-gt-tt {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
