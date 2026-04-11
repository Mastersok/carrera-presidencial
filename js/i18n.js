/**
 * I18N.JS v1.0 — Sistema de localización para Carrera Presidencial
 * ─────────────────────────────────────────────────────────────────
 * Uso:
 *   I18n.register('es', { ... })   — registra un locale
 *   I18n.setLang('en')             — cambia idioma + aplica al DOM + dispara evento
 *   I18n.t('ui.start.btn_play')    — retorna el string (o array/objeto) en el idioma activo
 *   I18n.getLang()                 — retorna el idioma actual
 *   <span data-i18n="ui.start.btn_play">...</span>  — se actualiza automáticamente
 */

'use strict';

const I18n = (() => {
    let _lang = 'es';
    const _locales = {};

    /**
     * Retorna el valor en el locale activo para una clave de punto notación.
     * Si no existe, retorna `fallback` (si se provee) o la misma clave.
     * El valor puede ser string, array, u objeto — el caller decide cómo usarlo.
     */
    function t(key, fallback) {
        const parts = key.split('.');
        let obj = _locales[_lang];
        for (const p of parts) {
            if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) {
                return fallback !== undefined ? fallback : key;
            }
            obj = obj[p];
        }
        if (obj === undefined || obj === null) {
            return fallback !== undefined ? fallback : key;
        }
        return obj;
    }

    /** Garantiza siempre retornar un string */
    function tStr(key, fallback) {
        const v = t(key, fallback);
        if (typeof v === 'string') return v;
        if (fallback !== undefined) return String(fallback);
        return key;
    }

    /** Registra un locale. Llamado por cada archivo locales/*.js */
    function register(lang, data) {
        _locales[lang] = data;
    }

    /** Retorna el idioma actual */
    function getLang() { return _lang; }

    /** Cambia idioma, actualiza DOM y despacha evento 'languageChanged' */
    function setLang(lang) {
        if (!_locales[lang]) {
            console.warn(`I18n: locale '${lang}' no está cargado`);
            return;
        }
        _lang = lang;
        applyToDOM();
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    /**
     * Actualiza todos los elementos del DOM con atributos data-i18n*.
     * Llamado automáticamente por setLang; también se puede llamar manualmente.
     */
    function applyToDOM() {
        // Texto interno de elementos
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const val = tStr(key);
            if (val !== key) el.textContent = val;
        });
        // Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            const val = tStr(key);
            if (val !== key) el.placeholder = val;
        });
        // HTML interno (para elementos con markup: strong, em, etc.)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.dataset.i18nHtml;
            const val = tStr(key);
            if (val !== key) el.innerHTML = val;
        });
        // Títulos (title attribute)
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.dataset.i18nTitle;
            const val = tStr(key);
            if (val !== key) el.title = val;
        });
    }

    return { t, tStr, register, getLang, setLang, applyToDOM };
})();
