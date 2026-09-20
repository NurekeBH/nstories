/* ===========================================================
   ApiPay.kz — landing scripts
   Тәуелділіксіз таза JS. Барлық баптау — CONFIG блогында.
   =========================================================== */
(function () {
  'use strict';

  var CONFIG = {
    // Браузер тілі орысша болса, бетті автоматты RU тілінде ашу керек пе?
    AUTO_LANG: false,
    // Лид формасы жіберілетін мекенжай. Бос болса — тек "рақмет" экраны көрсетіледі.
    // Мысал: '/api/leads' немесе Bitrix24/amoCRM вебхугы.
    FORM_ENDPOINT: '',
    // Есептегіштегі шартты интернет-эквайринг мөлшерлемесі (салыстыру үшін).
    ACQUIRING_RATE: 0.025,
    // Тарифтер: күніне шот лимиті → ай сайынғы баға (₸).
    PLANS: [
      { name: 'Start',    limit: 30,  price: 10000 },
      { name: 'Business', limit: 100, price: 25000 },
      { name: 'Pro',      limit: 300, price: 60000 },
      { name: 'Pro Max',  limit: 600, price: 90000 }
    ]
  };

  var $  = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  var nf = new Intl.NumberFormat('ru-RU');
  function tenge(n) { return nf.format(Math.round(n)) + ' ₸'; }

  /* ---------- Тіл ауыстыру (KZ / RU) ---------- */
  var DICT = (window.APIPAY_I18N || { ru: {}, kk: {} });
  var STORE_KEY = 'apipay_lang';
  var lang = 'kk';

  // Қазақша мәтін HTML-де тұр — оны есте сақтап қоямыз.
  var base = {};
  $$('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    var attr = el.getAttribute('data-i18n-attr');
    if (base[key] === undefined) {
      base[key] = attr ? el.getAttribute(attr) : el.innerHTML;
    }
  });

  function t(key) {
    var pack = DICT[lang] || {};
    if (pack[key] !== undefined) return pack[key];
    return (DICT.kk && DICT.kk[key] !== undefined) ? DICT.kk[key] : (base[key] || '');
  }

  function setLang(next, save) {
    lang = (next === 'ru') ? 'ru' : 'kk';

    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var attr = el.getAttribute('data-i18n-attr');
      var val = (lang === 'kk') ? base[key] : ((DICT.ru && DICT.ru[key]) || base[key]);
      if (val === undefined) return;
      if (attr) { el.setAttribute(attr, val); } else { el.innerHTML = val; }
    });

    document.documentElement.lang = lang;
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', lang === 'ru' ? 'ru_RU' : 'kk_KZ');

    $$('.lang__btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-lang') === lang);
    });

    if (save) {
      try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* құпия режим */ }
    }
    document.dispatchEvent(new CustomEvent('apipay:lang', { detail: lang }));
  }

  $$('.lang__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setLang(btn.getAttribute('data-lang'), true);
    });
  });

  /* ---------- Жылжығанда header көлеңкесі ---------- */
  var header = $('#header');
  function onScroll() {
    header.classList.toggle('is-stuck', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильді мәзір ---------- */
  var burger = $('#burger');
  var menu = $('#mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Скроллда пайда болу анимациясы ---------- */
  var revealables = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Math.min(i * 70, 280);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Код қойындылары ---------- */
  var tabs = $$('.tab');
  var panels = $$('.code-panel');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var key = tab.getAttribute('data-tab');
      tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      panels.forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-panel') === key);
      });
    });
  });

  /* ---------- Кодты көшіру ---------- */
  var copyBtn = $('#copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var active = $('.code-panel.is-active pre');
      if (!active || !navigator.clipboard) return;
      navigator.clipboard.writeText(active.innerText).then(function () {
        var prev = copyBtn.textContent;
        copyBtn.textContent = t('js.copied');
        setTimeout(function () { copyBtn.textContent = prev; }, 1800);
      });
    });
  }

  /* ---------- FAQ аккордеоны ---------- */
  $$('.qa').forEach(function (qa) {
    var btn = $('.qa__q', qa);
    var body = $('.qa__a', qa);
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = qa.classList.contains('is-open');
      $$('.qa').forEach(function (other) {
        other.classList.remove('is-open');
        $('.qa__a', other).style.maxHeight = null;
        $('.qa__q', other).setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        qa.classList.add('is-open');
        body.style.maxHeight = body.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('apipay:lang', function () {
    var openQa = $('.qa.is-open');
    if (openQa) {
      var body = $('.qa__a', openQa);
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });

  /* ---------- Үнем есептегіші ---------- */
  var cnt = $('#cnt'), avg = $('#avg'), mins = $('#min');
  if (cnt && avg && mins) {
    var out = {
      cnt: $('#cntOut'),
      turnover: $('#turnover'),
      fee: $('#fee'),
      planPrice: $('#planPrice'),
      hours: $('#hours'),
      save: $('#save'),
      planName: $('#planName')
    };

    var pickPlan = function (perDay) {
      for (var i = 0; i < CONFIG.PLANS.length; i++) {
        if (perDay <= CONFIG.PLANS[i].limit) return CONFIG.PLANS[i];
      }
      return { name: t('js.customPlan'), price: CONFIG.PLANS[CONFIG.PLANS.length - 1].price };
    };

    var recalc = function () {
      var perDay = Number(cnt.value) || 0;
      var check  = Math.max(0, Number(avg.value) || 0);
      var perInv = Math.max(0, Number(mins.value) || 0);

      var monthly  = perDay * 30;
      var turnover = monthly * check;
      var fee      = turnover * CONFIG.ACQUIRING_RATE;
      var plan     = pickPlan(perDay);
      var hours    = monthly * perInv / 60;
      var save     = Math.max(0, fee - plan.price);

      out.cnt.textContent       = perDay;
      out.turnover.textContent  = tenge(turnover);
      out.fee.textContent       = tenge(fee);
      out.planPrice.textContent = tenge(plan.price);
      out.hours.textContent     = nf.format(Math.round(hours)) + ' ' + t('js.hours');
      out.save.textContent      = tenge(save);
      out.planName.textContent  = plan.name + (plan.limit ? t('js.planUpTo').replace('{n}', plan.limit) : '');
    };

    [cnt, avg, mins].forEach(function (el) {
      el.addEventListener('input', recalc);
    });
    document.addEventListener('apipay:lang', recalc);
    recalc();
  }

  /* ---------- Лид формасы ---------- */
  var form = $('#leadForm');
  if (form) {
    var setError = function (input, hasError) {
      input.closest('.field').classList.toggle('has-error', hasError);
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name  = $('#name', form);
      var phone = $('#phone', form);
      var digits = phone.value.replace(/\D/g, '');

      var nameBad  = name.value.trim().length < 2;
      var phoneBad = digits.length < 10;
      setError(name, nameBad);
      setError(phone, phoneBad);
      if (nameBad || phoneBad) {
        (nameBad ? name : phone).focus();
        return;
      }

      var payload = {
        name: name.value.trim(),
        phone: phone.value.trim(),
        business: $('#biz', form).value,
        volume: $('#vol', form).value,
        page: location.href,
        ts: new Date().toISOString()
      };

      var done = function () { form.classList.add('is-sent'); };

      if (CONFIG.FORM_ENDPOINT) {
        var btn = $('button[type="submit"]', form);
        btn.disabled = true;
        btn.textContent = t('js.sending');
        fetch(CONFIG.FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(done).catch(function () {
          btn.disabled = false;
          btn.textContent = t('js.retry');
        });
      } else {
        // Бэкенд жалғанбаған: деректі консольге шығарып, алғыс экранын көрсетеміз.
        console.log('[ApiPay lead]', payload);
        done();
      }
    });

    $$('input', form).forEach(function (input) {
      input.addEventListener('input', function () { setError(input, false); });
    });
  }

  /* ---------- Ағымдағы жыл ---------- */
  function setYear() {
    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }
  document.addEventListener('apipay:lang', setYear);

  /* ---------- Бастапқы тіл ---------- */
  var saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* құпия режим */ }
  var initial = saved || (CONFIG.AUTO_LANG && /^ru\b/i.test(navigator.language || '') ? 'ru' : 'kk');
  setLang(initial, false);
  setYear();
})();
