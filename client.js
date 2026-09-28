/**
 * dsh-bing-search — Client half (browser bundle, DSH >= 0.1.6 only).
 *
 * On DSH <= 0.1.5 the provider's settings UI is the auto-generated section the
 * Host installs through `settings.installSection`, so this half stays inert
 * (the `configForms` service does not exist there).
 *
 * On DSH >= 0.1.6 the Settings forms are driven by the plugin's Cordis Config
 * volatile fields instead; this half registers a small editor into the
 * Plugins page's `plugins.bundle.config` slot (keyed by the package name),
 * reading and writing the `bing-search` profile entry through the shared
 * `configForms` service. The registration lives only while the Host serves
 * the entry, so a profile without the plugin shows no trace of the page.
 *
 * This file is a classic script registered through the client module loader:
 * `window.__ModuleLoader__.load({ id, factory })` with a lazy CJS factory.
 */
window.__ModuleLoader__.load({
  id: 'dsh-bing-search',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const React = require('react');

    /** Profile entry id of the provider row (see cordis.patch.yml). */
    const ENTRY_ID = 'bing-search';
    /** Bundle package name the Plugins page keys its config slot by. */
    const BUNDLE_KEY = 'dsh-bing-search';
    const LOCALE_NS = 'settings.bing-search';

    const zh = {
      title: 'Bing 免费搜索',
      summary: '配置 Bing HTML 搜索入口、语言与解析上限。',
      endpoint: '搜索入口 URL',
      endpointHint: '默认 https://cn.bing.com/search；任何返回 HTML 结果页的 Bing 镜像都可以。',
      maxResults: '解析上限',
      maxResultsHint: '每次搜索最多解析的结果条数（正整数）。',
      language: '结果语言',
      languageZh: '中文（ensearch=0）',
      languageEn: '英文（ensearch=1）',
      save: '保存',
      saving: '保存中…',
      saved: '已保存。',
      discard: '放弃修改',
      readOnly: '当前部署的配置为只读。',
      unavailable: 'Host 未提供 Bing 搜索配置。',
      saveFailed: '保存失败，已保留你的修改。',
    };
    const en = {
      title: 'Bing free search',
      summary: 'Configure the Bing HTML endpoint, language, and parse cap.',
      endpoint: 'Search endpoint URL',
      endpointHint: 'Defaults to https://cn.bing.com/search; any Bing mirror serving an HTML results page works.',
      maxResults: 'Parse cap',
      maxResultsHint: 'Maximum results parsed per search (positive integer).',
      language: 'Result language',
      languageZh: 'Chinese (ensearch=0)',
      languageEn: 'English (ensearch=1)',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved.',
      discard: 'Discard',
      readOnly: 'Configuration is read-only in this deployment.',
      unavailable: 'The Host does not serve Bing search configuration.',
      saveFailed: 'The deployment did not accept these values.',
    };

    function translateFactory(dict) {
      return (key) => dict[key] ?? en[key] ?? key;
    }

    const css = {
      section: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640, color: 'var(--dsw-alias-label-primary)' },
      title: { margin: 0, fontSize: 18, fontWeight: 600, lineHeight: '26px' },
      meta: { margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)' },
      field: { display: 'flex', flexDirection: 'column', gap: 4 },
      label: { fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      input: {
        height: 32, width: '100%', boxSizing: 'border-box',
        border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 8,
        padding: '0 10px', font: 'inherit', fontSize: 14, lineHeight: '22px',
        background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-primary)',
      },
      button: {
        boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: 28, padding: '0 10px', borderRadius: 14,
        border: '1px solid var(--dsw-alias-border-l2)', background: 'transparent',
        color: 'var(--dsw-alias-label-primary)', font: 'inherit', fontSize: 12, lineHeight: '18px',
        cursor: 'pointer',
      },
      primary: {
        boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: 32, padding: '0 14px', borderRadius: 16, border: 'none',
        background: 'var(--dsw-alias-button-primary-fill, #3b82f6)',
        color: 'var(--dsw-alias-label-primary-foreground, #fff)',
        font: 'inherit', fontSize: 13, cursor: 'pointer',
      },
      actions: { display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' },
      error: { margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-state-error-primary)' },
      ok: { margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-state-success-primary)' },
    };

    function BingSearchConfigPage(props) {
      const scope = props.scope;
      const t = typeof props.t === 'function' ? props.t : translateFactory(props.dict ?? zh);
      const [snap, setSnap] = React.useState(() => scope.getSnapshot());
      const [draft, setDraft] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [failed, setFailed] = React.useState(false);
      const [savedFlash, setSavedFlash] = React.useState(false);

      React.useEffect(() => {
        setSnap(scope.getSnapshot());
        return scope.subscribe(() => setSnap(scope.getSnapshot()));
      }, [scope]);

      const value = snap.value ?? {};
      const current = {
        endpoint: typeof value.endpoint === 'string' ? value.endpoint : '',
        maxResults: Number.isInteger(value.maxResults) ? value.maxResults : 20,
        ensearch: Number.isInteger(value.ensearch) ? value.ensearch : 0,
      };
      const form = draft ?? current;
      const dirty = draft !== null
        && (draft.endpoint !== current.endpoint
          || String(draft.maxResults) !== String(current.maxResults)
          || String(draft.ensearch) !== String(current.ensearch));

      if (props.view === 'summary') {
        return React.createElement('p', { style: css.meta }, t('summary'));
      }
      if (snap.status === 'unavailable') {
        return React.createElement('div', { style: css.section },
          React.createElement('h2', { style: css.title }, t('title')),
          React.createElement('p', { style: css.error }, t('unavailable')),
        );
      }

      const writable = snap.writable !== false && snap.status === 'ready';

      async function save() {
        const endpoint = String(form.endpoint ?? '').trim();
        const maxResults = Number.parseInt(String(form.maxResults), 10);
        const ensearch = Number.parseInt(String(form.ensearch), 10);
        setBusy(true);
        setFailed(false);
        setSavedFlash(false);
        try {
          const accepted = await scope.mutate([
            { op: 'set', path: ['endpoint'], value: endpoint },
            { op: 'set', path: ['maxResults'], value: Number.isInteger(maxResults) && maxResults > 0 ? maxResults : 20 },
            { op: 'set', path: ['ensearch'], value: ensearch === 1 ? 1 : 0 },
          ], snap.revision);
          if (accepted === false) throw new Error('refused');
          setDraft(null);
          setSavedFlash(true);
        } catch {
          setFailed(true);
        } finally {
          setBusy(false);
        }
      }

      return React.createElement('div', { style: css.section },
        React.createElement('h2', { style: css.title }, t('title')),
        !writable ? React.createElement('p', { style: css.meta }, t('readOnly')) : null,
        React.createElement('div', { style: css.field },
          React.createElement('span', { style: css.label }, t('endpoint')),
          React.createElement('input', {
            style: css.input,
            value: form.endpoint,
            placeholder: 'https://cn.bing.com/search',
            'aria-label': t('endpoint'),
            disabled: !writable || busy,
            onChange: (event) => setDraft({ ...form, endpoint: event.target.value }),
          }),
          React.createElement('p', { style: css.meta }, t('endpointHint')),
        ),
        React.createElement('div', { style: css.field },
          React.createElement('span', { style: css.label }, t('maxResults')),
          React.createElement('input', {
            style: { ...css.input, maxWidth: 120 },
            value: String(form.maxResults),
            inputMode: 'numeric',
            'aria-label': t('maxResults'),
            disabled: !writable || busy,
            onChange: (event) => setDraft({ ...form, maxResults: event.target.value }),
          }),
          React.createElement('p', { style: css.meta }, t('maxResultsHint')),
        ),
        React.createElement('div', { style: css.field },
          React.createElement('span', { style: css.label }, t('language')),
          React.createElement('select', {
            style: { ...css.input, maxWidth: 240 },
            value: String(form.ensearch),
            'aria-label': t('language'),
            disabled: !writable || busy,
            onChange: (event) => setDraft({ ...form, ensearch: event.target.value }),
          },
            React.createElement('option', { value: '0' }, t('languageZh')),
            React.createElement('option', { value: '1' }, t('languageEn')),
          ),
        ),
        failed ? React.createElement('p', { style: css.error, role: 'alert' }, t('saveFailed')) : null,
        savedFlash && !dirty ? React.createElement('p', { style: css.ok, role: 'status' }, t('saved')) : null,
        React.createElement('div', { style: css.actions },
          React.createElement('button', {
            type: 'button', style: css.button, disabled: !dirty || busy,
            onClick: () => { setDraft(null); setFailed(false); },
          }, t('discard')),
          React.createElement('button', {
            type: 'button', style: css.primary, disabled: !writable || !dirty || busy, onClick: save,
          }, busy ? t('saving') : t('save')),
        ),
      );
    }

    function apply(ctx) {
      // DSH <= 0.1.5 has no configForms service: the Host-installed settings
      // section covers the UI there, so this half stays inert.
      const configForms = typeof ctx.get === 'function' ? ctx.get('configForms') : undefined;
      const slots = typeof ctx.get === 'function' ? ctx.get('slots') : undefined;
      if (!configForms || typeof configForms.get !== 'function' || !slots) return;

      const locale = typeof ctx.get === 'function' ? ctx.get('locale') : undefined;
      let t = translateFactory(zh);
      if (locale && typeof locale.register === 'function' && typeof locale.bind === 'function') {
        ctx.effect(() => locale.register(LOCALE_NS, { zh, en }), 'dsh-bing-search: dictionaries');
        t = locale.bind(LOCALE_NS);
      }

      const scope = configForms.get(ENTRY_ID);
      ctx.effect(
        () => configForms.whileServed([ENTRY_ID], () => slots.inject('plugins.bundle.config', () => slots.register(
          { name: 'plugins.bundle.config', key: BUNDLE_KEY, locale: LOCALE_NS },
          (props) => React.createElement(BingSearchConfigPage, { ...props, scope, t }),
        ))),
        'dsh-bing-search: plugins page',
      );
    }

    exports.apply = apply;
    exports.inject = [];
    return module.exports;
  },
});
